export type BillingPlan = {
  id: string
  name: string
  price: number
  limits: Record<string, number | null>
  features: string[]
  stripePriceConfigured: boolean
}

export type BillingStatus = {
  orgId: string
  subscription: any
  plan: BillingPlan | null
  plans: BillingPlan[]
  usage: Record<string, number>
  stripeConfigured: boolean
}

async function billingApi(path: string, opts: RequestInit = {}, orgId?: string | null) {
  const res = await fetch(`/api/billing${path}`, {
    ...opts,
    headers: {
      ...(orgId ? { 'x-org-id': orgId } : {}),
      ...(opts.headers as Record<string, string> || {})
    }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Billing request failed')
  return data
}

export async function getBillingStatus(orgId?: string | null): Promise<BillingStatus> {
  return billingApi('/status', {}, orgId)
}

export async function startCheckout(planId: string, orgId?: string | null) {
  return billingApi('/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId })
  }, orgId)
}

export async function openBillingPortal(orgId?: string | null) {
  return billingApi('/portal', { method: 'POST' }, orgId)
}

export async function getInvoices(orgId?: string | null) {
  const data = await billingApi('/invoices', {}, orgId)
  return data.invoices || []
}
