import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Detectar navegadores problemáticos para hidratación
  const userAgent = request.headers.get('user-agent') || '';
  const isProblematicBrowser = userAgent.includes('Edg') || userAgent.includes('Brave');
  
  const response = NextResponse.next();
  
  // Agregar headers específicos para navegadores problemáticos
  if (isProblematicBrowser) {
    response.headers.set('X-Browser-Hydration-Fix', 'true');
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
