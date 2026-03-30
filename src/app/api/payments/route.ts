import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments
 * 
 * Records a new subscriber payment, updates the customer's due_balance,
 * and performs WATERFALL ALLOCATION: applying payment to the oldest
 * unpaid invoices first (FIFO).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('--- Incoming Payment Request ---', body)
    
    const { customer_id, amount, payment_method, collected_by, target_invoice_id } = body

    if (!customer_id || amount === undefined || !payment_method) {
      console.warn('Payment failed validation:', { customer_id, amount, payment_method })
      return NextResponse.json({ 
        success: false, 
        error: `Missing required payment data: ${!customer_id ? 'customer_id ' : ''}${amount === undefined ? 'amount ' : ''}${!payment_method ? 'payment_method' : ''}` 
      }, { status: 400 })
    }

    const paymentAmount = parseFloat(amount)

    // ══════════════════════════════════════════════════════════
    // STEP 1: INVOICE ALLOCATION
    // ══════════════════════════════════════════════════════════
    
    let allocatedMonths: string[] = []
    let monthReference: string | null = null

    if (target_invoice_id) {
      // Manual Allocation (Specific Month Override)
      const { data: targetInvoice, error: invoiceFetchErr } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', target_invoice_id)
        .single()
        
      if (invoiceFetchErr) {
        console.error('Failed to fetch target invoice:', invoiceFetchErr)
      } else if (targetInvoice) {
        // Apply full amount to this specific invoice
        const newPaid = Number(targetInvoice.amount_paid) + paymentAmount
        const newStatus = newPaid >= Number(targetInvoice.amount_due) ? 'paid' : 'partial'
        
        const { error: updateErr } = await supabaseAdmin
          .from('invoices')
          .update({ 
            amount_paid: newPaid, 
            status: newStatus 
          })
          .eq('id', targetInvoice.id)
          
        if (updateErr) {
           console.error(`Failed to update target invoice ${targetInvoice.id}:`, updateErr)
        } else {
           allocatedMonths.push(targetInvoice.billing_month)
           monthReference = targetInvoice.billing_month
        }
      }
    } else {
      // Auto-Allocation (Waterfall: Oldest unpaid invoices first)
      const { data: unpaidInvoices, error: invoicesFetchErr } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('customer_id', customer_id)
        .in('status', ['unpaid', 'partial'])
        .order('created_at', { ascending: true })

      if (invoicesFetchErr) {
        console.error('Failed to fetch unpaid invoices:', invoicesFetchErr)
      }

      let remaining = paymentAmount

      if (unpaidInvoices && unpaidInvoices.length > 0) {
        for (const invoice of unpaidInvoices) {
          if (remaining <= 0) break

          const owed = Number(invoice.amount_due) - Number(invoice.amount_paid)
          if (owed <= 0) continue

          const allocation = Math.min(remaining, owed)
          const newPaid = Number(invoice.amount_paid) + allocation
          const newStatus = newPaid >= Number(invoice.amount_due) ? 'paid' : 'partial'

          const { error: updateErr } = await supabaseAdmin
            .from('invoices')
            .update({ 
              amount_paid: newPaid, 
              status: newStatus 
            })
            .eq('id', invoice.id)

          if (updateErr) {
            console.error(`Failed to update invoice ${invoice.id}:`, updateErr)
          } else {
            allocatedMonths.push(invoice.billing_month)
            remaining -= allocation
          }
        }
      }
      
      monthReference = allocatedMonths.length > 0 ? allocatedMonths.join(', ') : null
    }

    // ══════════════════════════════════════════════════════════
    // STEP 2: Record the payment entry with attribution
    // ══════════════════════════════════════════════════════════
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([{
        customer_id,
        amount: paymentAmount,
        payment_method,
        collected_by: collected_by || 'Office',
        billing_month_reference: monthReference
      }])
      .select()

    if (paymentError) {
      console.error('Supabase Payment Insert Error:', paymentError)
      throw paymentError
    }

    // ══════════════════════════════════════════════════════════
    // STEP 3: Update customer's due_balance and last_payment_date
    // ══════════════════════════════════════════════════════════
    const { data: custData, error: custReadError } = await supabaseAdmin
      .from('customers')
      .select('due_balance')
      .eq('id', customer_id)
      .single()

    if (custReadError) throw custReadError

    const currentBalance = Number(custData.due_balance || 0)
    const newBalance = currentBalance - paymentAmount

    const { error: customerError } = await supabaseAdmin
      .from('customers')
      .update({ 
        last_payment_date: new Date().toISOString(),
        due_balance: newBalance
      })
      .eq('id', customer_id)

    if (customerError) throw customerError

    return NextResponse.json({
      success: true,
      data: paymentData[0],
      allocated_months: allocatedMonths,
      message: monthReference 
        ? `Payment of ৳${paymentAmount} allocated to: ${monthReference}`
        : 'Payment recorded successfully.'
    })

  } catch (error: any) {
    console.error('Payment Recording Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment.' },
      { status: 500 }
    )
  }
}
