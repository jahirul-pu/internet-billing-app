import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mikrotik/dashboard
 * 
 * Fetches real-time observability data from the MikroTik router.
 * Includes CPU, Memory, Uptime, Active Sessions, and Dual-WAN Traffic.
 */
export async function GET() {
  let mikrotikApi;
  try {
    mikrotikApi = await connectMikrotik()

    // 1. Fetch System Resources
    const resources = await mikrotikApi.write('/system/resource/print')
    const resource = resources[0] || {}

    // 2. Fetch Active PPPoE Sessions Count
    const activeSessions = await mikrotikApi.write('/ppp/active/print')
    const activeCount = activeSessions.length

    // 3. Dynamic Interface Traffic Monitoring
    // First, verify which interfaces actually exist to avoid "input does not match any value of interface"
    const allInterfaces = await mikrotikApi.write('/interface/print', ['=.proplist=name'])
    const existingNames = new Set(allInterfaces.map((i: any) => i.name))

    const targets = ['1ether11', '1ether12'].filter(name => existingNames.has(name))
    
    let wan1Rx = 0, wan1Tx = 0, wan2Rx = 0, wan2Tx = 0

    if (targets.length > 0) {
      try {
        const traffic = await mikrotikApi.write('/interface/monitor-traffic', [
          `=interface=${targets.join(',')}`,
          '=once='
        ])

        const wan1 = traffic.find((t: any) => t.name === '1ether11') || {}
        const wan2 = traffic.find((t: any) => t.name === '1ether12') || {}

        wan1Rx = (parseInt(wan1['rx-bits-per-second']) || 0) / 1000000
        wan1Tx = (parseInt(wan1['tx-bits-per-second']) || 0) / 1000000
        wan2Rx = (parseInt(wan2['rx-bits-per-second']) || 0) / 1000000
        wan2Tx = (parseInt(wan2['tx-bits-per-second']) || 0) / 1000000
      } catch (trafficErr) {
        console.warn('[Dashboard API]: Traffic monitoring failed for targets:', targets, trafficErr)
      }
    }

    // Memory calculation
    const freeMem = parseInt(resource['free-memory']) || 0
    const totalMem = parseInt(resource['total-memory']) || 1
    const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100)

    return NextResponse.json({
      success: true,
      stats: {
        cpu_load: parseInt(resource['cpu-load']) || 0,
        mem_usage: memUsage,
        uptime: resource.uptime || '00:00:00',
        active_sessions: activeCount,
        traffic: {
          wan1: {
            rx: parseFloat(wan1Rx.toFixed(2)),
            tx: parseFloat(wan1Tx.toFixed(2))
          },
          wan2: {
            rx: parseFloat(wan2Rx.toFixed(2)),
            tx: parseFloat(wan2Tx.toFixed(2))
          }
        },
        available_interfaces: Array.from(existingNames) // Send this for debugging help
      }
    })

  } catch (error: any) {
    console.error('Dual-WAN Dashboard Fetch Failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error) 
    }, { status: 500 })
  } finally {
    if (mikrotikApi) {
      try { await mikrotikApi.close() } catch { /* ignore */ }
    }
  }
}
