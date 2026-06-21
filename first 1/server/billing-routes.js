import express from 'express'
import {
  createBillingPortalSession,
  createCheckoutSession,
  getBillingStatus,
  getInvoices,
  getPlans,
  getUsageSummary,
  recordUsage
} from './billing-service.js'

const router = express.Router()

function getOrgId(req) {
  return req.auth?.orgId || req.headers['x-org-id'] || 'default'
}

router.get('/plans', (_, res) => {
  res.json({ plans: getPlans() })
})

router.get('/status', async (req, res) => {
  try {
    res.json(await getBillingStatus(getOrgId(req)))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/checkout', async (req, res) => {
  try {
    const result = await createCheckoutSession({
      orgId: getOrgId(req),
      planId: req.body.planId,
      email: req.body.email,
      req
    })
    res.json(result)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.post('/portal', async (req, res) => {
  try {
    res.json(await createBillingPortalSession({ orgId: getOrgId(req), req }))
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/usage', async (req, res) => {
  try {
    res.json({ usage: await getUsageSummary(getOrgId(req)) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/usage', async (req, res) => {
  try {
    await recordUsage({
      orgId: getOrgId(req),
      metric: req.body.metric,
      quantity: req.body.quantity,
      source: req.body.source || 'api'
    })
    res.json({ recorded: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/invoices', async (req, res) => {
  try {
    res.json({ invoices: await getInvoices(getOrgId(req)) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
