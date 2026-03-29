import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'
import { supabaseAdmin } from '@/lib/db'
import { VLANS, VLAN_INTERFACE_NAMES } from '@/lib/vlan-config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/uplink-logger
 * 
 * Secure cron job that runs `/interface/print stats` for configured VLAN interfaces,
 * extracts cumulative byte counters, and saves them to the vlan_logs table.
 * 
 * Required header: Authorization: Bearer {CRON_SECRET}
 */
export async function POST(request: Request) {
  let api
  try {
    // 1. Security Check
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    api = await connectMikrotik()

    // 2. Fetch interface stats for our VLAN interfaces
    const stats = await api.write('/interface/print', [
      '=stats=',
      '=.proplist=name,rx-byte,tx-byte',
    ])

    // 3. Filter to our configured VLANs
    const vlanSet = new Set(VLAN_INTERFACE_NAMES)
    const relevantStats = stats.filter((s: any) => vlanSet.has(s.name))

    if (relevantStats.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matching VLAN interfaces found on router.',
        configured: VLAN_INTERFACE_NAMES,
      })
    }

    // 4. Build log records
    const now = new Date().toISOString()
    const logs = relevantStats.map((s: any) => {
      const vlanEntry = VLANS.find(v => v.ifacce === s.name)
      return {
        vlan_name: vlanEntry?.name || s.name,
        rx_bytes: parseInt(s['rx-byte']) || 0,
        tx_bytes: parseInt(s['tx-byte']) || 0,
        created_at: now,
      }
    })

    // 5. Save to Supabase
    const { error } = await supabaseAdmin
      .from('vlan_logs')
      .insert(logs)

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: logs.length,
      timestamp: now,
      logged: logs.map(l => l.vlan_name),
    })
  } catch (error: any) {
    console.error('[Uplink Logger Cron Error]:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log traffic snapshots.' },
      { status: 500 }
    )
  } finally {
    if (api) {
      try { await api.close() } catch { /* ignore */ }
    }
  }
}
