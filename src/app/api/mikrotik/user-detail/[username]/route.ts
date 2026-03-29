import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mikrotik/user-detail/[username]
 * 
 * Fetches live session data (IP, MAC, Uptime) for a specific PPPoE user.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  let mikrotikApi

  try {
    mikrotikApi = await connectMikrotik()

    // 1. Fetch active session for this user
    // We use .query() with a filter for efficiency
    const activeSessions = await mikrotikApi.write('/ppp/active/print', [
      `?name=${username}`
    ])

    if (!activeSessions || activeSessions.length === 0) {
      return NextResponse.json({
        success: false,
        online: false,
        message: 'No active session found for this user.'
      }, { status: 404 })
    }

    const session = activeSessions[0]

    return NextResponse.json({
      success: true,
      online: true,
      detail: {
        username: session.name,
        ip_address: session.address,
        mac_address: session['caller-id'] || 'Unknown',
        uptime: session.uptime || '00:00:00',
        service: session.service,
        encoding: session.encoding
      }
    })

  } catch (error: any) {
    console.error(`User Detail API Error for ${username}:`, error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user details from MikroTik.' },
      { status: 500 }
    )
  } finally {
    if (mikrotikApi) await mikrotikApi.close()
  }
}
