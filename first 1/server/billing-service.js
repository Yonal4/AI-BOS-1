import pg from 'pg'
import Stripe from 'stripe'

const { Pool } = pg

const PLAN_CONFIG = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 299,
    priceEnv: 'STRIPE_PRICE_STARTER',
    limits: { aiActions: 5000, seats: 1, agents: 1, brainDocuments: 25 },
    features: ['1 AI employee', 'Sales Hub', '5K AI actions per month', 'Email support'],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 799,
    priceEnv: 'STRIPE_PRICE_GROWTH',
    limits: { aiActions: 25000, seats: 5, agents: 3, brainDocuments: 250 },
    features: ['3 AI employees', 'Company Brain', 'Agent collaboration workflows', 'Priority support'],
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 1999,
    priceEnv: 'STRIPE_PRICE_BUSINESS',
    limits: { aiActions: null, seats: 15, agents: 5, brainDocuments: null },
    features: ['All AI employees', 'Unlimited AI actions', 'Advanced analytics', 'Billing portal and invoice history'],
  },
}

let pool = null
function getPool() {
  if (!pool) pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  })
  return pool
}

let billingSchemaReady = false
export async function ensureBillingSchema() {
  if (billingSchemaReady) return
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS billing_customers (
      org_id TEXT PRIMARY KEY,
      stripe_customer_id TEXT UNIQUE,
      stripe_subscription_id TEXT,
      plan_id TEXT,
      status TEXT NOT NULL DEFAULT 'none',
      current_period_end TIMESTAMPTZ,
      cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS billing_usage (
      id BIGSERIAL PRIMARY KEY,
      org_id TEXT NOT NULL,
      metric TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      source TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS billing_webhook_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      org_id TEXT,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_billing_usage_org_metric ON billing_usage (org_id, metric, created_at DESC);
  `)
  billingSchemaReady = true
}

function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

function appUrl(req) {
  return process.env.APP_URL || req.headers.origin || `${req.protocol}://${req.get('host')}`
}

function planPriceId(planId) {
  const plan = PLAN_CONFIG[planId]
  return plan ? process.env[plan.priceEnv] : null
}

function normalizePlan(planId) {
  const id = String(planId || '').toLowerCase()
  if (!PLAN_CONFIG[id]) throw new Error('Invalid billing plan')
  return PLAN_CONFIG[id]
}

async function getBillingRow(orgId) {
  await ensureBillingSchema()
  const { rows } = await getPool().query(`SELECT * FROM billing_customers WHERE org_id=$1`, [orgId])
  return rows[0] || null
}

async function upsertBillingRow(orgId, fields) {
  await ensureBillingSchema()
  const existing = await getBillingRow(orgId)
  const next = { ...(existing || {}), ...fields }
  const { rows } = await getPool().query(
    `INSERT INTO billing_customers
      (org_id, stripe_customer_id, stripe_subscription_id, plan_id, status, current_period_end, cancel_at_period_end)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (org_id) DO UPDATE SET
      stripe_customer_id=EXCLUDED.stripe_customer_id,
      stripe_subscription_id=EXCLUDED.stripe_subscription_id,
      plan_id=EXCLUDED.plan_id,
      status=EXCLUDED.status,
      current_period_end=EXCLUDED.current_period_end,
      cancel_at_period_end=EXCLUDED.cancel_at_period_end,
      updated_at=NOW()
     RETURNING *`,
    [
      orgId,
      next.stripe_customer_id || null,
      next.stripe_subscription_id || null,
      next.plan_id || null,
      next.status || 'none',
      next.current_period_end || null,
      Boolean(next.cancel_at_period_end)
    ]
  )
  return rows[0]
}

async function getOrCreateCustomer(orgId, email) {
  const stripe = stripeClient()
  const billing = await getBillingRow(orgId)
  if (billing?.stripe_customer_id) return billing.stripe_customer_id

  const customer = await stripe.customers.create({
    email: email || undefined,
    name: orgId,
    metadata: { orgId }
  })
  await upsertBillingRow(orgId, { stripe_customer_id: customer.id, status: 'none' })
  return customer.id
}

export function getPlans() {
  return Object.values(PLAN_CONFIG).map(plan => ({
    ...plan,
    stripePriceConfigured: Boolean(process.env[plan.priceEnv])
  }))
}

export async function getBillingStatus(orgId) {
  await ensureBillingSchema()
  const billing = await getBillingRow(orgId)
  const usage = await getUsageSummary(orgId)
  const plan = billing?.plan_id ? PLAN_CONFIG[billing.plan_id] : null
  return {
    orgId,
    subscription: billing || { org_id: orgId, status: 'none', plan_id: null },
    plan,
    plans: getPlans(),
    usage,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  }
}

export async function createCheckoutSession({ orgId, planId, email, req }) {
  await ensureBillingSchema()
  const plan = normalizePlan(planId)
  const priceId = planPriceId(plan.id)
  if (!priceId) throw new Error(`${plan.name} Stripe price is not configured`)

  const stripe = stripeClient()
  const customerId = await getOrCreateCustomer(orgId, email)
  const baseUrl = appUrl(req)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/?billing=success&plan=${plan.id}`,
    cancel_url: `${baseUrl}/?billing=cancelled`,
    client_reference_id: orgId,
    metadata: { orgId, planId: plan.id },
    subscription_data: { metadata: { orgId, planId: plan.id } },
  })
  return { url: session.url, id: session.id }
}

export async function createBillingPortalSession({ orgId, req }) {
  const billing = await getBillingRow(orgId)
  if (!billing?.stripe_customer_id) throw new Error('No Stripe customer exists for this organization')
  const stripe = stripeClient()
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${appUrl(req)}/?billing=portal_return`
  })
  return { url: session.url }
}

