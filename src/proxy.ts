import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionTokenEdge } from '@/lib/session-token-edge'

const SESSION_COOKIE = 'evsoftware_session'

function applySecurityHeaders(response: NextResponse, sensitive = false) {
  const isProduction = process.env.NODE_ENV === 'production'
  const scriptSrc = isProduction
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'"
  const connectSrc = isProduction
    ? "'self' https://*.supabase.co"
    : "'self' ws: wss: https://*.supabase.co"

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  if (sensitive) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  }
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Referrer-Policy', sensitive ? 'no-referrer' : 'strict-origin-when-cross-origin')
  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/privacy-policy' || pathname === '/legal' || pathname === '/terms' || pathname === '/cookies' || pathname === '/robots.txt') {
    return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }))
  }
  if (pathname.startsWith('/anamnesis') || pathname === '/reschedule' || pathname === '/reset-password') {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    return applySecurityHeaders(response, true)
  }
  if (pathname === '/api/cron/reminders') return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), true)

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
    return applySecurityHeaders(response, true)
  }

  if (pathname.startsWith('/api/')) return applySecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }), true)
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  const response = NextResponse.redirect(loginUrl)
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return applySecurityHeaders(response, true)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|logo-white.png|icon-192.png|icon-512.png|manifest.webmanifest|sw.js|robots.txt|sitemap.xml).*)'],
}
