import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 120

const ANONYMIZE_PROMPT = `You are an aviation safety educator writing case studies for student and certificated pilots. You will receive a raw NTSB accident report JSON. Rewrite it as an educational scenario card.

Rules:
- Remove all proper names, tail numbers, specific airport identifiers (ICAO/FAA codes)
- Replace airports with region + type: "a small municipal airport in the Southeast"
- Keep aircraft type generic but accurate: "a Cessna 172" not "N12345"
- Keep weather conditions, phase of flight, and causal chain fully intact
- Write at student pilot reading level
- Do not editorialize or assign blame
- Return ONLY valid JSON, no markdown, no preamble

Required JSON keys:
{
  "title": "punchy 4-8 word headline",
  "summary": "2-3 sentences describing what happened neutrally",
  "prompt_one": "thoughtful open discussion question about the causal chain or decision-making",
  "prompt_two": "second discussion question from a different angle (e.g., system vs individual, weather, airspace)",
  "phase_of_flight": "string",
  "aircraft_type": "string",
  "weather": "brief weather description",
  "probable_cause": "paraphrase of NTSB probable cause finding",
  "region": "anonymized region e.g. Mountain West",
  "year": number
}`

export async function GET(request: NextRequest) {
  const isAdmin = request.nextUrl.searchParams.get('admin') === '1'
  const autoActivate = request.nextUrl.searchParams.get('activate') === '1'
  if (!isAdmin) {
    const secret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret')
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()

  // Get current offset
  const { data: configRow } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'ntsb_last_offset')
    .single()

  const offset = parseInt(configRow?.value || '0', 10)

  // Fetch from NTSB Socrata API
  const url = new URL('https://data.ntsb.gov/resource/avhn-8mzy.json')
  url.searchParams.set('aircraft_category', 'Airplane')
  url.searchParams.set('$where', "injury_severity='Fatal' OR injury_severity='Serious'")
  url.searchParams.set('$limit', '10')
  url.searchParams.set('$offset', String(offset))

  let rawData: Record<string, string>[]
  try {
    const resp = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
    if (!resp.ok) throw new Error(`NTSB API ${resp.status}`)
    rawData = await resp.json()
  } catch (err) {
    console.error('NTSB fetch error:', err)
    return NextResponse.json({ error: 'NTSB API unavailable' }, { status: 502 })
  }

  if (!rawData.length) {
    await supabase.from('system_config').update({ value: '0', updated_at: new Date().toISOString() }).eq('key', 'ntsb_last_offset')
    return NextResponse.json({ message: 'No more records — offset reset to 0' })
  }

  // Get existing NTSB IDs to skip duplicates
  const candidateIds = rawData.map(r => r.ev_id || r.ntsb_no || String(r.id || '')).filter(Boolean)
  const { data: existingRows } = await supabase
    .from('accidents')
    .select('ntsb_id')
    .in('ntsb_id', candidateIds)

  const existingSet = new Set((existingRows || []).map(r => r.ntsb_id))
  const newRecord = rawData.find(r => {
    const id = r.ev_id || r.ntsb_no || String(r.id || '')
    return id && !existingSet.has(id)
  })

  const newOffset = offset + rawData.length
  await supabase.from('system_config').update({ value: String(newOffset), updated_at: new Date().toISOString() }).eq('key', 'ntsb_last_offset')

  if (!newRecord) {
    return NextResponse.json({ message: 'All fetched records already exist', offset: newOffset })
  }

  // Send to Claude for anonymization
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  let processed: Record<string, unknown>
  try {
    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: ANONYMIZE_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(newRecord) }],
    })
    const text = resp.content[0].type === 'text' ? resp.content[0].text : ''
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    processed = JSON.parse(clean)
  } catch (err) {
    console.error('Anonymization failed:', err)
    return NextResponse.json({ error: 'Claude processing failed' }, { status: 500 })
  }

  const ntsb_id = newRecord.ev_id || newRecord.ntsb_no || String(newRecord.id || `ntsb-${Date.now()}`)

  const { error: insertError } = await supabase.from('accidents').insert({
    ntsb_id,
    title: processed.title as string,
    summary: processed.summary as string,
    prompt_one: processed.prompt_one as string,
    prompt_two: processed.prompt_two as string,
    phase_of_flight: processed.phase_of_flight as string | null,
    aircraft_type: processed.aircraft_type as string | null,
    weather: processed.weather as string | null,
    probable_cause: processed.probable_cause as string | null,
    region: processed.region as string | null,
    year: processed.year as number | null,
    raw_ntsb_json: newRecord,
    is_active: isAdmin && autoActivate,
    posted_at: new Date().toISOString(),
  })

  if (insertError) {
    console.error('Accident insert error:', insertError)
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, title: processed.title, ntsb_id, offset: newOffset })
}
