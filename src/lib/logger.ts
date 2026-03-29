import { supabaseAdmin } from './db'

export async function logSystemEvent({
  action_type,
  target_user,
  description,
  triggered_by = 'System',
}: {
  action_type: 'AUTO_SUSPEND' | 'REACTIVATION' | string
  target_user: string
  description: string
  triggered_by?: string
}) {
  try {
    const { error } = await supabaseAdmin.from('system_logs').insert({
      action_type,
      target_user,
      description,
      triggered_by,
    })
    if (error) {
      console.error('[Logger] Failed to insert system log:', error.message)
    }
  } catch (err) {
    console.error('[Logger] Exception while logging:', err)
  }
}
