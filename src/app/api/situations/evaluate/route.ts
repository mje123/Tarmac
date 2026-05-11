import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { situation, response, mode, tone } = await req.json()
  if (!situation || !response) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  if (mode === 'explain') {
    const voiceMap: Record<string, string> = {
      harsh: 'You are a tough, no-nonsense FAA DPE. Tell the student exactly what they got wrong and what the correct procedure is. Be blunt and direct — their life may depend on getting this right. Keep it under 120 words.',
      friendly: 'You are a patient, encouraging CFI. Walk the student through the correct procedure step by step, explaining the reasoning behind each action. Be warm but clear. Keep it under 120 words.',
      quick: 'Provide a crisp numbered list of the correct procedure steps. Nothing extra — just the actions in order, under 80 words.',
    }
    const systemPrompt = voiceMap[tone] || voiceMap.friendly

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `SITUATION: ${situation}\n\nSTUDENT'S RESPONSE: ${response}\n\nExplain the correct procedure.`,
      }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ explanation: text })
  }

  // mode === 'evaluate' (default)
  const evalPrompt = `You are an FAA Designated Pilot Examiner evaluating a student pilot's written response to an emergency scenario. Evaluate based on FAA-approved procedures (AIM, AFH, POH).

Return ONLY valid JSON — no markdown, no explanation, nothing else:
{"correct":true|false,"score":1|2|3,"feedback":"1-2 sentence evaluation"}

Score:
- 3: All critical memory items present, clear understanding
- 2: Mostly correct, missing 1-2 steps
- 1: Wrong, incomplete, or dangerous

Be strict. Focus on critical safety actions.`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: evalPrompt,
    messages: [{
      role: 'user',
      content: `SITUATION: ${situation}\n\nSTUDENT RESPONSE: ${response}`,
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON')
    const parsed = JSON.parse(match[0])
    return NextResponse.json({
      correct: !!parsed.correct,
      score: parsed.score ?? (parsed.correct ? 3 : 1),
      feedback: parsed.feedback ?? 'Unable to evaluate.',
    })
  } catch {
    return NextResponse.json({ correct: false, score: 1, feedback: 'Could not evaluate response. Please try again.' })
  }
}
