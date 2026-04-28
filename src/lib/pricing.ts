// ─── Pricing mode ────────────────────────────────────────────────────────────
// Switch between 'beta' and 'full' by changing this one line.
export const PRICING_MODE: 'beta' | 'full' = 'beta'

// ─── Beta pricing ─────────────────────────────────────────────────────────────
// 7-day free trial, then $15/mo
export const BETA_PLAN = {
  id: 'beta_monthly',
  name: 'Full Access',
  price: '$14.99',
  period: '/mo',
  trialDays: 7,
  tagline: 'Free for 7 days, then $14.99/mo. Cancel anytime.',
  features: [
    'All 1,400+ FAA questions — unlimited practice',
    'AI tutor explains every wrong answer',
    'Full 60-question timed practice exams',
    'Real-time progress across all 9 knowledge areas',
    '7-day free trial — cancel before you\'re charged',
  ],
  stripePlanKey: 'beta_monthly',
}

// ─── Full pricing (legacy — switch PRICING_MODE back to restore) ──────────────
export const FULL_PLANS = [
  {
    id: 'quick_prep',
    name: 'Quick Prep',
    price: '$69',
    period: 'one-time',
    duration: '60-day access',
    features: ['All 1,400+ questions', 'AI tutor on every question', 'Progress by knowledge area', 'Timed practice exams'],
    highlighted: false,
  },
  {
    id: 'study_pass',
    name: 'Tarmac Membership',
    price: '$89',
    period: 'one-time',
    duration: '90 days · Half the cost of failing',
    features: ['All 1,400+ questions', 'AI tutor — unlimited follow-ups', 'Progress by knowledge area', 'Unlimited timed exams', 'FAA supplement figures'],
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    id: 'founding_member',
    name: 'Founding Member',
    price: '$199',
    period: 'one-time',
    duration: 'Lifetime access',
    features: ['Everything in Tarmac Membership', 'Lifetime access', 'Future ratings included†', 'Price locks in now'],
    highlighted: false,
    note: 'Increases to $299 at Instrument launch.',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$44.99',
    period: '/mo',
    duration: 'Cancel anytime',
    features: ['All 1,400+ questions', 'AI tutor on every question', 'Progress by knowledge area', 'Timed practice exams'],
    highlighted: false,
  },
]

// ─── Helper ───────────────────────────────────────────────────────────────────
export const isBeta = PRICING_MODE === 'beta'
