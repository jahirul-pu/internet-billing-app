import { RouterOSAPI } from 'node-routeros'
import { supabaseAdmin } from '@/lib/db'

const EXCLUDED_PROFILES = ['default', 'default-encryption']

/**
 * Creates and connects a MikroTik RouterOS API client.
 *
 * Credential resolution order:
 *   1. Explicitly provided arguments (for live testing unsaved settings)
 *   2. system_settings table in Supabase (allows admin UI config)
 *   3. Fallback to environment variables (MIKROTIK_HOST, etc.)
 *
 * Caller is responsible for calling `api.close()` when done.
 */
export async function connectMikrotik(options?: {
  host?: string;
  user?: string;
  password?: string;
  port?: number;
}): Promise<RouterOSAPI> {
  let host = options?.host
  let user = options?.user
  let password = options?.password
  let port = options?.port

  // If credentials aren't provided ad-hoc, try fetching from the database
  if (!host || !user || !password) {
    try {
      const { data: settings, error } = await supabaseAdmin
        .from('system_settings')
        .select('mikrotik_ip, mikrotik_api_port, mikrotik_api_user, mikrotik_api_password')
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('[MikroTik Auth]: Database configuration lookup failed:', error.message)
      } else if (settings?.mikrotik_ip && settings?.mikrotik_api_user && settings?.mikrotik_api_password) {
        console.log('[MikroTik Auth]: Using credentials from System Settings table.')
        if (!host) host = settings.mikrotik_ip
        if (!user) user = settings.mikrotik_api_user
        if (!password) password = settings.mikrotik_api_password
        if (!port) port = settings.mikrotik_api_port || 9394
      }
    } catch (err: any) {
      console.error('[MikroTik Auth]: Unexpected error during database lookup:', err.message)
    }
  }

  // Fallback to environment variables if still missing.
  // 💡 TIP: Wrap values with special characters (like #) in quotes in .env.local 
  // e.g. MIKROTIK_USER="shakil#2025" to prevent truncation.
  if (!host) host = process.env.MIKROTIK_HOST
  if (!user) user = process.env.MIKROTIK_USER
  if (!password) password = process.env.MIKROTIK_PASS
  if (!port && process.env.MIKROTIK_PORT) port = Number(process.env.MIKROTIK_PORT) || 9394
  
  // Default port if nothing else worked
  if (!port) port = 9394

  if (!host || !user || !password) {
    throw new Error(
      'MikroTik credentials not configured. Please save them in Settings → Router Integration.'
    )
  }

  const api = new RouterOSAPI({
    host,
    user,
    password,
    port,
    timeout: 10,
  })

  await api.connect()
  return api
}

/**
 * Fetches all PPPoE profiles from the MikroTik router,
 * excluding built-in defaults ('default', 'default-encryption').
 */
export async function fetchMikrotikProfiles(): Promise<Record<string, string>[]> {
  const api = await connectMikrotik()

  try {
    const profiles = await api.write('/ppp/profile/print')

    return profiles.filter(
      (profile: any) => !EXCLUDED_PROFILES.includes(profile.name)
    )
  } finally {
    await api.close()
  }
}
