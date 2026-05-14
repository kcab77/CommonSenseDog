import { Pinecone } from '@pinecone-database/pinecone'

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
const index = pc.index(process.env.PINECONE_INDEX || 'dog-knowledge-database')

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
    }
  )
  const data = await res.json()
  return data.embedding.values
}

export async function upsertKnowledge(id: string, text: string, metadata: Record<string, string> = {}) {
  const values = await embedText(text)
  await index.upsert([{ id, values, metadata: { text, ...metadata } }])
}

export async function searchKnowledge(query: string, topK = 5): Promise<string[]> {
  const values = await embedText(query)
  const results = await index.query({ vector: values, topK, includeMetadata: true })
  return results.matches
    .filter(m => (m.score ?? 0) > 0.5)
    .map(m => (m.metadata as { text: string }).text)
}
