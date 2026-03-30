import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role = 'SUPER_ADMIN'; // Default fallback for dev without auth

  if (user) {
    const { data: profile } = await supabaseAdmin
      .from('staff_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profile) {
      role = profile.role;
    }
  }

  if (role === 'COLLECTOR') {
    redirect('/collector'); // the mobile portal
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
