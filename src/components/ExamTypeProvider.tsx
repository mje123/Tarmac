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
    try {
      const saved = localStorage.getItem('tarmac-exam-type') as ExamType | null
      if (saved === 'ifr') {
        setExamTypeState('ifr')
        document.cookie = 'tarmac-exam-type=ifr; path=/; max-age=31536000; SameSite=Lax'
      }
    } catch {}
  }, [])

  function setExamType(type: ExamType) {
    setExamTypeState(type)
    try {
      localStorage.setItem('tarmac-exam-type', type)
      document.cookie = `tarmac-exam-type=${type}; path=/; max-age=31536000; SameSite=Lax`
    } catch {}
    // Reload so server components re-render with the new exam type
    window.location.reload()
  }

  return (
    <ExamTypeContext.Provider value={{ examType, setExamType }}>
      {children}
    </ExamTypeContext.Provider>
  )
}

export const useExamType = () => useContext(ExamTypeContext)
