import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Security Note: In production, configure Vercel Cron to send a secure bearer token
  // and validate it here to prevent unauthorized triggering.

  try {
    const today = new Date().toISOString().split('T')[0]

    // 1. Target Logic
    // Query active customers whose billing start date has arrived
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

      const { error: updateErr } = await supabaseAdmin
        .from('customers')
        .update({ due_balance: newBalance })
        .eq('id', c.id)

      if (updateErr) {
        console.error(`Failed to update balance for ${c.pppoe_username}:`, updateErr)
        return null
      }

      usersCharged++
      totalRevenueAdded += charge

      // 3. Audit Trail
      logs.push({
        action_type: 'MONTHLY_INVOICE',
        description: `Applied standard monthly charge of ৳${charge}`,
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
      message: `Successfully invoiced ${usersCharged} users. Total value: ৳${totalRevenueAdded}` 
    })
  } catch (error: any) {
    console.error('[CRON] Monthly Invoicer Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
