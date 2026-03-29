import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('zones')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('GET /api/zones error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('GET /api/zones error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
