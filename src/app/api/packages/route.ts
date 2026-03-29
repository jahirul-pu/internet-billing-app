import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: packages, error } = await supabaseAdmin
      .from('packages')
      .select('*')
      .order('price', { ascending: true }) // Order by cheapest package first naturally

    if (error) {
      console.error('Supabase Package Query Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(packages)
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Payload validation
    if (!body.name || !body.price || !body.mikrotik_profile) {
      return NextResponse.json(
        { error: 'Name, Price, and MikroTik Profile are strictly required.' },
        { status: 400 }
      )
    }

    // 1. Generate Address List name based on mikrotik_profile: e.g. "10M_Home" -> "list_10M_Home"
    const sanitizedName = body.mikrotik_profile.replace(/[^a-zA-Z0-9]/g, '_')
    const addressListName = `list_${sanitizedName}`

    // 2. Push profile to the MikroTik Router
    let mikrotikApi;
    try {
      mikrotikApi = await connectMikrotik()
      await mikrotikApi.write('/ppp/profile/add', [
        `=name=${body.mikrotik_profile}`,
        `=address-list=${addressListName}`
      ])
      console.log(`Created MikroTik profile: ${body.mikrotik_profile} mapped to ${addressListName}`)
    } catch (err: any) {
      console.error('MikroTik Profile Creation Error:', err)
      
      return NextResponse.json(
        { error: err.message || 'Failure: profile already exists on the router.' },
        { status: 400 }
      )
    } finally {
      if (mikrotikApi) await mikrotikApi.close()
    }

    // 3. Save to Supabase with the generated address list
    const payload = {
      name: body.name,
      price: body.price,
      mikrotik_profile: body.mikrotik_profile,
      speed_raw_iig: body.speed_raw_iig || 0,
      speed_ggc: body.speed_ggc || 0,
      speed_fb: body.speed_fb || 0,
      speed_bdix: body.speed_bdix || 0,
      address_list: addressListName,
    }

    const { data, error } = await supabaseAdmin
      .from('packages')
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error('Supabase Package Insertion Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Package POST error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

