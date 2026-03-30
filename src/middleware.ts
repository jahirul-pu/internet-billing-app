import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // We need to bypass middleware for static file requests (e.g., /favicon.ico, /_next/*)
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next()
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // For this RBAC implementation, we assume if you are here, you belong to the staff
  // If we had a login page, we'd redirect unauthenticated users here

  if (user) {
    // Look up the user's role and status in the staff_profiles table
    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    const status = profile?.status
    const path = request.nextUrl.pathname

    if (status === 'inactive') {
      // Hard block inactive accounts from making requests
      return new NextResponse('Account suspended. Please contact Super Admin.', { status: 403 })
    }

    if (role === 'COLLECTOR') {
      // The COLLECTOR Trap: strictly restrict access
      if (!path.startsWith('/collector') && !path.startsWith('/api/payments') && !path.startsWith('/portal')) {
        const url = request.nextUrl.clone()
        url.pathname = '/collector'
        return NextResponse.redirect(url)
      }
    } else if (role === 'MANAGER') {
      // The MANAGER Boundary: strictly block settings and logs
      if (path.startsWith('/settings') || path.startsWith('/logs')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
    // SUPER_ADMIN gets pass-through
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
