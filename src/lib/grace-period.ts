import { supabaseAdmin } from '@/lib/db'

/**
 * Global default grace period (days).
 * In production, this should be fetched from a 'settings' table in the database.
 * For now, we define it as a constant that the /settings page can eventually control.
 */
export const GLOBAL_GRACE_PERIOD_DAYS = 7

/**
 * Calculates the actual disconnection ("drop") date for a customer.
 *
 * Logic:
 *   Actual Drop Date = expiry_date + (custom_grace_period_days ?? GLOBAL_GRACE_PERIOD_DAYS)
 *
 * The automated suspension script should compare `new Date()` against this
 * drop date before sending the disable command to the MikroTik.
 *
 * @param expiryDate - The customer's current subscription expiry date
 * @param customGracePeriodDays - The per-customer override (null = use global default)
 * @returns The actual Date after which the customer should be disconnected
 */
export function calculateDropDate(
  expiryDate: Date | string,
  customGracePeriodDays: number | null | undefined
): Date {
  const expiry = new Date(expiryDate)
  const graceDays = customGracePeriodDays ?? GLOBAL_GRACE_PERIOD_DAYS

  const dropDate = new Date(expiry)
  dropDate.setDate(dropDate.getDate() + graceDays)

  return dropDate
}

/**
 * Determines whether a customer should be suspended right now.
 *
 * @param expiryDate - The customer's expiry_date
 * @param customGracePeriodDays - Per-customer grace override (null = global)
 * @returns true if the current time is past the drop date
 */
export function shouldSuspendCustomer(
  expiryDate: Date | string,
  customGracePeriodDays: number | null | undefined
): boolean {
  const dropDate = calculateDropDate(expiryDate, customGracePeriodDays)
  return new Date() > dropDate
}

/**
 * Batch utility: fetches all active customers past their drop date
 * and returns them as candidates for automated suspension.
 * 
 * This is intended to be called by a cron job or scheduled function.
 */
export async function getCustomersDueForSuspension(): Promise<any[]> {
  const { data: activeCustomers, error } = await supabaseAdmin
    .from('customers')
    .select('id, full_name, pppoe_username, expiry_date, custom_grace_period_days, status')
    .eq('status', 'active')

  if (error || !activeCustomers) {
    console.error('Failed to fetch active customers for suspension check:', error)
    return []
  }

  const now = new Date()

  return activeCustomers.filter((customer) => {
    const dropDate = calculateDropDate(
      customer.expiry_date,
      customer.custom_grace_period_days
    )
    return now > dropDate
  })
}
