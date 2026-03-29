import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function GET() {
  const { data, error } = await supabaseAdmin.from('users').insert([{
    full_name: 'Test Comma Roles',
    role: 'admin,support',
    phone: 'comma_0123'
  }])

  return NextResponse.json({ error, data })
}
