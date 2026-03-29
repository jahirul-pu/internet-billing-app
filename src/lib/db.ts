import { createClient } from '@supabase/supabase-js'

/**
 * High-privilege Supabase Admin Client.
 *
 * Uses the SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS).
 * This MUST only be used in server-side contexts:
 *   - API Route Handlers (app/api/...)
 *   - Server Actions
 *   - Server Components
 *   - Cron jobs / background workers
 *
 * ⚠️  NEVER import this in client-side ("use client") components.
 *     Doing so would expose your service role key to the browser.
 *
 * Usage:
 *   import { supabaseAdmin } from '@/lib/db'
 *   const { data } = await supabaseAdmin.from('customers').select()
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)
