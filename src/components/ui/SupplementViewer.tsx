'use client'

import { useState } from 'react'
import { BookOpen, ExternalLink, X, ChevronUp, ChevronDown } from 'lucide-react'

// Maps figure/legend labels to PDF page numbers (FAA-CT-8080-2H)
// Appendix 1 (Legends) starts around page 5; Appendix 2 (Figures) around page 25
const FIGURE_PAGES: Record<string, number> = {
  'Legend 1': 5,   'Legend 2': 6,   'Legend 3': 7,   'Legend 4': 8,
  'Legend 5': 9,   'Legend 6': 10,  'Legend 7': 11,  'Legend 8': 12,
  'Legend 9': 13,  'Legend 10': 14, 'Legend 11': 15, 'Legend 12': 16,
  'Legend 13': 17, 'Legend 14': 18, 'Legend 15': 19, 'Legend 16': 20,
  'Legend 17': 21, 'Legend 18': 22, 'Legend 19': 23,
  'Figure 1': 28,  'Figure 2': 29,  'Figure 3': 30,  'Figure 4': 31,
  'Figure 5': 32,  'Figure 6': 33,  'Figure 7': 34,  'Figure 8': 35,
  'Figure 9': 36,  'Figure 10': 37, 'Figure 11': 38, 'Figure 12': 39,
  'Figure 13': 40, 'Figure 14': 41, 'Figure 15': 42, 'Figure 16': 43,
  'Figure 17': 44, 'Figure 18': 45, 'Figure 19': 46, 'Figure 20': 47,
  'Figure 21': 48, 'Figure 22': 49, 'Figure 23': 50, 'Figure 24': 51,
  'Figure 25': 52, 'Figure 26': 53, 'Figure 27': 54, 'Figure 28': 55,
  'Figure 29': 56, 'Figure 30': 60, 'Figure 31': 62,
  'Figure 32': 63, 'Figure 33': 64, 'Figure 34': 65, 'Figure 35': 66,
  'Figure 36': 67, 'Figure 37': 68, 'Figure 38': 69,
  'Figure 47': 79, 'Figure 48': 80,
  'Figure 52': 85, 'Figure 53': 86,
  'Figure 64': 97, 'Figure 65': 98, 'Figure 66': 99, 'Figure 67': 100,
  'Figure 78': 112,
}

function parseFigureKey(ref: string): string {
  // Extract "Figure 12" or "Legend 1" from strings like "FAA-CT-8080-2H, Figure 12"
  const match = ref.match(/(Figure|Legend)\s+\d+/i)
  return match ? match[0] : ref
}

interface Props {
  figureRef: string // e.g. "FAA-CT-8080-2H, Figure 12" or "Figure 12"
}

export default function SupplementViewer({ figureRef }: Props) {
  const [expanded, setExpanded] = useState(true)
  const figureKey = parseFigureKey(figureRef)
  const page = FIGURE_PAGES[figureKey]
  const baseUrl = process.env.NEXT_PUBLIC_SUPPLEMENT_URL || 'https://vdbrfhuzyffipcjifaui.supabase.co/storage/v1/object/public/public/supplement.pdf'
  const pdfUrl = `${baseUrl}${page ? `#page=${page}` : ''}`

  return (
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/50">Refer to <strong className="text-white/80">{figureKey}</strong> when answering this question.</p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#3E92CC] hover:text-[#5aabdf] transition-colors"
            >
              Open full screen <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Inline PDF viewer */}
          <div className="rounded-lg overflow-hidden" style={{ height: '420px', background: '#1a1a2e' }}>
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title={`FAA Supplement - ${figureKey}`}
            />
          </div>

          <p className="text-xs text-white/30 mt-2 text-center">
            Scroll to {figureKey} · Pinch or use browser zoom to enlarge
          </p>
        </div>
      )}
    </div>
  )
}
