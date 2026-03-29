import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mikrotik/analytics
 * 
 * Provides deep statistics by cross-referencing database and router data.
 */
export async function GET() {
  let mikrotikApi
  try {
    // Step A: Database counts (Source of truth for Total)
    const { count: totalCount, error: custError } = await supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true })

    if (custError) throw custError
    const total = totalCount || 0

    // Step B & C: Router Fetch (Secrets & Active)
    mikrotikApi = await connectMikrotik()
    
    // Fetch all secrets to count disabled ones (Deactivated)
    const secrets = await mikrotikApi.write('/ppp/secret/print')
    const deactivatedCount = (secrets || []).filter((s: any) => s.disabled === 'true').length

    // Fetch active sessions (Online)
    const activeSessions = await mikrotikApi.write('/ppp/active/print')
    const onlineCount = activeSessions?.length || 0

    // Step D: Math
    const offlineCount = Math.max(0, total - onlineCount - deactivatedCount)
    
    // Avg. Bandwidth calculation
    // Get traffic for ether11 (WAN1) and ether12 (WAN2)
    const allInterfaces = await mikrotikApi.write('/interface/print', ['=.proplist=name'])
    const existingNames = new Set(allInterfaces.map((i: any) => i.name))
    const targets = ['1ether11', '1ether12'].filter(name => existingNames.has(name))
    
    let totalMbps = 0
    if (targets.length > 0) {
      try {
        const traffic = await mikrotikApi.write('/interface/monitor-traffic', [
          `=interface=${targets.join(',')}`,
          '=once='
        ])
        traffic.forEach((t: any) => {
          const rx = (parseInt(t['rx-bits-per-second']) || 0) / 1000000
          const tx = (parseInt(t['tx-bits-per-second']) || 0) / 1000000
          totalMbps += (rx + tx)
        })
      } catch (e) {
        console.warn('Traffic monitor failed in analytics', e)
      }
    }

    const loadFactor = onlineCount > 0 ? totalMbps / onlineCount : 0

    return NextResponse.json({
      success: true,
      stats: {
        total,
        online: onlineCount,
        deactivated: deactivatedCount,
        offline: offlineCount,
        load_factor: parseFloat(loadFactor.toFixed(2))
      }
    })

  } catch (error: any) {
    console.error('Analytics API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate analytics.' },
      { status: 500 }
    )
  } finally {
    if (mikrotikApi) await mikrotikApi.close()
  }
}
