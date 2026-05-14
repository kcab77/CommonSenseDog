import { NextRequest, NextResponse } from 'next/server'
import { upsertKnowledge, searchKnowledge } from '@/lib/pinecone'

const ADMIN_KEY = process.env.ADMIN_KEY

export async function POST(req: NextRequest) {
  const { text, id, category, adminKey } = await req.json()
  if (adminKey !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!text || !id) return NextResponse.json({ error: 'text and id required' }, { status: 400 })
  await upsertKnowledge(id, text, { category: category || 'general' })
  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query) return NextResponse.json({ error: 'q param required' }, { status: 400 })
  const results = await searchKnowledge(query)
  return NextResponse.json({ results })
}
