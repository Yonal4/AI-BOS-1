import express from 'express'
import {
  collaborationOverview,
  createMarketingContent,
  createCampaignWorkflow,
  getWorkflow,
  listEvents,
  listMarketingContent,
  listMemory,
  listTasks
} from './collaboration-engine.js'

const router = express.Router()

function getOrgId(req) {
  return req.auth?.orgId || req.headers['x-org-id'] || 'default'
}

router.get('/', async (req, res) => {
  try {
    res.json(await collaborationOverview(getOrgId(req)))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/campaigns', express.json(), async (req, res) => {
  try {
    const workflow = await createCampaignWorkflow(getOrgId(req), req.body)
    res.status(201).json(workflow)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.get('/marketing-content', async (req, res) => {
  try {
    const content = await listMarketingContent(getOrgId(req))
    res.json({ content })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/marketing-content', express.json(), async (req, res) => {
  try {
    const content = await createMarketingContent(getOrgId(req), req.body)
    res.status(201).json({ content })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.get('/events', async (req, res) => {
  try {
    const events = await listEvents(getOrgId(req), {
      workflowId: req.query.workflowId,
      agent: req.query.agent,
      eventType: req.query.eventType,
      search: req.query.search,
      limit: Number(req.query.limit || 100)
    })
    res.json({ events })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await listTasks(getOrgId(req), {
      agent: req.query.agent,
      workflowId: req.query.workflowId,
      status: req.query.status
    })
    res.json({ tasks })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/memory', async (req, res) => {
  try {
    const memory = await listMemory(getOrgId(req), {
      entityType: req.query.entityType,
      entityId: req.query.entityId,
      workflowId: req.query.workflowId
    })
    res.json({ memory })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/workflows/:id', async (req, res) => {
  try {
    const workflow = await getWorkflow(getOrgId(req), req.params.id)
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' })
    res.json(workflow)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
