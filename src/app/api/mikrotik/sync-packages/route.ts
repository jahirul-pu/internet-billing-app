import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { connectMikrotik } from '@/lib/mikrotik'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mikrotik/sync-packages
 *
 * Fetches PPPoE profiles from the MikroTik router and upserts them
 * into the Supabase `packages` table.
 */
export async function POST() {
  let mikrotikApi;
  try {
    // 1. Connect to the router
    mikrotikApi = await connectMikrotik()

    // 2. Execute profile print
    const profiles = await mikrotikApi.write('/ppp/profile/print')
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, message: 'No profiles found on the router.', synced: 0 }, { status: 200 })
    }

    // 3. Get existing profiles from our database to avoid overwriting existing data
    const { data: existingPackages, error: dbFetchError } = await supabaseAdmin
      .from('packages')
      .select('mikrotik_profile')

    if (dbFetchError) throw dbFetchError

    const existingProfiles = new Set(
      (existingPackages || []).map((p: any) => p.mikrotik_profile)
    )

    // 4. Filter and prepare new profiles
    const insertPayloads: any[] = []
    
    for (const profile of profiles) {
      // Ignore default built-in profiles and those containing internal MikroTik markers
      if (['default', 'default-encryption'].includes(profile.name) || profile['.id']?.startsWith('*0')) {
        continue;
      }

      if (!existingProfiles.has(profile.name)) {
        // For NEW profiles found on router, generate a default address list and zeroed speeds
        const sanitizedName = profile.name.replace(/[^a-zA-Z0-9]/g, '_')
        const addressListName = `list_${sanitizedName}`

        insertPayloads.push({
          name: profile.name,
          mikrotik_profile: profile.name,
          price: 0,
          speed_raw_iig: 0,
          speed_ggc: 0,
          speed_fb: 0,
          speed_bdix: 0,
          address_list: addressListName,
        })
      }
    }

    if (insertPayloads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All profiles are already synced. No existing business data was overwritten.',
        synced: 0,
      }, { status: 200 })
    }

    // 5. Insert new profiles
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('packages')
      .insert(insertPayloads)
      .select()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${inserted?.length || 0} new profiles from MikroTik. Business data (prices/speeds) for existing profiles remains untouched.`,
      synced: inserted?.length || 0,
    }, { status: 200 })

  } catch (error: any) {
    console.error('MikroTik sync error:', error)
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    )
  } finally {
    if (mikrotikApi) {
      try { await mikrotikApi.close() } catch { /* ignore */ }
    }
  }
}
