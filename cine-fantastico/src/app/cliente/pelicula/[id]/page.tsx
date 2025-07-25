'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Star, Users, MapPin, Play, Ticket } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import TrailerModal from '@/components/TrailerModal';

interface Pelicula {
  id: string;
  titulo: string;
  sinopsis: string;
  poster_url?: string;
  trailer_url?: string;
  duracion_minutos: number;
  clasificacion: string;
  director: string;
  actores_principales: string;
  calificacion_imdb?: number;
  fecha_estreno_mundial?: string;
  fecha_estreno_local?: string;
  generos: string[];
  funciones: Funcion[];
}

interface Funcion {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  precio_base: number;
  asientos_disponibles: number;
  asientos_reservados: number;
  sala: {
    id: string;
    numero: number;
    nombre: string;
    tipo_sala: string;
    capacidad_total: number;
  };
}

export default function PeliculaDetalle() {
  const params = useParams();
  const id = params?.id as string;
  
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [funcionesLoading, setFuncionesLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  // Función para abrir el modal del tráiler
  const openTrailerModal = () => {
    setShowTrailerModal(true);
  };

  // Función para cerrar el modal del tráiler
  const closeTrailerModal = () => {
    setShowTrailerModal(false);
  };

  const fetchPelicula = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setFuncionesLoading(true);
      
      // Usar la nueva API pública que incluye funciones
      const response = await fetch(`/api/public/peliculas/${id}`);
      if (response.ok) {
        const result = await response.json();
        setPelicula(result.pelicula);
        setFunciones(result.pelicula.funciones || []);
      } else {
        console.error('Error response:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching movie:', error);
    } finally {
      setLoading(false);
      setFuncionesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPelicula();
  }, [fetchPelicula]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatRating = (rating?: number) => {
    if (!rating) return 'N/A';
    return rating.toFixed(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
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

  // Filtrar funciones según fecha seleccionada
  const funcionesFiltradas = selectedDate 
    ? funciones.filter(funcion => {
        const fechaFuncion = new Date(funcion.fecha_hora_inicio).toISOString().split('T')[0];
        return fechaFuncion === selectedDate;
      })
    : funciones;

  // Agrupar funciones por fecha
  const funcionesPorFecha = funcionesFiltradas.reduce((acc, funcion) => {
    const fecha = new Date(funcion.fecha_hora_inicio).toISOString().split('T')[0];
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push(funcion);
    return acc;
  }, {} as Record<string, Funcion[]>);

  // Obtener próximas fechas disponibles
  const fechasDisponibles = Object.keys(funcionesPorFecha)
    .sort()
    .slice(0, 7); // Próximos 7 días

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!pelicula) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-2xl font-bold text-white mb-4">Película no encontrada</h2>
          <Link href="/cliente" className="text-blue-300 hover:text-blue-200">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/cliente" className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Volver al catálogo
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Información Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Póster */}
          <div className="lg:col-span-1">
            <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden">
              {pelicula.poster_url ? (
                <Image
                  src={pelicula.poster_url}
                  alt={pelicula.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl text-gray-500">🎬</span>
                </div>
              )}
              
              {/* Clasificación */}
              <div className={`absolute top-4 right-4 px-3 py-1 ${getClasificacionColor(pelicula.clasificacion)} rounded text-white font-bold`}>
                {pelicula.clasificacion}
              </div>
            </div>

            {/* Botón de Trailer */}
            {pelicula.trailer_url && (
              <button 
                onClick={openTrailerModal}
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
              >
                <Play className="w-5 h-5" />
                Ver Tráiler
              </button>
            )}
          </div>

          {/* Información */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-white mb-4">
              {pelicula.titulo}
            </h1>

            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-medium">{formatRating(pelicula.calificacion_imdb)}</span>
                <span className="text-blue-300 text-sm">IMDb</span>
              </div>

              <div className="flex items-center gap-2 text-blue-300">
                <Clock className="w-5 h-5" />
                <span>{formatDuration(pelicula.duracion_minutos)}</span>
              </div>

              {/* Géneros */}
              <div className="flex flex-wrap gap-2">
                {pelicula.generos.map((genero, index) => (
                  <div key={index} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                    {genero}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Sinopsis</h3>
                <p className="text-blue-100 leading-relaxed">
                  {pelicula.sinopsis}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-1">Director</h4>
                  <p className="text-blue-200">{pelicula.director}</p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Reparto Principal</h4>
                  <p className="text-blue-200">{pelicula.actores_principales}</p>
                </div>
              </div>

              {pelicula.fecha_estreno_mundial && (
                <div>
                  <h4 className="text-white font-medium mb-1">Fecha de Estreno</h4>
                  <p className="text-blue-200">
                    {new Date(pelicula.fecha_estreno_mundial).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horarios y Funciones */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-400" />
            Horarios Disponibles
          </h2>

          {/* Selector de Fecha */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDate('')}
                className={`px-4 py-2 rounded-xl transition-colors ${
                  selectedDate === '' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-blue-300 hover:bg-white/20'
                }`}
              >
                Todos los días
              </button>
              {fechasDisponibles.map((fecha) => (
                <button
                  key={fecha}
                  onClick={() => setSelectedDate(fecha)}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    selectedDate === fecha 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/10 text-blue-300 hover:bg-white/20'
                  }`}
                >
                  {new Date(fecha).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Funciones */}
          {funcionesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : Object.keys(funcionesPorFecha).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-xl font-bold text-white mb-2">
                No hay funciones disponibles
              </h3>
              <p className="text-blue-300">
                Esta película no tiene funciones programadas en este momento
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(funcionesPorFecha)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([fecha, funcionesDia]) => (
                  <div key={fecha}>
                    <h3 className="text-xl font-bold text-white mb-4">
                      {new Date(fecha).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {funcionesDia
                        .sort((a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime())
                        .map((funcion) => (
                          <div
                            key={funcion.id}
                            className="bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-2xl font-bold text-white">
                                {new Date(funcion.fecha_hora_inicio).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="text-2xl font-bold text-green-400">
                                {formatCurrency(funcion.precio_base)}
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-blue-200">
                                <MapPin className="w-4 h-4" />
                                <span>Sala {funcion.sala.numero} - {funcion.sala.nombre}</span>
                              </div>
                              <div className="flex items-center gap-2 text-blue-200">
                                <span className="text-sm">{funcion.sala.tipo_sala}</span>
                              </div>
                              <div className="flex items-center gap-2 text-blue-200">
                                <Users className="w-4 h-4" />
                                <span>
                                  {funcion.asientos_disponibles} de {funcion.sala.capacidad_total} disponibles
                                </span>
                              </div>
                            </div>

                            {/* Barra de ocupación */}
                            <div className="mb-4">
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full"
                                  style={{
                                    width: `${(funcion.asientos_reservados / funcion.sala.capacidad_total) * 100}%`
                                  }}
                                ></div>
                              </div>
                            </div>

                            <Link
                              href={`/cliente/pelicula/${pelicula.id}/reservar?funcionId=${funcion.id}`}
                              className={`block w-full text-center px-4 py-3 rounded-xl font-medium transition-colors ${
                                funcion.asientos_disponibles > 0
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                              }`}
                            >
                              {funcion.asientos_disponibles > 0 ? (
                                <>
                                  <Ticket className="w-5 h-5 inline mr-2" />
                                  Reservar Boletos
                                </>
                              ) : (
                                'Agotado'
                              )}
                            </Link>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal del Tráiler */}
      {pelicula?.trailer_url && (
        <TrailerModal
          isOpen={showTrailerModal}
          onClose={closeTrailerModal}
          trailerUrl={pelicula.trailer_url}
          movieTitle={pelicula.titulo}
        />
      )}
    </div>
  );
}
