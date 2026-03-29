import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/collections
 * 
 * Dynamically aggregates today's transactions by collected_by_id.
 * No separate staff wallet table needed — everything is computed
 * from the transactions table in real-time.
 */
export async function GET() {
  try {
    // Get the start and end of today in ISO format
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

    // Fetch all completed transactions created today that have a collector assigned
    const { data: todaysTx, error: txError } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        amount,
        created_at,
        status,
        collected_by_id,
        collected_by:collected_by_id ( id, full_name, zone_id ),
        customer:customer_id ( full_name )
      `)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .eq('status', 'completed')
      .not('collected_by_id', 'is', null)
      .order('created_at', { ascending: true })

    if (txError) {
      console.error('Collections query error:', txError)
      return NextResponse.json({ error: txError.message }, { status: 400 })
    }

    // Group by collector and aggregate
    const staffMap: Record<string, {
      staff_id: string
      staff_name: string
      total_collected: number
      bills_count: number
      transactions: { customer_name: string; amount: number; time: string }[]
    }> = {}

    for (const tx of todaysTx || []) {
      const collector = tx.collected_by as any
      if (!collector?.id) continue

      const staffId = collector.id
      if (!staffMap[staffId]) {
        staffMap[staffId] = {
          staff_id: staffId,
          staff_name: collector.full_name,
          total_collected: 0,
          bills_count: 0,
          transactions: [],
        }
      }
      staffMap[staffId].total_collected += Number(tx.amount)
      staffMap[staffId].bills_count += 1
      staffMap[staffId].transactions.push({
        customer_name: (tx.customer as any)?.full_name || 'Unknown',
        amount: Number(tx.amount),
        time: tx.created_at,
      })
    }

    const collections = Object.values(staffMap)
    const totalCollectedToday = collections.reduce((sum, s) => sum + s.total_collected, 0)

    return NextResponse.json({
      date: startOfDay,
      total_collected_today: totalCollectedToday,
      staff_collections: collections,
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
