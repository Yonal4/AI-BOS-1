import pg from 'pg'
import { ensureCollaborationSchema } from './collaboration-engine.js'

const { Pool } = pg

let pool = null
function getPool() {
  if (!pool) pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  })
  return pool
}

let analyticsSchemaReady = false

export async function ensureAnalyticsSchema() {
  if (analyticsSchemaReady) return
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS brain_search_events (
      id BIGSERIAL PRIMARY KEY,
      org_id TEXT NOT NULL,
      query TEXT NOT NULL,
      mode TEXT,
      result_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_brain_search_events_org_time ON brain_search_events (org_id, created_at DESC);
  `)
  analyticsSchemaReady = true
}

async function tableExists(name) {
  const { rows } = await getPool().query(`SELECT to_regclass($1) AS regclass`, [name])
  return Boolean(rows[0]?.regclass)
}

async function countQuery(sql, params, fallback = 0) {
  try {
    const { rows } = await getPool().query(sql, params)
    return Number(rows[0]?.count || fallback)
  } catch {
    return fallback
  }
}

export async function logBrainSearch({ orgId, query, mode, resultCount }) {
  await ensureAnalyticsSchema()
  await getPool().query(
    `INSERT INTO brain_search_events (org_id, query, mode, result_count) VALUES ($1,$2,$3,$4)`,
    [orgId || 'default', query, mode || null, Number(resultCount || 0)]
  )
}

export async function getDashboardAnalytics(orgId = 'default') {
  await ensureAnalyticsSchema()
  await ensureCollaborationSchema()

  const hasLeads = await tableExists('leads')
  const hasBrainDocs = await tableExists('brain_documents')
  const hasCampaigns = await tableExists('marketing_campaigns')
  const hasEvents = await tableExists('agent_events')

  const [
    leadsGenerated,
    leadsContacted,
    activeCampaigns,
    totalCampaigns,
    campaignLeads,
    agentActivity,
    documentsUploaded,
    readyDocuments,
    brainSearches,
    recentEventsResult,
    campaignRowsResult,
    agentRowsResult
  ] = await Promise.all([
    hasLeads ? countQuery(`SELECT COUNT(*)::int AS count FROM leads WHERE org_id=$1`, [orgId]) : 0,
    hasLeads ? countQuery(`SELECT COUNT(*)::int AS count FROM leads WHERE org_id=$1 AND status IN ('Contacted','Proposal Sent','Won')`, [orgId]) : 0,
    hasCampaigns ? countQuery(`SELECT COUNT(*)::int AS count FROM marketing_campaigns WHERE org_id=$1 AND status='active'`, [orgId]) : 0,
    hasCampaigns ? countQuery(`SELECT COUNT(*)::int AS count FROM marketing_campaigns WHERE org_id=$1`, [orgId]) : 0,
    hasCampaigns ? countQuery(`SELECT COUNT(*)::int AS count FROM marketing_campaigns WHERE org_id=$1 AND lead_id IS NOT NULL`, [orgId]) : 0,
    hasEvents ? countQuery(`SELECT COUNT(*)::int AS count FROM agent_events WHERE org_id=$1`, [orgId]) : 0,
    hasBrainDocs ? countQuery(`SELECT COUNT(*)::int AS count FROM brain_documents WHERE org_id=$1`, [orgId]) : 0,
    hasBrainDocs ? countQuery(`SELECT COUNT(*)::int AS count FROM brain_documents WHERE org_id=$1 AND status='ready'`, [orgId]) : 0,
    countQuery(`SELECT COUNT(*)::int AS count FROM brain_search_events WHERE org_id=$1`, [orgId]),
    hasEvents
      ? getPool().query(
          `SELECT * FROM agent_events WHERE org_id=$1 ORDER BY created_at DESC LIMIT 8`,
          [orgId]
        ).catch(() => ({ rows: [] }))
      : { rows: [] },
    hasCampaigns
      ? getPool().query(
          `SELECT id, name, channel, audience, offer, status, lead_id, created_at
           FROM marketing_campaigns WHERE org_id=$1 ORDER BY created_at DESC LIMIT 8`,
          [orgId]
        ).catch(() => ({ rows: [] }))
      : { rows: [] },
    hasEvents
      ? getPool().query(
          `SELECT agent_id, agent_role, COUNT(*)::int AS event_count, MAX(created_at) AS last_activity
           FROM agent_events WHERE org_id=$1 GROUP BY agent_id, agent_role ORDER BY event_count DESC`,
          [orgId]
        ).catch(() => ({ rows: [] }))
      : { rows: [] }
  ])

  return {
    orgId,
    totals: {
      leadsGenerated,
      leadsContacted,
      agentActivity,
      documentsUploaded,
      readyDocuments,
      brainSearches,
    },
    campaignPerformance: {
      activeCampaigns,
      totalCampaigns,
      campaignLeads,
      leadConversionRate: totalCampaigns ? Math.round((campaignLeads / totalCampaigns) * 100) : 0,
      recentCampaigns: campaignRowsResult.rows,
    },
    agentActivity: {
      totalEvents: agentActivity,
      byAgent: agentRowsResult.rows,
      recentEvents: recentEventsResult.rows,
    },
  }
}
