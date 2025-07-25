'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import TrailerModal from '@/components/TrailerModal';

interface Genero {
  id: string;
  nombre: string;
}

interface PeliculaGenero {
  genero: Genero;
}

interface Pelicula {
  id: string;
  titulo: string;
  director: string;
  duracion_minutos: number;
  clasificacion: string;
  fecha_estreno: string;
  sinopsis?: string;
  poster_url?: string;
  trailer_url?: string;
  activa: boolean;
  fecha_creacion: string;
  peliculas_generos: PeliculaGenero[];
}

export default function DetallesPeliculaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  const peliculaId = params.id as string;

  const fetchPelicula = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/peliculas/${peliculaId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Película no encontrada');
        }
        throw new Error('Error al cargar los datos de la película');
      }

      const data = await response.json();
      setPelicula(data.pelicula);
    } catch (err) {
      console.error('Error fetching película:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [peliculaId]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!['empleado', 'administrador', 'gerente'].includes(user.tipo_usuario)) {
      router.push('/dashboard');
      return;
    }

    fetchPelicula();
  }, [user, authLoading, router, fetchPelicula]);

  const handleVolver = () => {
    router.push('/admin/peliculas');
  };

  const handleEditar = () => {
    router.push(`/admin/peliculas/${peliculaId}/edit`);
  };

  const handleVerTrailer = () => {
    setShowTrailerModal(true);
  };

  const closeTrailerModal = () => {
    setShowTrailerModal(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Cargando detalles de la película...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleVolver}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Volver a Películas
          </button>
        </div>
      </div>
    );
  }

  if (!pelicula) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-yellow-500 text-6xl mb-4">🎬</div>
          <h1 className="text-2xl font-bold mb-4">Película no encontrada</h1>
          <button
            onClick={handleVolver}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Volver a Películas
          </button>
        </div>
      </div>
    );
  }

  const generos = pelicula.peliculas_generos.map(pg => pg.genero.nombre).join(', ');
  const fechaEstreno = new Date(pelicula.fecha_estreno).toLocaleDateString('es-ES');
  const fechaCreacion = new Date(pelicula.fecha_creacion).toLocaleDateString('es-ES');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleVolver}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Volver
            </button>
            <h1 className="text-3xl font-bold">Detalles de Película</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm ${
              pelicula.activa 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {pelicula.activa ? 'Activa' : 'Inactiva'}
            </span>
            
            {(['administrador', 'gerente'].includes(user?.tipo_usuario || '')) && (
              <button
                onClick={handleEditar}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Editar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {pelicula.poster_url ? (
                <Image
                  src={pelicula.poster_url}
                  alt={pelicula.titulo}
                  width={400}
                  height={600}
                  className="w-full h-auto object-cover"
                  priority
                />
              ) : (
                <div className="aspect-[2/3] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-2">🎬</div>
                    <p>Sin poster</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-4xl font-bold mb-2">{pelicula.titulo}</h2>
              <p className="text-xl text-gray-400 mb-4">Dirigida por {pelicula.director}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-600 rounded-full">
                  {pelicula.clasificacion}
                </span>
                <span className="text-gray-400">
                  {pelicula.duracion_minutos} minutos
                </span>
                <span className="text-gray-400">
                  Estreno: {fechaEstreno}
                </span>
              </div>
            </div>

            {/* Géneros */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Géneros</h3>
              <p className="text-gray-300">{generos || 'No especificados'}</p>
            </div>

            {/* Sinopsis */}
            {pelicula.sinopsis && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Sinopsis</h3>
                <p className="text-gray-300 leading-relaxed">{pelicula.sinopsis}</p>
              </div>
            )}

            {/* Trailer */}
            {pelicula.trailer_url && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Trailer</h3>
                <button
                  onClick={handleVerTrailer}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <span className="mr-2">▶️</span>
                  Ver Trailer
                </button>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">ID:</span>
                  <span className="ml-2 font-mono">{pelicula.id}</span>
                </div>
                <div>
                  <span className="text-gray-400">Fecha de creación:</span>
                  <span className="ml-2">{fechaCreacion}</span>
                </div>
                <div>
                  <span className="text-gray-400">Estado:</span>
                  <span className={`ml-2 ${
                    pelicula.activa ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {pelicula.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal del Trailer */}
      <TrailerModal
        isOpen={showTrailerModal}
        onClose={closeTrailerModal}
        trailerUrl={pelicula?.trailer_url || ''}
        movieTitle={pelicula?.titulo || ''}
      />
    </div>
  );
}
