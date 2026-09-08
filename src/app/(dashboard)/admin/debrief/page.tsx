import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminDebriefClient, { type FlaggedComment } from './AdminDebriefClient'

export const dynamic = 'force-dynamic'

export default async function AdminDebriefPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const admin = createAdminClient()
  const [{ data: accidents }, { data: flaggedComments }] = await Promise.all([
    admin.from('accidents').select('id,title,is_active,posted_at,ai_summary').order('created_at', { ascending: false }),
    admin.from('accident_flags').select('id,comment_id,reason,created_at,accident_comments(id,body,accident_id,is_removed)').order('created_at', { ascending: false }),
  ])

  // accident_comments is a to-one embed at runtime (comment_id -> accident_comments.id
  // is many-to-one), but supabase-js's generic inference types embedded resources as
  // arrays regardless — a cast, not a runtime concern.
  return <AdminDebriefClient accidents={accidents || []} flaggedComments={(flaggedComments || []) as unknown as FlaggedComment[]} />
}
