'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ExamType = 'ppl' | 'ifr'

const ExamTypeContext = createContext<{
  examType: ExamType
  setExamType: (t: ExamType) => void
}>({ examType: 'ppl', setExamType: () => {} })

export function ExamTypeProvider({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [examType, setExamTypeState] = useState<ExamType>('ppl')

  useEffect(() => {
    if (!isAdmin) {
      // Clear any stale IFR state for non-admins
      try { localStorage.removeItem('tarmac-exam-type') } catch {}
      document.cookie = 'tarmac-exam-type=ppl; path=/; max-age=31536000; SameSite=Lax'
      return
    }
    try {
      const saved = localStorage.getItem('tarmac-exam-type') as ExamType | null
      if (saved === 'ifr') {
        setExamTypeState('ifr')
        document.cookie = 'tarmac-exam-type=ifr; path=/; max-age=31536000; SameSite=Lax'
      }
    } catch {}
  }, [isAdmin])

  function setExamType(type: ExamType) {
    if (!isAdmin) return
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
