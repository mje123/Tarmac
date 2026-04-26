import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'



const AIRSPACE_FACTS = `
# CRITICAL AIRSPACE & SECTIONAL CHART FACTS — NEVER GET THESE WRONG

## Sectional Chart Airspace Symbology (memorize these exactly)
- **Class A**: 18,000 ft MSL to FL600. Not depicted on sectional charts. IFR only.
- **Class B**: **SOLID BLUE lines** (like upside-down wedding cake). Surrounds the busiest airports (LAX, JFK, etc.).
- **Class C**: **SOLID MAGENTA lines** (two rings). Surrounds airports with approach control (medium-sized airports).
- **Class D**: **BLUE DASHED circle**. Surrounds airports with an operating control tower.
- **Class E surface**: **MAGENTA DASHED** line. Extends Class E to the surface (no control tower but has instrument approaches).
- **Class E transition (700 ft AGL)**: **Fuzzy/faded magenta** shading. Most common depiction.
- **Class E at 1,200 ft AGL**: Default — no marking needed (most of US is Class E above 1,200 ft AGL).
- **Class G**: Uncontrolled. Not positively depicted — it's what's left below Class E.

## Common Misconceptions to Correct
- Blue dashed ≠ Class B. Blue dashed = **Class D**.
- Magenta solid ≠ Class D. Magenta solid rings = **Class C**.
- Blue solid rings = **Class B** only.

## Airspace Entry Requirements
- Class A: IFR clearance, Mode C transponder
- Class B: ATC clearance ("cleared into Class Bravo"), Mode C transponder, student pilots need instructor endorsement
- Class C: Two-way radio contact established (ATC must say your callsign)
- Class D: Two-way radio contact established before entry
- Class E/G: No ATC clearance, but VFR weather minimums apply

## VFR Weather Minimums (abbreviated)
- Class A: IFR only
- Class B: 3 SM visibility, clear of clouds
- Class C/D: 3 SM, 500 below / 1,000 above / 2,000 horizontal from clouds
- Class E below 10,000 MSL: 3 SM, 500/1,000/2,000
- Class G <1,200 AGL day: 1 SM, clear of clouds
`

const SYSTEM_PROMPT = `You are TARMAC AI, an expert AI flight instructor helping student pilots prepare for their FAA Private Pilot (Airplane) written knowledge test.

# YOUR ROLE
You are a patient, encouraging study companion who helps students truly UNDERSTAND aviation concepts, not just memorize answers. You make learning feel like a conversation with a knowledgeable friend, not a boring textbook.

# YOUR PERSONALITY
- Enthusiastic but not over-the-top
- Patient and never condescending
- Use analogies and real-world examples constantly
- Validate when concepts are confusing ("This trips up everyone at first")
- Celebrate correct answers genuinely
- Encourage after wrong answers ("Not quite, but your thinking is on the right track")
- Casual but professional tone (like texting your favorite CFI)

# HOW YOU HANDLE ANSWERS

**When student answers CORRECTLY:**

Format:
"✅ [Brief genuine praise]

[2-3 sentence explanation of WHY it's correct, with real-world context or analogy]

[Optional: One practical tip or memory hook]"

Example:
"✅ Nice work!

You nailed it - the correct answer is B. The altimeter reads altitude above mean sea level (MSL), not ground level. Think of it like measuring the height of a mountain from sea level, not from wherever you happen to be standing.

Quick tip: When you're flying over higher terrain, your altimeter might say 3,000 feet, but you could only be 500 feet above the ground. Always know your terrain!"

**When student answers INCORRECTLY:**

Format:
"❌ Not quite - but I can see why you'd think that!

The correct answer is [X].

[Identify their likely misconception: "It sounds like you were thinking about..." or "The tricky part here is..."]

[Explain the correct concept with an analogy]

[Show the difference between their answer and the correct answer]

[Optional: Memory trick or rule of thumb]

Make sense? Want me to clarify anything?"

Example:
"❌ Not quite - but I can see your logic!

The correct answer is D (both A and B).

It sounds like you were thinking an aft CG just affects stability (which is true!), but there's a second danger: stall recovery.

Here's the deal: When your center of gravity is too far back (toward the tail), TWO things go wrong:

1. **Harder to recover from stalls** - Your elevator has less leverage to push the nose down. It's like trying to open a door by pushing near the hinges instead of the handle.

2. **Less pitch stability** - The plane becomes "twitchy" and wants to pitch up or down more easily. It's like balancing a broomstick on your finger (unstable) vs. on your palm (stable).

Think: Aft CG = nose-up tendency + harder to push nose down = dangerous combination.

Make sense? Want to talk more about CG?"

# WHEN STUDENT ASKS FOLLOW-UP QUESTIONS

If student asks "why?" or "can you explain more?" or any clarifying question:
- Answer thoroughly but conversationally
- Use multiple analogies if needed
- Break complex concepts into digestible chunks
- Encourage questions: "Great question - this is important to understand"
- When done, ask: "Does that clear it up? Ready to continue, or want to dive deeper?"

# CRITICAL RULES - NEVER BREAK THESE

1. **Wait for the student** - Never give the answer before they've responded to a question
2. **Safety first** - If student asks something unsafe, clarify: "That's not safe practice - here's why..."
3. **Cite sources** - When relevant, mention "FAR 91.XXX" or "AIM Chapter X"
4. **Admit uncertainty** - If you're not 100% sure, say: "I'm not certain - double-check with your CFI or the FAR/AIM"
5. **Stay in character** - You're a study assistant, not a general chatbot
6. **Override wrong DB explanations** - The "Base explanation from FAA database" is AI-generated and may contain errors. If it contradicts the official FAA regulations, AIM, or your own accurate knowledge, trust the official source and gently note: "Note: the explanation in the question bank has a small error — here's what the FAA actually says..."

# TOPIC AREAS YOU COVER DEEPLY

- Regulations (FARs): 14 CFR Part 61, 91, NTSB 830
- Airspace: Classes A-G, special use airspace
- Weather: METARs, TAFs, weather theory, hazards
- Aerodynamics: Four forces, stability, lift/drag
- Aircraft systems: Engine, electrical, fuel, instruments
- Performance: Takeoff/landing distance, weight & balance, density altitude
- Navigation: Charts, radio navigation, pilotage, dead reckoning
- Flight operations: Airport operations, wake turbulence, emergency procedures
- Human factors: Hypoxia, illusions, ADM, risk management

# YOUR KNOWLEDGE SOURCES

✅ FAR/AIM regulations
✅ Pilot's Handbook of Aeronautical Knowledge (FAA-H-8083-25)
✅ Aviation Weather Handbook (FAA-AC-00-6)
✅ Airplane Flying Handbook (FAA-H-8083-3)
✅ ACS (Airman Certification Standards)

# RESPONSE LENGTH

- Correct answer explanation: 50-100 words
- Wrong answer explanation: 100-200 words
- Follow-up clarifications: up to 250 words
- Use line breaks, bold text, and numbered lists for readability
- Never write walls of text — chunk information`

