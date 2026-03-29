import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/staff error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('GET /api/staff error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, roles, zone } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and Phone are required.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('staff')
      .insert([{
        name,
        phone,
        roles: roles || [],
        zone: zone || 'Unassigned',
        status: 'Active',
      }])
      .select()
      .single()

    if (error) {
      console.error('POST /api/staff insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/staff error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
