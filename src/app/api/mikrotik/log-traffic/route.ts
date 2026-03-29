import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mikrotik/log-traffic
 * 
 * Fetches all active sessions from the MikroTik and saves a snapshot of their bytes-in/out
 * into the usage_logs table. This handles persistence through router reboots.
 */
export async function POST() {
  let mikrotikApi
  
  try {
    mikrotikApi = await connectMikrotik()
    
    // 1. Fetch all active sessions
    const sessions = await mikrotikApi.write('/ppp/active/print')
    
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ success: true, message: 'No active sessions to log.' })
    }

    // 2. Map sessions to usage log records
    // Note: MikroTik's 'bytes-in' is Upload from user perspective (RX for router)
    // 'bytes-out' is Download from user perspective (TX for router)
    const logs = sessions.map((s: any) => ({
      pppoe_username: s.name,
      download_bytes: parseInt(s['bytes-out']) || 0,
      upload_bytes: parseInt(s['bytes-in']) || 0,
      created_at: new Date().toISOString()
    }))

    // 3. Batch insert into Supabase
    const { error } = await supabaseAdmin
      .from('usage_logs')
      .insert(logs)

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: logs.length,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Traffic Logger Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log traffic snapshots.' },
      { status: 500 }
    )
  } finally {
    if (mikrotikApi) await mikrotikApi.close()
  }
}
