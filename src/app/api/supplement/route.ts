import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs'

const PDF_PATH = '/Users/matthewewing/Desktop/sport_rec_private_akts.pdf'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const stat = fs.statSync(PDF_PATH)
    const fileSize = stat.size

    const rangeHeader = request.headers.get('range')

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      const stream = fs.createReadStream(PDF_PATH, { start, end })
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', chunk => controller.enqueue(chunk))
          stream.on('end', () => controller.close())
          stream.on('error', err => controller.error(err))
        }
      })

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': 'application/pdf',
        },
      })
    }

    const stream = fs.createReadStream(PDF_PATH)
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', chunk => controller.enqueue(chunk))
        stream.on('end', () => controller.close())
        stream.on('error', err => controller.error(err))
      }
    })

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
        'Content-Disposition': 'inline; filename="FAA-CT-8080-2H.pdf"',
      },
    })
  } catch {
    return new NextResponse('Supplement not found', { status: 404 })
  }
}
