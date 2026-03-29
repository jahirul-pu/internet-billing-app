import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Relational sync joining 'customers' mapping and identifying payment collector
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        customer:customer_id ( full_name, pppoe_username ),
        collected_by:collected_by_id ( full_name )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase Transaction Query Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(transactions)
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer_id, amount, transaction_type, payment_method, collected_by_id, reference_id } = body

    // ── Step 0: Validate required fields ──
    if (!customer_id || !amount || !transaction_type) {
      return NextResponse.json(
        { error: 'customer_id, amount, and transaction_type are strictly required.' },
        { status: 400 }
      )
    }

    // ── Step 1: Fetch customer's current state BEFORE doing anything ──
    const { data: customer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('expiry_date, status, pppoe_username, package_id')
      .eq('id', customer_id)
      .single()

    if (fetchError) {
      console.error('Customer lookup failed:', fetchError)
      return NextResponse.json({ error: `Customer not found: ${fetchError.message}` }, { status: 404 })
    }

    // ── Step 2: Calculate the new expiry date ──
    let newExpiryDate: string | null = null

    if (transaction_type === 'monthly_bill' || transaction_type === 'new_connection') {
      const currentExpiry = new Date(customer.expiry_date)
      const now = new Date()

      // If already expired (or suspended), extend from today. If still active, stack on top.
      const baseDate = currentExpiry > now ? currentExpiry : now
      const newExpiry = new Date(baseDate)
      newExpiry.setDate(newExpiry.getDate() + 30)
      newExpiryDate = newExpiry.toISOString()
    }

    // ── Step 3: MikroTik Auto-Reactivation (if suspended) ──
    let routerWarning: string | null = null
    if (customer.status === 'suspended') {
      try {
        // Find the ORIGINAL profile from the packages table
        const { data: pkg } = await supabaseAdmin
          .from('packages')
          .select('mikrotik_profile')
          .eq('id', customer.package_id)
          .single()

        if (pkg?.mikrotik_profile) {
          let mikrotikApi
          try {
            mikrotikApi = await connectMikrotik()
            
            // Step A: Restore Secret Profile
            const secrets = await mikrotikApi.write('/ppp/secret/print', [`?name=${customer.pppoe_username}`])
            if (secrets && secrets.length > 0) {
              await mikrotikApi.write('/ppp/secret/set', [
                `=.id=${secrets[0]['.id']}`,
                `=profile=${pkg.mikrotik_profile}`
              ])
            }

            // Step B & C: Find and Kick the Restricted Session
            const activeSessions = await mikrotikApi.write('/ppp/active/print', [`?name=${customer.pppoe_username}`])
            if (activeSessions && activeSessions.length > 0) {
              for (const session of activeSessions) {
                await mikrotikApi.write('/ppp/active/remove', [`=.id=${session['.id']}`])
              }
            }
            console.log(`[Auto-Reactivate] Successfully restored ${customer.pppoe_username} on router.`)
          } catch (err: any) {
             console.error('MikroTik Reactivation Error:', err)
             routerWarning = 'Payment logged, but router could not be reached for auto-reactivation. Please check MikroTik connection.'
          } finally {
            if (mikrotikApi) await mikrotikApi.close()
          }
        }
      } catch (err) {
        console.error('Package lookup failed during reactivation:', err)
      }
    }

    // ── Step 4: Atomic Database Transaction ──
    const insertPayload: Record<string, any> = {
      customer_id,
      amount,
      transaction_type,
      payment_method: payment_method || 'cash',
      status: 'completed',
    }
    if (collected_by_id) insertPayload.collected_by_id = collected_by_id
    if (reference_id) insertPayload.reference_id = reference_id

    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert([insertPayload])
      .select()
      .single()

    if (insertError) {
      console.error('Transaction insert failed:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // 4b. UPDATE the customer (only for billing/connection types)
    if (newExpiryDate) {
      const { error: updateError } = await supabaseAdmin
        .from('customers')
        .update({
          expiry_date: newExpiryDate,
          status: 'active',
        })
        .eq('id', customer_id)

      if (updateError) {
        console.error('Customer update failed, rolling back transaction:', updateError)
        await supabaseAdmin.from('transactions').delete().eq('id', transaction.id)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        message: routerWarning || 'Payment recorded and customer reactivated successfully.',
        transaction,
        new_expiry: newExpiryDate,
        router_warning: routerWarning
      }, { status: 200 })
    }

    return NextResponse.json({
      message: 'Transaction recorded. No expiry changes applied.',
      transaction,
    }, { status: 200 })

  } catch (error: any) {
    console.error('POST /api/transactions error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

