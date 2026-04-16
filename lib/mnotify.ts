const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY || ''
const MNOTIFY_SENDER_ID = process.env.MNOTIFY_SENDER_ID || 'McAforo'
const MNOTIFY_BASE_URL = 'https://apps.mnotify.net/smsapi'

interface SMSOptions {
  to: string | string[]
  message: string
  senderId?: string
}

interface SMSResponse {
  status: string
  code: string
  message: string
  balance?: number
}

export async function sendSMS(options: SMSOptions): Promise<SMSResponse> {
  const recipients = Array.isArray(options.to) ? options.to : [options.to]

  if (process.env.NODE_ENV === 'development') {
    console.log('SMS would be sent:', {
      to: recipients,
      message: options.message,
      senderId: options.senderId || MNOTIFY_SENDER_ID,
    })
    return {
      status: 'success',
      code: '1000',
      message: 'SMS sent (development mode)',
    }
  }

  const params = new URLSearchParams({
    key: MNOTIFY_API_KEY,
    to: recipients.join(','),
    msg: options.message,
    sender_id: options.senderId || MNOTIFY_SENDER_ID,
  })

  const response = await fetch(`${MNOTIFY_BASE_URL}?${params.toString()}`)
  const data = await response.json()

  return data
}

export async function sendOTP(phone: string, code: string): Promise<SMSResponse> {
  return sendSMS({
    to: phone,
    message: `Your McAforo verification code is: ${code}. This code expires in 10 minutes.`,
  })
}

export async function sendPaymentNotification(
  phone: string,
  amount: number,
  currency: string,
  invoiceId: string
): Promise<SMSResponse> {
  return sendSMS({
    to: phone,
    message: `McAforo: Payment of ${currency} ${amount.toFixed(2)} received for invoice ${invoiceId}. Thank you for your business!`,
  })
}

export async function sendTicketNotification(
  phone: string,
  ticketId: string,
  status: string
): Promise<SMSResponse> {
  return sendSMS({
    to: phone,
    message: `McAforo: Your support ticket ${ticketId} has been updated to: ${status}. Log in to view details.`,
  })
}
