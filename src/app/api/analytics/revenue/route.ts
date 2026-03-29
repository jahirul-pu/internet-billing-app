import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/revenue
 * 
 * Calculates the total collected BDT this month and the total outstanding 
 * balance from overdue users.
 */
export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    // 1. Fetch payments for the current month
    const { data: payments, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('amount, collected_by, created_at')
      .gte('created_at', startOfMonth.toISOString())

    if (paymentError) throw paymentError
    
    let collected_total = 0
    let collected_office = 0
    let collected_field = 0
    let collected_today = 0

    if (payments) {
      payments.forEach(p => {
        const amt = parseFloat(p.amount) || 0
        collected_total += amt
        
        const collector = (p.collected_by || 'Office').trim()
        if (collector.toLowerCase() === 'office') {
          collected_office += amt
        } else {
          collected_field += amt
        }

        if (p.created_at >= todayStart) {
          collected_today += amt
        }
      })
    }

    // 2. Calculate Expected Collection & Outstanding
    // Expected is simply the sum of package prices for all customers
    const { data: users, error: userError } = await supabaseAdmin
      .from('customers')
      .select('packages(price)')

    if (userError) throw userError

    let expected = 0
    if (users) {
      users.forEach((u: any) => {
        expected += (u.packages?.price || 0)
      })
    }

    const outstanding = Math.max(0, expected - collected_total)

    return NextResponse.json({
      success: true,
      summary: {
        expected: parseFloat(expected.toFixed(2)),
        collected: parseFloat(collected_total.toFixed(2)),
        collected_office: parseFloat(collected_office.toFixed(2)),
        collected_field: parseFloat(collected_field.toFixed(2)),
        collected_today: parseFloat(collected_today.toFixed(2)),
        outstanding: parseFloat(outstanding.toFixed(2)),
        currency: 'BDT'
      }
    })

  } catch (error: any) {
    console.error('Revenue Analytics Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate revenue stats.' },
      { status: 500 }
    )
  }
}
