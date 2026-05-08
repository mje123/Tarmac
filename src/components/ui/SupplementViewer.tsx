'use client'

import { useState } from 'react'
import { BookOpen, ChevronUp, ChevronDown, Maximize2, X } from 'lucide-react'

const SUPABASE_URL = 'https://vdbrfhuzyffipcjifaui.supabase.co/storage/v1/object/public/public/figures'

const FIGURE_IMAGES: Record<string, string> = {
  'Legend 1': 'legend-1',
  'Figure 1':  'figure-1',
  'Figure 2':  'figure-2',
  'Figure 3':  'figure-3',
  'Figure 4':  'figure-4',
  'Figure 8':  'figure-8',
  'Figure 12': 'figure-12',
  'Figure 13': 'figure-13',
  'Figure 14': 'figure-14',
  'Figure 15': 'figure-15',
  'Figure 17': 'figure-17',
  'Figure 20': 'figure-20',
  'Figure 25': 'figure-25',
  'Figure 26': 'figure-26',
  'Figure 32': 'figure-32',
  'Figure 33': 'figure-33',
  'Figure 35': 'figure-35',
  'Figure 38': 'figure-38',
  'Figure 47': 'figure-47',
  'Figure 48': 'figure-48',
  'Figure 52': 'figure-52',
  'Figure 60': 'figure-60',
  'Figure 64': 'figure-64',
  'Figure 78': 'figure-78',
}

function parseFigureKey(ref: string): string {
  const match = ref.match(/(Figures?|Legend)\s+\d+/i)
  if (!match) return ref
  return match[0].replace(/\s+/g, ' ').replace(/^Figures\s/i, 'Figure ').trim()
}

interface Props {
  figureRef: string
}

export default function SupplementViewer({ figureRef }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [lightbox, setLightbox] = useState(false)

  const figureKey = parseFigureKey(figureRef)
  const slug = FIGURE_IMAGES[figureKey]
  const imgUrl = slug ? `${SUPABASE_URL}/${slug}.png` : null

  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,182,39,0.3)', background: 'rgba(255,182,39,0.05)' }}>
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          style={{ background: 'rgba(255,182,39,0.1)' }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#FFB627]" />
            <span className="text-sm font-semibold text-[#FFB627]">Supplement Required</span>
            <span className="text-xs text-white/60 ml-1">FAA-CT-8080-2H · {figureKey}</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
        </button>

        {expanded && (
          <div className="p-3">
            {imgUrl ? (
              <>
                <div className="relative group rounded-lg overflow-hidden cursor-pointer" onClick={() => setLightbox(true)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={figureKey}
                    className="w-full object-contain rounded-lg"
                    style={{ background: '#fff', maxHeight: '480px' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.35)' }}>
                    <div className="flex items-center gap-2 bg-black/60 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                      <Maximize2 className="w-4 h-4" /> Tap to enlarge
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white/30 mt-2 text-center">Tap image to enlarge · {figureKey}</p>
              </>
            ) : (
              <p className="text-xs text-white/50 text-center py-4">Image not available for {figureKey}</p>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && imgUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setLightbox(false)}
          >
            <X className="w-7 h-7" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl}
            alt={figureKey}
            className="max-w-full max-h-full object-contain rounded-xl"
            style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/40 text-sm">{figureKey} · FAA-CT-8080-2H</p>
        </div>
      )}
    </>
  )
}
