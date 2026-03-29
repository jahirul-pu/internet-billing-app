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
    const currentDay = now.getDate()

    // 1. Calculate Collected This Month
    const { data: payments, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .gte('created_at', startOfMonth.toISOString())

    if (paymentError) throw paymentError
    const collected = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    // 2. Calculate Outstanding Balance
    // Outstanding users: currentDay >= billing_day AND (last_payment_date is null OR not in current month)
    const { data: users, error: userError } = await supabaseAdmin
      .from('customers')
      .select('id, last_payment_date, billing_day, packages(price)')

    if (userError) throw userError

    let outstanding = 0
    users.forEach((u: any) => {
      const billingDay = u.billing_day || 1
      const isPastBillingDay = currentDay >= billingDay
      
      let isPaidThisMonth = false
      if (u.last_payment_date) {
        const lpDate = new Date(u.last_payment_date)
        isPaidThisMonth = (lpDate.getMonth() === now.getMonth() && lpDate.getFullYear() === now.getFullYear())
      }

      if (isPastBillingDay && !isPaidThisMonth) {
        outstanding += (u.packages?.price || 0)
      }
    })

    return NextResponse.json({
      success: true,
      summary: {
        collected: parseFloat(collected.toFixed(2)),
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