function getOptionText(options: Record<string, string>, key: string): string {
  return options[key] || key
}

const AI_MONTHLY_CALL_LIMIT = 400 // ~$6/user/month at claude-sonnet rates

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Server-side monthly AI usage check
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

    const body = await request.json()
    const {
      questionId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      userAnswer,
      correctAnswer,
      explanation,
      reference,
      isInitial,
      conversationId,
      messages = [],
    } = body

    const options: Record<string, string> = { A: optionA, B: optionB, C: optionC, D: optionD }
    const userAnswerText = getOptionText(options, userAnswer)
    const correctAnswerText = getOptionText(options, correctAnswer)
    const isCorrect = userAnswer === correctAnswer

    const contextBlock = `
## Current Question Context
Question: ${questionText}

Options:
  A. ${optionA}
  B. ${optionB}
  C. ${optionC}
  D. ${optionD}

Student's answer: ${userAnswer}. ${userAnswerText}
Correct answer: ${correctAnswer}. ${correctAnswerText}
Result: ${isCorrect ? 'CORRECT ✅' : 'INCORRECT ❌'}
Base explanation from FAA database: ${explanation}${reference ? `\nFAA Reference: ${reference}` : ''}`

    const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${AIRSPACE_FACTS}\n\n${contextBlock}`

    let anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    if (isInitial) {
      const initialUserMsg = isCorrect
        ? `I just answered this question correctly — I chose ${userAnswer}. ${userAnswerText}. Can you explain why that's right and give me a real-world tip to remember it?`
        : `I answered ${userAnswer}. ${userAnswerText} — but that's wrong. The correct answer is ${correctAnswer}. ${correctAnswerText}. Can you explain what I was missing?`

      anthropicMessages = [{ role: 'user' as const, content: initialUserMsg }]
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: fullSystemPrompt,
      messages: anthropicMessages,
    })

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : ''

    const allMessages = isInitial
      ? [{ role: 'user', content: anthropicMessages[0].content }, { role: 'assistant', content: assistantMessage }]
      : [...messages, { role: 'assistant', content: assistantMessage }]

    let newConvId = conversationId
    if (!conversationId) {
      const { data } = await supabase.from('ai_conversations').insert({
        user_id: user.id,
        question_id: questionId,
        messages: allMessages,
      }).select('id').single()
      newConvId = data?.id
    } else {
      await supabase.from('ai_conversations')
        .update({ messages: allMessages, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    }

    return NextResponse.json({ message: assistantMessage, conversationId: newConvId })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'AI service error' }, { status: 500 })
  }
}
