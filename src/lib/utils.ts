import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { SubscriptionStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'America/Chicago',
  }) + ' CT'
}

export function getSubscriptionLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    free: 'Free Trial',
    study_pass: 'Study Pass',
    checkride_prep: 'Checkride Prep',
    annual: 'Annual Pass',
  }
  return labels[status]
}

export function canAccessExam(status: SubscriptionStatus): boolean {
  return status !== 'free'
}

export function canAccessPractice(status: SubscriptionStatus): boolean {
  return true
}

export function hasActiveSubscription(status: SubscriptionStatus, expiresAt: string | null): boolean {
  if (status === 'free') return false
  if (!expiresAt) return false
  return new Date(expiresAt) > new Date()
}

export const EXAM_QUESTION_DISTRIBUTION: Record<string, { min: number; max: number }> = {
  'Regulations': { min: 10, max: 12 },
  'Airspace': { min: 5, max: 7 },
  'Weather Theory': { min: 8, max: 10 },
  'Weather Services': { min: 5, max: 6 },
  'Aircraft Performance': { min: 6, max: 8 },
  'Weight & Balance': { min: 4, max: 5 },
  'Aerodynamics': { min: 5, max: 6 },
  'Flight Instruments': { min: 4, max: 5 },
  'Navigation': { min: 6, max: 7 },
}
