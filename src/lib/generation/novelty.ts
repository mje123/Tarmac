// Structural novelty check. A question can be textually different but functionally
// identical (same numbers swapped, same sentence shape) — this rejects that case so
// students see meaningfully different presentations of a concept, not superficial
// variation.

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or',
  'what', 'which', 'you', 'your', 'this', 'that', 'with', 'as', 'be', 'if', 'it',
])

/** Normalizes question text into a bag of significant words, stripping numbers so
 *  "8,000 feet and 30°C" and "7,000 feet and 25°C" collapse to the same shape —
 *  which is exactly the superficial-variation case we want to catch. */
function significantWords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[0-9]+([.,][0-9]+)?/g, '') // strip numbers — same shape, different values shouldn't count as novel
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
  return new Set(words)
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  let intersection = 0
  for (const w of a) if (b.has(w)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 1 : intersection / union
}

export interface NoveltyCheckInput {
  conceptId: string
  scenarioType: string
  questionText: string
  correctAnswerPosition: 'A' | 'B' | 'C' | 'D'
  recentQuestions: { concept_id: string | null; scenario_type: string | null; question_text: string; correct_answer: string }[]
}

/** Similarity threshold above which a question is considered a near-duplicate wording
 *  of something the student has already seen for this concept. */
const SIMILARITY_REJECT_THRESHOLD = 0.6

export interface NoveltyResult {
  novel: boolean
  maxSimilarity: number
  noveltyKey: string
}

export function checkNovelty(input: NoveltyCheckInput): NoveltyResult {
  const candidateWords = significantWords(input.questionText)
  // recentQuestions is expected to already be scoped to this concept by the caller
  // (index.ts fetches recent rows filtered by the concept's real DB id) — only the
  // archetype/scenario_type match is checked here.
  const sameArchetype = input.recentQuestions.filter(q => q.scenario_type === input.scenarioType)

  let maxSimilarity = 0
  for (const q of sameArchetype) {
    const sim = jaccardSimilarity(candidateWords, significantWords(q.question_text))
    if (sim > maxSimilarity) maxSimilarity = sim
  }

  const noveltyKey = `${input.conceptId}:${input.scenarioType}:${[...candidateWords].sort().join(',')}`

  return {
    novel: maxSimilarity < SIMILARITY_REJECT_THRESHOLD,
    maxSimilarity,
    noveltyKey,
  }
}
