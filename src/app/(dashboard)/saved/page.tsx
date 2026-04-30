import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Question } from '@/types'
import { Bookmark, BookmarkX } from 'lucide-react'
import SavedQuestionCard from '@/components/ui/SavedQuestionCard'

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('saved_questions')
    .select('question_id, saved_at, questions(*)')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  const saved = (data || []) as unknown as Array<{ question_id: string; saved_at: string; questions: Question }>

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,182,39,0.15)', border: '1px solid rgba(255,182,39,0.2)' }}>
          <Bookmark className="w-6 h-6 text-[#FFB627]" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Saved Questions</h1>
          <p className="text-white/45 text-sm mt-0.5">{saved.length} question{saved.length !== 1 ? 's' : ''} saved for review</p>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookmarkX className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No saved questions yet.</p>
          <p className="text-white/25 text-sm mt-1">Bookmark questions during practice or exams to review them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {saved.map(({ question_id, questions: q }) => (
            <SavedQuestionCard key={question_id} question={q} />
          ))}
        </div>
      )}
    </div>
  )
}
