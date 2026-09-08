'use client'

import { useRef, useState } from 'react'
import { BookOpen, ChevronUp, ChevronDown, Maximize2, X, RotateCcw } from 'lucide-react'

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

// Two-finger distance, for pinch-to-zoom.
function touchDistance(touches: React.TouchList): number {
  const [a, b] = [touches[0], touches[1]]
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
}

export default function SupplementViewer({ figureRef }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [lightbox, setLightbox] = useState(false)

  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null)

  function resetZoom() {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  function openLightbox() {
    resetZoom()
    setLightbox(true)
  }

  function closeLightbox() {
    setLightbox(false)
    resetZoom()
  }

  function zoomBy(factor: number) {
    setScale(prev => {
      const next = Math.min(4, Math.max(1, prev * factor))
      if (next === 1) setOffset({ x: 0, y: 0 })
      return next
    })
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15)
  }

  function handleDoubleClick() {
    if (scale > 1) resetZoom()
    else setScale(2)
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return
    dragRef.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    setOffset({ x: dragRef.current.offsetX + dx, y: dragRef.current.offsetY + dy })
  }

  function handleMouseUp() {
    dragRef.current = null
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchRef.current = { distance: touchDistance(e.touches), scale }
    } else if (e.touches.length === 1 && scale > 1) {
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, offsetX: offset.x, offsetY: offset.y }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const ratio = touchDistance(e.touches) / pinchRef.current.distance
      setScale(Math.min(4, Math.max(1, pinchRef.current.scale * ratio)))
    } else if (e.touches.length === 1 && dragRef.current) {
      const dx = e.touches[0].clientX - dragRef.current.x
      const dy = e.touches[0].clientY - dragRef.current.y
      setOffset({ x: dragRef.current.offsetX + dx, y: dragRef.current.offsetY + dy })
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchRef.current = null
    if (e.touches.length < 1) dragRef.current = null
  }

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
                <div className="relative group rounded-lg overflow-hidden cursor-pointer" onClick={openLightbox}>
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

      {/* Lightbox — drag to pan once zoomed, scroll/pinch to zoom, double-click/tap to
          toggle 2x. Reset button and a live zoom % keep the controls discoverable
          instead of hidden gesture-only affordances. */}
      {lightbox && imgUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden touch-none"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={closeLightbox}
          onWheel={handleWheel}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
            onClick={closeLightbox}
          >
            <X className="w-7 h-7" />
          </button>

          {scale > 1 && (
            <button
              className="absolute top-4 left-4 flex items-center gap-1.5 text-white/70 hover:text-white transition-colors z-10 text-sm bg-black/40 px-3 py-1.5 rounded-lg"
              onClick={e => { e.stopPropagation(); resetZoom() }}
            >
              <RotateCcw className="w-4 h-4" /> Reset ({Math.round(scale * 100)}%)
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl}
            alt={figureKey}
            className="max-w-full max-h-full object-contain rounded-xl select-none"
            style={{
              boxShadow: '0 0 60px rgba(0,0,0,0.8)',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              cursor: scale > 1 ? 'grab' : 'zoom-in',
              transition: dragRef.current || pinchRef.current ? 'none' : 'transform 0.15s ease-out',
            }}
            onClick={e => e.stopPropagation()}
            onDoubleClick={e => { e.stopPropagation(); handleDoubleClick() }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            draggable={false}
          />
          <p className="absolute bottom-4 text-white/40 text-sm">{figureKey} · FAA-CT-8080-2H · scroll or pinch to zoom, drag to pan</p>
        </div>
      )}
    </>
  )
}
