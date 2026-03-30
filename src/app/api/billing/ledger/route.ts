import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateQuery = searchParams.get('date') // e.g., '2026-03-30'
    const collectorQuery = searchParams.get('collector') // e.g., 'Jafor', 'Office', 'all'

    let query = supabaseAdmin
      .from('payments')
      .select(`
        id,
        amount,
        created_at,
        payment_method,
        collected_by,
        customers:customer_id (
          id,
          full_name,
          pppoe_username,
          due_balance
        )
      `)
      .order('created_at', { ascending: false })

    if (dateQuery) {
      // Filter by exactly this date
      const startOfDay = `${dateQuery}T00:00:00.000Z`
      const endOfDay = `${dateQuery}T23:59:59.999Z`
      query = query.gte('created_at', startOfDay).lte('created_at', endOfDay)
    }

    if (collectorQuery && collectorQuery !== 'all') {
      if (collectorQuery === 'Office') {
        query = query.in('collected_by', ['Office', 'System', 'Online']) // Typically mapped to these
      } else {
        query = query.eq('collected_by', collectorQuery)
      }
    }

    const { data: payments, error } = await query

    if (error) {
      console.error("Ledger query error:", error)
      return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 })
    }

    // Daily aggregates calculation (regardless of current active filter, 
    // we want today's aggregates. But to be safe, aggregates apply to the current filtered result set!)
    // The user wrote: "Sum of all payments where the date is today"
    // The safest is to just sum what's in 'payments' array and call it "Filtered Period".
    // Alternatively, calculate 'Today' totals natively in the client!

    return NextResponse.json({
      success: true,
      data: payments,
      message: 'Ledger data retrieved successfully.',
    })

  } catch (error: any) {
    console.error('API Error /billing/ledger:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
