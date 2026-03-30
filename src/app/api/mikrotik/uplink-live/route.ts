import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mikrotik/uplink-live
 *
 * Runs `/interface/monitor-traffic` based on dynamic VLAN IDs configured in Supabase.
 */
export async function GET() {
  let api
  try {
    // Step A: Fetch active router config from Supabase
    const { data: configs } = await supabaseAdmin.from('router_configs').select('*').limit(1)
    const config = configs?.[0] || {}

    // Extract dynamic VLAN IDs, mapped to our internal labels used by Recharts
    const vlanMap: Record<string, string | number> = {
      IIG: config.iig_vlan_id,
      BDIX: config.bdix_vlan_id,
      YouTube: config.ggc_vlan_id,
      Facebook: config.fb_vlan_id,
      FTP: config.ftp_vlan_id,
    }

    // Filter out missing/null configs from the targets
    const requiredVlanLabels = Object.keys(vlanMap).filter(label => !!vlanMap[label])

    if (requiredVlanLabels.length === 0) {
      return NextResponse.json({
         success: true,
         timestamp: new Date().toISOString(),
         vlans: {},
         warning: "No VLAN IDs configured in settings."
      })
    }

    api = await connectMikrotik()

    // Step B: Connect to MikroTik and match VLAN IDs to actual interface names
    // We fetch all VLANs from mikrotik to find their current actual names
    const allVlans = await api.write('/interface/vlan/print', ['=.proplist=name,vlan-id'])
    
    // Step C: Build a reverse map: actual_interface_name -> standard_ui_label
    const interfacesToMonitor: string[] = []
    const ifaceToLabel: Record<string, string> = {}

    for (const label of requiredVlanLabels) {
      const targetVlanId = String(vlanMap[label])
      const match = allVlans.find((v: any) => String(v['vlan-id']) === targetVlanId)

      if (match && match.name) {
        interfacesToMonitor.push(match.name)
        ifaceToLabel[match.name] = label
      }
    }

    if (interfacesToMonitor.length === 0) {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        vlans: {},
        warning: 'None of the dynamically configured VLAN IDs were found on the router.',
      })
    }

    // Step D: Pass those dynamically resolved names into monitor-traffic
    const traffic = await api.write('/interface/monitor-traffic', [
      `=interface=${interfacesToMonitor.join(',')}`,
      '=once=',
    ])

    // Step 3: Ensure Recharts uses standard labels (IIG, BDIX, etc) regardless of actual name
    const vlans: Record<string, { rx_mbps: number; tx_mbps: number }> = {}
    
    // Initialize defaults to 0 based on required labels so dashboard graph handles it gracefully
    for (const label of requiredVlanLabels) {
      vlans[label] = { rx_mbps: 0, tx_mbps: 0 }
    }

    for (const t of traffic) {
       const label = ifaceToLabel[t.name]
       if (label) {
          vlans[label] = {
             rx_mbps: parseFloat(((parseInt(t['rx-bits-per-second']) || 0) / 1_000_000).toFixed(2)),
             tx_mbps: parseFloat(((parseInt(t['tx-bits-per-second']) || 0) / 1_000_000).toFixed(2)),
          }
       }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      vlans,
    })
  } catch (error: any) {
    console.error('[Uplink Live Dynamic] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch live uplink traffic.' },
      { status: 500 }
    )
  } finally {
    if (api) {
      try { await api.close() } catch { /* ignore */ }
    }
  }
}
