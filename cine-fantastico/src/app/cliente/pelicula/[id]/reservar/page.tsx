'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import SelectorAsientos from '@/components/SelectorAsientos';

interface Funcion {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  precio_base: number;
  asientos_disponibles: number;
  asientos_reservados: number;
  sala: {
    id: string;
    nombre: string;
    numero: number;
    capacidad_total: number;
    tipo_sala: string;
  };
}

interface Pelicula {
  id: string;
  titulo: string;
  sinopsis: string;
  duracion_minutos: number;
  clasificacion: string;
  director: string;
  reparto: string;
  url_imagen: string;
  funciones: Funcion[];
}

export default function ReservarPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const funcionId = searchParams.get('funcionId');
  const { user, loading } = useAuth();
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [funcionSeleccionada, setFuncionSeleccionada] = useState<Funcion | null>(null);
  const [cantidadAsientos, setCantidadAsientos] = useState(1);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<Array<{ id: string; fila: string; numero: number }>>([]);
  const [mostrarAsientos, setMostrarAsientos] = useState(false);
  const [loadingPelicula, setLoadingPelicula] = useState(true);
  const [error, setError] = useState('');

  // Check authentication (no need to set state, just used for rendering)
  useEffect(() => {
    // Logic is handled in the render section
  }, [user, loading]);

  // Handle redirect to login
  const handleRedirectToLogin = () => {
    router.push(`/cliente/auth/login?redirect=/cliente/pelicula/${params.id}/reservar`);
  };

  // Handle redirect to register
  const handleRedirectToRegister = () => {
    router.push(`/cliente/auth/register?redirect=/cliente/pelicula/${params.id}/reservar`);
  };

  // Fetch movie details and functions
  useEffect(() => {
    const fetchPelicula = async () => {
      try {
        const response = await fetch(`/api/public/peliculas/${params.id}`);
        const data = await response.json();
        
        if (data.success) {
          setPelicula(data.pelicula);
        } else {
          setError('Película no encontrada');
        }
      } catch {
        setError('Error al cargar la película');
      } finally {
        setLoadingPelicula(false);
      }
    };

    if (params.id) {
      fetchPelicula();
    }
  }, [params.id]);

  // Auto-select function if funcionId is provided
  useEffect(() => {
    if (pelicula && funcionId) {
      const funcionEncontrada = pelicula.funciones.find(f => f.id === funcionId);
      if (funcionEncontrada) {
        setFuncionSeleccionada(funcionEncontrada);
      }
    }
  }, [pelicula, funcionId]);

  const handleReservar = async () => {
    if (!funcionSeleccionada || !user || asientosSeleccionados.length === 0) return;

    try {
      const response = await fetch('/api/cliente/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          funcion_id: funcionSeleccionada.id,
          cantidad_entradas: asientosSeleccionados.length,
          asientos_seleccionados: asientosSeleccionados.map(a => a.id),
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/cliente/reserva/${data.reserva.id}/confirmacion`);
      } else {
        setError(data.error || 'Error al crear la reserva');
      }
    } catch {
      setError('Error al procesar la reserva');
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      fecha: date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      hora: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Show loading while checking auth
  if (loading || loadingPelicula) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-blue-400 text-6xl mb-6">🎬</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            ¡Reserva tu función!
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            Para reservar entradas necesitas iniciar sesión en tu cuenta o crear una nueva.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleRedirectToLogin}
              className="w-full btn-gradient py-4 text-lg font-bold"
            >
              Iniciar Sesión
            </button>
            
            <button
              onClick={handleRedirectToRegister}
              className="w-full glass-button py-4 text-lg font-semibold"
            >
              Crear Cuenta Nueva
            </button>
          </div>

          <div className="mt-8">
            <Link
              href="/cliente"
              className="text-gray-400 hover:text-gray-300 text-sm inline-flex items-center"
            >
              ← Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link
            href="/cliente"
            className="btn-primary inline-block"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!pelicula) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/cliente/pelicula/${params.id}`}
            className="text-blue-400 hover:text-blue-300 mb-4 inline-flex items-center"
          >
            ← Volver a la película
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Reservar Entradas</h1>
          <p className="text-gray-300">Para: <span className="text-blue-400 font-semibold">{pelicula.titulo}</span></p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Movie Info */}
          <div className="glass-card p-6">
            <div className="flex gap-4 mb-6">
              {pelicula.url_imagen && (
                <Image
                  src={pelicula.url_imagen}
                  alt={pelicula.titulo}
                  width={96}
                  height={144}
                  className="w-24 h-36 object-cover rounded-lg"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{pelicula.titulo}</h2>
                <p className="text-gray-300 text-sm mb-1">
                  <span className="font-semibold">Director:</span> {pelicula.director}
                </p>
                <p className="text-gray-300 text-sm mb-1">
                  <span className="font-semibold">Duración:</span> {pelicula.duracion_minutos} min
                </p>
                <p className="text-gray-300 text-sm mb-1">
                  <span className="font-semibold">Clasificación:</span> {pelicula.clasificacion}
                </p>
              </div>
            </div>
            
            {pelicula.sinopsis && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Sinopsis</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{pelicula.sinopsis}</p>
              </div>
            )}
          </div>

          {/* Reservation Form */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Seleccionar Función</h2>

            {/* Functions List */}
            {pelicula.funciones && pelicula.funciones.length > 0 ? (
              <div className="space-y-4 mb-6">
                {pelicula.funciones.map((funcion) => {
                  const { fecha, hora } = formatDateTime(funcion.fecha_hora_inicio);
                  const asientosDisponibles = funcion.asientos_disponibles - funcion.asientos_reservados;
                  
                  return (
                    <div
                      key={funcion.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        funcionSeleccionada?.id === funcion.id
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setFuncionSeleccionada(funcion)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-semibold capitalize">{fecha}</p>
                          <p className="text-blue-400 text-lg font-bold">{hora}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatPrice(funcion.precio_base)}</p>
                          <p className="text-xs text-gray-400">por entrada</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-gray-300">
                          <span className="font-semibold">Sala:</span> {funcion.sala.nombre}
                        </p>
                        <p className={`${
                          asientosDisponibles > 10 ? 'text-green-400' : 
                          asientosDisponibles > 0 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {asientosDisponibles > 0 ? 
                            `${asientosDisponibles} asientos disponibles` : 
                            'Agotado'
                          }
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No hay funciones disponibles para esta película</p>
                <Link
                  href="/cliente"
                  className="btn-primary"
                >
                  Ver otras películas
                </Link>
              </div>
            )}

            {/* Seat Selection */}
            {funcionSeleccionada && !mostrarAsientos && (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Cantidad de entradas
                  </label>
                  <select
                    value={cantidadAsientos}
                    onChange={(e) => setCantidadAsientos(parseInt(e.target.value))}
                    className="glass-select"
                  >
                    {Array.from({ length: Math.min(10, funcionSeleccionada.asientos_disponibles - funcionSeleccionada.asientos_reservados) }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? 'entrada' : 'entradas'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Continue to seat selection */}
                <button
                  onClick={() => setMostrarAsientos(true)}
                  className="w-full btn-gradient py-4 text-lg font-bold"
                >
                  Seleccionar Asientos
                </button>
              </div>
            )}

            {/* Seat Map */}
            {funcionSeleccionada && mostrarAsientos && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Seleccionar Asientos</h3>
                  <button
                    onClick={() => setMostrarAsientos(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ← Volver
                  </button>
                </div>

                <SelectorAsientos
                  salaId={funcionSeleccionada.sala.id}
                  funcionId={funcionSeleccionada.id}
                  capacidadTotal={funcionSeleccionada.sala.capacidad_total}
                  asientosOcupados={funcionSeleccionada.asientos_reservados}
                  maxAsientos={cantidadAsientos}
                  onAsientosSeleccionados={setAsientosSeleccionados}
                />

                {/* Price Summary */}
                <div className="glass-card p-4 bg-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Entradas ({asientosSeleccionados.length}x)</span>
                    <span className="text-white">{formatPrice(funcionSeleccionada.precio_base * asientosSeleccionados.length)}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span className="text-white">Total</span>
                    <span className="text-blue-400">{formatPrice(funcionSeleccionada.precio_base * asientosSeleccionados.length)}</span>
                  </div>
                </div>

                {/* Reserve Button */}
                <button
                  onClick={handleReservar}
                  className="w-full btn-gradient py-4 text-lg font-bold"
                  disabled={asientosSeleccionados.length === 0}
                >
                  Reservar {asientosSeleccionados.length} Entrada{asientosSeleccionados.length !== 1 ? 's' : ''}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Al reservar, aceptas nuestros términos y condiciones
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
