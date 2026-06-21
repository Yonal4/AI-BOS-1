import pg from 'pg'
const { Pool } = pg

let pool = null
function getPool() {
  if (!pool) pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  })
  return pool
}

let leadsSchemaReady = false
async function ensureLeadsSchema() {
  if (leadsSchemaReady) return
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS leads (
      id BIGSERIAL PRIMARY KEY,
      org_id TEXT NOT NULL DEFAULT 'default',
      name TEXT NOT NULL,
      email TEXT,
      company TEXT,
      source TEXT NOT NULL DEFAULT 'Manual',
      status TEXT NOT NULL DEFAULT 'New',
      notes TEXT,
      assigned_agent TEXT NOT NULL DEFAULT 'aria',
      value INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 50,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_leads_org_status ON leads (org_id, status);
    CREATE INDEX IF NOT EXISTS idx_leads_org_updated ON leads (org_id, updated_at DESC);
  `)
  leadsSchemaReady = true
}

export async function createLead({ orgId, name, email, company, source, status, notes, assignedAgent, value, score }) {
  await ensureLeadsSchema()
  const { rows } = await getPool().query(
    `INSERT INTO leads (org_id,name,email,company,source,status,notes,assigned_agent,value,score)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [orgId||'default', name, email||null, company||null, source||'Manual',
     status||'New', notes||null, assignedAgent||'aria', value||0, score||50]
  )
  return rows[0]
}

export async function listLeads(orgId, { status, search } = {}) {
  await ensureLeadsSchema()
  let q = `SELECT * FROM leads WHERE org_id=$1`
  const params = [orgId||'default']
  if (status) { params.push(status); q += ` AND status=$${params.length}` }
  if (search) { params.push(`%${search}%`); q += ` AND (name ILIKE $${params.length} OR company ILIKE $${params.length} OR email ILIKE $${params.length})` }
  q += ` ORDER BY created_at DESC`
  const { rows } = await getPool().query(q, params)
  return rows
}

export async function getLead(id, orgId) {
  await ensureLeadsSchema()
  const { rows } = await getPool().query(`SELECT * FROM leads WHERE id=$1 AND org_id=$2`, [id, orgId || 'default'])
  return rows[0] || null
}

export async function updateLead(id, fields, orgId) {
  await ensureLeadsSchema()
  const allowed = ['name','email','company','source','status','notes','assigned_agent','value','score']
  const sets = [], params = []
  for (const [k, v] of Object.entries(fields)) {
    const col = k.replace(/([A-Z])/g, '_$1').toLowerCase()
    if (allowed.includes(col)) { params.push(v); sets.push(`${col}=$${params.length}`) }
  }
  if (!sets.length) return getLead(id, orgId)
  params.push(id)
  params.push(orgId || 'default')
  const { rows } = await getPool().query(
    `UPDATE leads SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${params.length - 1} AND org_id=$${params.length} RETURNING *`,
    params
  )
  return rows[0]
}

export async function deleteLead(id, orgId) {
  await ensureLeadsSchema()
  await getPool().query(`DELETE FROM leads WHERE id=$1 AND org_id=$2`, [id, orgId || 'default'])
}

export async function getLeadStats(orgId) {
  await ensureLeadsSchema()
  const { rows } = await getPool().query(
    `SELECT
       COUNT(*)::int                                               AS total,
       COUNT(*) FILTER (WHERE status='New')::int                  AS new_count,
       COUNT(*) FILTER (WHERE status='Qualified')::int            AS qualified,
       COUNT(*) FILTER (WHERE status='Contacted')::int            AS contacted,
       COUNT(*) FILTER (WHERE status='Proposal Sent')::int        AS proposal_sent,
       COUNT(*) FILTER (WHERE status='Won')::int                  AS won,
       COUNT(*) FILTER (WHERE status='Lost')::int                 AS lost,
       COALESCE(SUM(value) FILTER (WHERE status NOT IN ('Lost')),0)::int  AS pipeline_value,
       COALESCE(SUM(value) FILTER (WHERE status='Won'),0)::int           AS won_value,
       ROUND(AVG(score))::int                                      AS avg_score
     FROM leads WHERE org_id=$1`,
    [orgId||'default']
  )
  return rows[0]
}
