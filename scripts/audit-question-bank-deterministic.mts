/**
 * Content audit — Phase 2 (complete inventory) + Phase 3 (100%-coverage deterministic
 * checks) across every row in `questions`. This is the mechanical pass: things a
 * script can verify with certainty, with zero sampling. It does NOT verify factual
 * correctness against FAA source material — that's Phase 4, and requires actual
 * subject-matter judgment per question, which this script does not attempt and does
 * not claim to have done.
 *
 * Run: npx tsx scripts/audit-question-bank-deterministic.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { CONCEPTS } from '../src/lib/generation/concepts'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface QRow {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string | null
  correct_answer: string
  category: string
  explanation: string
  reference: string | null
  exam_type: string
  concept_id: string | null
  validation_status: string
}

async function fetchAll(): Promise<QRow[]> {
  const all: QRow[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, category, explanation, reference, exam_type, concept_id, validation_status')
      .range(from, from + 999)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...(data as QRow[]))
    if (data.length < 1000) break
    from += 1000
  }
  return all
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

async function main() {
  const all = await fetchAll()

  console.log('=== PHASE 2: INVENTORY ===')
  console.log(`TOTAL QUESTIONS: ${all.length}`)
  const byExam = new Map<string, number>()
  const byCategory = new Map<string, number>()
  const byStatus = new Map<string, number>()
  let withConcept = 0
  for (const q of all) {
    byExam.set(q.exam_type, (byExam.get(q.exam_type) ?? 0) + 1)
    byCategory.set(q.category, (byCategory.get(q.category) ?? 0) + 1)
    byStatus.set(q.validation_status, (byStatus.get(q.validation_status) ?? 0) + 1)
    if (q.concept_id) withConcept++
  }
  console.log('By exam:', Object.fromEntries(byExam))
  console.log('By validation_status:', Object.fromEntries(byStatus))
  console.log(`Concept-mapped (has ACS area/task via concepts.ts): ${withConcept} / ${all.length}`)
  console.log(`No ACS mapping (legacy, category-only): ${all.length - withConcept} / ${all.length}`)
  console.log('By category:')
  for (const [cat, count] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${cat}: ${count}`)

  console.log('\n=== PHASE 3: DETERMINISTIC CHECKS (100% coverage, no sampling) ===')

  // 1. Missing/malformed core fields
  const emptyStem = all.filter(q => !q.question_text || q.question_text.trim().length < 10)
  const emptyOptionA = all.filter(q => !q.option_a || !q.option_a.trim())
  const emptyOptionB = all.filter(q => !q.option_b || !q.option_b.trim())
  const emptyOptionC = all.filter(q => !q.option_c || !q.option_c.trim())
  const emptyExplanation = all.filter(q => !q.explanation || q.explanation.trim().length < 15)
  const missingReference = all.filter(q => !q.reference || !q.reference.trim())
  console.log(`Empty/too-short question stem: ${emptyStem.length}`)
  console.log(`Empty option A: ${emptyOptionA.length} | B: ${emptyOptionB.length} | C: ${emptyOptionC.length}`)
  console.log(`Empty/too-short explanation: ${emptyExplanation.length}`)
  console.log(`Missing source reference: ${missingReference.length}`)

  // 2. Invalid answer keys
  const invalidLetter = all.filter(q => !['A', 'B', 'C', 'D'].includes(q.correct_answer))
  const answerPointsToEmptyOption = all.filter(q => {
    const opt = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }[q.correct_answer as 'A' | 'B' | 'C' | 'D']
    return !opt || !opt.trim()
  })
  console.log(`correct_answer not in A/B/C/D: ${invalidLetter.length}`)
  console.log(`correct_answer points at an empty/missing option: ${answerPointsToEmptyOption.length}`)
  for (const q of answerPointsToEmptyOption) console.log(`  ${q.id}  [${q.category}]  correct_answer=${q.correct_answer}  "${q.question_text.slice(0, 70)}"`)

  // 3. Duplicate detection — exact text match, and near-duplicate via normalized text
  const byExactText = new Map<string, QRow[]>()
  for (const q of all) {
    const key = q.question_text.trim()
    if (!byExactText.has(key)) byExactText.set(key, [])
    byExactText.get(key)!.push(q)
  }
  const exactDuplicateGroups = [...byExactText.values()].filter(g => g.length > 1)
  console.log(`\nExact-duplicate question_text groups: ${exactDuplicateGroups.length} (${exactDuplicateGroups.reduce((s, g) => s + g.length, 0)} rows involved)`)
  for (const g of exactDuplicateGroups.slice(0, 20)) console.log(`  DUP (${g.length}x): ${g.map(q => q.id).join(', ')}  "${g[0].question_text.slice(0, 70)}"`)

  const byNormalized = new Map<string, QRow[]>()
  for (const q of all) {
    const key = normalize(q.question_text)
    if (!byNormalized.has(key)) byNormalized.set(key, [])
    byNormalized.get(key)!.push(q)
  }
  const nearDuplicateGroups = [...byNormalized.values()].filter(g => g.length > 1)
  console.log(`Near-duplicate groups (normalized, ignoring punctuation/case): ${nearDuplicateGroups.length} (${nearDuplicateGroups.reduce((s, g) => s + g.length, 0)} rows involved)`)

  // 4. Deterministic recalculation for concept-linked numeric questions (the only
  //    rows where we have a real, callable compute() function to check against).
  const conceptsWithNumeric = Object.values(CONCEPTS).filter(c => c.numeric)
  console.log(`\nConcepts with a deterministic numeric compute() function: ${conceptsWithNumeric.length} / ${Object.keys(CONCEPTS).length}`)
  console.log('(Full numeric re-derivation requires parsing each question\'s specific input values out of its prose, which the current schema does not store structurally for legacy rows — flagged as a Phase 4 item, not fabricated here.)')

  // 5. Answer/explanation consistency heuristic — explanation should at least
  //    reference language distinguishing it from a generic non-answer.
  const suspiciouslyGenericExplanation = all.filter(q =>
    /^(the answer is|correct|this is correct)\.?$/i.test(q.explanation.trim())
  )
  console.log(`\nSuspiciously generic/non-explanatory explanation text: ${suspiciouslyGenericExplanation.length}`)

  console.log('\n=== SUMMARY ===')
  console.log(`Total: ${all.length}`)
  console.log(`Structural issues found: ${emptyStem.length + emptyOptionA.length + emptyOptionB.length + emptyOptionC.length + emptyExplanation.length + invalidLetter.length + answerPointsToEmptyOption.length}`)
  console.log(`Missing reference: ${missingReference.length}`)
  console.log(`Exact duplicate groups: ${exactDuplicateGroups.length}`)
  console.log(`Near-duplicate groups: ${nearDuplicateGroups.length}`)
  console.log(`Not yet individually source-verified (Phase 4 remaining): ${all.filter(q => q.validation_status === 'legacy').length}`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
