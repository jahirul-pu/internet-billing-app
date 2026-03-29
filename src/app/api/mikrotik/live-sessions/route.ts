import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mikrotik/live-sessions
 * 
 * Fetches the list of all currently active PPPoE sessions from the router.
 * Returns a simple array of usernames.
 */
export async function GET() {
  let mikrotikApi
  try {
    mikrotikApi = await connectMikrotik()
    
    const activeSessions = await mikrotikApi.write('/ppp/active/print')
    
    // Extract only unique usernames from the active list
    const onlineUsernames = Array.from(new Set(
      (activeSessions || []).map((s: any) => s.name)
    ))

    return NextResponse.json({
      success: true,
      online: onlineUsernames,
      count: onlineUsernames.length
    })

  } catch (error: any) {
    console.error('Live Sessions Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reach MikroTik for live session list.' },
      { status: 500 }
    )
  } finally {
    if (mikrotikApi) await mikrotikApi.close()
  }
}
