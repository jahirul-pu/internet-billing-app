import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'
import { supabaseAdmin } from '@/lib/db'
import { VLANS, VLAN_INTERFACE_NAMES } from '@/lib/vlan-config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mikrotik/uplink-logger
 *
 * Runs `/interface/print stats` for the configured VLAN interfaces,
 * extracts cumulative rx-byte and tx-byte, and inserts a snapshot
 * into the `vlan_logs` table in Supabase.
 *
 * Designed to be called by a cron job (e.g. every 5 minutes).
 *
 * Required Supabase table:
 * ```sql
 * CREATE TABLE IF NOT EXISTS vlan_logs (
 *   id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   vlan_name   text NOT NULL,
 *   rx_bytes    bigint NOT NULL DEFAULT 0,
 *   tx_bytes    bigint NOT NULL DEFAULT 0,
 *   created_at  timestamptz NOT NULL DEFAULT now()
 * );
 *
 * CREATE INDEX idx_vlan_logs_name_time ON vlan_logs (vlan_name, created_at DESC);
 * ```
 */
export async function POST() {
  let api
  try {
    api = await connectMikrotik()

    // 1. Fetch interface stats for our VLAN interfaces
    //    Using /interface/print with stats and a name filter
    const stats = await api.write('/interface/print', [
      '=stats=',
      '=.proplist=name,rx-byte,tx-byte',
    ])

    // 2. Filter to only include our configured VLANs
    const vlanSet = new Set(VLAN_INTERFACE_NAMES)
    const relevantStats = stats.filter((s: any) => vlanSet.has(s.name))

    if (relevantStats.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matching VLAN interfaces found on the router.',
        configured: VLAN_INTERFACE_NAMES,
      })
    }

    // 3. Build log records
    const now = new Date().toISOString()
    const logs = relevantStats.map((s: any) => {
      // Find the human-readable VLAN name
      const vlanEntry = VLANS.find(v => v.ifacce === s.name)
      return {
        vlan_name: vlanEntry?.name || s.name,
        rx_bytes: parseInt(s['rx-byte']) || 0,
        tx_bytes: parseInt(s['tx-byte']) || 0,
        created_at: now,
      }
    })

    // 4. Insert into Supabase
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
    console.error('[Uplink Logger] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log VLAN traffic snapshot.' },
      { status: 500 }
    )
  } finally {
    if (api) {
      try { await api.close() } catch { /* ignore */ }
    }
  }
}
