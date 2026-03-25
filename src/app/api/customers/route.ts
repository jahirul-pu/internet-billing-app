import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Attempting a relational join. Supabase automatically resolves foreign keys.
    // 'packages' returns the package name. 'zones' returns the zone name.
    // We alias the 'users' joined data to 'agent' for clarity on the frontend.
    const { data: customers, error } = await supabaseAdmin
      .from('customers')
      .select(`
        *,
        packages:package_id ( name, download_speed, upload_speed, price ),
        zones:zone_id ( name ),
        agent:agent_id ( full_name )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase Query Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(customers)
  } catch (error: any) {
    console.error('Server Internal Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pppoe_username } = body

    if (!pppoe_username) {
      return NextResponse.json(
        { error: 'PPPoE Username is strictly required' },
        { status: 400 }
      )
    }

    // 1. Verify that the PPPoE Username is entirely unique before proceeding
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('pppoe_username', pppoe_username)
      .maybeSingle() // Using maybeSingle avoids throwing PGRST116 if 0 rows are found

    if (checkError) throw checkError

    if (existingUser) {
      return NextResponse.json(
        { error: 'This PPPoE Username is already taken' },
        { status: 409 }
      )
    }

    // 2. Safely initialize 'zone_id' if missing from frontend
    let targetZoneId = body.zone_id
    if (!targetZoneId) {
      let { data: defaultZone } = await supabaseAdmin
        .from('zones')
        .select('id')
        .eq('name', 'Default Zone')
        .maybeSingle()
      
      if (!defaultZone) {
        const { data: newZone } = await supabaseAdmin
          .from('zones')
          .insert([{ name: 'Default Zone', description: 'System generated fallback' }])
          .select('id')
          .single()
        defaultZone = newZone
      }
      targetZoneId = defaultZone?.id
    }

    // 3. Insert the new customer mapping all attributes securely
    const { data, error: insertError } = await supabaseAdmin
      .from('customers')
      .insert([{ ...body, zone_id: targetZoneId }])
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
