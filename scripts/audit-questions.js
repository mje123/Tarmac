/**
 * TARMAC Question Auditor
 * Fetches every question, sends in batches of 20 to Claude for expert review,
 * patches any incorrect answers/explanations in the DB.
 *
 * Run: node scripts/audit-questions.js
 * Run PPL only: node scripts/audit-questions.js ppl
 * Run IFR only: node scripts/audit-questions.js ifr
 */

const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BATCH_SIZE = 20
const examTypeFilter = process.argv[2] || 'all'

async function fetchAllQuestions() {
  const results = []
  let from = 0
  while (true) {
    let query = supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, exam_type, reference')
      .range(from, from + 199)
      .order('id')

    if (examTypeFilter !== 'all') query = query.eq('exam_type', examTypeFilter)

    const { data, error } = await query
    if (error) throw new Error('Fetch error: ' + error.message)
    if (!data || data.length === 0) break
    results.push(...data)
    if (data.length < 200) break
    from += 200
  }
  return results
}

async function auditBatch(questions) {
  const formatted = questions.map((q, i) => {
    const opts = [
      `A: ${q.option_a}`,
      `B: ${q.option_b}`,
      `C: ${q.option_c}`,
      q.option_d ? `D: ${q.option_d}` : null,
    ].filter(Boolean).join('\n    ')
    return `[${i}] ID=${q.id} | Category: ${q.category} | Exam: ${q.exam_type}
  Q: ${q.question_text}
    ${opts}
  Marked correct: ${q.correct_answer}
  Explanation: ${q.explanation}`
  }).join('\n\n')

  const prompt = `You are an FAA knowledge test expert with deep expertise in the FARs, AIM, PHAK, AFH, and IFH. Review the following ${questions.length} aviation knowledge test questions. For EACH question:

1. Verify the marked correct answer is definitively correct per official FAA sources
2. If the answer is WRONG or the explanation contains errors, flag it
3. Only flag questions where you are HIGHLY CONFIDENT the answer is wrong — do not flag if there is reasonable ambiguity

QUESTIONS TO REVIEW:
${formatted}

Return a JSON array. Include ONLY questions that need correction (omit correct ones entirely):
[
  {
    "index": 0,
    "id": "uuid-here",
    "issue": "one sentence describing the error",
    "correct_answer": "A",
    "corrected_explanation": "Accurate 2-3 sentence explanation citing the correct FAA source."
  }
]

If ALL questions are correct, return an empty array: []
Return ONLY the JSON array, no markdown.`

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []

  try {
    return JSON.parse(match[0])
  } catch {
    return []
  }
}

async function applyFixes(fixes) {
  let updated = 0
  for (const fix of fixes) {
    const { error } = await supabase
      .from('questions')
      .update({
        correct_answer: fix.correct_answer,
        explanation: fix.corrected_explanation,
      })
      .eq('id', fix.id)

    if (error) {
      console.log(`    ✗ Failed to update ${fix.id}: ${error.message}`)
    } else {
      updated++
    }
  }
  return updated
}

async function main() {
  console.log(`TARMAC Question Auditor${examTypeFilter !== 'all' ? ` (${examTypeFilter.toUpperCase()} only)` : ''}\n`)

  console.log('Fetching questions...')
  const questions = await fetchAllQuestions()
  console.log(`Found ${questions.length} questions to audit\n`)

  const batches = []
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE))
  }

  let totalFlagged = 0
  let totalFixed = 0
  const allIssues = []

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b]
    const start = b * BATCH_SIZE + 1
    const end = start + batch.length - 1
    process.stdout.write(`Batch ${b + 1}/${batches.length} (Q${start}-${end})... `)

    try {
      const fixes = await auditBatch(batch)
      if (fixes.length === 0) {
        console.log('✓ all correct')
      } else {
        console.log(`⚠ ${fixes.length} issue(s) found:`)
        for (const fix of fixes) {
          console.log(`    [Q${start + fix.index}] ${fix.issue}`)
          console.log(`    → Corrected answer: ${fix.correct_answer}`)
          allIssues.push({ batch: b + 1, qNum: start + fix.index, ...fix })
        }
        const fixed = await applyFixes(fixes)
        totalFixed += fixed
        totalFlagged += fixes.length
        console.log(`    Applied ${fixed}/${fixes.length} fix(es)`)
      }
    } catch (e) {
      console.log(`✗ Error: ${e.message}`)
    }
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Audit complete.`)
  console.log(`  Questions audited: ${questions.length}`)
  console.log(`  Issues found:      ${totalFlagged}`)
  console.log(`  Fixes applied:     ${totalFixed}`)
  console.log(`  Pass rate:         ${(((questions.length - totalFlagged) / questions.length) * 100).toFixed(1)}%`)

  if (allIssues.length > 0) {
    console.log(`\nAll issues:`)
    for (const issue of allIssues) {
      console.log(`  [Batch ${issue.batch}, Q${issue.qNum}] ID=${issue.id}`)
      console.log(`    ${issue.issue}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
