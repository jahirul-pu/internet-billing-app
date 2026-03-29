import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/customers/usage/[username]
 * 
 * Aggregates snapshots from 'usage_logs' into daily GB consumption for the last 30 days.
 */
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username
  
  try {
    // 1. Fetch snapshots for this user for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: snapshots, error } = await supabaseAdmin
      .from('usage_logs')
      .select('download_bytes, upload_bytes, created_at')
      .eq('pppoe_username', username)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error
    if (!snapshots || snapshots.length === 0) {
      return NextResponse.json({ success: true, history: [] })
    }

    // 2. Aggregate logic: Sum increments between snapshots.
    // If bytes decrease (reboot/disconnect), the new bytes represent a fresh increment.
    const dailyMap: Record<string, { date: string, download: number, upload: number }> = {}

    let lastDL = 0
    let lastUL = 0

    snapshots.forEach((s) => {
      const dateKey = new Date(s.created_at).toLocaleDateString('en-GB') // DD/MM/YYYY
      
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, download: 0, upload: 0 }
      }

      const currentDL = parseInt(s.download_bytes) || 0
      const currentUL = parseInt(s.upload_bytes) || 0

      // Calculate increments
      const dlInc = currentDL > lastDL ? currentDL - lastDL : currentDL
      const ulInc = currentUL > lastUL ? currentUL - lastUL : currentUL

      dailyMap[dateKey].download += dlInc
      dailyMap[dateKey].upload += ulInc

      lastDL = currentDL
      lastUL = currentUL
    })

    // 3. Convert to GB and return array
    const sortedHistory = Object.values(dailyMap).map((d) => ({
      date: d.date,
      downloadGB: parseFloat((d.download / 1073741824).toFixed(3)), // Bytes to GB (1024^3)
      uploadGB: parseFloat((d.upload / 1073741824).toFixed(3)),
      totalGB: parseFloat(((d.download + d.upload) / 1073741824).toFixed(3))
    }))

    return NextResponse.json({
      success: true,
      username,
      history: sortedHistory
    })

  } catch (err: any) {
    console.error(`Usage API Fail for ${username}:`, err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to aggregate usage data.' },
      { status: 500 }
    )
  }
}
