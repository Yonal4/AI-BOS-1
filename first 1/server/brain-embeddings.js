const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_MODEL = 'voyage-3-lite';
const BATCH_SIZE = 128;

export function isEmbeddingsEnabled() {
  return !!process.env.VOYAGE_API_KEY;
}

export async function embedTexts(texts) {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) return null;

  const results = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ input: batch, model: VOYAGE_MODEL })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Voyage AI error: ${err}`);
    }
    const data = await res.json();
    results.push(...data.data.map(d => d.embedding));
  }
  return results;
}

export async function embedQuery(text) {
  const embeddings = await embedTexts([text]);
  return embeddings ? embeddings[0] : null;
}

export function getDimension() {
  return 1024;
}
