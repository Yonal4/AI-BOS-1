import express from 'express'
import { createLead, listLeads, getLead, updateLead, deleteLead, getLeadStats } from './leads-db.js'

const router = express.Router()

function getOrgId(req) {
  return req.auth?.orgId || req.headers['x-org-id'] || 'default'
}

router.get('/stats', async (req, res) => {
  try {
    const stats = await getLeadStats(getOrgId(req))
    res.json(stats)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/', async (req, res) => {
  try {
    const orgId = getOrgId(req)
    const leads = await listLeads(orgId, { status: req.query.status, search: req.query.search })
    res.json({ leads })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', express.json(), async (req, res) => {
  try {
    const orgId = getOrgId(req)
    const { name, email, company, source, status, notes, assignedAgent, value, score } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })
    const lead = await createLead({ orgId, name, email, company, source, status, notes, assignedAgent, value, score })
    res.status(201).json({ lead })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const lead = await getLead(req.params.id, getOrgId(req))
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json({ lead })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.patch('/:id', express.json(), async (req, res) => {
  try {
    const lead = await updateLead(req.params.id, req.body, getOrgId(req))
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json({ lead })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await deleteLead(req.params.id, getOrgId(req))
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
