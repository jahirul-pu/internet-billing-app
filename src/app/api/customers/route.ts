import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('customers')
      .select(`
        *,
        packages:package_id ( name, price ),
        zones:zone_id ( name )
      `, { count: 'exact' })

    const search = searchParams.get('search')
    if (search) {
      query = query.or(`pppoe_username.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const packageId = searchParams.get('package_id')
    if (packageId && packageId !== 'all') {
      query = query.eq('package_id', packageId)
    }

    const status = searchParams.get('status')
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const zoneId = searchParams.get('zone_id')
    if (zoneId && zoneId !== 'all') {
      query = query.eq('zone_id', zoneId)
    }

    const { data: customers, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase Query Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: customers,
      total: count || 0,
      page,
      limit
    })
  } catch (error: any) {
    console.error('Server Internal Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pppoe_username, pppoe_password, full_name, phone, package_id } = body

    if (!pppoe_username || !pppoe_password || !package_id) {
      return NextResponse.json(
        { error: 'PPPoE Username, Password, and Package are strictly required' },
        { status: 400 }
      )
    }

    // 1. Verify that the PPPoE Username is entirely unique in DB first
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('pppoe_username', pppoe_username)
      .maybeSingle()

    if (checkError) throw checkError

    if (existingUser) {
      return NextResponse.json(
        { error: 'This PPPoE Username is already taken in the portal' },
        { status: 409 }
      )
    }

    // 2. Fetch the package to get the exact mikrotik_profile
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('mikrotik_profile')
      .eq('id', package_id)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json(
        { error: 'Selected package not found or has no MikroTik profile mapped.' },
        { status: 404 }
      )
    }

    // 3. Push to MikroTik first (Transactional Integrity)
    let mikrotikApi
    try {
      mikrotikApi = await connectMikrotik()
      
      const pppArgs = [
        `=name=${pppoe_username}`,
        `=password=${pppoe_password}`,
        `=profile=${pkg.mikrotik_profile}`,
        `=service=pppoe`,
        `=comment=${full_name} - ${phone || 'No Phone'}`
      ]
      
      // Bind MAC Address to the secret if provided
      if (body.mac_address) {
        pppArgs.push(`=caller-id=${body.mac_address}`)
      }

      await mikrotikApi.write('/ppp/secret/add', pppArgs)
      console.log(`Successfully provisioned PPPoE user ${pppoe_username} on MikroTik.`)
    } catch (err: any) {
      console.error('MikroTik PPPoE Secret Creation Error:', err)
      return NextResponse.json(
        { error: err.message || 'Failed to provision user on the MikroTik router.' },
        { status: 400 }
      )
    } finally {
      if (mikrotikApi) await mikrotikApi.close()
    }

    // 4. Safely initialize 'zone_id' if missing from frontend
    let targetZoneId = body.zone_id
    if (!targetZoneId) {
      let { data: defaultZone } = await supabaseAdmin
        .from('zones')
        .select('id')
        .eq('name', 'Default Zone')
        .maybeSingle()
      
      if (!defaultZone) {
        const { data: newZone, error: newZoneError } = await supabaseAdmin
          .from('zones')
          .insert([{ name: 'Default Zone', description: 'System generated fallback' }])
          .select('id')
          .single()
        if (newZoneError) throw newZoneError
        defaultZone = newZone
      }
      targetZoneId = defaultZone?.id
    }

    // 5. Insert the new customer mapping all attributes securely
    const { data, error: insertError } = await supabaseAdmin
      .from('customers')
      .insert([{ ...body, zone_id: targetZoneId }])
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
