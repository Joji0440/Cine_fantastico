'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  allowedRoles = []
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push('/auth/login');
        return;
      }
      
      if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.tipo_usuario)) {
        router.push('/');
        return;
      }
    }
  }, [user, loading, requireAuth, allowedRoles, router]);

  // Mostrar loading durante la verificación de auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si requiere auth y no hay usuario
  if (requireAuth && !user) {
    return null; // El useEffect ya redirigirá
  }

  // Si hay roles requeridos y el usuario no los tiene
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.tipo_usuario)) {
    return null; // El useEffect ya redirigirá
  }

  return <>{children}</>;
}
