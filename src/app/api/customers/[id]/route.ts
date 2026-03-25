import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Optionally extract the 'id' from the body if the frontend accidentally passed it,
    // to prevent Supabase from throwing an error about updating a primary key.
    const { id: _removedId, ...updatePayload } = body

    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase Update Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Customer updated successfully', data })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Soft Delete Implementation:
    // Instead of using .delete(), we strategically update the core status to 'cancelled'
    // This allows the ledger (transactions, inventory tracking) to remain perfectly intact.
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
       console.error('Supabase Soft-Delete Error:', error)
       return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Customer marked as cancelled', data })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
