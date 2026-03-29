import { NextResponse } from 'next/server'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mikrotik/kick-user
 * Forcefully terminates an active PPPoE session by clearing it from /ppp/active.
 */
export async function POST(request: Request) {
  let mikrotikApi
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    mikrotikApi = await connectMikrotik()
    
    // Find the session ID(s) for this user
    const activeSessions = await mikrotikApi.write('/ppp/active/print', [
      `?name=${username}`
    ])

    if (!activeSessions || activeSessions.length === 0) {
      return NextResponse.json({ message: 'User is not currently online' }, { status: 404 })
    }

    // Remove all active sessions for this username
    for (const session of activeSessions) {
      await mikrotikApi.write('/ppp/active/remove', [
        `=.id=${session['.id']}`
      ])
    }

    return NextResponse.json({ message: `Successfully disconnected ${username}` })
  } catch (error: any) {
    console.error('MikroTik Kick Error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect user on router', details: error.message },
      { status: 500 }
    )
  } finally {
    if (mikrotikApi) await mikrotikApi.close()
  }
}
