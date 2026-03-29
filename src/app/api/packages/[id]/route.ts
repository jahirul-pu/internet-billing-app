import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log("Updating Package ID:", id)
    
    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { speed_raw_iig, speed_ggc, speed_fb, speed_bdix, address_list, price } = body

    const { data, error } = await supabaseAdmin
      .from('packages')
      .update({
        speed_raw_iig: Number(speed_raw_iig),
        speed_ggc: Number(speed_ggc),
        speed_fb: Number(speed_fb),
        speed_bdix: Number(speed_bdix),
        address_list: address_list,
        price: Number(price)
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating package:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update package' },
      { status: 500 }
    )
  }
}
