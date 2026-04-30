import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/start', '/auth/callback', '/terms', '/privacy', '/partners', '/unsubscribed', '/checkout', '/forgot-password', '/update-password']
// Paths that require an active trial/subscription (free users redirect to /upgrade)
const GATED_PATHS = ['/dashboard', '/practice', '/exam', '/quiz', '/saved', '/chat', '/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    return NextResponse.next({ request })
  }

  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith('/auth/') || pathname.startsWith('/start') || pathname.startsWith('/checkout/'))

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Gate dashboard routes — free users with no stripe_customer_id go to /upgrade
  if (user && GATED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('subscription_status, subscription_expires_at, is_admin')
      .eq('id', user.id)
      .single()

    const status = profile?.subscription_status
    const expires = profile?.subscription_expires_at
    const isAdmin = profile?.is_admin

    // For all non-free statuses: check expiry if present.
    // Trialing gets NO special bypass — if webhook is delayed, the expiry date
    // set at checkout (= trial end) still gates access correctly.
    const hasAccess = isAdmin ||
      (status && status !== 'free' && (!expires || new Date(expires) > new Date()))

    if (!hasAccess) {
      const url = request.nextUrl.clone()
      url.pathname = '/upgrade'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|og-image.png|supplement.pdf|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
