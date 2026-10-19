import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionTokenEdge } from '@/lib/session-token-edge'

const SESSION_COOKIE = 'evsoftware_session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/privacy-policy' || pathname === '/robots.txt') {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }
  if (pathname.startsWith('/anamnesis') || pathname === '/reschedule' || pathname === '/reset-password') {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    return response
  }
  if (pathname === '/api/cron/reminders') return NextResponse.next({ request: { headers: requestHeaders } })

  const token = request.cookies.get(SESSION_COOKIE)?.value
  let valid = false
  try {
    valid = await verifySessionTokenEdge(token)
  } catch {
    valid = false
  }
  if (valid) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('Vary', 'Cookie')
    return response
  }

  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  const response = NextResponse.redirect(loginUrl)
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|logo-white.png).*)'],
}
