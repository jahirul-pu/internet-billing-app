import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { connectMikrotik } from '@/lib/mikrotik'
import { logSystemEvent } from '@/lib/logger'
import { sendTransactionalSMS, smsTemplates } from '@/lib/sms'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/suspend-users
 * Automated task to disconnect users whose expiry date + grace period has passed.
 */
export async function POST(request: Request) {
  try {
    // 1. Security Check
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch Global Settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('global_grace_period, mikrotik_suspended_profile')
      .single()

    if (settingsError || !settings) {
      throw new Error('Could not fetch system settings')
    }

    const globalGrace = settings.global_grace_period ?? 7
    const suspendedProfile = settings.mikrotik_suspended_profile || 'Suspended'

    // 3. Fetch Active Customers
    const { data: customers, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, full_name, pppoe_username, phone, expiry_date, custom_grace_period_days, monthly_bill')
      .eq('status', 'active')

    if (customerError) throw customerError
    if (!customers || customers.length === 0) {
      return NextResponse.json({ message: 'No active customers found to process.' })
    }

    const now = new Date()
    const dropList: any[] = []
    const warningList: any[] = []
    
    customers.forEach((user) => {
      const graceDays = user.custom_grace_period_days ?? globalGrace
      const dropDate = new Date(user.expiry_date)
      dropDate.setDate(dropDate.getDate() + graceDays)
      
      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)
      
      const isDueTomorrow = dropDate.toISOString().split('T')[0] === tomorrow.toISOString().split('T')[0]

      if (dropDate < now) {
        dropList.push(user)
      } else if (isDueTomorrow) {
        warningList.push(user)
      }
    })

    console.log(`[Cron] Found ${warningList.length} users to warn, and ${dropList.length} users to suspend.`)

    // 4. Send Pre-Cutoff Warnings
    for (const user of warningList) {
      if (user.phone) {
        await sendTransactionalSMS(
          user.phone,
          smsTemplates.preCutoffWarning({ amount: user.monthly_bill || 0 })
        )
      }
    }

    if (dropList.length === 0) {
      return NextResponse.json({ 
        message: 'No users due for suspension today.',
        warnings_sent: warningList.length 
      })
    }

    // 4. Execute Router Disconnections (Sequential to avoid MikroTik API congestion)
    let mikrotikApi
    const results = {
      success: [] as string[],
      failed: [] as string[]
    }

    try {
      mikrotikApi = await connectMikrotik()
      
      for (const user of dropList) {
        try {
          // --- Step A: Change Secret Profile ---
          const secrets = await mikrotikApi.write('/ppp/secret/print', [`?name=${user.pppoe_username}`])
          if (secrets && secrets.length > 0) {
             await mikrotikApi.write('/ppp/secret/set', [
               `=.id=${secrets[0]['.id']}`,
               `=profile=${suspendedProfile}`
             ])
          }

          // --- Step B & C: Find and Kick Active Session ---
          const activeSessions = await mikrotikApi.write('/ppp/active/print', [`?name=${user.pppoe_username}`])
          if (activeSessions && activeSessions.length > 0) {
            for (const session of activeSessions) {
              await mikrotikApi.write('/ppp/active/remove', [`=.id=${session['.id']}`])
            }
          }

          // --- Step D: Update Database ---
          const { error: updateError } = await supabaseAdmin
            .from('customers')
            .update({ status: 'suspended' })
            .eq('id', user.id)

          if (updateError) throw updateError
          
          await logSystemEvent({
            action_type: 'AUTO_SUSPEND',
            target_user: user.pppoe_username,
            description: 'Automated suspension due to grace period expiration',
            triggered_by: 'System'
          })

          // Send hard cutoff SMS
          if (user.phone) {
            await sendTransactionalSMS(
              user.phone,
              smsTemplates.serviceSuspended()
            )
          }

          results.success.push(user.pppoe_username)
          console.log(`[Cron] Successfully suspended ${user.full_name} (${user.pppoe_username}).`)
        } catch (err: any) {
          console.error(`[Cron] Failed to suspend ${user.pppoe_username}:`, err.message)
          results.failed.push(`${user.pppoe_username}: ${err.message}`)
        }
      }
    } finally {
      if (mikrotikApi) await mikrotikApi.close()
    }

    return NextResponse.json({
      summary: `Processed ${dropList.length} users.`,
      results
    })

  } catch (error: any) {
    console.error('[Cron Error]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
