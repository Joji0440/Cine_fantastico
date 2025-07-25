"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

interface Funcion {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  activa: boolean;
  pelicula: {
    titulo: string;
  };
}

interface Sala {
  id: string;
  numero: number;
  nombre: string;
  tipo_sala: string;
  capacidad_total: number;
  filas: number;
  asientos_por_fila: number;
  precio_extra: number;
  activa: boolean;
  equipamiento: Record<string, boolean> | null;
  notas?: string;
  fecha_creacion: string;
  funciones?: Funcion[];
}

export default function EditSalaPage() {
  const router = useRouter();
  const params = useParams();
  const salaId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sala, setSala] = useState<Sala | null>(null);
  const [hasActiveFunctions, setHasActiveFunctions] = useState(false);

  const [formData, setFormData] = useState({
    numero: '',
    nombre: '',
    tipo_sala: 'estandar',
    filas: '',
    asientos_por_fila: '',
    precio_extra: '',
    activa: true,
    notas: ''
  });

  const [equipamiento, setEquipamiento] = useState({
    aire_acondicionado: false,
    sistema_sonido_dolby: false,
    proyector_4k: false,
    sistema_3d: false,
    asientos_reclinables: false,
    sistema_vibracion: false,
    pantalla_premium: false,
    iluminacion_led: false,
    accesibilidad_discapacitados: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const loadSala = async () => {
      try {
        const response = await fetch(`/api/admin/salas/${salaId}`);
        const data = await response.json();
        
        if (data.success) {
          const salaData = data.sala;
          setSala(salaData);
          
          // Populate form data
          setFormData({
            numero: salaData.numero.toString(),
            nombre: salaData.nombre,
            tipo_sala: salaData.tipo_sala,
            filas: salaData.filas.toString(),
            asientos_por_fila: salaData.asientos_por_fila.toString(),
            precio_extra: salaData.precio_extra.toString(),
            activa: salaData.activa,
            notas: salaData.notas || ''
          });

          // Populate equipment
          if (salaData.equipamiento) {
            setEquipamiento(prev => ({
              ...prev,
              ...salaData.equipamiento
            }));
          }

          // Check for active functions
          const activeFunctions = salaData.funciones?.filter((f: Funcion) => 
            f.activa && new Date(f.fecha_hora_inicio) >= new Date()
          ) || [];
          setHasActiveFunctions(activeFunctions.length > 0);

        } else {
          setErrors({ general: data.error || 'Error al cargar la sala' });
        }
      } catch {
        setErrors({ general: 'Error de conexión' });
      } finally {
        setLoading(false);
      }
    };

    if (salaId) {
      loadSala();
    }
  }, [salaId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Auto-calculate capacity
    if (name === 'filas' || name === 'asientos_por_fila') {
      const filas = name === 'filas' ? parseInt(value) || 0 : parseInt(formData.filas) || 0;
      const asientos = name === 'asientos_por_fila' ? parseInt(value) || 0 : parseInt(formData.asientos_por_fila) || 0;
      
      // Don't auto-update if there are active functions (capacity changes not allowed)
      if (!hasActiveFunctions && filas > 0 && asientos > 0) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  const handleEquipmentChange = (equipment: string) => {
    setEquipamiento(prev => ({
      ...prev,
      [equipment]: !prev[equipment as keyof typeof prev]
    }));
  };

  const calculateCapacity = () => {
    const filas = parseInt(formData.filas) || 0;
    const asientos = parseInt(formData.asientos_por_fila) || 0;
    return filas * asientos;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.numero || parseInt(formData.numero) < 1) {
      newErrors.numero = 'El número de sala debe ser mayor a 0';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!hasActiveFunctions) {
      if (!formData.filas || parseInt(formData.filas) < 1) {
        newErrors.filas = 'El número de filas debe ser mayor a 0';
      }

      if (!formData.asientos_por_fila || parseInt(formData.asientos_por_fila) < 1) {
        newErrors.asientos_por_fila = 'Los asientos por fila deben ser mayor a 0';
      }

      const capacity = calculateCapacity();
      if (capacity < 1) {
        newErrors.capacidad = 'La capacidad debe ser mayor a 0';
      }
    }

    if (parseFloat(formData.precio_extra) < 0) {
      newErrors.precio_extra = 'El precio extra no puede ser negativo';
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
      const submitData: Record<string, unknown> = {
        numero: parseInt(formData.numero),
        nombre: formData.nombre.trim(),
        tipo_sala: formData.tipo_sala,
        precio_extra: parseFloat(formData.precio_extra) || 0,
        activa: formData.activa,
        equipamiento,
        notas: formData.notas.trim()
      };

      // Only include capacity fields if there are no active functions
      if (!hasActiveFunctions) {
        submitData.filas = parseInt(formData.filas);
        submitData.asientos_por_fila = parseInt(formData.asientos_por_fila);
        submitData.capacidad_total = calculateCapacity();
      }

      const response = await fetch(`/api/admin/salas/${salaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/salas');
      } else {
        setErrors({ general: data.error || 'Error al actualizar la sala' });
      }
    } catch {
      setErrors({ general: 'Error de conexión' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando sala...</p>
        </div>
      </div>
    );
  }

  if (!sala) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Sala no encontrada</h3>
          <p className="text-gray-400 mb-6">La sala que buscas no existe o no tienes permisos para verla</p>
          <button
            onClick={() => router.push('/admin/salas')}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
          >
            Volver a Salas
          </button>
        </div>
      </div>
    );
  }

  const equipmentOptions = [
    { key: 'aire_acondicionado', label: 'Aire Acondicionado' },
    { key: 'sistema_sonido_dolby', label: 'Sistema Sonido Dolby' },
    { key: 'proyector_4k', label: 'Proyector 4K' },
    { key: 'sistema_3d', label: 'Sistema 3D' },
    { key: 'asientos_reclinables', label: 'Asientos Reclinables' },
    { key: 'sistema_vibracion', label: 'Sistema Vibración' },
    { key: 'pantalla_premium', label: 'Pantalla Premium' },
    { key: 'iluminacion_led', label: 'Iluminación LED' },
    { key: 'accesibilidad_discapacitados', label: 'Accesibilidad' }
  ];

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
                <span className="text-2xl">🏛️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Editar Sala {sala.numero}</h1>
                <p className="text-sm text-gray-400">Modifica la configuración de la sala</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                sala.activa
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {sala.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning for active functions */}
        {hasActiveFunctions && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-300">Limitaciones por funciones activas</h3>
                <p className="text-sm text-yellow-200 mt-1">
                  Esta sala tiene funciones programadas. Solo se pueden modificar el estado, precio extra, equipamiento y notas.
                  Para cambios estructurales, cancela las funciones futuras primero.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-300 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Información Básica
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    disabled={hasActiveFunctions}
                    min="1"
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      hasActiveFunctions ? 'opacity-50 cursor-not-allowed' : ''
                    } ${errors.numero ? 'border-red-500/50' : ''}`}
                  />
                  {errors.numero && (
                    <p className="mt-1 text-sm text-red-300">{errors.numero}</p>
                  )}
                </div>

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
                    placeholder="Ej: Sala Principal, VIP Premium..."
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      errors.nombre ? 'border-red-500/50' : ''
                    }`}
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-300">{errors.nombre}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tipo_sala" className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Sala
                  </label>
                  <select
                    id="tipo_sala"
                    name="tipo_sala"
                    value={formData.tipo_sala}
                    onChange={handleChange}
                    disabled={hasActiveFunctions}
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      hasActiveFunctions ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="estandar" className="bg-gray-800">Estándar</option>
                    <option value="premium" className="bg-gray-800">Premium</option>
                    <option value="vip" className="bg-gray-800">VIP</option>
                    <option value="imax" className="bg-gray-800">IMAX</option>
                    <option value="4dx" className="bg-gray-800">4DX</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="activa" className="block text-sm font-medium text-gray-300 mb-2">
                    Estado de la Sala
                  </label>
                  <select
                    id="activa"
                    name="activa"
                    value={formData.activa.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, activa: e.target.value === 'true' }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="true" className="bg-gray-800">Activa</option>
                    <option value="false" className="bg-gray-800">Inactiva</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Capacity Configuration */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Configuración de Capacidad
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    disabled={hasActiveFunctions}
                    min="1"
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      hasActiveFunctions ? 'opacity-50 cursor-not-allowed' : ''
                    } ${errors.filas ? 'border-red-500/50' : ''}`}
                  />
                  {errors.filas && (
                    <p className="mt-1 text-sm text-red-300">{errors.filas}</p>
                  )}
                </div>

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
                    disabled={hasActiveFunctions}
                    min="1"
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      hasActiveFunctions ? 'opacity-50 cursor-not-allowed' : ''
                    } ${errors.asientos_por_fila ? 'border-red-500/50' : ''}`}
                  />
                  {errors.asientos_por_fila && (
                    <p className="mt-1 text-sm text-red-300">{errors.asientos_por_fila}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Capacidad Total
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-800/30 border border-white/10 rounded-lg text-gray-300 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-400">
                      {hasActiveFunctions ? sala.capacidad_total : calculateCapacity()}
                    </span>
                    <span className="ml-2 text-sm">asientos</span>
                  </div>
                  {errors.capacidad && (
                    <p className="mt-1 text-sm text-red-300">{errors.capacidad}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Configuración de Precios
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    step="0.5"
                    className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      errors.precio_extra ? 'border-red-500/50' : ''
                    }`}
                  />
                  {errors.precio_extra && (
                    <p className="mt-1 text-sm text-red-300">{errors.precio_extra}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Recargo adicional por tipo de sala (recomendado máximo $5)
                  </p>
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Equipamiento
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {equipmentOptions.map((option) => (
                  <label key={option.key} className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={equipamiento[option.key as keyof typeof equipamiento]}
                      onChange={() => handleEquipmentChange(option.key)}
                      className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-white/20 rounded bg-white/5"
                    />
                    <span className="text-white text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-white/20 pb-2">
                Notas Adicionales
              </h2>
              
              <div>
                <label htmlFor="notas" className="block text-sm font-medium text-gray-300 mb-2">
                  Notas y Observaciones
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Información adicional sobre la sala, mantenimiento, restricciones, etc."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
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
                    Actualizando...
                  </span>
                ) : 'Actualizar Sala'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
