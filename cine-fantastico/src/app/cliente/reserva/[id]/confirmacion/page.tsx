'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface ReservaData {
  id: string;
  codigo_reserva: string;
  cantidad_entradas: number;
  precio_total: number;
  estado: string;
  fecha_reserva: string;
  fecha_limite_pago: string;
  funcion: {
    id: string;
    fecha_hora_inicio: string;
    fecha_hora_fin: string;
    pelicula: {
      titulo: string;
      poster_url: string;
    };
    sala: {
      nombre: string;
    };
  };
}

export default function ConfirmacionPage() {
  const params = useParams();
  const [reserva, setReserva] = useState<ReservaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState('');

  useEffect(() => {
    // Por ahora mostraremos datos de ejemplo ya que no tenemos la API GET para reservas individuales
    // En una implementación completa, haríamos fetch('/api/cliente/reservas/${params.id}')
    
    // Datos de ejemplo para mostrar la confirmación
    const reservaEjemplo: ReservaData = {
      id: params.id as string,
      codigo_reserva: `RES-${Date.now()}`,
      cantidad_entradas: 2,
      precio_total: 34.00,
      estado: 'pendiente',
      fecha_reserva: new Date().toISOString(),
      fecha_limite_pago: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      funcion: {
        id: 'func-1',
        fecha_hora_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        fecha_hora_fin: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        pelicula: {
          titulo: 'Película Reservada',
          poster_url: '/resources/default.jpg'
        },
        sala: {
          nombre: 'Sala VIP'
        }
      }
    };

    setReserva(reservaEjemplo);
    setLoading(false);
  }, [params.id]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      fecha: date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      hora: date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Cargando confirmación...</p>
        </div>
      </div>
    );
  }

  if (error || !reserva) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center">
          <div className="text-red-400 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-gray-300 mb-6">
            {error || 'No se pudo cargar la información de la reserva'}
          </p>
          <Link href="/cliente" className="btn-gradient py-3 px-6">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const { fecha: fechaFuncion, hora: horaFuncion } = formatDateTime(reserva.funcion.fecha_hora_inicio);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-green-400 text-6xl mb-4">✅</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-gray-300 text-lg">
            Tu reserva ha sido procesada exitosamente
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Reservation Details Card */}
          <div className="glass-card p-8 mb-8">
            <div className="flex items-start gap-6 mb-6">
              {reserva.funcion.pelicula.poster_url && (
                <Image
                  src={reserva.funcion.pelicula.poster_url}
                  alt={reserva.funcion.pelicula.titulo}
                  width={120}
                  height={180}
                  className="w-30 h-45 object-cover rounded-lg"
                />
              )}
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">
                  {reserva.funcion.pelicula.titulo}
                </h2>
                
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span className="font-semibold">Código de reserva:</span>
                    <span className="text-blue-400 font-mono">{reserva.codigo_reserva}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold">Función:</span>
                    <span className="capitalize">{fechaFuncion}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold">Hora:</span>
                    <span>{horaFuncion}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold">Sala:</span>
                    <span>{reserva.funcion.sala.nombre}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold">Entradas:</span>
                    <span>{reserva.cantidad_entradas}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="border-t border-gray-600 pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-white">Total pagado:</span>
                <span className="text-green-400">{formatPrice(reserva.precio_total)}</span>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-lg font-semibold text-white">Estado: Reserva Pendiente</h3>
                <p className="text-gray-300 text-sm">
                  Tu reserva está confirmada. Presenta este código en taquilla para recoger tus entradas.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/cliente"
              className="flex-1 glass-button text-center py-4 text-lg font-semibold"
            >
              Volver al catálogo
            </Link>
            
            <button
              onClick={() => window.print()}
              className="flex-1 btn-gradient py-4 text-lg font-bold"
            >
              Imprimir confirmación
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 glass-card p-6 bg-blue-500/10">
            <h3 className="text-lg font-semibold text-white mb-3">📋 Instrucciones importantes:</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Llega al cine 15 minutos antes del inicio de la función</li>
              <li>• Presenta tu código de reserva <strong className="text-blue-400">{reserva.codigo_reserva}</strong> en taquilla</li>
              <li>• Puedes usar este código desde tu móvil o impreso</li>
              <li>• Las entradas se entregarán únicamente con documento de identidad</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
