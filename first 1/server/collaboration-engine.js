import pg from 'pg'
import { createLead, updateLead } from './leads-db.js'
import { fullTextSearch } from './brain-db.js'

const { Pool } = pg

let pool = null
function getPool() {
  if (!pool) pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  })
  return pool
}

const AGENTS = {
  marketing: { id: 'lexi', name: 'Lexi', role: 'marketing' },
  sales: { id: 'aria', name: 'Aria', role: 'sales' },
}

let schemaReady = false

export async function ensureCollaborationSchema() {
  if (schemaReady) return
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS agent_events (
      id BIGSERIAL PRIMARY KEY,
      org_id TEXT NOT NULL,
      workflow_id TEXT,
      agent_id TEXT NOT NULL,
      agent_role TEXT NOT NULL,
      event_type TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS shared_memory (
      id BIGSERIAL PRIMARY KEY,
      org_id TEXT NOT NULL,
      memory_key TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      owner_agent TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'all_agents',
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (org_id, memory_key)
    );

    CREATE TABLE IF NOT EXISTS agent_workflows (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      workflow_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      current_step TEXT NOT NULL DEFAULT 'started',
      input JSONB NOT NULL DEFAULT '{}'::jsonb,
      result JSONB NOT NULL DEFAULT '{}'::jsonb,
      started_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agent_tasks (
      id BIGSERIAL PRIMARY KEY,
      org_id TEXT NOT NULL,
      workflow_id TEXT NOT NULL REFERENCES agent_workflows(id) ON DELETE CASCADE,
      from_agent TEXT NOT NULL,
      to_agent TEXT NOT NULL,
      task_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      result JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      id BIGSERIAL PRIMARY KEY,
      org_id TEXT NOT NULL,
      workflow_id TEXT NOT NULL,
      name TEXT NOT NULL,
      channel TEXT NOT NULL,
      audience TEXT NOT NULL,
      offer TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_by TEXT NOT NULL DEFAULT 'lexi',
      lead_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS marketing_outputs (
      id BIGSERIAL PRIMARY KEY,
      org_id TEXT NOT NULL,
      output_type TEXT NOT NULL,
      prompt TEXT NOT NULL,
      output TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_by TEXT NOT NULL DEFAULT 'lexi',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_agent_events_org_time ON agent_events (org_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_agent_events_workflow ON agent_events (workflow_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks (org_id, to_agent, status);
    CREATE INDEX IF NOT EXISTS idx_shared_memory_entity ON shared_memory (org_id, entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_marketing_outputs_org_time ON marketing_outputs (org_id, created_at DESC);
  `)
  schemaReady = true
}

function workflowId() {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function publishEvent({ orgId, workflowId, agent, eventType, entityType, entityId, payload }) {
  await ensureCollaborationSchema()
  const { rows } = await getPool().query(
    `INSERT INTO agent_events (org_id, workflow_id, agent_id, agent_role, event_type, entity_type, entity_id, payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [orgId, workflowId, agent.id, agent.role, eventType, entityType || null, entityId || null, payload || {}]
  )
  return rows[0]
}

async function remember({ orgId, key, entityType, entityId, ownerAgent, value }) {
  await ensureCollaborationSchema()
  const { rows } = await getPool().query(
    `INSERT INTO shared_memory (org_id, memory_key, entity_type, entity_id, owner_agent, value)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (org_id, memory_key)
     DO UPDATE SET value = EXCLUDED.value, owner_agent = EXCLUDED.owner_agent, updated_at = NOW()
     RETURNING *`,
    [orgId, key, entityType, String(entityId), ownerAgent, value]
  )
  return rows[0]
}

async function delegateTask({ orgId, workflowId, fromAgent, toAgent, taskType, payload }) {
  const { rows } = await getPool().query(
    `INSERT INTO agent_tasks (org_id, workflow_id, from_agent, to_agent, task_type, payload)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [orgId, workflowId, fromAgent, toAgent, taskType, payload || {}]
  )
  await publishEvent({
    orgId,
    workflowId,
    agent: AGENTS[fromAgent],
    eventType: 'task.delegated',
    entityType: 'agent_task',
    entityId: String(rows[0].id),
    payload: { toAgent, taskType, taskId: rows[0].id, payload }
  })
  return rows[0]
}

async function completeTask(taskId, result) {
  const { rows } = await getPool().query(
    `UPDATE agent_tasks SET status='completed', result=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [result || {}, taskId]
  )
  return rows[0]
}

async function failTask(taskId, error) {
  const { rows } = await getPool().query(
    `UPDATE agent_tasks SET status='failed', result=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [{ error }, taskId]
  )
  return rows[0]
}

async function getCompanyBrainContext(orgId, query) {
  try {
    const rows = await fullTextSearch(query, orgId, 4)
    return rows
      .map((row, index) => `[${index + 1}] ${row.doc_title}: ${row.content}`)
      .join('\n\n')
  } catch {
    return ''
  }
}

async function generateOutreach({ lead, campaign }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required for Sales Agent outreach generation')
  }

  const companyContext = await getCompanyBrainContext(
    campaign.org_id || lead.org_id || 'default',
    `${campaign.name} ${campaign.audience} ${campaign.offer} ${lead.company || ''}`
  )

  const prompt = `Write a personalized outbound email under 130 words.
Lead: ${lead.name}
Company: ${lead.company || 'Unknown'}
Email: ${lead.email || 'Unknown'}
Campaign: ${campaign.name}
Audience: ${campaign.audience}
Offer: ${campaign.offer}
Company Brain context:
${companyContext || 'No relevant Company Brain context found.'}
Source: Marketing Agent Lexi generated this lead.
Sign as Aria, AI Sales Rep at AI BOS.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 450,
      system: 'You are Aria, AI BOS Sales Agent. Generate useful, specific outreach using shared cross-agent context.',
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  if (!response.ok || data.error) throw new Error(data.error?.message || 'Outreach generation failed')
  return data.content?.find(block => block.type === 'text')?.text || ''
}

export async function createCampaignWorkflow(orgId, input) {
  await ensureCollaborationSchema()

  const required = ['name', 'channel', 'audience', 'offer', 'leadName']
  for (const field of required) {
    if (!String(input[field] || '').trim()) throw new Error(`${field} is required`)
  }

  const id = workflowId()
  await getPool().query(
    `INSERT INTO agent_workflows (id, org_id, workflow_type, status, current_step, input, started_by)
     VALUES ($1,$2,'marketing_to_sales','running','marketing_campaign_created',$3,'lexi')`,
    [id, orgId, input]
  )

  const { rows: campaignRows } = await getPool().query(
    `INSERT INTO marketing_campaigns (org_id, workflow_id, name, channel, audience, offer)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [orgId, id, input.name, input.channel, input.audience, input.offer]
  )
  const campaign = campaignRows[0]

  await publishEvent({
    orgId,
    workflowId: id,
    agent: AGENTS.marketing,
    eventType: 'marketing.campaign.created',
    entityType: 'campaign',
    entityId: String(campaign.id),
    payload: { campaign }
  })
  await remember({
    orgId,
    key: `campaign:${campaign.id}`,
    entityType: 'campaign',
    entityId: campaign.id,
    ownerAgent: 'lexi',
    value: { campaign, source: 'marketing_agent' }
  })

  const lead = await createLead({
    orgId,
    name: input.leadName,
    email: input.leadEmail || null,
    company: input.leadCompany || null,
    source: `Marketing: ${campaign.name}`,
    status: 'New',
    notes: `Created by Lexi from campaign "${campaign.name}". Audience: ${campaign.audience}. Offer: ${campaign.offer}. ${input.leadNotes || ''}`.trim(),
    assignedAgent: 'aria',
    value: Number(input.value || 0),
    score: Number(input.score || 75)
  })

  await getPool().query(`UPDATE marketing_campaigns SET lead_id=$1, updated_at=NOW() WHERE id=$2`, [String(lead.id), campaign.id])
  await publishEvent({
    orgId,
    workflowId: id,
    agent: AGENTS.marketing,
    eventType: 'marketing.lead.created',
    entityType: 'lead',
    entityId: String(lead.id),
    payload: { lead, campaignId: campaign.id }
  })
  await remember({
    orgId,
    key: `lead:${lead.id}:marketing_context`,
    entityType: 'lead',
    entityId: lead.id,
    ownerAgent: 'lexi',
    value: { campaign, lead, handoffReason: 'campaign_generated_lead' }
  })

  const salesTask = await delegateTask({
    orgId,
    workflowId: id,
    fromAgent: 'marketing',
    toAgent: 'sales',
    taskType: 'generate_outreach',
    payload: { leadId: lead.id, campaignId: campaign.id }
  })
  await publishEvent({
    orgId,
    workflowId: id,
    agent: AGENTS.sales,
    eventType: 'sales.lead.received',
    entityType: 'lead',
    entityId: String(lead.id),
    payload: { taskId: salesTask.id, lead, campaignId: campaign.id }
  })

  try {
    const outreach = await generateOutreach({ lead, campaign })
    await completeTask(salesTask.id, { outreach, leadId: lead.id })
    await remember({
      orgId,
      key: `lead:${lead.id}:sales_outreach`,
      entityType: 'lead',
      entityId: lead.id,
      ownerAgent: 'aria',
      value: { outreach, campaignId: campaign.id, generatedAt: new Date().toISOString() }
    })
    await publishEvent({
      orgId,
      workflowId: id,
      agent: AGENTS.sales,
      eventType: 'sales.outreach.generated',
      entityType: 'lead',
      entityId: String(lead.id),
      payload: { taskId: salesTask.id, outreach }
    })

    const updatedLead = await updateLead(lead.id, { status: 'Contacted' }, orgId)
    await publishEvent({
      orgId,
      workflowId: id,
      agent: AGENTS.sales,
      eventType: 'lead.status.updated',
      entityType: 'lead',
      entityId: String(lead.id),
      payload: { from: lead.status, to: updatedLead.status, lead: updatedLead }
    })

    await getPool().query(
      `UPDATE agent_workflows SET status='completed', current_step='sales_outreach_generated', result=$1, updated_at=NOW() WHERE id=$2`,
      [{ campaignId: campaign.id, leadId: updatedLead.id, outreach }, id]
    )
  } catch (e) {
    await failTask(salesTask.id, e.message)
    await publishEvent({
      orgId,
      workflowId: id,
      agent: AGENTS.sales,
      eventType: 'sales.outreach.failed',
      entityType: 'lead',
      entityId: String(lead.id),
      payload: { taskId: salesTask.id, error: e.message }
    })
    await getPool().query(
      `UPDATE agent_workflows SET status='waiting_on_ai', current_step='sales_outreach_generation', result=$1, updated_at=NOW() WHERE id=$2`,
      [{ campaignId: campaign.id, leadId: lead.id, error: e.message }, id]
    )
  }

  return getWorkflow(orgId, id)
}

async function generateMarketingOutput({ orgId, type, prompt }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required for Marketing Agent content generation')
  }

  const companyContext = await getCompanyBrainContext(orgId || 'default', prompt)

  const instructions = {
    linkedin: 'Write a high-performing LinkedIn post under 180 words.',
    email: 'Write five high-converting email subject lines.',
    ad: 'Write a paid social ad with headline, body, and CTA.',
    blog: 'Write a practical blog outline with five sections.',
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 700,
      system: 'You are Lexi, AI BOS Marketing Agent. Produce specific, usable marketing assets. No filler.',
      messages: [{ role: 'user', content: `${instructions[type] || instructions.linkedin}\n\nCompany Brain context:\n${companyContext || 'No relevant Company Brain context found.'}\n\nGoal:\n${prompt}` }]
    })
  })

  const data = await response.json()
  if (!response.ok || data.error) throw new Error(data.error?.message || 'Marketing content generation failed')
  return data.content?.find(block => block.type === 'text')?.text || ''
}

export async function createMarketingContent(orgId, input) {
  await ensureCollaborationSchema()
  const type = String(input.type || 'linkedin')
  const prompt = String(input.prompt || '').trim()
  if (!prompt) throw new Error('prompt is required')
  const output = await generateMarketingOutput({ orgId, type, prompt })

  const { rows } = await getPool().query(
    `INSERT INTO marketing_outputs (org_id, output_type, prompt, output, status)
     VALUES ($1,$2,$3,$4,'draft') RETURNING *`,
    [orgId, type, prompt, output]
  )
  const content = rows[0]

  await publishEvent({
    orgId,
    workflowId: null,
    agent: AGENTS.marketing,
    eventType: 'marketing.content.generated',
    entityType: 'marketing_output',
    entityId: String(content.id),
    payload: { outputId: content.id, type, prompt }
  })
  await remember({
    orgId,
    key: `marketing_output:${content.id}`,
    entityType: 'marketing_output',
    entityId: content.id,
    ownerAgent: 'lexi',
    value: { type, prompt, output, status: content.status }
  })

  return content
}

export async function listMarketingContent(orgId) {
  await ensureCollaborationSchema()
  const { rows } = await getPool().query(
    `SELECT * FROM marketing_outputs WHERE org_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [orgId]
  )
  return rows
}

export async function getWorkflow(orgId, id) {
  await ensureCollaborationSchema()
  const { rows } = await getPool().query(`SELECT * FROM agent_workflows WHERE org_id=$1 AND id=$2`, [orgId, id])
  if (!rows[0]) return null
  const workflow = rows[0]
  const [events, tasks, memory] = await Promise.all([
    listEvents(orgId, { workflowId: id, limit: 100 }),
    listTasks(orgId, { workflowId: id }),
    listMemory(orgId, { workflowId: id })
  ])
  return { workflow, events, tasks, memory }
}

export async function listEvents(orgId, { workflowId, agent, eventType, search, limit = 100 } = {}) {
  await ensureCollaborationSchema()
  const params = [orgId]
  let query = `SELECT * FROM agent_events WHERE org_id=$1`
  if (workflowId) {
    params.push(workflowId)
    query += ` AND workflow_id=$${params.length}`
  }
  if (agent && agent !== 'all') {
    params.push(agent)
    query += ` AND (agent_id=$${params.length} OR agent_role=$${params.length})`
  }
  if (eventType && eventType !== 'all') {
    params.push(eventType)
    query += ` AND event_type=$${params.length}`
  }
  if (search) {
    params.push(`%${search}%`)
    query += ` AND (
      event_type ILIKE $${params.length}
      OR agent_id ILIKE $${params.length}
      OR agent_role ILIKE $${params.length}
      OR entity_type ILIKE $${params.length}
      OR entity_id ILIKE $${params.length}
      OR payload::text ILIKE $${params.length}
    )`
  }
  params.push(limit)
  query += ` ORDER BY created_at DESC LIMIT $${params.length}`
  const { rows } = await getPool().query(query, params)
  return rows
}

export async function listTasks(orgId, { agent, workflowId, status } = {}) {
  await ensureCollaborationSchema()
  const params = [orgId]
  let query = `SELECT * FROM agent_tasks WHERE org_id=$1`
  if (agent) {
    params.push(agent)
    query += ` AND to_agent=$${params.length}`
  }
  if (workflowId) {
    params.push(workflowId)
    query += ` AND workflow_id=$${params.length}`
  }
  if (status) {
    params.push(status)
    query += ` AND status=$${params.length}`
  }
  query += ` ORDER BY created_at DESC LIMIT 100`
  const { rows } = await getPool().query(query, params)
  return rows
}

export async function listMemory(orgId, { entityType, entityId, workflowId } = {}) {
  await ensureCollaborationSchema()
  if (workflowId) {
    const { rows } = await getPool().query(
      `SELECT sm.* FROM shared_memory sm
       WHERE sm.org_id=$1
       AND (
         sm.value->>'workflow_id' = $2
         OR sm.value->'campaign'->>'workflow_id' = $2
         OR sm.value->>'campaignId' IN (
           SELECT id::text FROM marketing_campaigns WHERE workflow_id=$2
         )
       )
       ORDER BY sm.updated_at DESC`,
      [orgId, workflowId]
    )
    return rows
  }

  const params = [orgId]
  let query = `SELECT * FROM shared_memory WHERE org_id=$1`
  if (entityType) {
    params.push(entityType)
    query += ` AND entity_type=$${params.length}`
  }
  if (entityId) {
    params.push(String(entityId))
    query += ` AND entity_id=$${params.length}`
  }
  query += ` ORDER BY updated_at DESC LIMIT 100`
  const { rows } = await getPool().query(query, params)
  return rows
}

export async function collaborationOverview(orgId) {
  await ensureCollaborationSchema()
  const [events, tasks, campaigns, content, memory] = await Promise.all([
    listEvents(orgId, { limit: 30 }),
    listTasks(orgId, {}),
    getPool().query(`SELECT * FROM marketing_campaigns WHERE org_id=$1 ORDER BY created_at DESC LIMIT 20`, [orgId]),
    getPool().query(`SELECT * FROM marketing_outputs WHERE org_id=$1 ORDER BY created_at DESC LIMIT 20`, [orgId]),
    listMemory(orgId, {})
  ])
  return { events, tasks, campaigns: campaigns.rows, content: content.rows, memory }
}
