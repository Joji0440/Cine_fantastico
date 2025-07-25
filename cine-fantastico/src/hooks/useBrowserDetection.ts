'use client';

import { useState, useEffect } from 'react';

export function useBrowserDetection() {
  const [browser, setBrowser] = useState<{
    name: string;
    isProblematic: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent;
      let browserName = 'Unknown';
      let isProblematic = false;

      // Detectar navegadores específicos
      if (userAgent.indexOf('Edg') > -1) {
        browserName = 'Edge';
        isProblematic = true; // Edge tiene problemas de hidratación
      } else if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Brave') > -1) {
        browserName = 'Brave';
        isProblematic = true; // Brave también tiene problemas
      } else if (userAgent.indexOf('Chrome') > -1) {
        browserName = 'Chrome';
        isProblematic = false;
      } else if (userAgent.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
        isProblematic = false;
      } else if (userAgent.indexOf('Safari') > -1) {
        browserName = 'Safari';
        isProblematic = false;
      } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
        browserName = 'Opera';
        isProblematic = false;
      }

      setBrowser({ name: browserName, isProblematic });
    }
  }, []);

  return browser;
}

export function useHydrationSafe() {
  const [isHydrated, setIsHydrated] = useState(false);
  const browser = useBrowserDetection();

  useEffect(() => {
    // Para navegadores problemáticos, esperar un poco más
    const delay = browser?.isProblematic ? 100 : 0;
    
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [browser]);

  return {
    isHydrated,
    browser,
    shouldDelay: browser?.isProblematic || false
  };
}
