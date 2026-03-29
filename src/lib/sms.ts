/**
 * Shared utility for sending transactional and bulk SMS messages.
 * 
 * Replace the console.log tracking with your actual SMS provider's Node.js API 
 * or HTTP fetch logic (e.g., Greenweb, Boomcast, Twilio).
 */

export const smsTemplates = {
  paymentReceipt: ({ name, amount, month, supportPhone = "01944xxxxxx", lang = 'bn' }: { name: string, amount: string | number, month?: string, supportPhone?: string, lang?: 'en' | 'bn' }) => {
    if (lang === 'en') return `Dear ${name}, Purrfect Universe has received your payment of ৳${amount} for ${month || 'the current month'}. Thank you! Support: ${supportPhone}`;
    return `Dear ${name}, Purrfect Universe e apnar ৳${amount} bill joma hoyeche. Dhonnobad! Support: ${supportPhone}`;
  },
  
  preCutoffWarning: ({ amount, lang = 'bn' }: { amount: string | number, lang?: 'en' | 'bn' }) => {
    if (lang === 'en') return `Alert: Your Purrfect Universe internet bill is due tomorrow. Please pay ৳${amount} to avoid automatic disconnection. Ignore if paid.`;
    return `Sotorkobarta: Apnar internet bill aagamikal due hobe. Line bichinno aRate onugroho kore ৳${amount} porishodh korun. - Purrfect Universe`;
  },
  
  serviceSuspended: ({ lang = 'bn' }: { lang?: 'en' | 'bn' } = {}) => {
    if (lang === 'en') return `Your Purrfect Universe internet is temporarily suspended due to an unpaid bill. Please pay to restore service immediately.`;
    return `Bokeya bill er karone apnar Purrfect Universe internet bondho kora hoyeche. Line chalu korte onugroho kore bill porishodh korun.`;
  },
  
  serviceReactivated: ({ lang = 'bn' }: { lang?: 'en' | 'bn' } = {}) => {
    if (lang === 'en') return `Payment received! Your Purrfect Universe internet is now reactivated. Happy browsing!`;
    return `Bill grohon kora hoyeche! Apnar Purrfect Universe internet abar chalu hoyeche. Happy browsing!`;
  }
}

export async function sendTransactionalSMS(phoneNumber: string | undefined | null, message: string) {
  if (!phoneNumber) {
    console.warn('[SMS] Aborting send: No phone number provided.')
    return { success: false, error: 'No phone number' }
  }

  try {
    // 💡 Plug your existing provider's API logic here.
    // Example using fetch for a generic provider:
    /*
    const response = await fetch('https://api.sms-provider.com/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
         to: phoneNumber, 
         text: message, 
         token: process.env.SMS_API_KEY 
      })
    })
    const data = await response.json()
    */
    
    // For now, tracking to console to prove integration works:
    console.log(`\n======================================`)
    console.log(`[SMS OUTBOUND] 📱 To: ${phoneNumber}`)
    console.log(`[MESSAGE]: ${message}`)
    console.log(`======================================\n`)
    
    return { success: true }
  } catch (error) {
    console.error('[SMS Service Error]:', error)
    return { success: false, error }
  }
}
