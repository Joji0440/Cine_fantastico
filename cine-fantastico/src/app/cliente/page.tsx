'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Clock, Star, Play, LogOut } from 'lucide-react';
import Image from 'next/image';
import TrailerModal from '@/components/TrailerModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

interface Pelicula {
  id: string;
  titulo: string;
  sinopsis: string;
  poster_url?: string;
  trailer_url?: string;
  duracion_minutos: number;
  clasificacion: string;
  genero: string;
  director: string;
  actores_principales: string;
  calificacion_imdb?: number | null;
  fecha_estreno_mundial?: string;
  fecha_estreno_local?: string;
  activa: boolean;
}

export default function ClienteCatalogo() {
  const { user, logout, loading } = useAuth();
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [loadingPeliculas, setLoadingPeliculas] = useState(true);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [clasificacion, setClasificacion] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('fecha_estreno');

  // Modal del tráiler
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState({ url: '', title: '' });

  // Función para abrir el modal del tráiler
  const openTrailerModal = (trailerUrl: string, movieTitle: string) => {
    setSelectedTrailer({ url: trailerUrl, title: movieTitle });
    setShowTrailerModal(true);
  };

  // Función para cerrar el modal del tráiler
  const closeTrailerModal = () => {
    setShowTrailerModal(false);
    setSelectedTrailer({ url: '', title: '' });
  };

  const fetchPeliculas = useCallback(async () => {
    try {
      setLoadingPeliculas(true);
      
      // Construir parámetros para filtros del servidor
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (clasificacion) params.append('clasificacion', clasificacion);
      params.append('ordenarPor', ordenarPor);
      params.append('limit', '50'); // Límite más alto para el cliente
      
      // Usar la API pública con filtros del servidor
      const response = await fetch(`/api/public/peliculas?${params}`);
      if (response.ok) {
        const result = await response.json();
        setPeliculas(result.peliculas || []);
      } else {
        console.error('Error response:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoadingPeliculas(false);
    }
  }, [search, clasificacion, ordenarPor]);

  useEffect(() => {
    fetchPeliculas();
  }, [fetchPeliculas]);

  // Actualizar películas cuando cambien los filtros
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchPeliculas();
    }, 300); // Debounce para el input de búsqueda

    return () => clearTimeout(delayedSearch);
  }, [search, clasificacion, ordenarPor, fetchPeliculas]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatRating = (rating?: number | null) => {
    if (!rating || typeof rating !== 'number' || isNaN(rating)) return 'N/A';
    return rating.toFixed(1);
  };

  const getClasificacionColor = (clasificacion: string) => {
    switch (clasificacion.toUpperCase()) {
      case 'G': return 'bg-green-500';
      case 'PG': return 'bg-blue-500';
      case 'PG-13': return 'bg-yellow-500';
      case 'R': return 'bg-orange-500';
      case 'NC-17': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={['cliente', 'empleado', 'administrador', 'gerente']}>
      {/* Mostrar loading mientras se verifica la autenticación */}
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Verificando sesión...</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          {/* Header */}
          <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">🎬</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">Cine Fantástico</h1>
                </Link>
                
                <nav className="hidden md:flex items-center gap-6">
                  <Link href="/cliente" className="text-white hover:text-blue-300 transition-colors">
                    Cartelera
                  </Link>
                  <Link href="/cliente/horarios" className="text-blue-300 hover:text-white transition-colors">
                    Horarios
                  </Link>
                  <Link href="/cliente/promociones" className="text-blue-300 hover:text-white transition-colors">
                    Promociones
                  </Link>
                  {user && (
                    <Link href="/cliente/mis-reservas" className="text-blue-300 hover:text-white transition-colors">
                      Mis Reservas
                    </Link>
                  )}
                  {user ? (
                    <div className="flex items-center gap-4">
                      <span className="text-white text-sm">
                        Hola, {user.nombre}
                      </span>
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  ) : (
                    <Link 
                      href="/auth/login"
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Iniciar Sesión
                    </Link>
                  )}
                </nav>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          {user ? (
            <>
              <div className="text-6xl mb-6">🎬</div>
              <h1 className="text-5xl font-bold mb-4">
                ¡Bienvenido de nuevo, <span className="text-blue-400">{user.nombre}</span>!
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Descubre las mejores películas en cartelera. Reserva tus boletos y vive la magia del cine.
              </p>
              
              {/* Dashboard Cards para usuarios autenticados */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🎭</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Películas</h3>
                      <p className="text-gray-400 text-sm">En cartelera</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => document.getElementById('peliculas-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
                  >
                    Ver todas →
                  </button>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🎫</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Mis Reservas</h3>
                      <p className="text-gray-400 text-sm">Entradas activas</p>
                    </div>
                  </div>
                  <Link 
                    href="/cliente/mis-reservas"
                    className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
                  >
                    Ver reservas →
                  </Link>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Mi Perfil</h3>
                      <p className="text-gray-400 text-sm">Datos personales</p>
                    </div>
                  </div>
                  <Link 
                    href="/cliente/perfil"
                    className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
                  >
                    Editar perfil →
                  </Link>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Historial</h3>
                      <p className="text-gray-400 text-sm">Reservas pasadas</p>
                    </div>
                  </div>
                  <Link 
                    href="/cliente/historial"
                    className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
                  >
                    Ver historial →
                  </Link>
                </div>
              </div>

              {/* Quick Actions para usuarios autenticados */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">Acciones Rápidas</h3>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button 
                    onClick={() => document.getElementById('peliculas-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    🎬 Ver Cartelera
                  </button>
                  <Link 
                    href="/cliente/horarios"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    🕐 Ver Horarios
                  </Link>
                  <Link 
                    href="/cliente/promociones"
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    💰 Ofertas Especiales
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-6">�</div>
              <h2 className="text-5xl font-bold text-white mb-4">
                �🎭 Cartelera
              </h2>
              <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-8">
                Descubre las mejores películas en cartelera. Reserva tus boletos y vive la magia del cine.
              </p>
              
              {/* Llamada a la acción para usuarios no autenticados */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-white/20 rounded-2xl p-8 mb-12">
                <h3 className="text-2xl font-bold text-white mb-4">¿Listo para reservar?</h3>
                <p className="text-gray-300 mb-6">
                  Inicia sesión para acceder a reservas, historial y descuentos exclusivos
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link 
                    href="/auth/login"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link 
                    href="/auth/register"
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Registrarse
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filtros */}
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5 z-10" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar películas, director o actores..."
                  className="glass-input pl-10"
                />
              </div>
            </div>

            {/* Clasificación */}
            <div>
              <select
                value={clasificacion}
                onChange={(e) => setClasificacion(e.target.value)}
                className="glass-select"
              >
                <option value="">Toda clasificación</option>
                <option value="G">G - Todas las edades</option>
                <option value="PG">PG - Se sugiere guía paterna</option>
                <option value="PG-13">PG-13 - Menores de 13 con adulto</option>
                <option value="R">R - Solo mayores de 17</option>
                <option value="NC-17">NC-17 - Solo adultos</option>
              </select>
            </div>

            {/* Ordenar */}
            <div>
              <select
                value={ordenarPor}
                onChange={(e) => setOrdenarPor(e.target.value)}
                className="glass-select"
              >
                <option value="fecha_estreno">Más recientes</option>
                <option value="titulo">A-Z (Alfabético)</option>
                <option value="calificacion_imdb">Mejor calificadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de Películas */}
        {loadingPeliculas ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            {/* Contador de resultados */}
            <div className="mb-6">
              <p className="text-blue-200">
                {peliculas.length === 0 ? 
                  'No se encontraron películas' : 
                  `${peliculas.length} película${peliculas.length === 1 ? '' : 's'} encontrada${peliculas.length === 1 ? '' : 's'}`
                }
              </p>
            </div>

            <div id="peliculas-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {peliculas.map((pelicula) => (
              <div key={pelicula.id} className="movie-card group">
                {/* Póster */}
                <div className="movie-poster">
                  {pelicula.poster_url ? (
                    <Image
                      src={pelicula.poster_url}
                      alt={pelicula.titulo}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl text-gray-500">🎬</span>
                    </div>
                  )}
                  
                  {/* Overlay con botones */}
                  <div className="movie-overlay">
                    {pelicula.trailer_url && (
                      <button 
                        onClick={() => openTrailerModal(pelicula.trailer_url!, pelicula.titulo)}
                        className="p-3 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                        title="Ver Tráiler"
                      >
                        <Play className="w-6 h-6" />
                      </button>
                    )}
                    <Link href={`/cliente/pelicula/${pelicula.id}`} className="btn-primary">
                      Ver Detalles
                    </Link>
                  </div>

                  {/* Clasificación */}
                  <div className={`classificacion-badge ${getClasificacionColor(pelicula.clasificacion)}`}>
                    {pelicula.clasificacion}
                  </div>
                </div>

                {/* Información */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                    {pelicula.titulo}
                  </h3>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm">{formatRating(pelicula.calificacion_imdb)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-300">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{formatDuration(pelicula.duracion_minutos)}</span>
                    </div>
                  </div>

                  <p className="text-blue-200 text-sm mb-3">
                    {pelicula.genero} • {pelicula.director}
                  </p>

                  <p className="text-blue-100 text-sm line-clamp-3 mb-4">
                    {pelicula.sinopsis}
                  </p>

                  <div className="flex gap-2">
                    <Link href={`/cliente/pelicula/${pelicula.id}`} className="btn-gradient">
                      Ver Funciones
                    </Link>
                    <Link href={`/cliente/pelicula/${pelicula.id}/reservar`} className="btn-success">
                      Reservar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        )}

        {peliculas.length === 0 && !loadingPeliculas && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-2xl font-bold text-white mb-2">No se encontraron películas</h3>
            <p className="text-blue-300">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">🎟️</div>
            <h3 className="text-xl font-bold text-white mb-2">Reserva Online</h3>
            <p className="text-blue-200">
              Reserva tus boletos desde la comodidad de tu hogar
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">🍿</div>
            <h3 className="text-xl font-bold text-white mb-2">Dulcería</h3>
            <p className="text-blue-200">
              Complementa tu experiencia con nuestros snacks
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-xl font-bold text-white mb-2">Experiencia Premium</h3>
            <p className="text-blue-200">
              Audio y video de última generación para tu disfrute
            </p>
          </div>
        </div>
          </div>

          {/* Modal del Tráiler */}
          <TrailerModal
            isOpen={showTrailerModal}
            onClose={closeTrailerModal}
            trailerUrl={selectedTrailer.url}
            movieTitle={selectedTrailer.title}
          />
        </div>
      )}
    </ProtectedRoute>
  );
}
