"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Pelicula {
  id: string;
  titulo: string;
  duracion_minutos: number;
  clasificacion: string;
  poster_url: string;
}

interface Sala {
  id: string;
  numero: number;
  nombre: string;
  tipo_sala: string;
  capacidad_total: number;
  precio_extra: number;
}

export default function NuevaFuncionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    pelicula_id: '',
    sala_id: '',
    fecha: '',
    hora: '',
    precio_base: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [selectedPelicula, setSelectedPelicula] = useState<Pelicula | null>(null);
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);

  useEffect(() => {
    Promise.all([
      fetchPeliculas(),
      fetchSalas()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchPeliculas = async () => {
    try {
      const response = await fetch('/api/admin/peliculas?activa=true');
      const data = await response.json();
      if (data.success) {
        setPeliculas(data.peliculas);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  const fetchSalas = async () => {
    try {
      const response = await fetch('/api/admin/salas?activa=true');
      const data = await response.json();
      if (data.success) {
        setSalas(data.salas);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Update selected movie/room data
    if (name === 'pelicula_id') {
      const pelicula = peliculas.find(p => p.id === value);
      setSelectedPelicula(pelicula || null);
    }
    
    if (name === 'sala_id') {
      const sala = salas.find(s => s.id === value);
      setSelectedSala(sala || null);
      
      // Auto-calculate suggested price based on room type
      if (sala) {
        let suggestedPrice = 8; // Precio base estándar
        
        switch (sala.tipo_sala.toLowerCase()) {
          case 'vip':
            suggestedPrice = 12;
            break;
          case 'imax':
            suggestedPrice = 15;
            break;
          case 'premium':
            suggestedPrice = 10;
            break;
          case '4dx':
            suggestedPrice = 18;
            break;
          default:
            suggestedPrice = 8;
        }
        
        // El precio_extra en la base de datos representa el recargo adicional por tipo de sala
        // pero lo limitamos a un máximo razonable
        const extraCharge = Math.min(sala.precio_extra || 0, 5);
        const totalPrice = suggestedPrice + extraCharge;
        
        setFormData(prev => ({
          ...prev,
          precio_base: totalPrice.toString()
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.pelicula_id) {
      newErrors.pelicula_id = 'Selecciona una película';
    }

    if (!formData.sala_id) {
      newErrors.sala_id = 'Selecciona una sala';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'Selecciona una fecha';
    } else {
      // Crear fechas usando el constructor de Date de forma más explícita
      const fechaInput = formData.fecha; // Formato: "YYYY-MM-DD"
      const [year, month, day] = fechaInput.split('-').map(Number);
      
      const selectedDate = new Date(year, month - 1, day); // month es 0-indexado en JS
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      console.log('🔍 Validación fecha:', { 
        fechaInput,
        year, month, day,
        fechaSeleccionada: selectedDate, 
        fechaHoy: today, 
        esAnterior: selectedDate < today 
      });
      
      if (selectedDate < today) {
        newErrors.fecha = 'La fecha no puede ser anterior a hoy';
      }
    }

    if (!formData.hora) {
      newErrors.hora = 'Selecciona una hora';
    }

    if (!formData.precio_base || parseFloat(formData.precio_base) <= 0) {
      newErrors.precio_base = 'El precio debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Combine date and time
      const fecha_hora_inicio = new Date(`${formData.fecha}T${formData.hora}`);

      const response = await fetch('/api/admin/funciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pelicula_id: formData.pelicula_id,
          sala_id: formData.sala_id,
          fecha_hora_inicio: fecha_hora_inicio.toISOString(),
          precio_base: formData.precio_base
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/funciones');
      } else {
        setErrors({ general: data.error || 'Error al crear la función' });
      }
    } catch {
      setErrors({ general: 'Error de conexión' });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateEndTime = () => {
    if (!selectedPelicula || !formData.hora) return '';
    
    const [hours, minutes] = formData.hora.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(startTime.getTime() + (selectedPelicula.duracion_minutos + 30) * 60000);
    
    return endTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/funciones')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Nueva Función</h1>
                <p className="text-sm text-gray-400">Programa una nueva función en el cine</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-300 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Selección de Película y Sala */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
              Selección de Película y Sala
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Movie Selection */}
              <div>
                <label htmlFor="pelicula_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Película *
                </label>
                <select
                  id="pelicula_id"
                  name="pelicula_id"
                  value={formData.pelicula_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.pelicula_id ? 'border-red-500/50' : ''
                  }`}
                >
                  <option value="" className="bg-gray-800">Selecciona una película</option>
                  {peliculas.map((pelicula) => (
                    <option key={pelicula.id} value={pelicula.id} className="bg-gray-800">
                      {pelicula.titulo} ({pelicula.duracion_minutos} min)
                    </option>
                  ))}
                </select>
                {errors.pelicula_id && (
                  <p className="mt-1 text-sm text-red-300">{errors.pelicula_id}</p>
                )}

                {/* Movie Details */}
                {selectedPelicula && (
                  <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-24 relative flex-shrink-0">
                        <Image
                          src={selectedPelicula.poster_url || '/resources/default.jpg'}
                          alt={selectedPelicula.titulo}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{selectedPelicula.titulo}</h4>
                        <p className="text-sm text-gray-300">
                          Duración: {selectedPelicula.duracion_minutos} minutos
                        </p>
                        <p className="text-sm text-gray-300">
                          Clasificación: {selectedPelicula.clasificacion}
                        </p>
                        {formData.hora && (
                          <p className="text-sm text-green-400 font-medium">
                            Fin estimado: {calculateEndTime()} (incluye 30 min limpieza)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Room Selection */}
              <div>
                <label htmlFor="sala_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Sala *
                </label>
                <select
                  id="sala_id"
                  name="sala_id"
                  value={formData.sala_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.sala_id ? 'border-red-500/50' : ''
                  }`}
                >
                  <option value="" className="bg-gray-800">Selecciona una sala</option>
                  {salas.map((sala) => (
                    <option key={sala.id} value={sala.id} className="bg-gray-800">
                      Sala {sala.numero} - {sala.nombre} ({sala.tipo_sala})
                    </option>
                  ))}
                </select>
                {errors.sala_id && (
                  <p className="mt-1 text-sm text-red-300">{errors.sala_id}</p>
                )}

                {/* Room Details */}
                {selectedSala && (
                  <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <h4 className="font-medium text-white mb-2">
                      Sala {selectedSala.numero} - {selectedSala.nombre}
                    </h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>Tipo: <span className="font-medium capitalize text-yellow-400">{selectedSala.tipo_sala}</span></p>
                      <p>Capacidad: <span className="font-medium text-green-400">{selectedSala.capacidad_total} asientos</span></p>
                      {selectedSala.precio_extra > 0 && (
                        <p>Recargo adicional: <span className="font-medium text-blue-400">+${Math.min(selectedSala.precio_extra, 5)}</span></p>
                      )}
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <p className="text-xs text-gray-400">
                          💡 Precio sugerido: ${formData.precio_base} 
                          {selectedSala.precio_extra > 5 && (
                            <span className="text-orange-400 ml-1">
                              (recargo limitado para mantener precios competitivos)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule and Pricing */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
              Programación y Precios
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date */}
              <div>
                <label htmlFor="fecha" className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.fecha ? 'border-red-500/50' : ''
                  }`}
                />
                {errors.fecha && (
                  <p className="mt-1 text-sm text-red-300">{errors.fecha}</p>
                )}
              </div>

              {/* Time */}
              <div>
                <label htmlFor="hora" className="block text-sm font-medium text-gray-300 mb-2">
                  Hora de inicio *
                </label>
                <input
                  type="time"
                  id="hora"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.hora ? 'border-red-500/50' : ''
                  }`}
                />
                {errors.hora && (
                  <p className="mt-1 text-sm text-red-300">{errors.hora}</p>
                )}
              </div>

              {/* Base Price */}
              <div>
                <label htmlFor="precio_base" className="block text-sm font-medium text-gray-300 mb-2">
                  Precio base ($) *
                </label>
                <input
                  type="number"
                  id="precio_base"
                  name="precio_base"
                  value={formData.precio_base}
                  onChange={handleChange}
                  min="0"
                  step="0.50"
                  className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.precio_base ? 'border-red-500/50' : ''
                  }`}
                />
                {errors.precio_base && (
                  <p className="mt-1 text-sm text-red-300">{errors.precio_base}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  💰 Precios base: Estándar $8 • Premium $10 • VIP $12 • IMAX $15 • 4DX $18
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => router.push('/admin/funciones')}
              className="px-6 py-3 bg-white/5 border border-white/20 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </span>
              ) : 'Crear Función'}
            </button>
          </div>
        </form>
        </div>
      </main>
    </div>
  );
}
