'use client'

import { useState } from 'react'
import { BookOpen, ExternalLink, X, ChevronUp, ChevronDown } from 'lucide-react'

// Maps figure/legend labels to PDF page numbers (FAA-CT-8080-2H)
// Appendix 1 (Legends) starts around page 5; Appendix 2 (Figures) around page 25
// Page numbers verified against FAA-CT-8080-2H PDF (113 pages total)
// Figure 1 is at PDF page 35; all pages shifted +7 from original mapping
const FIGURE_PAGES: Record<string, number> = {
  'Legend 1': 12,  'Legend 2': 13,  'Legend 3': 14,  'Legend 4': 15,
  'Legend 5': 16,  'Legend 6': 17,  'Legend 7': 18,  'Legend 8': 19,
  'Legend 9': 20,  'Legend 10': 21, 'Legend 11': 22, 'Legend 12': 23,
  'Legend 13': 24, 'Legend 14': 25, 'Legend 15': 26, 'Legend 16': 27,
  'Legend 17': 28, 'Legend 18': 29, 'Legend 19': 30,
  'Figure 1': 35,  'Figure 2': 36,  'Figure 3': 37,  'Figure 4': 38,
  'Figure 5': 39,  'Figure 6': 40,  'Figure 7': 41,  'Figure 8': 42,
  'Figure 9': 43,  'Figure 10': 44, 'Figure 11': 45, 'Figure 12': 46,
  'Figure 13': 47, 'Figure 14': 48, 'Figure 15': 49, 'Figure 16': 50,
  'Figure 17': 51, 'Figure 18': 52, 'Figure 19': 53, 'Figure 20': 54,
  'Figure 21': 55, 'Figure 22': 56, 'Figure 23': 57, 'Figure 24': 58,
  'Figure 25': 59, 'Figure 26': 60, 'Figure 27': 61, 'Figure 28': 62,
  'Figure 29': 63, 'Figure 30': 67, 'Figure 31': 69,
  'Figure 32': 70, 'Figure 33': 71, 'Figure 34': 72, 'Figure 35': 73,
  'Figure 36': 74, 'Figure 37': 75, 'Figure 38': 76,
  'Figure 47': 86, 'Figure 48': 87,
  'Figure 52': 92, 'Figure 53': 93,
  'Figure 64': 104, 'Figure 65': 105, 'Figure 66': 106, 'Figure 67': 107,
  'Figure 78': 113,
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
