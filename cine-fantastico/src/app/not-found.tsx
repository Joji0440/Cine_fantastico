'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect después de 5 segundos
    const timer = setTimeout(() => {
      router.push('/cliente');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="text-8xl mb-6">🎬</div>
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">Página no encontrada</h2>
        <p className="text-gray-400 mb-8">
          La página que estás buscando no existe o ha sido movida.
          Serás redirigido automáticamente en unos segundos.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/cliente"
            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Ir al Catálogo de Películas
          </Link>
          
          <Link 
            href="/"
            className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-white/20"
          >
            Ir al Inicio
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>¿Necesitas ayuda? Contacta con nuestro soporte.</p>
        </div>
      </div>
    </div>
  );
}
