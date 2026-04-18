const KEY = 'tarmac_ai_msgs_used'
export const AI_MSG_LIMIT = 5

export function getAIMsgsUsed(): number {
  try { return parseInt(localStorage.getItem(KEY) || '0', 10) } catch { return 0 }
}

export function incrementAIMsgs(): number {
  const next = getAIMsgsUsed() + 1
  try { localStorage.setItem(KEY, String(next)) } catch {}
  return next
}

export function isAILimitReached(): boolean {
  return getAIMsgsUsed() >= AI_MSG_LIMIT
}
