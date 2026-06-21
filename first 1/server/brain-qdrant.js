import { QdrantClient } from '@qdrant/js-client-rest';
import { getDimension } from './brain-embeddings.js';

const COLLECTION = 'brain_embeddings';

let client = null;

function getClient() {
  if (!client) {
    const url = process.env.QDRANT_URL;
    const apiKey = process.env.QDRANT_API_KEY;
    if (!url) return null;
    client = new QdrantClient({ url, apiKey: apiKey || undefined });
  }
  return client;
}

export function isQdrantEnabled() {
  return !!process.env.QDRANT_URL;
}

export async function ensureCollection() {
  const c = getClient();
  if (!c) return false;
  try {
    const collections = await c.getCollections();
    const exists = collections.collections.some(col => col.name === COLLECTION);
    if (!exists) {
      await c.createCollection(COLLECTION, {
        vectors: { size: getDimension(), distance: 'Cosine' }
      });
    }
    return true;
  } catch (e) {
    console.error('Qdrant ensureCollection error:', e.message);
    return false;
  }
}

export async function upsertVectors(points) {
  const c = getClient();
  if (!c) return false;
  try {
    await c.upsert(COLLECTION, { wait: true, points });
    return true;
  } catch (e) {
    console.error('Qdrant upsert error:', e.message);
    return false;
  }
}

export async function searchVectors(queryVector, limit = 8, scoreThreshold = 0.3) {
  const c = getClient();
  if (!c) return [];
  try {
    const results = await c.search(COLLECTION, {
      vector: queryVector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true
    });
    return results;
  } catch (e) {
    console.error('Qdrant search error:', e.message);
    return [];
  }
}

export async function deleteByDocumentId(documentId) {
  const c = getClient();
  if (!c) return;
  try {
    await c.delete(COLLECTION, {
      filter: { must: [{ key: 'document_id', match: { value: documentId } }] }
    });
  } catch (e) {
    console.error('Qdrant delete error:', e.message);
  }
}
