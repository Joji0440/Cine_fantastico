'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function RedirectReservarPage() {
  const router = useRouter();
  const params = useParams();
  const funcionId = params?.funcionId as string;

  useEffect(() => {
    // Redirigir a la estructura correcta
    if (funcionId) {
      // Necesitamos encontrar la película asociada a esta función
      // Por ahora, redirigir a la página principal del cliente
      router.replace('/cliente');
    } else {
      router.replace('/cliente');
    }
  }, [funcionId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-300">Redirigiendo...</p>
      </div>
    </div>
  );
}
