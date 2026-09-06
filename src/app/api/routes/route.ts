import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('route_critiques')
      .select(`
        id, title, departure, destination, waypoints, altitude,
        description, date_of_flight, created_at, user_id,
        users!inner(callsign, full_name)
      `)
      .eq('is_removed', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 })
    return NextResponse.json({ routes: data || [] })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { title, departure, destination, waypoints, altitude, description, date_of_flight } =
      await request.json() as {
        title: string
        departure: string
        destination: string
        waypoints?: string
        altitude?: string
        description: string
        date_of_flight?: string
      }

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!departure?.trim()) return NextResponse.json({ error: 'Departure airport is required' }, { status: 400 })
    if (!destination?.trim()) return NextResponse.json({ error: 'Destination airport is required' }, { status: 400 })
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 })

    const admin = createAdminClient()
    const { data: route, error } = await admin
      .from('route_critiques')
      .insert({
        user_id: user.id,
        title: title.trim(),
        departure: departure.trim().toUpperCase(),
        destination: destination.trim().toUpperCase(),
        waypoints: waypoints?.trim().toUpperCase() || null,
        altitude: altitude?.trim() || null,
        description: description.trim(),
        date_of_flight: date_of_flight || null,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to post route' }, { status: 500 })
    return NextResponse.json({ route })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
