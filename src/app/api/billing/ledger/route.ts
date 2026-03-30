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
      // dateQuery is 'YYYY-MM-DD'
      // Determine the start and end of that specific day in Bangladesh Time (+06:00)
      // If we query UTC, payments from 1 AM BDT on 31st March resolve to 30th March 7 PM UTC.
      const startOfDay = `${dateQuery}T00:00:00.000+06:00`
      const endOfDay = `${dateQuery}T23:59:59.999+06:00`
      
      // Convert to UTC ISO Strings for Supabase comparison (to avoid ambiguity)
      const gte = new Date(startOfDay).toISOString()
      const lte = new Date(endOfDay).toISOString()
      
      query = query.gte('created_at', gte).lte('created_at', lte)
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
