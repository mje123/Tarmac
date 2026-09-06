export type SubscriptionStatus =
  | 'free'
  | 'tarmac_member'
  | 'trialing'
  // Legacy statuses — grandfathered users keep full access
  | 'study_pass'
  | 'checkride_prep'
  | 'annual'

export type PPLCategory =
  | 'Regulations'
  | 'Airspace'
  | 'Weather Theory'
  | 'Weather Services'
  | 'Aircraft Performance'
  | 'Weight & Balance'
  | 'Aerodynamics'
  | 'Flight Instruments'
  | 'Navigation'

export type IFRCategory =
  | 'IFR Regulations'
  | 'Instrument Navigation'
  | 'Instrument Approaches'
  | 'IFR Weather'
  | 'IFR En Route'
  | 'ATC & Communications'
  | 'Instrument Systems'
  | 'Departure & Arrivals'
  | 'IFR Emergency Operations'

export type QuestionCategory = PPLCategory | IFRCategory

export type ExamType = 'ppl' | 'ifr'

export type Difficulty = 'easy' | 'medium' | 'hard'
export type AnswerOption = 'A' | 'B' | 'C' | 'D'
export type SessionType = 'real_exam' | 'practice_mode'
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'

export interface OnboardingData {
  exam_type?: ExamType
  test_date?: string
  studied_before?: 'yes' | 'no'
  taken_faa_written_before?: 'yes' | 'no'
  confidence_level?: 'nervous' | 'unsure' | 'somewhat_confident' | 'very_confident'
  minutes_per_day?: '10' | '20' | '30' | '45' | '60'
  referral_source?: string
  recommended_plan?: string
  // legacy fields — kept so existing users' stored onboarding data still reads
  training_stage?: string
  primary_goal?: string
  biggest_worry?: string
  community_interest?: string
  learning_style?: 'detailed_explanations' | 'learning_by_doing' | 'need_structure' | 'mixed' | 'skipped'
  test_timeline?: string
  previous_tools?: string
}

export interface User {
  id: string
  email: string
  full_name: string | null
  callsign: string | null
  callsign_set_at: string | null
  debrief_anonymous: boolean
  is_cfi: boolean
  cfi_verified: boolean
  avatar_url: string | null
  subscription_status: SubscriptionStatus
  subscription_expires_at: string | null
  stripe_customer_id: string | null
  is_admin: boolean
  onboarding_data?: OnboardingData | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string | null
  correct_answer: AnswerOption
  category: QuestionCategory
  difficulty: Difficulty
  explanation: string
  reference: string | null
  exam_type?: ExamType
  created_at: string
  // Validated concept-generation pipeline fields (src/lib/generation) — null/undefined
  // on legacy bank rows that predate the concept layer.
  concept_id?: string | null
  archetype_id?: string | null
  cognitive_level?: string | null
  scenario_type?: string | null
  distractor_rationale?: string | null
  common_trap?: string | null
  validation_status?: 'legacy' | 'pending' | 'approved' | 'rejected'
  novelty_key?: string | null
}

export interface TestSession {
  id: string
  user_id: string
  session_type: SessionType
  started_at: string
  completed_at: string | null
  time_remaining_seconds: number | null
  score: number | null
  total_questions: number
  status: SessionStatus
}

export interface TestAnswer {
  id: string
  session_id: string
  question_id: string
  user_answer: AnswerOption | null
  is_correct: boolean | null
  is_marked_for_review: boolean
  answered_at: string | null
  ai_explanation_requested: boolean
  question?: Question
}

export interface UserProgress {
  id: string
  user_id: string
  category: QuestionCategory
  questions_attempted: number
  questions_correct: number
  accuracy_percentage: number
  last_practiced: string
  updated_at: string
}

export interface AIConversation {
  id: string
  user_id: string
  question_id: string | null
  session_id: string | null
  messages: AIMessage[]
  created_at: string
  updated_at: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

// All paid statuses (new + legacy grandfathered)
export const PAID_STATUSES: SubscriptionStatus[] = [
  'tarmac_member', 'trialing', 'study_pass', 'checkride_prep', 'annual'
]

export function isPaidUser(status: SubscriptionStatus, expires: string | null): boolean {
  if (!PAID_STATUSES.includes(status)) return false
  if (!expires) return true
  return new Date(expires) > new Date()
}
