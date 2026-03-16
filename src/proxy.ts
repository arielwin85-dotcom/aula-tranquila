import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('auth_session');
  const { pathname } = request.nextUrl;

  // Rutas que no requieren autenticación
  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/api/auth/login');

  if (!session && !isPublicRoute) {
    // Redirigir a login si no hay sesión y no es una ruta pública
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isPublicRoute) {
    // Redirigir al home si ya está autenticado e intenta ir a login
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configurar qué rutas deben ser procesadas por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, except /api/auth/login)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/auth/logout',
    '/api/auth/me'
  ],
};
