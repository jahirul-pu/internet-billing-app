import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mikrotik/sync-customers
 * 
 * Dynamically fetches all PPPoE secrets from MikroTik and upserts them into Supabase.
 * Maps router profiles to database package IDs and ensures no duplicates.
 */
export async function POST() {
  let mikrotikApi
  try {
    // 1. Connect to the MikroTik Router
    mikrotikApi = await connectMikrotik()

    // 2. Fetch all secrets from the router
    const secrets = await mikrotikApi.write('/ppp/secret/print')
    if (!secrets || !Array.isArray(secrets)) {
      return NextResponse.json({ success: true, message: 'No secrets found on the router.', count: 0 }, { status: 200 })
    }

    // 3. Fetch all Packages and Zones for mapping
    const [pkgRes, zoneRes] = await Promise.all([
      supabaseAdmin.from('packages').select('id, mikrotik_profile'),
      supabaseAdmin.from('zones').select('id, name')
    ])

    if (pkgRes.error) throw pkgRes.error
    if (zoneRes.error) throw zoneRes.error

    // Create a mapping of mikrotik_profile -> package_id
    const packageMap: Record<string, string> = {}
    pkgRes.data.forEach((pkg: any) => {
      packageMap[pkg.mikrotik_profile] = pkg.id
    })

    // Get or Create a Default Zone
    let defaultZoneId = zoneRes.data?.[0]?.id
    if (!defaultZoneId) {
      const { data: newZone, error: newZoneError } = await supabaseAdmin
        .from('zones')
        .insert([{ name: 'Default Zone', description: 'Auto-created during sync' }])
        .select('id')
        .single()
      if (newZoneError) throw newZoneError
      defaultZoneId = newZone.id
    }

    // 4. Map secrets to Customer upsert payload
    const defaultExpiry = new Date()
    defaultExpiry.setDate(defaultExpiry.getDate() + 30) // Default 30-day expiry for new imports

    const upsertData = secrets
      .filter((s: any) => s.service === 'pppoe' || s.service === 'any' || !s.service)
      .map((s: any) => {
        // Try to extract full name from comment (format: "Name - Phone")
        let fullName = s.name
        let phone = '01000-000000'
        if (s.comment) {
          const parts = s.comment.split(' - ')
          if (parts.length >= 1) fullName = parts[0]
          if (parts.length >= 2) phone = parts[1]
        }

        return {
          pppoe_username: s.name,
          pppoe_password: s.password || '123456', // Fallback if missing
          full_name: fullName,
          phone: phone,
          address: 'Synced from MikroTik',
          status: s.disabled === 'true' ? 'deactivated' : 'active',
          expiry_date: defaultExpiry.toISOString(),
          package_id: packageMap[s.profile] || pkgRes.data?.[0]?.id, // Default to first package if profile missing
          zone_id: defaultZoneId,
          ip_address: s['remote-address'] || null,
          mac_address: s['caller-id'] || null
        }
      })

    if (upsertData.length === 0) {
      return NextResponse.json({ success: true, message: 'No PPPoE users to sync.', count: 0 }, { status: 200 })
    }

    // 5. Efficient Bulk Upsert
    const { data, error: upsertError } = await supabaseAdmin
      .from('customers')
      .upsert(upsertData, { onConflict: 'pppoe_username' })
      .select('id')

    if (upsertError) throw upsertError

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${data?.length || 0} customers from MikroTik.`,
      count: data?.length || 0
    }, { status: 200 })

  } catch (error: any) {
    console.error('Customer Sync Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred during synchronization.' },
      { status: 500 }
    )
  } finally {
    if (mikrotikApi) await mikrotikApi.close()
  }
}
