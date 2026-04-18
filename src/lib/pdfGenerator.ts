import jsPDF from 'jspdf'

interface CategoryStat {
  category: string
  correct: number
  total: number
  accuracy: number
}

interface MissedQuestion {
  questionText: string
  userAnswer: string
  correctAnswer: string
  explanation: string
  category: string
}

interface ExamReportData {
  userName: string
  userEmail: string
  score: number
  totalQuestions: number
  completedAt: string
  categoryStats: CategoryStat[]
  missedQuestions: MissedQuestion[]
}

export function generateExamPDF(data: ExamReportData): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 20
  const contentW = pageW - margin * 2

  const navy = [10, 36, 99] as [number, number, number]
  const sky = [62, 146, 204] as [number, number, number]
  const gold = [255, 182, 39] as [number, number, number]
  const white = [255, 255, 255] as [number, number, number]
  const lightGray = [245, 247, 252] as [number, number, number]
  const darkText = [20, 30, 60] as [number, number, number]

  const pct = Math.round((data.score / data.totalQuestions) * 100)
  const passed = pct >= 70

  // ── Header band ──
  doc.setFillColor(...navy)
  doc.rect(0, 0, pageW, 45, 'F')

  doc.setFillColor(...gold)
  doc.rect(0, 42, pageW, 3, 'F')

  doc.setTextColor(...white)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('TARMAC', margin, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('Private Pilot Exam Prep', margin, 26)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...white)
  doc.text('Practice Exam Report', margin, 37)

  // Date top-right
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(data.completedAt, pageW - margin, 37, { align: 'right' })

  let y = 55

  // ── Score card ──
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, y, contentW, 32, 4, 4, 'F')

  doc.setFillColor(...(passed ? ([34, 197, 94] as [number, number, number]) : ([239, 68, 68] as [number, number, number])))
  doc.roundedRect(margin + contentW - 44, y + 6, 40, 20, 3, 3, 'F')
  doc.setTextColor(...white)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(passed ? 'PASSED ✓' : 'FAILED ✗', margin + contentW - 24, y + 19, { align: 'center' })

  doc.setTextColor(...darkText)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text(`${data.score}/${data.totalQuestions}`, margin + 10, y + 20)

  doc.setFontSize(14)
  doc.setTextColor(...(passed ? ([34, 197, 94] as [number, number, number]) : ([239, 68, 68] as [number, number, number])))
  doc.text(`${pct}%`, margin + 52, y + 20)

  doc.setFontSize(10)
  doc.setTextColor(120, 130, 160)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.userName}  ·  ${data.userEmail}`, margin + 10, y + 28)

  y += 42

  // ── Category breakdown ──
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...navy)
  doc.text('Performance by Category', margin, y)
  y += 7

  // Table header
  doc.setFillColor(...navy)
  doc.rect(margin, y, contentW, 8, 'F')
  doc.setTextColor(...white)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Category', margin + 3, y + 5.5)
  doc.text('Correct', margin + contentW * 0.62, y + 5.5)
  doc.text('Total', margin + contentW * 0.75, y + 5.5)
  doc.text('Accuracy', margin + contentW * 0.88, y + 5.5)
  y += 8

  data.categoryStats.forEach((cat, i) => {
    const rowBg = i % 2 === 0 ? lightGray : white
    doc.setFillColor(...rowBg)
    doc.rect(margin, y, contentW, 8, 'F')

    const barColor: [number, number, number] = cat.accuracy >= 80 ? [34, 197, 94] : cat.accuracy >= 60 ? [255, 182, 39] : [239, 68, 68]
    doc.setFillColor(...barColor)
    const barW = Math.max(2, (cat.accuracy / 100) * (contentW * 0.45))
    doc.rect(margin + 3, y + 2.5, barW, 3, 'F')

    doc.setTextColor(...darkText)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(cat.category, margin + 3, y + 6.5)
    doc.text(String(cat.correct), margin + contentW * 0.62 + 4, y + 6.5, { align: 'center' })
    doc.text(String(cat.total), margin + contentW * 0.75 + 3, y + 6.5, { align: 'center' })

    doc.setTextColor(...barColor)
    doc.setFont('helvetica', 'bold')
    doc.text(`${Math.round(cat.accuracy)}%`, margin + contentW * 0.88 + 5, y + 6.5, { align: 'center' })

    y += 8
  })

  y += 8

  // ── Missed questions ──
  if (data.missedQuestions.length > 0) {
    if (y > 230) { doc.addPage(); y = 20 }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...navy)
    doc.text('Missed Questions — Review & Learn', margin, y)
    y += 8

    data.missedQuestions.forEach((mq, idx) => {
      const estimatedH = 12 + doc.splitTextToSize(mq.questionText, contentW - 6).length * 5
        + doc.splitTextToSize(mq.explanation, contentW - 6).length * 4.5 + 20

      if (y + estimatedH > 270) { doc.addPage(); y = 20 }

      // Card background
      doc.setFillColor(...lightGray)
      doc.roundedRect(margin, y, contentW, estimatedH, 3, 3, 'F')

      // Number badge
      doc.setFillColor(...sky)
      doc.circle(margin + 5, y + 5.5, 4, 'F')
      doc.setTextColor(...white)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(String(idx + 1), margin + 5, y + 7.5, { align: 'center' })

      // Category tag
      doc.setTextColor(100, 120, 160)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.text(mq.category, margin + 12, y + 7)

      y += 12

      // Question text
      doc.setTextColor(...darkText)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      const qLines = doc.splitTextToSize(mq.questionText, contentW - 6)
      doc.text(qLines, margin + 3, y)
      y += qLines.length * 5 + 2

      // Your answer / correct answer
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(239, 68, 68)
      doc.text(`Your answer: ${mq.userAnswer}`, margin + 3, y)
      y += 5
      doc.setTextColor(34, 197, 94)
      doc.text(`Correct: ${mq.correctAnswer}`, margin + 3, y)
      y += 6

      // Explanation
      doc.setFontSize(8)
      doc.setTextColor(80, 100, 140)
      const expLines = doc.splitTextToSize(mq.explanation, contentW - 6)
      doc.text(expLines, margin + 3, y)
      y += expLines.length * 4.5 + 6
    })
  }

  // ── Footer ──
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFillColor(...navy)
    doc.rect(0, 287, pageW, 10, 'F')
    doc.setTextColor(...white)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text('tarmac.study  ·  Private Pilot Exam Prep', margin, 293)
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, 293, { align: 'right' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}
