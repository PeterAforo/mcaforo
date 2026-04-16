import crypto from 'crypto'

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || ''
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || ''
const FLUTTERWAVE_WEBHOOK_SECRET = process.env.FLUTTERWAVE_WEBHOOK_SECRET || ''
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3'

interface PaymentInitData {
  amount: number
  currency: string
  email: string
  name: string
  phone?: string
  txRef: string
  redirectUrl: string
  meta?: Record<string, string>
  customizations?: {
    title?: string
    description?: string
    logo?: string
  }
}

interface SubscriptionPlanData {
  name: string
  amount: number
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  currency: string
}

interface FlutterwaveResponse<T> {
  status: string
  message: string
  data: T
}

async function flutterwaveRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<FlutterwaveResponse<T>> {
  const response = await fetch(`${FLUTTERWAVE_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Flutterwave API error')
  }

  return response.json()
}

export async function initializePayment(data: PaymentInitData) {
  const payload = {
    tx_ref: data.txRef,
    amount: data.amount,
    currency: data.currency,
    redirect_url: data.redirectUrl,
    customer: {
      email: data.email,
      name: data.name,
      phonenumber: data.phone,
    },
    meta: data.meta,
    customizations: {
      title: data.customizations?.title || 'McAforo Payment',
      description: data.customizations?.description || 'Payment for services',
      logo: data.customizations?.logo || '',
    },
  }

  const response = await flutterwaveRequest<{ link: string }>(
    '/payments',
    'POST',
    payload
  )

  return response.data.link
}

export async function verifyTransaction(transactionId: string) {
  const response = await flutterwaveRequest<{
    id: number
    tx_ref: string
    flw_ref: string
    amount: number
    currency: string
    charged_amount: number
    status: string
    payment_type: string
    customer: {
      email: string
      name: string
      phone_number: string
    }
    created_at: string
  }>(`/transactions/${transactionId}/verify`)

  return response.data
}

export async function createPaymentPlan(data: SubscriptionPlanData) {
  const response = await flutterwaveRequest<{
    id: number
    name: string
    amount: number
    interval: string
    currency: string
    status: string
  }>('/payment-plans', 'POST', {
    name: data.name,
    amount: data.amount,
    interval: data.interval,
    currency: data.currency,
  })

  return response.data
}

export async function getPaymentPlan(planId: string) {
  const response = await flutterwaveRequest<{
    id: number
    name: string
    amount: number
    interval: string
    currency: string
    status: string
  }>(`/payment-plans/${planId}`)

  return response.data
}

export async function cancelSubscription(subscriptionId: string) {
  const response = await flutterwaveRequest<{ status: string }>(
    `/subscriptions/${subscriptionId}/cancel`,
    'PUT'
  )

  return response.data
}

export async function getSubscription(subscriptionId: string) {
  const response = await flutterwaveRequest<{
    id: number
    amount: number
    customer: {
      email: string
      customer_id: number
    }
    plan: number
    status: string
    created_at: string
  }>(`/subscriptions/${subscriptionId}`)

  return response.data
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha256', FLUTTERWAVE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  return hash === signature
}

export function generateTxRef(prefix: string = 'MCF'): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  return `${prefix}-${timestamp}-${random}`
}

export { FLUTTERWAVE_PUBLIC_KEY }
