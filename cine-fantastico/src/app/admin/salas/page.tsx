"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
  fecha_creacion: string;
}

export default function AdminSalasPage() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchSalas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSalas = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter !== 'all') params.append('activa', filter);

      const response = await fetch(`/api/admin/salas?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSalas(data.salas);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchSalas();
  };

  const toggleStatus = async (id: string, activa: boolean) => {
    try {
      const response = await fetch(`/api/admin/salas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activa: !activa }),
      });

      if (response.ok) {
        fetchSalas();
      }
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  };

  const deleteSala = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sala? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/salas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSalas();
      } else {
        const data = await response.json();
        alert(data.error || 'Error al eliminar la sala');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const getTipoSalaColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'vip':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'imax':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'premium':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case '4dx':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const getEquipamientoList = (equipamiento: Record<string, boolean> | null) => {
    if (!equipamiento || typeof equipamiento !== 'object') return [];
    return Object.entries(equipamiento)
      .filter(([, value]) => value === true)
      .map(([key]) => key);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando salas...</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Gestión de Salas</h1>
                <p className="text-sm text-gray-400">Administra las salas de cine</p>
              </div>
            </div>
            <Link
              href="/admin/salas/nueva"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg"
            >
              + Nueva Sala
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buscar sala
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o número de sala..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all" className="bg-gray-800">Todas</option>
                <option value="true" className="bg-gray-800">Activas</option>
                <option value="false" className="bg-gray-800">Inactivas</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-gray-300">
            {salas.length} sala{salas.length !== 1 ? 's' : ''} encontrada{salas.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Salas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salas.map((sala) => (
            <div key={sala.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg hover:bg-white/10 transition-all duration-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Sala {sala.numero}
                  </h3>
                  <p className="text-gray-300 text-sm">{sala.nombre}</p>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                  sala.activa
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {sala.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              {/* Tipo de Sala */}
              <div className="mb-4">
                <span className={`px-3 py-1 text-sm rounded-lg font-medium capitalize ${getTipoSalaColor(sala.tipo_sala)}`}>
                  {sala.tipo_sala}
                </span>
              </div>

              {/* Información */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Capacidad:</span>
                  <span className="text-white font-medium">{sala.capacidad_total} asientos</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Configuración:</span>
                  <span className="text-white font-medium">{sala.filas} × {sala.asientos_por_fila}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Precio extra:</span>
                  <span className="text-white font-medium">${sala.precio_extra}</span>
                </div>
              </div>

              {/* Equipamiento */}
              {getEquipamientoList(sala.equipamiento).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">Equipamiento:</p>
                  <div className="flex flex-wrap gap-1">
                    {getEquipamientoList(sala.equipamiento).slice(0, 3).map((equipo) => (
                      <span key={equipo} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                        {equipo}
                      </span>
                    ))}
                    {getEquipamientoList(sala.equipamiento).length > 3 && (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                        +{getEquipamientoList(sala.equipamiento).length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="flex space-x-2">
                  <Link
                    href={`/admin/salas/${sala.id}/edit`}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => toggleStatus(sala.id, sala.activa)}
                    className={`text-sm font-medium transition-colors ${
                      sala.activa
                        ? 'text-yellow-400 hover:text-yellow-300'
                        : 'text-green-400 hover:text-green-300'
                    }`}
                  >
                    {sala.activa ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
                <button
                  onClick={() => deleteSala(sala.id)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {salas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No hay salas</h3>
            <p className="text-gray-400 mb-6">Comienza creando tu primera sala de cine</p>
            <Link
              href="/admin/salas/nueva"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
            >
              Crear Primera Sala
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
