import express from 'express'
import { getDashboardAnalytics } from './analytics-service.js'

const router = express.Router()

function getOrgId(req) {
  return req.auth?.orgId || req.headers['x-org-id'] || 'default'
}

router.get('/dashboard', async (req, res) => {
  try {
    res.json(await getDashboardAnalytics(getOrgId(req)))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
