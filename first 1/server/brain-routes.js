import express from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import {
  createDocument,
  updateDocumentReady,
  updateDocumentError,
  insertChunks,
  listDocuments,
  getDocument,
  deleteDocument,
  fullTextSearch,
  getChunksByQdrantIds,
  getStats
} from './brain-db.js'
import { parseFile, splitIntoChunks } from './brain-parser.js'
import { embedTexts, embedQuery, isEmbeddingsEnabled } from './brain-embeddings.js'
import {
  ensureCollection,
  upsertVectors,
  searchVectors,
  deleteByDocumentId,
  isQdrantEnabled
} from './brain-qdrant.js'
import { logBrainSearch } from './analytics-service.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

function getOrgId(req) {
  return req.auth?.orgId || req.headers['x-org-id'] || 'default'
}

async function processDocument(docId, text, docType, orgId) {
  try {
    const chunks = splitIntoChunks(text)
    if (!chunks.length) throw new Error('No text content extracted from document.')

    let enrichedChunks = chunks.map(chunk => ({ ...chunk, qdrantId: null }))

    if (isEmbeddingsEnabled() && isQdrantEnabled()) {
      await ensureCollection()
      const embeddings = await embedTexts(chunks.map(chunk => chunk.content))
      if (embeddings) {
        const points = embeddings.map((vector, index) => ({
          id: uuidv4().replace(/-/g, '').slice(0, 16),
          vector,
          payload: {
            document_id: docId,
            chunk_index: index,
            content: chunks[index].content,
            type: docType,
            org_id: orgId
          }
        }))
        await upsertVectors(points)
        enrichedChunks = chunks.map((chunk, index) => ({ ...chunk, qdrantId: points[index].id }))
      }
    }

    await insertChunks(docId, enrichedChunks, orgId)
    await updateDocumentReady(docId, enrichedChunks.length)
  } catch (e) {
    await updateDocumentError(docId, e.message)
    throw e
  }
}

router.get('/status', async (req, res) => {
  try {
    const orgId = getOrgId(req)
    const stats = await getStats(orgId)
    res.json({
      db: true,
      embeddings: isEmbeddingsEnabled(),
      qdrant: isQdrantEnabled(),
      stats
    })
  } catch (e) {
    res.json({
      db: false,
      embeddings: isEmbeddingsEnabled(),
      qdrant: isQdrantEnabled(),
      stats: null,
      error: e.message
    })
  }
})

router.get('/documents', async (req, res) => {
  try {
    const orgId = getOrgId(req)
    const docs = await listDocuments(orgId)
    res.json({ documents: docs })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file
  const { title, type } = req.body
  if (!file) return res.status(400).json({ error: 'No file provided.' })
  if (!title) return res.status(400).json({ error: 'Document title required.' })

  const orgId = getOrgId(req)
  let doc = null
  try {
    doc = await createDocument({
      title,
      type: type || 'other',
      filename: file.originalname,
      sizeBytes: file.size,
      orgId
    })
    const text = await parseFile(file.buffer, file.mimetype, file.originalname)
    await processDocument(doc.id, text, type || 'other', orgId)
    const readyDoc = await getDocument(doc.id)
    res.json({ document: readyDoc, message: 'Document uploaded and indexed.' })
  } catch (e) {
    if (doc?.id) await updateDocumentError(doc.id, e.message).catch(() => {})
    res.status(400).json({ error: e.message })
  }
})

router.post('/add', express.json(), async (req, res) => {
  const { title, type, content } = req.body
  if (!title || !content) return res.status(400).json({ error: 'title and content required.' })

  const orgId = getOrgId(req)
  let doc = null
  try {
    doc = await createDocument({
      title,
      type: type || 'other',
      filename: null,
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
      orgId
    })
    await processDocument(doc.id, content, type || 'other', orgId)
    const readyDoc = await getDocument(doc.id)
    res.json({ document: readyDoc, message: 'Content added and indexed.' })
  } catch (e) {
    if (doc?.id) await updateDocumentError(doc.id, e.message).catch(() => {})
    res.status(400).json({ error: e.message })
  }
})

router.delete('/documents/:id', async (req, res) => {
  const { id } = req.params
  const orgId = getOrgId(req)
  try {
    const doc = await getDocument(id)
    if (!doc) return res.status(404).json({ error: 'Document not found.' })
    if (doc.org_id !== orgId) return res.status(403).json({ error: 'Access denied.' })
    if (isQdrantEnabled()) await deleteByDocumentId(id)
    await deleteDocument(id)
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/search', express.json(), async (req, res) => {
  const { query, limit = 8 } = req.body
  if (!query) return res.status(400).json({ error: 'query required.' })
  const orgId = getOrgId(req)

  try {
    let results = []

    if (isEmbeddingsEnabled() && isQdrantEnabled()) {
      const queryVector = await embedQuery(query)
      if (queryVector) {
        const hits = await searchVectors(queryVector, limit)
        const qdrantIds = hits.map(hit => String(hit.id))
        const chunks = await getChunksByQdrantIds(qdrantIds, orgId)
        const chunkMap = Object.fromEntries(chunks.map(chunk => [chunk.qdrant_id, chunk]))
        results = hits
          .map(hit => {
            const chunk = chunkMap[String(hit.id)]
            if (!chunk) return null
            return { content: chunk.content, score: hit.score, doc_title: chunk.doc_title, doc_type: chunk.doc_type }
          })
          .filter(Boolean)
      }
    }

    if (!results.length) {
      const rows = await fullTextSearch(query, orgId, limit)
      results = rows.map(row => ({
        content: row.content,
        score: row.score,
        doc_title: row.doc_title,
        doc_type: row.doc_type
      }))
    }

    const mode = isEmbeddingsEnabled() && isQdrantEnabled() ? 'semantic' : 'fulltext'
    await logBrainSearch({ orgId, query, mode, resultCount: results.length }).catch(() => {})
    res.json({ results, mode })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/context', express.json(), async (req, res) => {
  const { query, limit = 5 } = req.body
  if (!query) return res.status(400).json({ error: 'query required.' })
  const orgId = getOrgId(req)

  try {
    let results = []

    if (isEmbeddingsEnabled() && isQdrantEnabled()) {
      const queryVector = await embedQuery(query)
      if (queryVector) {
        const hits = await searchVectors(queryVector, limit, 0.25)
        const qdrantIds = hits.map(hit => String(hit.id))
        const chunks = await getChunksByQdrantIds(qdrantIds, orgId)
        const chunkMap = Object.fromEntries(chunks.map(chunk => [chunk.qdrant_id, chunk]))
        results = hits.map(hit => chunkMap[String(hit.id)]?.content).filter(Boolean)
      }
    }

    if (!results.length) {
      const rows = await fullTextSearch(query, orgId, limit)
      results = rows.map(row => row.content)
    }

    const context = results.length
      ? `Relevant company knowledge:\n\n${results.map((row, index) => `[${index + 1}] ${row}`).join('\n\n')}`
      : ''

    await logBrainSearch({ orgId, query, mode: 'context', resultCount: results.length }).catch(() => {})
    res.json({ context, chunks: results.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
