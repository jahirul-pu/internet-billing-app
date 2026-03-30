import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/forecast
 *
 * Calculates:
 * 1. Next Month Expected Revenue = SUM(monthly_fee - discount) for active users
 * 2. Net Growth = New Users - Churn this month
 * 3. Projected Revenue 3 months out (if growth is positive)
 */
export async function GET() {
  try {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)

    // 1. Expected Revenue: sum of (monthly_fee - discount) for all active customers
    const { data: activeUsers, error: activeErr } = await supabaseAdmin
      .from('customers')
      .select('monthly_bill, discount, monthly_fee')
      .eq('status', 'active')

    if (activeErr) throw activeErr

    let expectedRevenue = 0
    for (const u of (activeUsers || [])) {
      const bill = Number(u.monthly_bill) || 0
      const disc = Number(u.discount) || 0
      const fee = Number(u.monthly_fee) || 0
      // Use monthly_fee if available (it's already bill - discount), else compute
      expectedRevenue += fee > 0 ? fee : Math.max(0, bill - disc)
    }

    const totalActiveUsers = (activeUsers || []).length

    // 2. Net Growth: new joins this month vs churn (auto-suspensions)
    const { count: newJoins } = await supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart.toISOString())
      .lte('created_at', thisMonthEnd.toISOString())

    const { count: churnCount } = await supabaseAdmin
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'AUTO_SUSPEND')
      .gte('created_at', thisMonthStart.toISOString())
      .lte('created_at', thisMonthEnd.toISOString())

    const gains = newJoins || 0
    const churn = churnCount || 0
    const netGrowth = gains - churn
    const growthPercentage = totalActiveUsers > 0 
      ? (netGrowth / totalActiveUsers) * 100 
      : 0

    // 3. Projected Revenue 3 months from now
    // If net growth is positive, compound at the growth rate for 3 months
    let projectedRevenue3M = expectedRevenue
    if (netGrowth > 0 && growthPercentage > 0) {
      const growthFactor = 1 + (growthPercentage / 100)
      projectedRevenue3M = expectedRevenue * Math.pow(growthFactor, 3)
    }

    // 4. Last month expected revenue for comparison
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    const { data: lastMonthPayments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString())

    const lastMonthCollected = (lastMonthPayments || []).reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0), 0
    )

    return NextResponse.json({
      success: true,
      forecast: {
        nextMonthExpected: parseFloat(expectedRevenue.toFixed(2)),
        totalActiveUsers,
        newJoins: gains,
        churn,
        netGrowth,
        growthPercentage: parseFloat(growthPercentage.toFixed(2)),
        projectedRevenue3M: parseFloat(projectedRevenue3M.toFixed(2)),
        isGrowthPositive: netGrowth > 0,
        lastMonthCollected: parseFloat(lastMonthCollected.toFixed(2)),
      }
    })
  } catch (error: any) {
    console.error('Forecast API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
