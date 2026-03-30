import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { connectMikrotik } from '@/lib/mikrotik'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabaseAdmin
    .from('staff_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'SUPER_ADMIN'
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select(`
        *,
        packages:package_id ( name, price, mikrotik_profile ),
        zones:zone_id ( name )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase Fetch Error:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let mikrotikApi
  try {
    const { id } = await params
    const body = await request.json()

    // 1. If we are updating sensitive network credentials, we MUST sync to MikroTik
    if (body.pppoe_username || body.pppoe_password) {
      // Fetch the CURRENT record so we know the OLD username (to find the secret on the router)
      const { data: currentCustomer } = await supabaseAdmin
        .from('customers')
        .select('pppoe_username, pppoe_password')
        .eq('id', id)
        .single()

      if (currentCustomer) {
        try {
          mikrotikApi = await connectMikrotik()
          
          // Find the secret ID based on the OLD username
          const secrets = await mikrotikApi.write('/ppp/secret/print', [
            `?name=${currentCustomer.pppoe_username}`
          ])

          if (secrets && secrets.length > 0) {
            const secretId = secrets[0]['.id']
            const updateArgs: string[] = [`=.id=${secretId}`]
            
            if (body.pppoe_username) updateArgs.push(`=name=${body.pppoe_username}`)
            if (body.pppoe_password) updateArgs.push(`=password=${body.pppoe_password}`)
            if (body.mac_address !== undefined) updateArgs.push(`=caller-id=${body.mac_address || ''}`)

            await mikrotikApi.write('/ppp/secret/set', updateArgs)
            console.log(`Synced MikroTik secret updates for ${id}`)
          }
        } catch (err: any) {
          console.error('MikroTik Sync Error during PATCH:', err)
          return NextResponse.json(
            { error: 'Failed to sync changes to MikroTik router', details: err.message },
            { status: 400 }
          )
        } finally {
          if (mikrotikApi) await mikrotikApi.close()
        }
      }
    }

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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    // if (!isSuperAdmin) {
    //   return new NextResponse('Unauthorized - Super Admin role required', { status: 403 })
    // }

    const { id } = await params

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

