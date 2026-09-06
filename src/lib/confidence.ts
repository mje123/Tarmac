// Shared confidence-capture options for practice/quiz flows. Values match the
// ConfidenceLevel union in spacedRepetition.ts and the test_answers.confidence CHECK
// constraint — keep all three in sync if this ever changes.
export type ConfidenceLevel = 'very_confident' | 'somewhat_confident' | 'unsure' | 'guessing'

export const CONFIDENCE_OPTIONS: { value: ConfidenceLevel; label: string }[] = [
  { value: 'very_confident', label: 'Very confident' },
  { value: 'somewhat_confident', label: 'Somewhat confident' },
  { value: 'unsure', label: 'Unsure' },
  { value: 'guessing', label: 'Guessing' },
]
