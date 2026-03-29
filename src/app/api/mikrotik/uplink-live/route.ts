import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'
import { VLANS, VLAN_INTERFACE_NAMES } from '@/lib/vlan-config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mikrotik/uplink-live
 *
 * Runs `/interface/monitor-traffic` once for the configured VLAN interfaces
 * and returns real-time rx/tx in Mbps for each VLAN.
 *
 * Response shape:
 * {
 *   success: true,
 *   timestamp: string,
 *   vlans: {
 *     [vlanName]: { rx_mbps: number, tx_mbps: number }
 *   }
 * }
 */
export async function GET() {
  let api
  try {
    api = await connectMikrotik()

    // 1. Verify which of our configured VLAN interfaces actually exist on the router
    const allInterfaces = await api.write('/interface/print', ['=.proplist=name'])
    const existingNames = new Set(allInterfaces.map((i: any) => i.name))

    const validInterfaces = VLAN_INTERFACE_NAMES.filter(name => existingNames.has(name))

    if (validInterfaces.length === 0) {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        vlans: {},
        warning: 'None of the configured VLAN interfaces were found on the router.',
        configured: VLAN_INTERFACE_NAMES,
        available: Array.from(existingNames),
      })
    }

    // 2. Monitor traffic once for all valid interfaces in a single API call
    const traffic = await api.write('/interface/monitor-traffic', [
      `=interface=${validInterfaces.join(',')}`,
      '=once=',
    ])

    // 3. Map results back to our VLAN names
    const vlans: Record<string, { rx_mbps: number; tx_mbps: number }> = {}

    for (const vlan of VLANS) {
      const match = traffic.find((t: any) => t.name === vlan.ifacce)
      if (match) {
        vlans[vlan.name] = {
          rx_mbps: parseFloat(((parseInt(match['rx-bits-per-second']) || 0) / 1_000_000).toFixed(2)),
          tx_mbps: parseFloat(((parseInt(match['tx-bits-per-second']) || 0) / 1_000_000).toFixed(2)),
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      vlans,
    })
  } catch (error: any) {
    console.error('[Uplink Live] Error:', error)
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
