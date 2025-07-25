"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

type UserRole = 'cliente' | 'empleado' | 'administrador' | 'gerente';

interface UseAdminProtectionOptions {
  allowedRoles?: UserRole[];
  redirectTo?: string;
  showError?: boolean;
}

export function useAdminProtection(options: UseAdminProtectionOptions = {}) {
  const { 
    allowedRoles = ['empleado', 'administrador', 'gerente'],
    redirectTo = '/dashboard/cliente',
    showError = true 
  } = options;
  
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si está cargando, no hacer nada aún
    if (loading) return;

    // Si no hay usuario, redirigir al login
    if (!user) {
      console.log('🔒 useAdminProtection: No user found, redirecting to login');
      router.push('/auth/login');
      return;
    }

    // Si el usuario no está activo
    if (!user.activo) {
      console.log('🔒 useAdminProtection: User inactive, redirecting to login');
      router.push('/auth/login');
      return;
    }

    // Si el tipo de usuario no está en los roles permitidos
    if (!allowedRoles.includes(user.tipo_usuario as UserRole)) {
      console.log(`🔒 useAdminProtection: Access denied for role: ${user.tipo_usuario}`);
      
      if (showError) {
        alert(`Acceso denegado. Esta página es solo para ${allowedRoles.join(', ')}.`);
      }

      // Redirigir según el tipo de usuario
      if (user.tipo_usuario === 'cliente') {
        router.push('/dashboard/cliente');
      } else {
        router.push(redirectTo);
      }
      return;
    }

    console.log(`✅ useAdminProtection: Access granted for ${user.tipo_usuario}: ${user.email}`);
  }, [user, loading, router, allowedRoles, redirectTo, showError]);

  return {
    user,
    loading,
    hasAccess: user && user.activo && allowedRoles.includes(user.tipo_usuario as UserRole),
    isAuthorized: !loading && user && user.activo && allowedRoles.includes(user.tipo_usuario as UserRole)
  };
}
