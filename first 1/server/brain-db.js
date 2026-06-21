import pg from 'pg';

const { Pool } = pg;

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
}

let brainSchemaReady = false;

export async function ensureBrainSchema() {
  if (brainSchemaReady) return;
  await getPool().query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS brain_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id TEXT NOT NULL DEFAULT 'default',
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'other',
      filename TEXT,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      chunk_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'processing',
      error_msg TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS brain_chunks (
      id BIGSERIAL PRIMARY KEY,
      org_id TEXT NOT NULL DEFAULT 'default',
      document_id UUID NOT NULL REFERENCES brain_documents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      qdrant_id TEXT,
      tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_brain_documents_org_status ON brain_documents (org_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_brain_chunks_doc ON brain_chunks (document_id, chunk_index);
    CREATE INDEX IF NOT EXISTS idx_brain_chunks_org_tsv ON brain_chunks USING GIN (tsv);
    CREATE INDEX IF NOT EXISTS idx_brain_chunks_qdrant ON brain_chunks (qdrant_id);
  `);
  brainSchemaReady = true;
}

export async function createDocument({ title, type, filename, sizeBytes, orgId }) {
  await ensureBrainSchema();
  const { rows } = await getPool().query(
    `INSERT INTO brain_documents (title, type, filename, size_bytes, status, org_id)
     VALUES ($1, $2, $3, $4, 'processing', $5)
     RETURNING *`,
    [title, type, filename || null, sizeBytes || 0, orgId || 'default']
  );
  return rows[0];
}

export async function updateDocumentReady(id, chunkCount) {
  await ensureBrainSchema();
  const { rows } = await getPool().query(
    `UPDATE brain_documents
     SET status='ready', chunk_count=$2, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [id, chunkCount]
  );
  return rows[0];
}

export async function updateDocumentError(id, errorMsg) {
  await ensureBrainSchema();
  await getPool().query(
    `UPDATE brain_documents SET status='error', error_msg=$2, updated_at=NOW() WHERE id=$1`,
    [id, errorMsg]
  );
}

export async function insertChunks(documentId, chunks, orgId) {
  await ensureBrainSchema();
  if (!chunks.length) return;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        `INSERT INTO brain_chunks (document_id, content, chunk_index, qdrant_id, org_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [documentId, chunks[i].content, i, chunks[i].qdrantId || null, orgId || 'default']
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function listDocuments(orgId) {
  await ensureBrainSchema();
  const { rows } = await getPool().query(
    `SELECT * FROM brain_documents WHERE org_id=$1 ORDER BY created_at DESC`,
    [orgId || 'default']
  );
  return rows;
}

export async function getDocument(id) {
  await ensureBrainSchema();
  const { rows } = await getPool().query(
    `SELECT * FROM brain_documents WHERE id=$1`, [id]
  );
  return rows[0] || null;
}

export async function deleteDocument(id) {
  await ensureBrainSchema();
  await getPool().query(`DELETE FROM brain_documents WHERE id=$1`, [id]);
}

export async function getChunksByDocument(documentId) {
  await ensureBrainSchema();
  const { rows } = await getPool().query(
    `SELECT * FROM brain_chunks WHERE document_id=$1 ORDER BY chunk_index`, [documentId]
  );
  return rows;
}

export async function fullTextSearch(query, orgId, limit = 8) {
  await ensureBrainSchema();
  const { rows } = await getPool().query(
    `SELECT
       bc.id,
       bc.content,
       bc.chunk_index,
       bd.title AS doc_title,
       bd.type  AS doc_type,
       ts_rank(bc.tsv, plainto_tsquery('english', $1)) AS score
     FROM brain_chunks bc
     JOIN brain_documents bd ON bd.id = bc.document_id
     WHERE bc.tsv @@ plainto_tsquery('english', $1)
       AND bd.status = 'ready'
       AND bd.org_id = $2
     ORDER BY score DESC
     LIMIT $3`,
    [query, orgId || 'default', limit]
  );
  return rows;
}

export async function getChunksByQdrantIds(qdrantIds, orgId) {
  await ensureBrainSchema();
  if (!qdrantIds.length) return [];
  const { rows } = await getPool().query(
    `SELECT bc.id, bc.content, bc.chunk_index, bc.qdrant_id,
            bd.title AS doc_title, bd.type AS doc_type
     FROM brain_chunks bc
     JOIN brain_documents bd ON bd.id = bc.document_id
     WHERE bc.qdrant_id = ANY($1::text[])
       AND bd.org_id = $2`,
    [qdrantIds, orgId || 'default']
  );
  return rows;
}

export async function getStats(orgId) {
  await ensureBrainSchema();
  const { rows } = await getPool().query(
    `SELECT
       (SELECT COUNT(*) FROM brain_documents WHERE status='ready' AND org_id=$1)::int AS doc_count,
       (SELECT COALESCE(SUM(chunk_count),0) FROM brain_documents WHERE status='ready' AND org_id=$1)::int AS chunk_count,
       (SELECT COUNT(*) FROM brain_documents WHERE status='processing' AND org_id=$1)::int AS processing_count`,
    [orgId || 'default']
  );
  return rows[0];
}
