import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Fetch all active customers who have an assigned collector
    const { data: customers, error: custErr } = await supabaseAdmin
      .from('customers')
      .select('id, collector, monthly_bill, discount')
      .eq('status', 'active')
      .not('collector', 'is', null)

    if (custErr) {
      console.error('Supabase fetch error resolving targets:', custErr)
      return NextResponse.json({ error: custErr.message }, { status: 400 })
    }

    // 2. Fetch all payments for the current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const { data: payments, error: payErr } = await supabaseAdmin
      .from('payments')
      .select('amount, collected_by')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)

    if (payErr) {
      console.error('Supabase fetch error resolving payments:', payErr)
      return NextResponse.json({ error: payErr.message }, { status: 400 })
    }

    // 3. Build targets: collector -> { total_users, expected_collection, actual_collected }
    const targets: Record<string, { total_users: number; expected_collection: number; actual_collected: number }> = {}

    for (const c of customers) {
      if (!c.collector) continue
      const collector = c.collector.trim()

      if (!targets[collector]) {
        targets[collector] = { total_users: 0, expected_collection: 0, actual_collected: 0 }
      }

      const bill = Number(c.monthly_bill) || 0
      const discount = Number(c.discount) || 0

      targets[collector].total_users += 1
      targets[collector].expected_collection += Math.max(0, bill - discount)
    }

    // 4. Aggregate payments by precisely who collected it (instead of who is currently assigned)
    for (const p of (payments || [])) {
      const collector = (p.collected_by || 'Office').trim()
      
      // If it's a staff member we don't have registered yet, we still track it but it won't crash
      if (!targets[collector]) {
        targets[collector] = { total_users: 0, expected_collection: 0, actual_collected: 0 }
      }

      targets[collector].actual_collected += Number(p.amount) || 0
    }

    return NextResponse.json({ targets })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
