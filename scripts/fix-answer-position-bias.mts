/**
 * One-off remediation for QA audit issue 6: the question bank's correct-answer
 * letter is heavily skewed toward A (confirmed: ~65% A / 33% B / ~9% C across both
 * PPL and IFR, out of ~1800 questions) — a pattern a test-savvy student can exploit
 * instead of learning the material.
 *
 * For each exam_type, this assigns every eligible question a round-robin target
 * letter (A/B/C) over a pre-shuffled order — guaranteeing an even ~1/3 split rather
 * than hoping independent randomness converges there — then swaps the TEXT of the
 * current-correct and target-correct option slots so the same three answer choices
 * still exist, just repositioned, and updates correct_answer to match. Skips any
 * row with an option_d (four-option questions weren't part of the observed skew and
 * add a fourth slot this swap logic doesn't handle) and any row whose
 * distractor_rationale/common_trap explicitly names an option letter (rewriting the
 * layout would desync that explanation from the new positions) — those are left
 * untouched and reported separately rather than silently mangled.
 *
 * Run:           npx tsx scripts/fix-answer-position-bias.mts --dry-run
 * Then for real: npx tsx scripts/fix-answer-position-bias.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const DRY_RUN = process.argv.includes('--dry-run')

type Letter = 'A' | 'B' | 'C'

interface QuestionRow {
  id: string
  exam_type: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string | null
  correct_answer: string
  distractor_rationale: string | null
  common_trap: string | null
}

async function fetchAll(): Promise<QuestionRow[]> {
  const all: QuestionRow[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, exam_type, option_a, option_b, option_c, option_d, correct_answer, distractor_rationale, common_trap')
      .range(from, from + 999)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...(data as QuestionRow[]))
    if (data.length < 1000) break
    from += 1000
  }
  return all
}

function mentionsOptionLetter(text: string | null): boolean {
  if (!text) return false
  return /\b(option|answer)\s*[ABCD]\b/i.test(text)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function main() {
  const all = await fetchAll()
  console.log(`Fetched ${all.length} questions`)

  const eligible = all.filter(q =>
    !q.option_d &&
    (q.correct_answer === 'A' || q.correct_answer === 'B' || q.correct_answer === 'C') &&
    !mentionsOptionLetter(q.distractor_rationale) &&
    !mentionsOptionLetter(q.common_trap)
  )
  console.log(`Eligible for reshuffle: ${eligible.length} (skipped ${all.length - eligible.length}: 4-option or letter-referencing rationale/trap)`)

  const byExamType = new Map<string, QuestionRow[]>()
  for (const q of eligible) {
    if (!byExamType.has(q.exam_type)) byExamType.set(q.exam_type, [])
    byExamType.get(q.exam_type)!.push(q)
  }

  const letters: Letter[] = ['A', 'B', 'C']
  const updates: { id: string; option_a: string; option_b: string; option_c: string; correct_answer: Letter }[] = []

  for (const [examType, rows] of byExamType) {
    const before: Record<Letter, number> = { A: 0, B: 0, C: 0 }
    const after: Record<Letter, number> = { A: 0, B: 0, C: 0 }
    const order = shuffle(rows)
    order.forEach((q, i) => {
      const current = q.correct_answer as Letter
      before[current]++
      const target = letters[i % 3]
      after[target]++
      if (target !== current) {
        const opts: Record<Letter, string> = { A: q.option_a, B: q.option_b, C: q.option_c }
        const tmp = opts[target]
        opts[target] = opts[current]
        opts[current] = tmp
        updates.push({ id: q.id, option_a: opts.A, option_b: opts.B, option_c: opts.C, correct_answer: target })
      }
    })
    console.log(`${examType}: before A/B/C = ${before.A}/${before.B}/${before.C}  ->  after A/B/C = ${after.A}/${after.B}/${after.C}`)
  }

  console.log(`${updates.length} rows require a position swap`)
  if (DRY_RUN) {
    console.log('Dry run — no writes performed.')
    return
  }

  const CHUNK = 25
  let done = 0
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK)
    const results = await Promise.all(chunk.map(u =>
      supabase.from('questions').update({
        option_a: u.option_a,
        option_b: u.option_b,
        option_c: u.option_c,
        correct_answer: u.correct_answer,
      }).eq('id', u.id)
    ))
    const failed = results.filter(r => r.error)
    if (failed.length > 0) console.error(`  ${failed.length} update(s) failed in this chunk:`, failed[0].error)
    done += chunk.length
    if (done % 250 === 0 || done === updates.length) console.log(`  updated ${done}/${updates.length}`)
  }
  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
