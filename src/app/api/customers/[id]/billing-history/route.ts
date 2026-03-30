import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Fetch customer with package info
    const { data: customer, error: customerErr } = await supabaseAdmin
      .from("customers")
      .select("*, packages:package_id(name, price)")
      .eq("id", id)
      .single()

    if (customerErr) throw customerErr

    // 2. Fetch payment history (newest first)
    const { data: payments, error: paymentsErr } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })

    if (paymentsErr) throw paymentsErr

    // 3. Fetch all invoices for this customer (oldest first for display)
    const { data: invoices, error: invoicesErr } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: true })

    // Non-fatal: if invoices table doesn't exist yet, return empty
    const allInvoices = invoicesErr ? [] : (invoices || [])

    // 4. Separate unpaid/partial invoices for the "Months Due" section
    const unpaidInvoices = allInvoices.filter(
      (inv: any) => inv.status === 'unpaid' || inv.status === 'partial'
    )

    const lifetimeValue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    
    const basePrice = customer.monthly_bill || customer.packages?.price || 0
    const discount = customer.discount || 0
    const monthlyFee = Math.max(0, basePrice - discount)

    return NextResponse.json({
      success: true,
      dueBalance: customer.due_balance || 0,
      monthlyFee,
      lifetimeValue,
      payments,
      invoices: allInvoices,
      unpaidInvoices
    })
  } catch (err: any) {
    console.error("Billing history API error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
