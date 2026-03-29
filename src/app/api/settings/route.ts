import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Helper: get or create the single settings row.
 */
async function getOrCreateSettings() {
  const { data: rows } = await supabaseAdmin
    .from('system_settings')
    .select('*')
    .limit(1)

  if (rows && rows.length > 0) return rows[0]

  const { data: newRow, error } = await supabaseAdmin
    .from('system_settings')
    .insert([{}])
    .select()
    .single()

  if (error) throw error
  return newRow
}

/**
 * GET /api/settings
 */
export async function GET() {
  try {
    const settings = await getOrCreateSettings()
    return NextResponse.json(settings, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}

/**
 * POST /api/settings
 * Saves the router credentials and global settings.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const settings = await getOrCreateSettings()

    // Filter out standard non-updateable fields
    const { id: _id, created_at: _ca, updated_at: _ua, ...updatePayload } = body

    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .update(updatePayload)
      .eq('id', settings.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Settings saved', data }, { status: 200 })
  } catch (error: any) {
    console.error('API Settings Error:', error)
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}
