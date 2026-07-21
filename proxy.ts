import {NextRequest, NextResponse} from 'next/server'

const protectedApiPrefixes = [
  '/api/admin',
  '/api/graphics',
  '/api/importer',
  '/api/storage',
]

const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function needsAdminAccess(request: NextRequest) {
  const {pathname} = request.nextUrl

  if (pathname.startsWith('/admin')) return true

  if (protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true
  }

  if (
    pathname.startsWith('/api/projects/') &&
    writeMethods.has(request.method.toUpperCase())
  ) {
    return true
  }

  return false
}

function unauthorized() {
  return new NextResponse('Admin access required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="CFDT Workspace", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  })
}

function decodeBasicAuth(header: string) {
  if (!header.startsWith('Basic ')) return null

  try {
    const decoded = atob(header.slice('Basic '.length))
    const separator = decoded.indexOf(':')
    if (separator === -1) return null

    return {
      user: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    }
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  if (!needsAdminAccess(request)) return NextResponse.next()

  const adminPassword = process.env.CFDT_ADMIN_PASSWORD

  if (!adminPassword) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.next()

    return new NextResponse(
      'Admin access is disabled until CFDT_ADMIN_PASSWORD is configured.',
      {
        status: 503,
        headers: {'Cache-Control': 'no-store'},
      },
    )
  }

  const credentials = decodeBasicAuth(request.headers.get('authorization') || '')
  const adminUser = process.env.CFDT_ADMIN_USER || 'admin'

  if (
    credentials?.user === adminUser &&
    credentials.password === adminPassword
  ) {
    return NextResponse.next()
  }

  return unauthorized()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