export async function getInvoices(orgId) {
  const billing = await getBillingRow(orgId)
  if (!billing?.stripe_customer_id || !process.env.STRIPE_SECRET_KEY) return []
  const stripe = stripeClient()
  const invoices = await stripe.invoices.list({ customer: billing.stripe_customer_id, limit: 12 })
  return invoices.data.map(inv => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    amountPaid: inv.amount_paid,
    amountDue: inv.amount_due,
    currency: inv.currency,
    hostedInvoiceUrl: inv.hosted_invoice_url,
    invoicePdf: inv.invoice_pdf,
    created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
  }))
}

export async function recordUsage({ orgId, metric, quantity = 1, source = 'app' }) {
  await ensureBillingSchema()
  await getPool().query(
    `INSERT INTO billing_usage (org_id, metric, quantity, source) VALUES ($1,$2,$3,$4)`,
    [orgId, metric, Number(quantity || 1), source]
  )
}

export async function getUsageSummary(orgId) {
  await ensureBillingSchema()
  const { rows } = await getPool().query(
    `SELECT metric, COALESCE(SUM(quantity),0)::int AS quantity
     FROM billing_usage
     WHERE org_id=$1 AND created_at >= date_trunc('month', NOW())
     GROUP BY metric`,
    [orgId]
  )
  const usage = Object.fromEntries(rows.map(r => [r.metric, Number(r.quantity)]))

  const eventCount = await getPool().query(
    `SELECT COUNT(*)::int AS count FROM agent_events WHERE org_id=$1 AND created_at >= date_trunc('month', NOW())`,
    [orgId]
  ).catch(() => ({ rows: [{ count: 0 }] }))
  const docCount = await getPool().query(
    `SELECT COUNT(*)::int AS count FROM brain_documents WHERE org_id=$1`,
    [orgId]
  ).catch(() => ({ rows: [{ count: 0 }] }))
  const searchCount = await getPool().query(
    `SELECT COUNT(*)::int AS count FROM brain_search_events WHERE org_id=$1 AND created_at >= date_trunc('month', NOW())`,
    [orgId]
  ).catch(() => ({ rows: [{ count: 0 }] }))

  return {
    ...usage,
    agent_events: Number(eventCount.rows[0]?.count || 0),
    brain_documents: Number(docCount.rows[0]?.count || 0),
    brain_searches: Number(searchCount.rows[0]?.count || 0),
  }
}

function planFromSubscription(subscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id
  return Object.values(PLAN_CONFIG).find(plan => process.env[plan.priceEnv] === priceId)?.id || null
}

async function syncSubscription(subscription) {
  const orgId = subscription.metadata?.orgId
  if (!orgId) return
  await upsertBillingRow(orgId, {
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    stripe_subscription_id: subscription.id,
    plan_id: subscription.metadata?.planId || planFromSubscription(subscription),
    status: subscription.status,
    current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
  })
}

export async function handleStripeWebhook(req, res) {
  let event = req.body
  try {
    const stripe = stripeClient()
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      const signature = req.headers['stripe-signature']
      event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    } else if (Buffer.isBuffer(req.body)) {
      event = JSON.parse(req.body.toString('utf8'))
    }

    await ensureBillingSchema()
    const orgId =
      event.data?.object?.metadata?.orgId ||
      event.data?.object?.client_reference_id ||
      null

    await getPool().query(
      `INSERT INTO billing_webhook_events (id, type, org_id, payload)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO NOTHING`,
      [event.id, event.type, orgId, event]
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        await syncSubscription(subscription)
      }
    }

    if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      await syncSubscription(event.data.object)
    }

    res.json({ received: true })
  } catch (e) {
    console.error('Stripe webhook error:', e.message)
    res.status(400).json({ error: e.message })
  }
}
