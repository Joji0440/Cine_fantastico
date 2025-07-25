'use client';

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Recargar la página para actualizar el estado
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="border-t-8 border-dotted border-white/20 bg-gray-900/50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
              <h1 className="text-3xl font-bold">
                <span className="text-red-500">Cine</span>{" "}
                <span className="text-yellow-500">Fantástico</span>
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/" 
                className="text-white hover:text-yellow-400 transition-colors"
              >
                Inicio
              </Link>
              <Link 
                href="/cliente" 
                className="text-white hover:text-yellow-400 transition-colors"
              >
                Cartelera
              </Link>
              
              {!loading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-4">
                      <span className="text-yellow-400 font-semibold">
                        ¡Hola, {user.nombre}!
                      </span>
                      <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  ) : (
                    <Link 
                      href="/auth/login" 
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      Iniciar Sesión
                    </Link>
                  )}
                </>
              )}
            </nav>
            
            {/* Mobile menu button */}
            <button className="md:hidden text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
            {user ? `¡Bienvenido de nuevo, ${user.nombre}!` : 'Bienvenido a Cine Fantástico'}
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {user 
              ? 'Descubre las mejores películas en cartelera. Reserva tus boletos y vive la magia del cine.'
              : 'Sistema moderno de gestión cinematográfica con reservas de asientos, administración de películas y control total de funciones.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/cliente"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Ver Cartelera
            </Link>
            {!user && (
              <Link 
                href="/auth/register"
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Registrarse
              </Link>
            )}
            {user && (
              <Link 
                href="/cliente/mis-reservas"
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Mis Reservas
              </Link>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎫</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-yellow-400">Reservas Inteligentes</h3>
            <p className="text-gray-300">
              Sistema avanzado de selección de asientos con visualización en tiempo real 
              y confirmación inmediata.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎬</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-yellow-400">Gestión Completa</h3>
            <p className="text-gray-300">
              Administra películas, horarios, salas y empleados desde un panel 
              de control intuitivo y moderno.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-yellow-400">Análisis Detallado</h3>
            <p className="text-gray-300">
              Reportes en tiempo real, auditoría completa y métricas de rendimiento 
              para optimizar tu negocio.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-red-600/10 to-yellow-600/10 rounded-2xl p-8 mb-16 border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">1000+</div>
              <div className="text-gray-300">Películas Gestionadas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">50K+</div>
              <div className="text-gray-300">Reservas Procesadas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">99.9%</div>
              <div className="text-gray-300">Tiempo de Actividad</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
              <div className="text-gray-300">Soporte Técnico</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-4 text-white">
            ¿Listo para modernizar tu cine?
          </h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Únete a la revolución digital del entretenimiento con nuestro sistema 
            de gestión integral para cines modernos.
          </p>
          <Link 
            href="/demo"
            className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 inline-block"
          >
            Solicitar Demo
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-md border-t border-white/10 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-lg">🎬</span>
              </div>
              <span className="text-lg font-bold">
                <span className="text-red-500">Cine</span>{" "}
                <span className="text-yellow-500">Fantástico</span>
              </span>
            </div>
            <p className="text-gray-400">
              © 2025 Cine Fantástico - Sistema de Gestión Cinematográfica
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
