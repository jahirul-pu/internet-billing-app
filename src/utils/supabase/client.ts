import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in Client Components (browser-side).
 *
 * This client respects Row Level Security (RLS) and operates in the
 * context of the currently authenticated user via cookie-based sessions.
 *
 * Usage:
 *   import { createClient } from '@/utils/supabase/client'
 *   const supabase = createClient()
 *   const { data } = await supabase.from('customers').select()
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
