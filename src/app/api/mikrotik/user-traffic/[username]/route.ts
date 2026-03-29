import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mikrotik/user-traffic/[username]
 * 
 * Fetches real-time bits-per-second AND cumulative session bytes
 * for a specific PPPoE user. Used for live polling in the user flyout.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  let mikrotikApi
  
  try {
    mikrotikApi = await connectMikrotik()
    
    // 1. Resolve exact interface name and cumulative bytes 
    const interfaces = await mikrotikApi.write('/interface/print')
    const iface = interfaces.find((i: any) => 
      i.name === `<pppoe-${username}>` || 
      i.name === username || 
      i.name.includes(username)
    )

    if (!iface) {
      return NextResponse.json({ 
        success: false, 
        message: 'Interface not found or user offline.' 
      }, { status: 404 })
    }

    const exactInterfaceName = iface.name
    
    // Extract cumulative bytes
    let bytesIn = Number(iface['rx-byte'] || 0)
    let bytesOut = Number(iface['tx-byte'] || 0)
    let trafficIn = '0 B'
    let trafficOut = '0 B'

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const gb = bytes / (1024 * 1024 * 1024)
      if (gb >= 1) return `${gb.toFixed(2)} GB`
      const mb = bytes / (1024 * 1024)
      return `${mb.toFixed(2)} MB`
    }
    
    trafficIn = formatBytes(bytesIn)
    trafficOut = formatBytes(bytesOut)

    // 2. Fetch real-time traffic speed for this resolved interface
    const traffic = await mikrotikApi.write('/interface/monitor-traffic', [
      `=interface=${exactInterfaceName}`,
      '=once='
    ])

    const stats = traffic[0] || {}

    // Convert bits-per-second to Mbps
    const rxMbps = (parseInt(stats['rx-bits-per-second']) || 0) / 1000000
    const txMbps = (parseInt(stats['tx-bits-per-second']) || 0) / 1000000

    return NextResponse.json({
      success: true,
      download: parseFloat(rxMbps.toFixed(2)),
      upload: parseFloat(txMbps.toFixed(2)),
      traffic_in: trafficIn,
      traffic_out: trafficOut,
      bytes_in: bytesIn,
      bytes_out: bytesOut,
      debug_interface: "resolved",
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error(`User Traffic API Error for ${username}:`, error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch traffic stats.' },
      { status: 500 }
    )
  } finally {
    if (mikrotikApi) await mikrotikApi.close()
  }
}
