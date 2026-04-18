export type SubscriptionStatus = 'free' | 'study_pass' | 'checkride_prep' | 'annual'

export type QuestionCategory =
  | 'Regulations'
  | 'Airspace'
  | 'Weather Theory'
  | 'Weather Services'
  | 'Aircraft Performance'
  | 'Weight & Balance'
  | 'Aerodynamics'
  | 'Flight Instruments'
  | 'Navigation'

export type Difficulty = 'easy' | 'medium' | 'hard'
export type AnswerOption = 'A' | 'B' | 'C' | 'D'
export type SessionType = 'real_exam' | 'practice_mode'
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'

export interface User {
  id: string
  email: string
  full_name: string | null
  subscription_status: SubscriptionStatus
  subscription_expires_at: string | null
  stripe_customer_id: string | null
  is_admin: boolean
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
  created_at: string
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

export interface PricingTier {
  id: SubscriptionStatus
  name: string
  price: number
  period: string
  features: string[]
  highlighted?: boolean
  badge?: string
  stripePriceId?: string
}
