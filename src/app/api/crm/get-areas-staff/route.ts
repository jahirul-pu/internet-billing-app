import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/crm/get-areas-staff
 * Returns all staff (optionally filtered by role=Collector) along with their assigned_areas.
 * Also returns a unique, deduplicated list of all available areas.
 */
export async function GET() {
  try {
    const { data: staffData, error } = await supabaseAdmin
      .from('staff')
      .select('id, name, phone, roles, zone, status, assigned_areas')
      .eq('status', 'Active')
      .order('name', { ascending: true })

    if (error) {
      console.error('GET /api/crm/get-areas-staff error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const staff = staffData || []

    // Extract unique areas from all staff assigned_areas arrays
    const areasSet = new Set<string>()
    staff.forEach(s => {
      if (Array.isArray(s.assigned_areas)) {
        s.assigned_areas.forEach((a: string) => areasSet.add(a))
      }
      // Also include zone if it's meaningful
      if (s.zone && s.zone !== 'Unassigned') {
        areasSet.add(s.zone)
      }
    })

    const areas = Array.from(areasSet).sort()

    return NextResponse.json({
      staff,
      areas,
    })
  } catch (error: any) {
    console.error('GET /api/crm/get-areas-staff error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
