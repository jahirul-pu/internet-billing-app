import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Relational sync joining 'customers' mapping and identifying 'agent' origin points
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        customer:customer_id ( full_name, pppoe_username ),
        agent:agent_id ( full_name )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase Transaction Query Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(transactions)
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer_id, amount, payment_method, transaction_type } = body

    // 1. Rigid payload validations before initiating transactional side-effects
    if (!customer_id || !amount || !transaction_type) {
       return NextResponse.json(
         { error: 'customer_id, amount, and transaction_type are strictly required.' }, 
         { status: 400 }
       )
    }

    // 2. Insert the payment ledger record initially into 'transactions'
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert([body])
      .select()
      .single()

    if (txError) {
      console.error('Record Generation Error:', txError)
      return NextResponse.json({ error: txError.message }, { status: 400 })
    }

    // 3. Automated Trigger: Only process +30 days logic securely IF the transaction succeeds
    if (transaction_type === 'monthly_bill' || transaction_type === 'new_connection') {
      
      const { data: customer, error: fetchError } = await supabaseAdmin
        .from('customers')
        .select('expiry_date')
        .eq('id', customer_id)
        .single()

      if (fetchError) {
        console.error('Failed retrieving linked customer constraints:', fetchError)
        return NextResponse.json({ error: fetchError.message }, { status: 400 })
      }

      const currentExpiry = new Date(customer.expiry_date)
      const now = new Date()

      // Chronological offset logic:
      // If the client's term already expired weeks ago, calculate 30 days starting precisely FROM NOW.
      // If the client simply paid early (proactive), cleanly add 30 days to their CURRENT future expiry!
      const activeBaseDate = currentExpiry > now ? currentExpiry : now
      
      const newExpiryTime = new Date(activeBaseDate)
      newExpiryTime.setDate(newExpiryTime.getDate() + 30)

      // 4. Overwrite their account metrics enforcing 'active' networking states directly
      const { error: updateError } = await supabaseAdmin
        .from('customers')
        .update({ 
          expiry_date: newExpiryTime.toISOString(),
          status: 'active' 
        })
        .eq('id', customer_id)

      if (updateError) {
        console.error('Failed writing the expiration timeline offset', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      return NextResponse.json({ 
         message: 'Payment logged dynamically and user package expiration efficiently extended by 30 net calendar days',
         transaction,
         new_expiry: newExpiryTime.toISOString()
      }, { status: 201 })
    }

    // Fallback if this was e.g., an ad-hoc 'hardware_fee' that doesn't natively grant internet time
    return NextResponse.json({ 
       message: 'Transaction permanently recorded. No expiration timelines altered.',
       transaction 
    }, { status: 201 })

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
