-- Migration: Secure all tables by enabling RLS
-- Description: Enables RLS on all tables to prevent public/anon access via PostgREST.
-- Since the application uses service_role (supabaseAdmin) for all data access, 
-- no permissive policies are needed for the Prisma tables. 
-- This completely prevents the "Table publicly accessible" 
-- and "Sensitive data publicly accessible" vulnerabilities.

-- 1. Drop the dangerously permissive policy on the invoices table (which defaulted to public access)
DROP POLICY IF EXISTS "Service role full access on invoices" ON public.invoices;

-- 2. Ensure RLS is enabled on all Prisma-managed tables
ALTER TABLE IF EXISTS public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.network_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.router_configs ENABLE ROW LEVEL SECURITY;

-- Note: No additional policies are required because the Next.js API layer
-- exclusively uses the Supabase service_role key to bypass RLS and act as an admin.
