import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/monthly-invoicer
 * 
 * Runs on the 1st of each month. For each active customer whose billing
 * start date has arrived:
 *   1. Adds (monthly_fee - discount) to customer.due_balance
 *   2. Creates a new invoice record for the billing month
 *   3. Logs the action to system_logs
 */
export async function GET(request: Request) {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Generate the billing month label, e.g. "April 2026"
    const billingMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    // 1. Target Logic - Query active customers whose billing start date has arrived
    const { data: customers, error: fetchErr } = await supabaseAdmin
      .from('customers')
      .select('id, pppoe_username, due_balance, monthly_bill, discount, packages:package_id(price)')
      .eq('status', 'active')
      .lte('billing_start_date', today)

    if (fetchErr) throw fetchErr

    if (!customers || customers.length === 0) {
      return NextResponse.json({ success: true, message: "No active users ready for billing." })
    }

    let usersCharged = 0
    let totalRevenueAdded = 0
    const logs: any[] = []

    // 2. Financial Math & Execution
    const updates = customers.map(async (c) => {
      // Charge = (monthly_fee - discount)
      const baseFee = c.monthly_bill || (c.packages as any)?.price || 0
      const charge = Math.max(0, baseFee - (c.discount || 0))

      if (charge <= 0) return null

      const newBalance = Number(c.due_balance || 0) + charge

      // 2a. Update the customer's due_balance (quick-reference summary)
      const { error: updateErr } = await supabaseAdmin
        .from('customers')
        .update({ due_balance: newBalance })
        .eq('id', c.id)

      if (updateErr) {
        console.error(`Failed to update balance for ${c.pppoe_username}:`, updateErr)
        return null
      }

      // 2b. Insert a new invoice record for this billing month
      const { error: invoiceErr } = await supabaseAdmin
        .from('invoices')
        .upsert({
          customer_id: c.id,
          billing_month: billingMonth,
          amount_due: charge,
          amount_paid: 0,
          status: 'unpaid'
        }, {
          onConflict: 'customer_id,billing_month'
        })

      if (invoiceErr) {
        console.error(`Failed to create invoice for ${c.pppoe_username} [${billingMonth}]:`, invoiceErr)
        // Non-fatal: due_balance was already updated, log and continue
      }

      usersCharged++
      totalRevenueAdded += charge

      // 3. Audit Trail
      logs.push({
        action_type: 'MONTHLY_INVOICE',
        description: `Applied monthly charge of ৳${charge} for ${billingMonth}`,
        target_user: c.pppoe_username
      })
    })

    await Promise.all(updates)

    // Insert all logs in bulk for performance
    if (logs.length > 0) {
      const { error: logErr } = await supabaseAdmin.from('system_logs').insert(logs)
      if (logErr) console.error("Audit logging error:", logErr)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully invoiced ${usersCharged} users for ${billingMonth}. Total value: ৳${totalRevenueAdded}` 
    })
  } catch (error: any) {
    console.error('[CRON] Monthly Invoicer Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
