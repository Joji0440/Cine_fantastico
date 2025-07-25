"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Funcion {
  id: string;
  pelicula_id: string;
  sala_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  precio_base: number;
  asientos_disponibles: number;
  asientos_reservados: number;
  activa: boolean;
  fecha_creacion: string;
  // Datos relacionados
  pelicula: {
    titulo: string;
    poster_url: string;
    duracion_minutos: number;
    clasificacion: string;
  };
  sala: {
    numero: number;
    nombre: string;
    tipo_sala: string;
    capacidad_total: number;
  };
}

export default function AdminFuncionesPage() {
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchFunciones();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFunciones = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter !== 'all') params.append('activa', filter);
      if (dateFilter) params.append('fecha', dateFilter);

      const response = await fetch(`/api/admin/funciones?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setFunciones(data.funciones);
      }
    } catch (error) {
      console.error('Error fetching functions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchFunciones();
  };

  const toggleStatus = async (id: string, activa: boolean) => {
    try {
      const response = await fetch(`/api/admin/funciones/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activa: !activa }),
      });

      if (response.ok) {
        fetchFunciones();
      }
    } catch (error) {
      console.error('Error updating function status:', error);
    }
  };

  const deleteFuncion = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta función?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/funciones/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchFunciones();
      }
    } catch (error) {
      console.error('Error deleting function:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  const getOccupancyPercentage = (disponibles: number, reservados: number) => {
    const total = disponibles + reservados;
    if (total === 0) return 0;
    return Math.round((reservados / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando funciones...</p>
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
                <span className="text-2xl">🎬</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Gestión de Funciones</h1>
                <p className="text-sm text-gray-400">Administra las funciones y horarios del cine</p>
              </div>
            </div>
            <Link
              href="/admin/funciones/nueva"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg"
            >
              + Nueva Función
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buscar película o sala
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Título de película o sala..."
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              />
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
            {funciones.length} función{funciones.length !== 1 ? 'es' : ''} encontrada{funciones.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Functions Table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Película
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Sala
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ocupación
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {funciones.map((funcion) => (
                  <tr key={funcion.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-16 w-12 flex-shrink-0 relative">
                          <Image
                            src={funcion.pelicula.poster_url || '/resources/default.jpg'}
                            alt={funcion.pelicula.titulo}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {funcion.pelicula.titulo}
                          </div>
                          <div className="text-sm text-gray-400">
                            {funcion.pelicula.duracion_minutos} min • {funcion.pelicula.clasificacion}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        Sala {funcion.sala.numero}
                      </div>
                      <div className="text-sm text-gray-400">
                        {funcion.sala.nombre} ({funcion.sala.tipo_sala})
                      </div>
                      <div className="text-xs text-gray-500">
                        Cap: {funcion.sala.capacidad_total}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="font-medium">
                        {formatDateTime(funcion.fecha_hora_inicio)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        Fin: {formatDateTime(funcion.fecha_hora_fin)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="font-medium">
                        ${funcion.precio_base}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {funcion.asientos_reservados} / {funcion.asientos_disponibles + funcion.asientos_reservados}
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${getOccupancyPercentage(funcion.asientos_disponibles, funcion.asientos_reservados)}%`
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {getOccupancyPercentage(funcion.asientos_disponibles, funcion.asientos_reservados)}% ocupado
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        funcion.activa
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {funcion.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/funciones/${funcion.id}/edit`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => toggleStatus(funcion.id, funcion.activa)}
                        className={`${
                          funcion.activa
                            ? 'text-yellow-400 hover:text-yellow-300'
                            : 'text-green-400 hover:text-green-300'
                        } transition-colors`}
                      >
                        {funcion.activa ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => deleteFuncion(funcion.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {funciones.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No hay funciones</h3>
              <p className="text-gray-400 mb-6">Comienza programando tu primera función</p>
              <Link
                href="/admin/funciones/nueva"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                Crear Primera Función
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
