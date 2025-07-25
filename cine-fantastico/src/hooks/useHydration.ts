'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para manejar la hidratación de componentes del lado del cliente
 * Previene errores de hidratación al asegurarse de que el componente 
 * solo renderice contenido dinámico después de la hidratación
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Este efecto solo se ejecuta en el cliente
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook para detectar si estamos en el lado del cliente
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook para manejar valores que pueden diferir entre servidor y cliente
 * durante la hidratación
 */
export function useClientValue<T>(clientValue: T, serverValue: T): T {
  const isHydrated = useHydration();
  return isHydrated ? clientValue : serverValue;
}
