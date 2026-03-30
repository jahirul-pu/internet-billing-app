import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments
 * 
 * Records a new subscriber payment and updates the customer's 'last_payment_date'.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('--- Incoming Payment Request ---', body)
    
    const { customer_id, amount, payment_method, collected_by } = body

    if (!customer_id || amount === undefined || !payment_method) {
      console.warn('Payment failed validation:', { customer_id, amount, payment_method })
      return NextResponse.json({ 
        success: false, 
        error: `Missing required payment data: ${!customer_id ? 'customer_id ' : ''}${amount === undefined ? 'amount ' : ''}${!payment_method ? 'payment_method' : ''}` 
      }, { status: 400 })
    }

    // 1. Record the payment entry with attribution
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([{
        customer_id,
        amount: parseFloat(amount),
        payment_method,
        collected_by: collected_by || 'Office'
      }])
      .select()

    if (paymentError) {
      console.error('Supabase Payment Insert Error:', paymentError)
      throw paymentError
    }

    // 2. Update the customer's last_payment_date and deduct the collection from due_balance
    // First retrieve the current balance
    const { data: custData, error: custReadError } = await supabaseAdmin
      .from('customers')
      .select('due_balance')
      .eq('id', customer_id)
      .single()

    if (custReadError) throw custReadError

    const currentBalance = Number(custData.due_balance || 0)
    const newBalance = currentBalance - parseFloat(amount)

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
      message: 'Payment recorded successfully.'
    })

  } catch (error: any) {
    console.error('Payment Recording Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment.' },
      { status: 500 }
    )
  }
}
