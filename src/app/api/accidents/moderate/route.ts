import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const MODERATE_PROMPT = `You are a content moderator for an aviation education community. Flag if the comment contains: hate speech, slurs, sexual content, personal attacks (attacking a person, not an idea), threats, spam, or content with no relation to aviation safety or the discussion topic.

Thoughtful criticism, disagreement, and debate about aviation decisions is always allowed.

Return ONLY valid JSON: {"approved": true/false, "reason": "string or null"}`

export async function POST(request: NextRequest) {
  try {
    const { body } = await request.json() as { body: string }
    if (!body?.trim()) return NextResponse.json({ error: 'Missing body' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: MODERATE_PROMPT,
      messages: [{ role: 'user', content: body }],
    })

    const text = resp.content[0].type === 'text' ? resp.content[0].text : '{}'
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const result = JSON.parse(clean) as { approved: boolean; reason: string | null }
    return NextResponse.json(result)
  } catch (err) {
    console.error('Moderation error:', err)
    // Fail open on moderation errors — don't block comments if Claude is unavailable
    return NextResponse.json({ approved: true, reason: null })
  }
}
