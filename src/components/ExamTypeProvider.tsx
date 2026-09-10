'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ExamType = 'ppl' | 'ifr'

const ExamTypeContext = createContext<{
  examType: ExamType
  setExamType: (t: ExamType) => void
}>({ examType: 'ppl', setExamType: () => {} })

export function ExamTypeProvider({ children }: { children: React.ReactNode }) {
  const [examType, setExamTypeState] = useState<ExamType>('ppl')

  useEffect(() => {
    let saved: ExamType | null = null
    try {
      const raw = localStorage.getItem('tarmac-exam-type') as ExamType | null
      if (raw === 'ppl' || raw === 'ifr') saved = raw
    } catch {}

    if (saved) {
      setExamTypeState(saved)
      try { document.cookie = `tarmac-exam-type=${saved}; path=/; max-age=31536000; SameSite=Lax` } catch {}
      return
    }

    // No local record of the user's choice (new device, cleared storage, incognito) —
    // this used to silently stay on the 'ppl' default forever regardless of the
    // account's real preference. Ask the server for the truth instead; a 401 here just
    // means an anonymous visitor, which is a fine no-op.
    fetch('/api/user/exam-type')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.examType === 'ppl' || data?.examType === 'ifr') {
          setExamTypeState(data.examType)
          try {
            localStorage.setItem('tarmac-exam-type', data.examType)
            document.cookie = `tarmac-exam-type=${data.examType}; path=/; max-age=31536000; SameSite=Lax`
          } catch {}
        }
      })
      .catch(() => {})
  }, [])

  function setExamType(type: ExamType) {
    setExamTypeState(type)
    try {
      localStorage.setItem('tarmac-exam-type', type)
      document.cookie = `tarmac-exam-type=${type}; path=/; max-age=31536000; SameSite=Lax`
    } catch {}
    window.location.reload()
  }

  return (
    <ExamTypeContext.Provider value={{ examType, setExamType }}>
      {children}
    </ExamTypeContext.Provider>
  )
}

export const useExamType = () => useContext(ExamTypeContext)
