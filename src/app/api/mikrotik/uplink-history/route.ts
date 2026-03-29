import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { VLANS } from '@/lib/vlan-config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mikrotik/uplink-history?period=today|week|month
 *
 * Reads from the `vlan_logs` table and calculates the delta (difference
 * between the latest and earliest snapshot) for each VLAN within the
 * requested time window.
 *
 * Returns data shaped for the BarChart:
 * [
 *   { vlan: "IIG",  download_gb: 120.5, upload_gb: 14.2 },
 *   { vlan: "BDIX", download_gb: 300.1, upload_gb: 45.5 },
 *   ...
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    const period = request.nextUrl.searchParams.get('period') || 'today'

    // Calculate the start timestamp
    const now = new Date()
    let since: Date

    switch (period) {
      case 'week':
        since = new Date(now)
        since.setDate(since.getDate() - 7)
        since.setHours(0, 0, 0, 0)
        break
      case 'month':
        since = new Date(now)
        since.setDate(1)
        since.setHours(0, 0, 0, 0)
        break
      case 'today':
      default:
        since = new Date(now)
        since.setHours(0, 0, 0, 0)
        break
    }

    const vlanNames = VLANS.map(v => v.name)

    // Fetch earliest and latest snapshots for each VLAN in the period
    const { data: logs, error } = await supabaseAdmin
      .from('vlan_logs')
      .select('vlan_name, rx_bytes, tx_bytes, created_at')
      .in('vlan_name', vlanNames)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    if (!logs || logs.length === 0) {
      return NextResponse.json({ success: true, data: [], period })
    }

    // Group by VLAN name
    const grouped: Record<string, typeof logs> = {}
    for (const log of logs) {
      if (!grouped[log.vlan_name]) grouped[log.vlan_name] = []
      grouped[log.vlan_name].push(log)
    }

    // Calculate deltas — the difference between first and last snapshot
    const data = vlanNames
      .filter(name => grouped[name] && grouped[name].length >= 2)
      .map(name => {
        const entries = grouped[name]
        const first = entries[0]
        const last = entries[entries.length - 1]

        const rxDelta = (last.rx_bytes - first.rx_bytes)
        const txDelta = (last.tx_bytes - first.tx_bytes)

        // Convert bytes to GB (1 GB = 1,073,741,824 bytes)
        return {
          vlan: name,
          download_gb: parseFloat(Math.max(0, rxDelta / 1_073_741_824).toFixed(2)),
          upload_gb: parseFloat(Math.max(0, txDelta / 1_073_741_824).toFixed(2)),
        }
      })

    return NextResponse.json({ success: true, data, period })
  } catch (error: any) {
    console.error('[Uplink History] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch historical data.' },
      { status: 500 }
    )
  }
}
