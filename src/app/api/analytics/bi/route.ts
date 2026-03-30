import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // ═══════════════════════════════════════════════════════════════
    // 1. Customer Growth (Last 6 Months)
    // ═══════════════════════════════════════════════════════════════
    const growthData = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))
      
      const { count: gains } = await supabaseAdmin
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())

      const { count: churn } = await supabaseAdmin
        .from('system_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action_type', 'AUTO_SUSPEND')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())

      growthData.push({
        month: format(monthStart, 'MMM'),
        newJoins: gains || 0,
        churn: churn || 0,
      })
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. Financials + Profitability Engine
    // ═══════════════════════════════════════════════════════════════
    const { data: thisMonthPayments } = await supabaseAdmin
      .from('payments')
      .select('amount, collected_by, created_at, customer_id')
      .gte('created_at', thisMonthStart.toISOString())

    const { data: lastMonthPayments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString())

    const grossRevenue = (thisMonthPayments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const lastMonthGross = (lastMonthPayments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    
    const profitChangePrefix = grossRevenue >= lastMonthGross ? '+' : ''
    const profitChangePct = lastMonthGross > 0 
      ? ((grossRevenue - lastMonthGross) / lastMonthGross) * 100 
      : 0

    // Fetch active customers for projected revenue + billing data
    const { data: activeCustomers } = await supabaseAdmin
      .from('customers')
      .select('id, monthly_bill, monthly_fee, discount, collector, billing_day, last_payment_date, created_at')
      .eq('status', 'active')

    const projectedRevenue = (activeCustomers || []).reduce((sum, c) => sum + (parseFloat(c.monthly_bill) || 0), 0)

    // Total Billed (expected) = SUM(monthly_bill - discount) for active users  
    const totalBilled = (activeCustomers || []).reduce((sum, c) => {
      const bill = Number(c.monthly_bill) || 0
      const disc = Number(c.discount) || 0
      return sum + Math.max(0, bill - disc)
    }, 0)

    // Profitability Engine: Collection Efficiency
    const collectionEfficiency = totalBilled > 0 
      ? (grossRevenue / totalBilled) * 100 
      : 0

    // Static Expense Variable (IIG Bill + Staff Salaries)
    // Pull from system_settings if available, otherwise use defaults
    const { data: sysSettings } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    const staticExpense = Number(sysSettings?.monthly_expense) || 50000 // Default 50k BDT
    const netProfit = grossRevenue - staticExpense
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0

    // Outstanding = Billed - Collected
    const outstanding = Math.max(0, totalBilled - grossRevenue)

    // ═══════════════════════════════════════════════════════════════
    // 3. Revenue Leakage Tracker
    // ═══════════════════════════════════════════════════════════════
    // Total Discounted Amount vs Total Gross Revenue
    const totalGrossBeforeDiscount = (activeCustomers || []).reduce(
      (sum, c) => sum + (Number(c.monthly_bill) || 0), 0
    )
    const totalDiscounted = (activeCustomers || []).reduce(
      (sum, c) => sum + (Number(c.discount) || 0), 0
    )
    const leakagePercentage = totalGrossBeforeDiscount > 0 
      ? (totalDiscounted / totalGrossBeforeDiscount) * 100 
      : 0
    const leakageAlert = leakagePercentage > 5 // Orange warning if > 5%

    // ═══════════════════════════════════════════════════════════════
    // 4. Staff Performance Table (with Avg Days to Collect)
    // ═══════════════════════════════════════════════════════════════
    // Build collector -> assigned customers mapping 
    const collectorTargets: Record<string, {
      assignedTarget: number,
      assignedUsers: number,
      collected: number,
      paymentDays: number[],
    }> = {}

    for (const c of (activeCustomers || [])) {
      const collector = (c.collector || '').trim()
      if (!collector) continue
      
      if (!collectorTargets[collector]) {
        collectorTargets[collector] = { assignedTarget: 0, assignedUsers: 0, collected: 0, paymentDays: [] }
      }
      const bill = Number(c.monthly_bill) || 0
      const disc = Number(c.discount) || 0
      collectorTargets[collector].assignedTarget += Math.max(0, bill - disc)
      collectorTargets[collector].assignedUsers += 1
    }

    // Now aggregate payments to each collector
    if (thisMonthPayments) {
      for (const p of thisMonthPayments) {
        const collector = (p.collected_by || '').trim()
        if (!collector) continue

        if (!collectorTargets[collector]) {
          collectorTargets[collector] = { assignedTarget: 0, assignedUsers: 0, collected: 0, paymentDays: [] }
        }
        collectorTargets[collector].collected += (parseFloat(p.amount) || 0)

        // Calculate days between billing cycle start and payment date
        // billingDay is the 1st of the month for most, so we measure from month start
        const paymentDate = new Date(p.created_at)
        const dayOfMonth = paymentDate.getDate()
        collectorTargets[collector].paymentDays.push(dayOfMonth)
      }
    }

    const staffPerformance = Object.entries(collectorTargets)
      .map(([name, data]) => {
        const progress = data.assignedTarget > 0 
          ? (data.collected / data.assignedTarget) * 100 
          : 0
        const avgDays = data.paymentDays.length > 0
          ? data.paymentDays.reduce((a, b) => a + b, 0) / data.paymentDays.length
          : 0

        return {
          name,
          assignedTarget: parseFloat(data.assignedTarget.toFixed(2)),
          assignedUsers: data.assignedUsers,
          collected: parseFloat(data.collected.toFixed(2)),
          progress: parseFloat(progress.toFixed(1)),
          avgDaysToCollect: parseFloat(avgDays.toFixed(1)),
          paymentsCount: data.paymentDays.length,
        }
      })
      .sort((a, b) => b.collected - a.collected)

    // ═══════════════════════════════════════════════════════════════
    // 5. Bandwidth Trends (TB Consumed)
    // ═══════════════════════════════════════════════════════════════
    const vlanStats: any = {}
    const vlanList = ['IIG', 'BDIX', 'YouTube', 'Facebook', 'FTP']

    for (const vlan of vlanList) {
      const { data: thisMonthLogs } = await supabaseAdmin
        .from('vlan_logs')
        .select('rx_bytes, tx_bytes')
        .eq('vlan_name', vlan)
        .gte('created_at', thisMonthStart.toISOString())
        .order('created_at', { ascending: true })

      let consumedThis = 0
      if (thisMonthLogs && thisMonthLogs.length > 1) {
        const first = (thisMonthLogs[0].rx_bytes + thisMonthLogs[0].tx_bytes)
        const last = (thisMonthLogs[thisMonthLogs.length - 1].rx_bytes + thisMonthLogs[thisMonthLogs.length - 1].tx_bytes)
        consumedThis = Math.max(0, last - first)
      }

      const { data: lastMonthLogs } = await supabaseAdmin
        .from('vlan_logs')
        .select('rx_bytes, tx_bytes')
        .eq('vlan_name', vlan)
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
        .order('created_at', { ascending: true })

      let consumedLast = 0
      if (lastMonthLogs && lastMonthLogs.length > 1) {
        const first = (lastMonthLogs[0].rx_bytes + lastMonthLogs[0].tx_bytes)
        const last = (lastMonthLogs[lastMonthLogs.length - 1].rx_bytes + lastMonthLogs[lastMonthLogs.length - 1].tx_bytes)
        consumedLast = Math.max(0, last - first)
      }

      vlanStats[vlan] = {
        thisMonthTB: parseFloat((consumedThis / (1024 ** 4)).toFixed(2)),
        lastMonthTB: parseFloat((consumedLast / (1024 ** 4)).toFixed(2)),
      }
    }

    // Efficiency: Revenue per Peak Gbps
    const { data: peakIIGLogs } = await supabaseAdmin
      .from('vlan_logs')
      .select('rx_bytes, tx_bytes, created_at')
      .eq('vlan_name', 'IIG')
      .gte('created_at', thisMonthStart.toISOString())
      .order('created_at', { ascending: true })

    let peakGbps = 0
    if (peakIIGLogs && peakIIGLogs.length > 1) {
       let maxDelta = 0
       for(let i=1; i<peakIIGLogs.length; i++) {
          const t1 = new Date(peakIIGLogs[i-1].created_at).getTime()
          const t2 = new Date(peakIIGLogs[i].created_at).getTime()
          const b1 = peakIIGLogs[i-1].rx_bytes + peakIIGLogs[i-1].tx_bytes
          const b2 = peakIIGLogs[i].rx_bytes + peakIIGLogs[i].tx_bytes
          
          const seconds = (t2 - t1) / 1000
          if (seconds > 0) {
             const bps = ((b2 - b1) * 8) / seconds
             if (bps > maxDelta) maxDelta = bps
          }
       }
       peakGbps = maxDelta / (1000 ** 3)
    }
    const revenuePerGbps = peakGbps > 0 ? grossRevenue / peakGbps : 0

    // ═══════════════════════════════════════════════════════════════
    // 6. Collector Leaderboard (legacy, kept for backward compat)
    // ═══════════════════════════════════════════════════════════════
    const masters: Record<string, number> = {}
    if (thisMonthPayments) {
       thisMonthPayments.forEach(p => {
          const name = p.collected_by || 'Office'
          masters[name] = (masters[name] || 0) + (parseFloat(p.amount) || 0)
       })
    }

    const leaderboard = Object.entries(masters).map(([name, total]) => ({
       name,
       collected: total,
       target: 100000,
       percentage: (total / 100000) * 100
    })).sort((a, b) => b.collected - a.collected)

    // ═══════════════════════════════════════════════════════════════
    // 7. Daily Revenue Trend (Last 30 Days)
    // ═══════════════════════════════════════════════════════════════
    const revenueTrend = []
    for (let i = 29; i >= 0; i--) {
       const day = subDays(now, i)
       const dayStartStr = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString()
       const dayEndStr = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999).toISOString()
       
       const { data: dayAmt } = await supabaseAdmin
          .from('payments')
          .select('amount')
          .gte('created_at', dayStartStr)
          .lte('created_at', dayEndStr)
       
       const total = (dayAmt || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
       revenueTrend.push({
          date: format(day, 'MMM dd'),
          amount: total
       })
    }

    return NextResponse.json({
      success: true,
      growth: growthData,
      financials: {
        gross: grossRevenue,
        lastGross: lastMonthGross,
        diff: profitChangePct,
        diffLabel: `${profitChangePrefix}${profitChangePct.toFixed(1)}%`,
        projected: projectedRevenue,
      },
      // NEW: Profitability Engine
      profitability: {
        totalBilled,
        totalCollected: grossRevenue,
        collectionEfficiency: parseFloat(collectionEfficiency.toFixed(1)),
        staticExpense,
        netProfit: parseFloat(netProfit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        outstanding: parseFloat(outstanding.toFixed(2)),
      },
      // NEW: Revenue Leakage
      leakage: {
        totalGrossBeforeDiscount: parseFloat(totalGrossBeforeDiscount.toFixed(2)),
        totalDiscounted: parseFloat(totalDiscounted.toFixed(2)),
        leakagePercentage: parseFloat(leakagePercentage.toFixed(2)),
        isAlert: leakageAlert,
      },
      // NEW: Staff Performance
      staffPerformance,
      bandwidth: vlanStats,
      efficiency: {
         peakIIG: parseFloat(peakGbps.toFixed(2)),
         revenuePerGbps: parseFloat(revenuePerGbps.toFixed(2))
      },
      leaderboard,
      revenueTrend,
    })

  } catch (error: any) {
    console.error('BI Analytics API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function subDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}
