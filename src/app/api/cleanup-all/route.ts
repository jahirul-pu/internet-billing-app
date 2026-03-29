import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function GET() {
  const results: Record<string, any> = {}

  try {
    // Inventory - skip since table isn't created fully on remote apparently
    
    // Devices
    const { data: dev } = await supabaseAdmin.from('network_devices').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('*');
    results.network_devices = dev?.length || 0;

    // Transactions
    const { data: trans } = await supabaseAdmin.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('*');
    results.transactions = trans?.length || 0;

    // Tickets
    const { data: tickets } = await supabaseAdmin.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('*');
    results.tickets = tickets?.length || 0;

    // Expenses
    const { data: expenses } = await supabaseAdmin.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('*');
    results.expenses = expenses?.length || 0;

    // Staff / Users
    const { data: users } = await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('*');
    results.users = users?.length || 0;

    // Zones / Franchises (Except default zone)
    const { data: zones } = await supabaseAdmin.from('zones').delete().neq('name', 'Default Zone').select('*');
    results.zones = zones?.length || 0;

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
