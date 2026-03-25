import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Example payload validations
    if (!body.name || !body.price || !body.mikrotik_profile) {
      return NextResponse.json(
        { error: 'Name, Price, and MikroTik Profile are strictly required.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('packages')
      .insert([body])
      .select()
      .single()

    if (error) {
       console.error('Supabase Package Insertion Error:', error)
       return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
