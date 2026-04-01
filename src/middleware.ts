// OrdrX — Middleware
// Handles @ redirect + auth protection

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ── Handle @ in URL ──────────────────────────────────────
  // ordrx.in/@madhu → ordrx.in/madhu
  if (path.startsWith('/@')) {
    const slug   = path.slice(2)
    const url    = request.nextUrl.clone()
    url.pathname = `/${slug}`
    return NextResponse.redirect(url)
  }
const isPublicPage =
  path === '/'                ||
  path === '/explore'         ||
  path.startsWith('/explore') ||
  path.startsWith('/api')     ||
  // storefront slugs are already public
  (!path.startsWith('/dashboard') &&
   !path.startsWith('/products')  &&
   !path.startsWith('/orders')    &&
   !path.startsWith('/customers') &&
   !path.startsWith('/settings')  &&
   !path.startsWith('/onboarding') &&
   !path.startsWith('/upgrade'))

if (isPublicPage) return supabaseResponse

  // ── Protected dashboard routes ───────────────────────────
  const isDashboardPage =
    path.startsWith('/dashboard') ||
    path.startsWith('/products')  ||
    path.startsWith('/orders')    ||
    path.startsWith('/customers') ||
    path.startsWith('/settings')  ||
    path.startsWith('/onboarding') ||
    path.startsWith('/explore')

  const isAuthPage =
    path === '/login' ||
    path === '/explore' ||
    path === '/signup'|| 
    path === '/forgot-password' ||  
    path === '/reset-password'       

  // Not logged in → redirect to login
  if (!user && isDashboardPage) {
    const url    = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in → redirect away from auth pages
  if (user && isAuthPage) {
    const url    = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Everything else — let through freely ✅
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}