import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/top-consumers
 * 
 * Identifies the Top 5 customers by total data consumption in the current month.
 */
export async function GET() {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // 1. Fetch all snapshots for the current month
    const { data: snapshots, error } = await supabaseAdmin
      .from('usage_logs')
      .select('pppoe_username, download_bytes, upload_bytes, created_at')
      .gte('created_at', startOfMonth.toISOString())
      .order('pppoe_username', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    if (!snapshots || snapshots.length === 0) {
      return NextResponse.json({ success: true, top_consumers: [] })
    }

    // 2. Aggregate per user using a delta-based approach
    const userUsage: Record<string, { totalBytes: number, lastDL: number, lastUL: number, initialized: boolean }> = {}

    snapshots.forEach((s) => {
      const username = s.pppoe_username
      const currentDL = parseInt(s.download_bytes) || 0
      const currentUL = parseInt(s.upload_bytes) || 0

      if (!userUsage[username]) {
        // Benchmark initialization: Needs at least one PRIOR snapshot to calculate usage
        userUsage[username] = { totalBytes: 0, lastDL: currentDL, lastUL: currentUL, initialized: true }
        return
      }

      // Calculate incremental usage (handle counter resets/reboots)
      const dlInc = currentDL >= userUsage[username].lastDL 
        ? currentDL - userUsage[username].lastDL 
        : currentDL
        
      const ulInc = currentUL >= userUsage[username].lastUL 
        ? currentUL - userUsage[username].lastUL 
        : currentUL

      userUsage[username].totalBytes += (dlInc + ulInc)
      
      // Update bookmarks for the next delta
      userUsage[username].lastDL = currentDL
      userUsage[username].lastUL = currentUL
    })

    // 3. Sort and pick Top 5
    const top5 = Object.entries(userUsage)
      .map(([username, data]) => ({
        username,
        totalBytes: data.totalBytes
      }))
      .sort((a, b) => b.totalBytes - a.totalBytes)
      .slice(0, 5)
      .map(u => ({
        username: u.username,
        totalGB: parseFloat((u.totalBytes / 1073741824).toFixed(2))
      }))

    return NextResponse.json({
      success: true,
      top_consumers: top5
    })

  } catch (err: any) {
    console.error('Top Consumers API Error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch top consumers.' },
      { status: 500 }
    )
  }
}
