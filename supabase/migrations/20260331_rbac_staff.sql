create table if not exists public.staff_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null check (role in ('SUPER_ADMIN', 'MANAGER', 'COLLECTOR')),
  status text not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Turn on RLS
alter table public.staff_profiles enable row level security;
-- Allow supabase admin to do anything
-- (Using true since policies are skipped for service_role, but just in case for anon reads later)
create policy "Allow read for all authenticated users" on public.staff_profiles for select to authenticated using (true);
