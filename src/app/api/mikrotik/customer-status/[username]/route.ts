import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mikrotik/customer-status/[username]
 * Checks if a PPPoE user is currently active and returns their session stats.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  let mikrotikApi
  try {
    const { username } = await context.params

    mikrotikApi = await connectMikrotik()
    
    // Check /ppp/active for the specific user
    const activeSessions = await mikrotikApi.write('/ppp/active/print', [
      `?name=${username}`
    ])

    if (activeSessions && activeSessions.length > 0) {
      const session = activeSessions[0]
      return NextResponse.json({
        online: true,
        address: session.address,
        uptime: session.uptime,
        macAddress: session['caller-id'],
        bytesIn: Number(session['bytes-in'] || session['rx-byte'] || session['rx-bytes'] || 0),
        bytesOut: Number(session['bytes-out'] || session['tx-byte'] || session['tx-bytes'] || 0),
        service: session.service,
        raw: session
      })
    }

    return NextResponse.json({ online: false })
  } catch (error: any) {
    console.error('MikroTik Status Fetch Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status from router', details: error.message },
      { status: 500 }
    )
  } finally {
    if (mikrotikApi) await mikrotikApi.close()
  }
}
