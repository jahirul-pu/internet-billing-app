import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'

// Initialize the Supabase client with the Service Role Key.
// WARNING: This client bypasses Row Level Security (RLS). 
// It MUST strictly be used ONLY on the server-side (API Routes, Server Actions, Server Components).
// Do not expose or import this instance in client-side components.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})
