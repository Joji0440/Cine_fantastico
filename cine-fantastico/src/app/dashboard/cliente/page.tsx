'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardClienteRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la página principal del cliente
    router.push('/cliente');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirigiendo...</p>
        <p className="text-gray-400 text-sm">Te estamos llevando a tu página principal</p>
      </div>
    </div>
  );
}