import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function fetchAll() {
  const all: { category: string; exam_type: string; verified_at: string | null }[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('category, exam_type, verified_at')
      .range(from, from + 999)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < 1000) break
    from += 1000
  }
  return all
}

async function main() {
  const data = await fetchAll()
  const byCategory = new Map<string, { total: number; verified: number }>()
  for (const q of data ?? []) {
    const key = `${q.category} (${q.exam_type})`
    const entry = byCategory.get(key) ?? { total: 0, verified: 0 }
    entry.total++
    if (q.verified_at) entry.verified++
    byCategory.set(key, entry)
  }
  const rows = [...byCategory.entries()].sort((a, b) => (b[1].total - b[1].verified) - (a[1].total - a[1].verified))
  for (const [cat, { total, verified }] of rows) {
    console.log(`${cat}: ${verified}/${total} verified, ${total - verified} remaining`)
  }
  const totalAll = (data ?? []).length
  const verifiedAll = (data ?? []).filter(q => q.verified_at).length
  console.log(`\nTOTAL: ${verifiedAll}/${totalAll} verified, ${totalAll - verifiedAll} remaining`)
}
main()
