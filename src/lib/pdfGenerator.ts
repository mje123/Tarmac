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
  const margin = 18
  const contentW = pageW - margin * 2

  const navy   = [10, 36, 99]   as [number, number, number]
  const sky    = [62, 146, 204] as [number, number, number]
  const gold   = [255, 182, 39] as [number, number, number]
  const white  = [255, 255, 255] as [number, number, number]
  const lightGray = [247, 249, 253] as [number, number, number]
  const midGray   = [230, 235, 245] as [number, number, number]
  const darkText  = [15, 25, 55]  as [number, number, number]
  const green  = [22, 163, 74]  as [number, number, number]
  const red    = [220, 38, 38]  as [number, number, number]
  const amber  = [217, 119, 6]  as [number, number, number]

  const pct    = Math.round((data.score / data.totalQuestions) * 100)
  const passed = pct >= 70

  // ── Page 1 header ──────────────────────────────────────────────────────────
  doc.setFillColor(...navy)
  doc.rect(0, 0, pageW, 48, 'F')
  doc.setFillColor(...gold)
  doc.rect(0, 45, pageW, 3, 'F')

  // Logo area
  doc.setFillColor(...gold)
  doc.roundedRect(margin, 10, 10, 10, 2, 2, 'F')
  doc.setTextColor(...navy)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('FLY', margin + 5, 16.5, { align: 'center' })

  doc.setTextColor(...white)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('TARMAC', margin + 14, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 200, 240)
  doc.text('Private Pilot Exam Prep', margin + 14, 24)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...white)
  doc.text('Practice Exam Report', margin, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(180, 200, 240)
  doc.text(data.completedAt, pageW - margin, 38, { align: 'right' })

  let y = 58

  // ── Score card ─────────────────────────────────────────────────────────────
  const cardH = 38
  doc.setFillColor(...(passed ? ([5, 46, 22] as [number, number, number]) : ([45, 10, 10] as [number, number, number])))
  doc.roundedRect(margin, y, contentW, cardH, 5, 5, 'F')

  // Left: big score
  doc.setTextColor(...white)
  doc.setFontSize(34)
  doc.setFont('helvetica', 'bold')
  doc.text(`${data.score}`, margin + 10, y + 22)
  const scoreW = doc.getTextWidth(`${data.score}`)
  doc.setFontSize(18)
  doc.setTextColor(200, 210, 230)
  doc.text(`/${data.totalQuestions}`, margin + 10 + scoreW + 1, y + 22)

  // Pct
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...(passed ? ([52, 211, 153] as [number, number, number]) : ([248, 113, 113] as [number, number, number])))
  doc.text(`${pct}%`, margin + 52, y + 22)

  // User info
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(160, 180, 220)
  doc.text(`${data.userName}  |  ${data.userEmail}`, margin + 10, y + 32)

  // Pass/fail badge (right side)
  const badgeColor: [number, number, number] = passed ? green : red
  doc.setFillColor(...badgeColor)
  doc.roundedRect(pageW - margin - 42, y + 9, 38, 14, 3, 3, 'F')
  doc.setTextColor(...white)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(passed ? 'PASSED' : 'FAILED', pageW - margin - 23, y + 18.5, { align: 'center' })

  y += cardH + 12

  // ── Category breakdown ──────────────────────────────────────────────────────
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...navy)
  doc.text('Performance by Category', margin, y)
  y += 6

  // Column layout: Category | [bar] | Correct | Total | Accuracy
  const colCat   = margin
  const colBar   = margin + 72
  const colBarW  = 38
  const colCorr  = colBar + colBarW + 8
  const colTotal = colCorr + 16
  const colAcc   = pageW - margin

  // Header row
  doc.setFillColor(...navy)
  doc.rect(margin, y, contentW, 8, 'F')
  doc.setTextColor(...white)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Category',  colCat + 2,  y + 5.5)
  doc.text('Progress',  colBar + colBarW / 2, y + 5.5, { align: 'center' })
  doc.text('Correct',   colCorr + 4, y + 5.5, { align: 'center' })
  doc.text('Total',     colTotal + 4, y + 5.5, { align: 'center' })
  doc.text('Score',     colAcc - 2,  y + 5.5, { align: 'right' })
  y += 8

  data.categoryStats.forEach((cat, i) => {
    const rowH = 9
    const rowBg: [number, number, number] = i % 2 === 0 ? lightGray : white
    doc.setFillColor(...rowBg)
    doc.rect(margin, y, contentW, rowH, 'F')

    // Category name
    doc.setTextColor(...darkText)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.text(cat.category, colCat + 2, y + 6)

    // Progress bar background
    doc.setFillColor(...midGray)
    doc.roundedRect(colBar, y + 2.5, colBarW, 4, 1, 1, 'F')

    // Progress bar fill
    const barColor: [number, number, number] = cat.accuracy >= 80 ? green : cat.accuracy >= 50 ? amber : red
    const fillW = Math.max(0, (cat.accuracy / 100) * colBarW)
    if (fillW > 0) {
      doc.setFillColor(...barColor)
      doc.roundedRect(colBar, y + 2.5, fillW, 4, 1, 1, 'F')
    }

    // Numbers
    doc.setTextColor(...darkText)
    doc.setFontSize(8.5)
    doc.text(String(cat.correct), colCorr + 4, y + 6, { align: 'center' })
    doc.text(String(cat.total),   colTotal + 4, y + 6, { align: 'center' })

    // Accuracy %
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...barColor)
    doc.text(`${Math.round(cat.accuracy)}%`, colAcc - 2, y + 6, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    y += rowH
  })

  y += 10

  // ── Missed questions ────────────────────────────────────────────────────────
  if (data.missedQuestions.length === 0) {
    if (y > 240) { doc.addPage(); y = 24 }
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, y, contentW, 16, 4, 4, 'F')
    doc.setTextColor(...navy)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('No missed questions — perfect score!', pageW / 2, y + 10, { align: 'center' })
  } else {
    if (y > 230) { doc.addPage(); y = 24 }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...navy)
    doc.text(`Missed Questions  (${data.missedQuestions.length})`, margin, y)
    y += 8

    data.missedQuestions.forEach((mq, idx) => {
      const qLines   = doc.splitTextToSize(mq.questionText, contentW - 8)
      const expLines = doc.splitTextToSize(mq.explanation, contentW - 8)

      // Precise height: top-padding(10) + question(qLines*5) + gap(3) + answers(10) + gap(3) + explanation(expLines*4.5) + bottom-padding(6)
      const cardHeight = 10 + qLines.length * 5 + 3 + 10 + 3 + expLines.length * 4.5 + 8

      if (y + cardHeight > 272) { doc.addPage(); y = 24 }

      // Card
      doc.setFillColor(...lightGray)
      doc.roundedRect(margin, y, contentW, cardHeight, 4, 4, 'F')

      // Left accent bar
      doc.setFillColor(...sky)
      doc.roundedRect(margin, y, 3, cardHeight, 2, 2, 'F')

      // Number badge
      doc.setFillColor(...navy)
      doc.circle(margin + 10, y + 6.5, 4.5, 'F')
      doc.setTextColor(...white)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(String(idx + 1), margin + 10, y + 8.5, { align: 'center' })

      // Category tag
      doc.setTextColor(...sky)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.text(mq.category.toUpperCase(), margin + 18, y + 8)

      let cy = y + 14

      // Question text
      doc.setTextColor(...darkText)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(qLines, margin + 6, cy)
      cy += qLines.length * 5 + 3

      // Answers
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...red)
      const yourLabel = `Your answer:  ${mq.userAnswer}`
      doc.text(yourLabel, margin + 6, cy)
      cy += 5
      doc.setTextColor(...green)
      doc.text(`Correct answer:  ${mq.correctAnswer}`, margin + 6, cy)
      cy += 6

      // Explanation
      doc.setFontSize(8)
      doc.setTextColor(80, 100, 140)
      doc.setFont('helvetica', 'normal')
      doc.text(expLines, margin + 6, cy)

      y += cardHeight + 5
    })
  }

  // ── Page footers ────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFillColor(...navy)
    doc.rect(0, 287, pageW, 10, 'F')
    doc.setTextColor(...white)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text('tarmac.study  |  Private Pilot Exam Prep', margin, 293)
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, 293, { align: 'right' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}
