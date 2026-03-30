import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getOrCreateConfig() {
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from('router_configs')
    .select('*')
    .limit(1)

  if (fetchError && fetchError.code !== 'PGRST116') {
     console.error('Fetch error:', fetchError)
  }

  if (rows && rows.length > 0) return rows[0]

  // If no row exists, create one
  const { data: newRow, error } = await supabaseAdmin
    .from('router_configs')
    .insert([{ router_name: 'Main Router', ip_address: '192.168.88.1', username: 'admin', password: '' }])
    .select()
    .single()

  if (error) {
    if (error.message.includes('insert or update on table "router_configs" violates foreign key constraint')) {
       // it needs something
    }
    throw error
  }
  return newRow
}

export async function GET() {
  try {
    const config = await getOrCreateConfig()
    return NextResponse.json(config, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const config = await getOrCreateConfig()

    const { id, created_at, updated_at, ...updatePayload } = body

    const { data, error } = await supabaseAdmin
      .from('router_configs')
      .update(updatePayload)
      .eq('id', config.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Settings saved', data }, { status: 200 })
  } catch (error: any) {
    console.error('API Router Config Error:', error)
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}
