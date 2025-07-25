import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Deshabilitar strict mode que puede causar hidratación dual
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"]
    },
    // Optimizaciones para hidratación
    optimizeCss: false,
    optimizeServerReact: false
  },
  // Configuración de imágenes para dominios externos
  images: {
    remotePatterns: [
      // Permite cualquier dominio HTTPS (más seguro)
      {
        protocol: 'https',
        hostname: '**',
      },
      // Permite cualquier dominio HTTP (para desarrollo local)
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    // Configuración adicional para imágenes
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Permitir dominios no listados
    unoptimized: false,
  },
  // Configuración del servidor
  async rewrites() {
    return [];
  }
};

export default nextConfig;
