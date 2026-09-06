'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, MessageSquare } from 'lucide-react'

interface ArchiveAccident {
  id: string
  title: string
  phase_of_flight: string | null
  aircraft_type: string | null
  region: string | null
  year: number | null
  posted_at: string | null
}

export default function DebriefArchivePage() {
  const [accidents, setAccidents] = useState<ArchiveAccident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('accidents').select('id,title,phase_of_flight,aircraft_type,region,year,posted_at')
      .not('posted_at', 'is', null)
      .order('posted_at', { ascending: false })
      .then(({ data }) => { setAccidents(data || []); setLoading(false) })
  }, [])

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/debrief" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Debrief Archive</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-ter)' }}>Past accident scenarios</p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--surface-1)' }} />
          ))}
        </div>
      )}

      {!loading && accidents.length === 0 && (
        <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--border-2)' }}>
          <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-ter)' }} />
          <p className="text-sm" style={{ color: 'var(--text-ter)' }}>No archived scenarios yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {accidents.map(a => (
          <Link key={a.id} href={`/debrief/${a.id}`}
            className="block rounded-xl p-4 transition-all hover:border-white/15"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)' }}>
            <h3 className="text-sm font-semibold text-white mb-1">{a.title}</h3>
            <div className="flex flex-wrap gap-x-3 text-xs" style={{ color: 'var(--text-ter)' }}>
              {a.phase_of_flight && <span>{a.phase_of_flight}</span>}
              {a.aircraft_type && <span>· {a.aircraft_type}</span>}
              {a.region && <span>· {a.region}</span>}
              {a.year && <span>· {a.year}</span>}
              {a.posted_at && <span>· {new Date(a.posted_at).toLocaleDateString()}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
