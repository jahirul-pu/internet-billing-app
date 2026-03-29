import { NextResponse } from 'next/server'
import { RouterOSAPI } from 'node-routeros'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mikrotik/test
 * 
 * Strictly tests the MikroTik connection using the credentials provided in the request body.
 * This route bypasses the database to allow testing of settings before THEY are saved.
 */
export async function POST(request: Request) {
  let api: RouterOSAPI | null = null

  try {
    const body = await request.json()
    const { host, port, user, password } = body

    if (!host || !user || !password) {
      return NextResponse.json(
        { error: 'Incomplete credentials. Please provide Host, User, and Password.' },
        { status: 400 }
      )
    }

    // Initialize temporary connection utility directly (bypass DB)
    api = new RouterOSAPI({
      host,
      user,
      password,
      port: parseInt(port) || 9394,
      timeout: 10,
    })

    await api.connect()

    // Run a quick resource test to confirm full API access
    const resources = await api.write('/system/resource/print')
    const resource = resources[0] || {}

    return NextResponse.json({
      success: true,
      message: 'Connected Successfully',
      uptime: resource.uptime || 'Unknown',
      cpu_load: resource['cpu-load'] || '0',
      version: resource.version || 'Unknown',
    })

  } catch (error: any) {
    console.error('[MikroTik Test Error]:', error.message || error)
    
    let message = error.message || String(error)
    if (message.includes('ECONNREFUSED')) message = 'Connection Refused (Check IP/Port/API Service)'
    if (message.includes('ETIMEDOUT')) message = 'Connection Timeout (Check Firewall/Router IP)'
    if (message.includes('cannot log in')) message = 'Authentication Failed (Check User/Pass)'

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  } finally {
    if (api?.connected) {
      try { await api.close() } catch { /* ignore close errors */ }
    }
  }
}
