import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''

    let query = supabaseAdmin
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (search) {
      query = query.ilike('target_user', `%${search}%`)
    }

    const { data: logs, error } = await query

    if (error) {
       // if table doesn't exist, return empty array to prevent UI crash
       if (error.code === '42P01') { 
         return NextResponse.json({ 
           success: true, 
           data: [], 
           warning: 'system_logs table does not exist. Please create it in Supabase.'
         })
       }
       throw error
    }

    return NextResponse.json({ success: true, data: logs })
  } catch (error: any) {
    console.error('System Logs API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch system logs' },
      { status: 500 }
    )
  }
}
