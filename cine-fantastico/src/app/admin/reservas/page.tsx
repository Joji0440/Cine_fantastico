"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Reserva {
  id: string;
  codigo_reserva: string;
  usuario_id: string;
  funcion_id: string;
  cantidad_asientos: number;
  precio_subtotal: number;
  precio_total: number;
  estado: 'pendiente' | 'confirmada' | 'pagada' | 'cancelada' | 'usada' | 'vencida';
  metodo_pago?: string;
  fecha_reserva: string;
  fecha_pago?: string;
  notas?: string;
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  };
  funcion: {
    id: string;
    fecha_hora_inicio: string;
    precio_base: number;
    pelicula: {
      titulo: string;
      poster_url?: string;
      duracion_minutos: number;
      clasificacion: string;
    };
    sala: {
      numero: number;
      nombre: string;
      tipo_sala: string;
    };
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function AdminReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    fetchReservas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReservas = async (newPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterEstado !== 'all') params.append('estado', filterEstado);
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (fechaHasta) params.append('fechaHasta', fechaHasta);
      params.append('page', newPage.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/reservas?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setReservas(data.reservas);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching reservations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchReservas(1); // Reset to page 1 when searching
  };

  const handlePageChange = (newPage: number) => {
    fetchReservas(newPage);
  };

  const updateReservaStatus = async (reservaId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/reservas/${reservaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar la lista local
        setReservas(prev => prev.map(reserva => 
          reserva.id === reservaId ? { ...reserva, estado: newStatus as Reserva['estado'] } : reserva
        ));
      } else {
        alert('Error al actualizar el estado de la reserva');
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
      alert('Error de conexión');
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      pendiente: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      confirmada: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      pagada: 'bg-green-500/20 text-green-300 border-green-500/30',
      cancelada: 'bg-red-500/20 text-red-300 border-red-500/30',
      usada: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      vencida: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando reservas...</p>
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
                <span className="text-2xl">🎫</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Gestión de Reservas</h1>
                <p className="text-sm text-gray-400">Administra todas las reservas del cine</p>
              </div>
            </div>
            <Link
              href="/admin/reservas/nueva"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
            >
              + Nueva Reserva
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buscar reserva
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Código, cliente o película..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all" className="bg-gray-800">Todos</option>
                <option value="pendiente" className="bg-gray-800">Pendiente</option>
                <option value="confirmada" className="bg-gray-800">Confirmada</option>
                <option value="pagada" className="bg-gray-800">Pagada</option>
                <option value="cancelada" className="bg-gray-800">Cancelada</option>
                <option value="usada" className="bg-gray-800">Usada</option>
                <option value="vencida" className="bg-gray-800">Vencida</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
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
            {pagination.total} reserva{pagination.total !== 1 ? 's' : ''} encontrada{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Reservations Table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Código / Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Función
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Asientos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reservas.map((reserva) => (
                  <tr key={reserva.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{reserva.codigo_reserva}</div>
                        <div className="text-sm text-gray-300">
                          {reserva.usuario.nombre} {reserva.usuario.apellido}
                        </div>
                        <div className="text-xs text-gray-400">{reserva.usuario.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{reserva.funcion.pelicula.titulo}</div>
                        <div className="text-sm text-gray-300">
                          Sala {reserva.funcion.sala.numero} - {reserva.funcion.sala.nombre}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(reserva.funcion.fecha_hora_inicio)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-medium">{reserva.cantidad_asientos}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-medium">{formatCurrency(reserva.precio_total)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium border ${getEstadoColor(reserva.estado)}`}>
                        {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(reserva.fecha_reserva)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link
                        href={`/admin/reservas/${reserva.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Ver
                      </Link>
                      {reserva.estado === 'pendiente' && (
                        <button
                          onClick={() => updateReservaStatus(reserva.id, 'confirmada')}
                          className="text-green-400 hover:text-green-300 font-medium"
                        >
                          Confirmar
                        </button>
                      )}
                      {reserva.estado === 'confirmada' && (
                        <button
                          onClick={() => updateReservaStatus(reserva.id, 'pagada')}
                          className="text-green-400 hover:text-green-300 font-medium"
                        >
                          Marcar Pagada
                        </button>
                      )}
                      {['pendiente', 'confirmada'].includes(reserva.estado) && (
                        <button
                          onClick={() => updateReservaStatus(reserva.id, 'cancelada')}
                          className="text-red-400 hover:text-red-300 font-medium"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {reservas.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === pagination.page
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>

            <div className="ml-4 text-sm text-gray-400">
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} reservas)
            </div>
          </div>
        )}

        {/* Empty State */}
        {reservas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No hay reservas</h3>
            <p className="text-gray-400 mb-6">No se encontraron reservas con los criterios de búsqueda actuales</p>
            <Link
              href="/admin/reservas/nueva"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
            >
              Crear Primera Reserva
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
