import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: customer, error: customerErr } = await supabase
      .from("customers")
      .select("*, packages:package_id(name, price)")
      .eq("id", id)
      .single()

    if (customerErr) throw customerErr

    const { data: payments, error: paymentsErr } = await supabase
      .from("payments")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })

    if (paymentsErr) throw paymentsErr

    const lifetimeValue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    
    const basePrice = customer.monthly_bill || customer.packages?.price || 0
    const discount = customer.discount || 0
    const monthlyFee = Math.max(0, basePrice - discount)

    return NextResponse.json({
      success: true,
      dueBalance: customer.due_balance || 0,
      monthlyFee,
      lifetimeValue,
      payments
    })
  } catch (err: any) {
    console.error("Billing history API error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
