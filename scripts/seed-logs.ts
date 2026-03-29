import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

// Load .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedLogs() {
  console.log("Seeding mock system logs...")

  const mockLogs = [
    {
      action_type: 'AUTO_SUSPEND',
      target_user: 'shakil_mirpur',
      description: 'Automated suspension due to grace period expiration',
      triggered_by: 'System',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      action_type: 'REACTIVATION',
      target_user: 'shakil_mirpur',
      description: 'Access restored following payment confirmation',
      triggered_by: 'Admin',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
    },
    {
      action_type: 'AUTO_SUSPEND',
      target_user: 'rahim_uttara',
      description: 'Automated suspension due to grace period expiration',
      triggered_by: 'System',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      action_type: 'PAYMENT_RECEIVED',
      target_user: 'karim_dhanmondi',
      description: 'Monthly bill payment of ৳1000 collected by Office',
      triggered_by: 'Cashier',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 mins ago
    }
  ]

  const { error } = await supabase.from('system_logs').insert(mockLogs)

  if (error) {
    console.error("Failed to seed logs:", error.message)
  } else {
    console.log("Successfully inserted 4 mock logs!")
  }
}

seedLogs()
