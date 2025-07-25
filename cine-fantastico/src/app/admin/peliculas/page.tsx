"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Pelicula {
  id: string;
  titulo: string;
  director: string;
  genero: string;
  duracion_minutos: number;
  clasificacion: string;
  fecha_estreno_local: string;
  poster_url: string;
  activa: boolean;
  fecha_creacion: string;
}

export default function AdminPeliculasPage() {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchPeliculas = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter !== 'all') params.append('activa', filter);

      const response = await fetch(`/api/admin/peliculas?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPeliculas(data.peliculas);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchPeliculas();
  }, [fetchPeliculas]);

  const handleSearch = () => {
    setLoading(true);
    fetchPeliculas();
  };

  const toggleActiva = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/peliculas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activa: !currentStatus }),
      });

      if (response.ok) {
        setPeliculas(prev => 
          prev.map(p => 
            p.id === id ? { ...p, activa: !currentStatus } : p
          )
        );
      }
    } catch (error) {
      console.error('Error updating movie status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando películas...</p>
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
              <Link 
                href="/dashboard/admin"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Gestión de Películas</h1>
                <p className="text-sm text-gray-400">Administrar catálogo</p>
              </div>
            </div>
            
            <Link
              href="/admin/peliculas/nueva"
              className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              + Nueva Película
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Buscar por título, director o género..."
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all" className="bg-gray-800">Todas</option>
              <option value="true" className="bg-gray-800">Activas</option>
              <option value="false" className="bg-gray-800">Inactivas</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-medium rounded-lg transition-colors duration-200"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-blue-300 text-sm font-medium">Total Películas</h3>
            <p className="text-2xl font-bold text-white">{peliculas.length}</p>
          </div>
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-green-300 text-sm font-medium">Activas</h3>
            <p className="text-2xl font-bold text-white">
              {peliculas.filter(p => p.activa).length}
            </p>
          </div>
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-red-300 text-sm font-medium">Inactivas</h3>
            <p className="text-2xl font-bold text-white">
              {peliculas.filter(p => !p.activa).length}
            </p>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-yellow-300 text-sm font-medium">Este Mes</h3>
            <p className="text-2xl font-bold text-white">
              {peliculas.filter(p => {
                const fechaCreacion = new Date(p.fecha_creacion);
                const ahora = new Date();
                return fechaCreacion.getMonth() === ahora.getMonth() && 
                       fechaCreacion.getFullYear() === ahora.getFullYear();
              }).length}
            </p>
          </div>
        </div>

        {/* Movies List */}
        {peliculas.length > 0 ? (
          <div className="space-y-4">
            {peliculas.map((pelicula) => (
              <div
                key={pelicula.id}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Poster */}
                  <div className="flex-shrink-0">
                    {pelicula.poster_url ? (
                      <img
                        src={pelicula.poster_url}
                        alt={pelicula.titulo}
                        className="w-24 h-32 object-cover rounded-lg border border-white/10"
                        onError={(e) => {
                          e.currentTarget.src = '/resources/default.jpg';
                          e.currentTarget.className += ' opacity-50';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-32 bg-gray-700 rounded-lg flex items-center justify-center border border-white/10">
                        <span className="text-4xl">🎬</span>
                      </div>
                    )}
                  </div>

                  {/* Movie Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {pelicula.titulo}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {pelicula.director} • {pelicula.genero} • {pelicula.duracion_minutos} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          pelicula.activa 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {pelicula.activa ? 'Activa' : 'Inactiva'}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {pelicula.clasificacion === 'PG_13' ? 'PG-13' : pelicula.clasificacion}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span>📅 {pelicula.fecha_estreno_local ? new Date(pelicula.fecha_estreno_local).toLocaleDateString() : 'Sin fecha'}</span>
                      <span>📅 Creada: {new Date(pelicula.fecha_creacion).toLocaleDateString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/peliculas/${pelicula.id}`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200"
                      >
                        Ver Detalles
                      </Link>
                      <Link
                        href={`/admin/peliculas/${pelicula.id}/edit`}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-black text-sm rounded-lg transition-colors duration-200"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => toggleActiva(pelicula.id, pelicula.activa)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                          pelicula.activa
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {pelicula.activa ? 'Desactivar' : 'Activar'}
                      </button>
                      <Link
                        href={`/admin/funciones/nueva?pelicula=${pelicula.id}`}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors duration-200"
                      >
                        Programar Función
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold text-white mb-2">No se encontraron películas</h3>
            <p className="text-gray-400 mb-6">
              {search || filter !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Comienza agregando tu primera película al catálogo.'
              }
            </p>
            <Link
              href="/admin/peliculas/nueva"
              className="inline-block bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              + Agregar Primera Película
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
