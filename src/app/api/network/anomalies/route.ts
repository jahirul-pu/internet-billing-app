import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * GET /api/network/anomalies
 *
 * Detects "heavy users" — PPPoE subscribers whose average daily download
 * exceeds 20% of the total IIG VLAN traffic. These could be resellers
 * sharing their connection.
 *
 * Logic:
 *  1. Fetch total IIG VLAN cumulative traffic from MikroTik
 *  2. Fetch all active PPPoE sessions and their cumulative traffic
 *  3. Flag any user whose traffic > 20% of IIG total
 */
export async function GET() {
  let api
  try {
    api = await connectMikrotik()

    // 1. Get IIG VLAN total traffic (via router_configs for the VLAN ID)
    const { data: configs } = await supabaseAdmin
      .from('router_configs')
      .select('iig_vlan_id')
      .limit(1)

    const iigVlanId = configs?.[0]?.iig_vlan_id

    let totalIIGBytes = 0

    if (iigVlanId) {
      // Find the IIG VLAN interface
      const allVlans = await api.write('/interface/vlan/print', ['=.proplist=name,vlan-id'])
      const iigIface = allVlans.find((v: any) => String(v['vlan-id']) === String(iigVlanId))

      if (iigIface?.name) {
        // Get cumulative bytes for IIG
        const ifaces = await api.write('/interface/print', [
          `=.proplist=name,rx-byte,tx-byte`,
          `?name=${iigIface.name}`
        ])
        if (ifaces?.[0]) {
          totalIIGBytes = (Number(ifaces[0]['rx-byte']) || 0) + (Number(ifaces[0]['tx-byte']) || 0)
        }
      }
    }

    // 2. Get all active PPPoE sessions with their traffic
    const activeSessions = await api.write('/ppp/active/print', [
      '=.proplist=name,caller-id,address,uptime'
    ])

    // 3. Get all PPPoE interfaces and their traffic
    const allInterfaces = await api.write('/interface/print', [
      '=.proplist=name,rx-byte,tx-byte,type'
    ])

    // Map PPPoE interface traffic
    const pppoeInterfaces = allInterfaces.filter((i: any) =>
      i.name?.startsWith('<pppoe-') || i.type === 'pppoe-in'
    )

    // 4. Cross-reference with customer database
    const { data: customers } = await supabaseAdmin
      .from('customers')
      .select('pppoe_username, full_name, monthly_bill, discount, package_id, packages:package_id(name, price)')
      .eq('status', 'active')

    const customerMap: Record<string, any> = {}
    for (const c of (customers || [])) {
      customerMap[c.pppoe_username] = c
    }

    // 5. Calculate per-user traffic and flag anomalies
    const threshold = totalIIGBytes * 0.20 // 20% of IIG total
    const anomalies: any[] = []
    const allUserTraffic: any[] = []

    for (const iface of pppoeInterfaces) {
      // Extract username from interface name like <pppoe-username>
      let username = iface.name
      if (username.startsWith('<pppoe-')) {
        username = username.replace('<pppoe-', '').replace('>', '')
      }

      const rxBytes = Number(iface['rx-byte']) || 0
      const txBytes = Number(iface['tx-byte']) || 0
      const totalBytes = rxBytes + txBytes
      const totalGB = totalBytes / (1024 ** 3)

      const customer = customerMap[username]
      const percentOfIIG = totalIIGBytes > 0 ? (totalBytes / totalIIGBytes) * 100 : 0

      const userData = {
        username,
        fullName: customer?.full_name || username,
        packageName: (customer?.packages as any)?.name || 'Unknown',
        downloadGB: parseFloat((txBytes / (1024 ** 3)).toFixed(2)), // Router TX = User Download
        uploadGB: parseFloat((rxBytes / (1024 ** 3)).toFixed(2)),   // Router RX = User Upload
        totalGB: parseFloat(totalGB.toFixed(2)),
        percentOfIIG: parseFloat(percentOfIIG.toFixed(2)),
        isAnomaly: totalBytes > threshold && threshold > 0,
      }

      allUserTraffic.push(userData)

      if (userData.isAnomaly) {
        anomalies.push(userData)
      }
    }

    // Sort anomalies by total usage descending
    anomalies.sort((a, b) => b.totalGB - a.totalGB)

    return NextResponse.json({
      success: true,
      totalIIGTrafficGB: parseFloat((totalIIGBytes / (1024 ** 3)).toFixed(2)),
      thresholdGB: parseFloat((threshold / (1024 ** 3)).toFixed(2)),
      anomalyCount: anomalies.length,
      anomalies,
      topUsers: allUserTraffic
        .sort((a, b) => b.totalGB - a.totalGB)
        .slice(0, 10), // Top 10 consumers
    })
  } catch (error: any) {
    console.error('[Network Anomalies] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to detect anomalies',
      anomalyCount: 0,
      anomalies: [],
      topUsers: [],
    }, { status: 500 })
  } finally {
    if (api) {
      try { await api.close() } catch { /* ignore */ }
    }
  }
}
