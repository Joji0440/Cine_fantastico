"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EquipamientoState {
  [key: string]: boolean;
}

export default function NuevaSalaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    numero: '',
    nombre: '',
    tipo_sala: 'standard',
    capacidad_total: '',
    filas: '',
    asientos_por_fila: '',
    precio_extra: '0',
    notas: ''
  });

  const [equipamiento, setEquipamiento] = useState<EquipamientoState>({
    '3D': false,
    'Dolby_Atmos': false,
    'IMAX': false,
    '4DX': false,
    'D-BOX': false,
    'Reclining_Seats': false,
    'VIP_Service': false,
    'Bar': false,
    'Premium_Sound': false,
    'Laser_Projection': false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const tiposSala = [
    { value: 'standard', label: 'Estándar', color: 'text-gray-300' },
    { value: 'premium', label: 'Premium', color: 'text-purple-400' },
    { value: 'vip', label: 'VIP', color: 'text-yellow-400' },
    { value: 'imax', label: 'IMAX', color: 'text-blue-400' },
    { value: '4dx', label: '4DX', color: 'text-green-400' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate capacity
    if (name === 'filas' || name === 'asientos_por_fila') {
      const filas = name === 'filas' ? parseInt(value) || 0 : parseInt(formData.filas) || 0;
      const asientos = name === 'asientos_por_fila' ? parseInt(value) || 0 : parseInt(formData.asientos_por_fila) || 0;
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        capacidad_total: (filas * asientos).toString()
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEquipamientoChange = (key: string) => {
    setEquipamiento(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.numero || parseInt(formData.numero) <= 0) {
      newErrors.numero = 'El número de sala es obligatorio y debe ser mayor a 0';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la sala es obligatorio';
    }

    if (!formData.filas || parseInt(formData.filas) <= 0) {
      newErrors.filas = 'El número de filas debe ser mayor a 0';
    }

    if (!formData.asientos_por_fila || parseInt(formData.asientos_por_fila) <= 0) {
      newErrors.asientos_por_fila = 'El número de asientos por fila debe ser mayor a 0';
    }

    if (parseFloat(formData.precio_extra) < 0) {
      newErrors.precio_extra = 'El precio extra no puede ser negativo';
    }

    // Validate capacity calculation
    const filas = parseInt(formData.filas) || 0;
    const asientos = parseInt(formData.asientos_por_fila) || 0;
    const capacidad = parseInt(formData.capacidad_total) || 0;
    
    if (filas * asientos !== capacidad) {
      newErrors.capacidad_total = 'La capacidad total no coincide con filas × asientos por fila';
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
      const response = await fetch('/api/admin/salas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          equipamiento
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/salas');
      } else {
        setErrors({ general: data.error || 'Error al crear la sala' });
      }
    } catch {
      setErrors({ general: 'Error de conexión' });
    } finally {
      setSubmitting(false);
    }
  };

  const getEquipamientoLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      '3D': '3D',
      'Dolby_Atmos': 'Dolby Atmos',
      'IMAX': 'IMAX',
      '4DX': '4DX',
      'D-BOX': 'D-BOX',
      'Reclining_Seats': 'Asientos Reclinables',
      'VIP_Service': 'Servicio VIP',
      'Bar': 'Bar',
      'Premium_Sound': 'Sonido Premium',
      'Laser_Projection': 'Proyección Láser'
    };
    return labels[key] || key;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/salas')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Nueva Sala</h1>
                <p className="text-sm text-gray-400">Crea una nueva sala de cine</p>
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

            {/* Información Básica */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Información Básica
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Número de Sala */}
                <div>
                  <label htmlFor="numero" className="block text-sm font-medium text-gray-300 mb-2">
                    Número de Sala *
                  </label>
                  <input
                    type="number"
                    id="numero"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      errors.numero ? 'border-red-500/50' : ''
                    }`}
                    placeholder="1, 2, 3..."
                  />
                  {errors.numero && (
                    <p className="mt-1 text-sm text-red-300">{errors.numero}</p>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre de la Sala *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      errors.nombre ? 'border-red-500/50' : ''
                    }`}
                    placeholder="Sala Principal, Sala VIP, etc."
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-300">{errors.nombre}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Sala */}
                <div>
                  <label htmlFor="tipo_sala" className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Sala
                  </label>
                  <select
                    id="tipo_sala"
                    name="tipo_sala"
                    value={formData.tipo_sala}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  >
                    {tiposSala.map((tipo) => (
                      <option key={tipo.value} value={tipo.value} className="bg-gray-800">
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Precio Extra */}
                <div>
                  <label htmlFor="precio_extra" className="block text-sm font-medium text-gray-300 mb-2">
                    Precio Extra ($)
                  </label>
                  <input
                    type="number"
                    id="precio_extra"
                    name="precio_extra"
                    value={formData.precio_extra}
                    onChange={handleChange}
                    min="0"
                    step="0.50"
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      errors.precio_extra ? 'border-red-500/50' : ''
                    }`}
                    placeholder="0.00"
                  />
                  {errors.precio_extra && (
                    <p className="mt-1 text-sm text-red-300">{errors.precio_extra}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Configuración de Asientos */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Configuración de Asientos
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Filas */}
                <div>
                  <label htmlFor="filas" className="block text-sm font-medium text-gray-300 mb-2">
                    Número de Filas *
                  </label>
                  <input
                    type="number"
                    id="filas"
                    name="filas"
                    value={formData.filas}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      errors.filas ? 'border-red-500/50' : ''
                    }`}
                    placeholder="10"
                  />
                  {errors.filas && (
                    <p className="mt-1 text-sm text-red-300">{errors.filas}</p>
                  )}
                </div>

                {/* Asientos por Fila */}
                <div>
                  <label htmlFor="asientos_por_fila" className="block text-sm font-medium text-gray-300 mb-2">
                    Asientos por Fila *
                  </label>
                  <input
                    type="number"
                    id="asientos_por_fila"
                    name="asientos_por_fila"
                    value={formData.asientos_por_fila}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      errors.asientos_por_fila ? 'border-red-500/50' : ''
                    }`}
                    placeholder="20"
                  />
                  {errors.asientos_por_fila && (
                    <p className="mt-1 text-sm text-red-300">{errors.asientos_por_fila}</p>
                  )}
                </div>

                {/* Capacidad Total */}
                <div>
                  <label htmlFor="capacidad_total" className="block text-sm font-medium text-gray-300 mb-2">
                    Capacidad Total
                  </label>
                  <input
                    type="number"
                    id="capacidad_total"
                    name="capacidad_total"
                    value={formData.capacidad_total}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-lg text-gray-300 cursor-not-allowed"
                    placeholder="Se calcula automáticamente"
                  />
                  {errors.capacidad_total && (
                    <p className="mt-1 text-sm text-red-300">{errors.capacidad_total}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Se calcula automáticamente: filas × asientos por fila
                  </p>
                </div>
              </div>
            </div>

            {/* Equipamiento */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Equipamiento
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(equipamiento).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleEquipamientoChange(key)}
                      className="w-4 h-4 text-red-600 bg-white/5 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-300">{getEquipamientoLabel(key)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Información Adicional
              </h2>
              
              <div>
                <label htmlFor="notas" className="block text-sm font-medium text-gray-300 mb-2">
                  Notas
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Información adicional sobre la sala..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => router.push('/admin/salas')}
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
                ) : 'Crear Sala'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
