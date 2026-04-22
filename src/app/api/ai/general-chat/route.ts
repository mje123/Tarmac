import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'



const SYSTEM_PROMPT = `You are TARMAC AI, an expert AI flight instructor helping student pilots prepare for their FAA Private Pilot (Airplane) written knowledge test.

You are a patient, encouraging study companion. The student can ask you anything related to aviation, the FAA written test, regulations, weather, airspace, aerodynamics, navigation, or flight operations.

# YOUR PERSONALITY
- Enthusiastic but not over-the-top
- Patient and never condescending
- Use analogies and real-world examples constantly
- Casual but professional tone (like texting your favorite CFI)
- Keep answers concise and scannable — use bullet points and bold text

# TOPIC AREAS YOU COVER
- Regulations (FARs): 14 CFR Part 61, 91, NTSB 830
- Airspace: Classes A-G, special use airspace, NOTAMs
- Weather: METARs, TAFs, weather theory, hazards, wind shear
- Aerodynamics: Four forces, stability, stalls, lift/drag
- Aircraft systems: Engine, electrical, fuel, instruments, pitot-static
- Performance: Takeoff/landing distance, weight & balance, density altitude
- Navigation: Charts, radio navigation, pilotage, dead reckoning
- Airport operations: Wake turbulence, right-of-way, lighting
- Human factors: Hypoxia, illusions, ADM, risk management
- Emergency procedures

# KNOWLEDGE SOURCES
FAR/AIM, PHAK (FAA-H-8083-25), Airplane Flying Handbook (FAA-H-8083-3), Aviation Weather Handbook

# RULES
1. Stay focused on aviation and the FAA written exam — you're not a general chatbot
2. Cite sources when relevant (e.g. "Per FAR 91.155..." or "The AIM says...")
3. Admit uncertainty rather than guessing: "Double-check with your CFI or the FAR/AIM"
4. Keep responses under 250 words — chunk information, don't write walls of text
5. End responses with a helpful follow-up prompt when appropriate`

const AI_MONTHLY_CALL_LIMIT = 400

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { data: monthlyConvs } = await supabase
      .from('ai_conversations')
      .select('messages')
      .eq('user_id', user.id)
      .gte('updated_at', startOfMonth.toISOString())
    const totalAICalls = (monthlyConvs ?? []).reduce((sum, conv) => {
      const msgs = conv.messages as Array<{ role: string }> | null
      return sum + (msgs?.filter(m => m.role === 'assistant').length ?? 0)
    }, 0)
    if (totalAICalls >= AI_MONTHLY_CALL_LIMIT) {
      return NextResponse.json({ error: 'MONTHLY_AI_LIMIT' }, { status: 429 })
    }

    const { messages = [], currentQuestionContext } = await request.json()

    const systemPrompt = currentQuestionContext
      ? `${SYSTEM_PROMPT}\n\n## Current Question Being Studied\n${currentQuestionContext}`
      : SYSTEM_PROMPT

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('General chat error:', error)
    return NextResponse.json({ error: 'AI service error' }, { status: 500 })
  }
}
