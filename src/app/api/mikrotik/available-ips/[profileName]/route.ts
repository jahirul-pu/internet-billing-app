import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'
import IPCIDR from 'ip-cidr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mikrotik/available-ips/[profileName]
 * 
 * Calculates available IPs for a given PPPoE profile by:
 * 1. Querying the profile to find its remote-address (IP Pool) and local-address (Gateway)
 * 2. Fetching the pool's CIDR ranges and expanding them
 * 3. Filtering out: network IP, broadcast IP, gateway IP, and currently assigned IPs
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ profileName: string }> }
) {
  let api
  try {
    const { profileName } = await context.params

    if (!profileName) {
      return NextResponse.json({ error: 'Profile name is required' }, { status: 400 })
    }

    api = await connectMikrotik()

    // ── Step A: Get the profile's remote-address (Pool) and local-address (Gateway) ──
    const profiles = await api.write('/ppp/profile/print', [
      `?name=${profileName}`
    ])

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: `Profile "${profileName}" not found on router` },
        { status: 404 }
      )
    }

    const profile = profiles[0]
    const poolName = profile['remote-address']
    const gatewayIp = profile['local-address'] || ''

    if (!poolName) {
      return NextResponse.json(
        { 
          error: `Profile "${profileName}" has no remote-address (IP Pool) configured`,
          hint: 'Set a remote-address pool on this profile in MikroTik' 
        },
        { status: 404 }
      )
    }

    // ── Step B: Fetch the pool's ranges ──
    const pools = await api.write('/ip/pool/print', [
      `?name=${poolName}`
    ])

    if (!pools || pools.length === 0) {
      return NextResponse.json(
        { error: `IP Pool "${poolName}" not found on router` },
        { status: 404 }
      )
    }

    const poolRanges = pools[0].ranges || ''

    // ── Step C: Fetch all currently assigned remote-addresses from PPPoE secrets ──
    const secrets = await api.write('/ppp/secret/print')
    const usedIps = new Set<string>()
    for (const secret of secrets) {
      if (secret['remote-address']) {
        usedIps.add(secret['remote-address'])
      }
    }

    // Also fetch active connections to catch dynamically assigned IPs
    const activeConnections = await api.write('/ppp/active/print')
    for (const conn of activeConnections) {
      if (conn.address) {
        usedIps.add(conn.address)
      }
    }

    // ── Expansion Logic: Parse ranges and compute available IPs ──
    // MikroTik pool ranges can be:
    //   - CIDR: "10.151.50.0/28"
    //   - Range: "10.151.50.1-10.151.50.14"
    //   - Multiple: "10.151.50.0/28,10.151.51.0/28"
    const rangeSegments = poolRanges.split(',').map((s: string) => s.trim())
    const allExpandedIps: string[] = []
    const excludedIps = new Set<string>()

    // Always exclude the gateway
    if (gatewayIp) {
      excludedIps.add(gatewayIp)
    }

    for (const segment of rangeSegments) {
      if (!segment) continue

      if (segment.includes('/')) {
        // ── CIDR notation ──
        let cidr: any
        try {
          cidr = new IPCIDR(segment)
        } catch {
          console.warn(`[available-ips] Invalid CIDR: ${segment}`)
          continue
        }

        const expandedIps: string[] = cidr.toArray()

        // First IP = Network Address, Last IP = Broadcast Address
        if (expandedIps.length > 0) {
          excludedIps.add(expandedIps[0])  // Network IP
          excludedIps.add(expandedIps[expandedIps.length - 1])  // Broadcast IP
        }

        allExpandedIps.push(...expandedIps)

      } else if (segment.includes('-')) {
        // ── Range notation (e.g. 10.0.0.1-10.0.0.14) ──
        const [startStr, endStr] = segment.split('-').map((s: string) => s.trim())
        const startParts = startStr.split('.').map(Number)
        const endParts = endStr.split('.').map(Number)

        const startNum = (startParts[0] << 24) + (startParts[1] << 16) + (startParts[2] << 8) + startParts[3]
        const endNum = (endParts[0] << 24) + (endParts[1] << 16) + (endParts[2] << 8) + endParts[3]

        for (let i = startNum; i <= endNum; i++) {
          const ip = `${(i >>> 24) & 0xFF}.${(i >>> 16) & 0xFF}.${(i >>> 8) & 0xFF}.${i & 0xFF}`
          allExpandedIps.push(ip)
        }

      } else {
        // ── Single IP ──
        allExpandedIps.push(segment)
      }
    }

    // ── Final Filtering: remove network, broadcast, gateway, and used IPs ──
    const availableIps = allExpandedIps.filter(ip => {
      if (excludedIps.has(ip)) return false
      if (usedIps.has(ip)) return false
      return true
    })

    return NextResponse.json({
      success: true,
      profile: profileName,
      pool: poolName,
      gateway: gatewayIp,
      total_in_pool: allExpandedIps.length,
      used_count: usedIps.size,
      excluded_count: excludedIps.size,
      available_ips: availableIps,
      available_count: availableIps.length
    })

  } catch (error: any) {
    console.error('[available-ips] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate available IPs' },
      { status: 500 }
    )
  } finally {
    if (api) {
      try { await api.close() } catch {}
    }
  }
}
