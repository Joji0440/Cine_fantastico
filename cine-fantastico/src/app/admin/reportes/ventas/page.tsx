'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Calendar, DollarSign, TrendingUp, Users, Filter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface TopPelicula {
  funcion_id: string;
  _sum: {
    precio_total: number | null;
    cantidad_asientos: number | null;
  };
  _count: {
    id: number;
  };
  pelicula: {
    titulo: string;
    poster_url?: string;
  } | null;
}

interface Filtros {
  periodo: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  pelicula: string;
  sala: string;
  estado: string;
}

interface Reserva {
  id: string;
  codigo_reserva: string;
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
  };
  funcion: {
    fecha_hora_inicio: string;
    precio_base: number;
    pelicula: {
      titulo: string;
      poster_url?: string;
      clasificacion: string;
    };
    sala: {
      numero: number;
      nombre: string;
      tipo_sala: string;
    };
  };
  cantidad_asientos: number;
  precio_total: number;
  estado: string;
  fecha_reserva: string;
}

interface Metricas {
  total_reservas: number;
  ingresos_total: number;
  asientos_vendidos: number;
  precio_promedio: number;
  por_estado: Array<{
    estado: string;
    cantidad: number;
    ingresos: number;
  }>;
}

interface VentasData {
  reservas: Reserva[];
  metricas: Metricas;
  top_peliculas: TopPelicula[];
  filtros: Filtros;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function ReporteVentasPage() {
  const [data, setData] = useState<VentasData | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [periodo, setPeriodo] = useState('month');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [pelicula, setPelicula] = useState('');
  const [sala, setSala] = useState('');
  const [estado, setEstado] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        periodo,
        pelicula,
        sala,
        estado,
        page: page.toString(),
        limit: limit.toString()
      });

      if (periodo === 'custom' && fechaInicio && fechaFin) {
        params.append('fechaInicio', fechaInicio);
        params.append('fechaFin', fechaFin);
      }

      const response = await fetch(`/api/admin/reportes/ventas?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  }, [periodo, fechaInicio, fechaFin, pelicula, sala, estado, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    // Implementar exportación a CSV/PDF
    console.log('Exportando datos...');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagada': return 'bg-green-500/20 text-green-300';
      case 'confirmada': return 'bg-blue-500/20 text-blue-300';
      case 'pendiente': return 'bg-yellow-500/20 text-yellow-300';
      case 'cancelada': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/admin/reportes"
              className="text-blue-300 hover:text-blue-200 mb-2 inline-block"
            >
              ← Volver a Reportes
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">
              💰 Reporte de Ventas
            </h1>
            <p className="text-blue-200">
              Análisis detallado de ingresos y transacciones
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300"
          >
            <Download size={20} />
            Exportar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Filter size={20} />
            Filtros
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Período */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Período
              </label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-gray-500 transition-colors duration-200"
                style={{
                  colorScheme: 'dark'
                }}
              >
                <option value="today" className="bg-gray-800 text-white">Hoy</option>
                <option value="week" className="bg-gray-800 text-white">Esta semana</option>
                <option value="month" className="bg-gray-800 text-white">Este mes</option>
                <option value="year" className="bg-gray-800 text-white">Este año</option>
                <option value="custom" className="bg-gray-800 text-white">Personalizado</option>
              </select>
            </div>

            {/* Fechas personalizadas */}
            {periodo === 'custom' && (
              <>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-gray-500 transition-colors duration-200"
                    style={{
                      colorScheme: 'dark'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-gray-500 transition-colors duration-200"
                    style={{
                      colorScheme: 'dark'
                    }}
                  />
                </div>
              </>
            )}

            {/* Estado */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-gray-500 transition-colors duration-200"
                style={{
                  colorScheme: 'dark'
                }}
              >
                <option value="all" className="bg-gray-800 text-white">Todos</option>
                <option value="pendiente" className="bg-gray-800 text-white">Pendientes</option>
                <option value="confirmada" className="bg-gray-800 text-white">Confirmadas</option>
                <option value="pagada" className="bg-gray-800 text-white">Pagadas</option>
                <option value="cancelada" className="bg-gray-800 text-white">Canceladas</option>
              </select>
            </div>

            {/* Película */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Película
              </label>
              <input
                type="text"
                value={pelicula}
                onChange={(e) => setPelicula(e.target.value)}
                placeholder="Buscar película..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-gray-500 transition-colors duration-200"
              />
            </div>

            {/* Sala */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Sala
              </label>
              <input
                type="text"
                value={sala}
                onChange={(e) => setSala(e.target.value)}
                placeholder="Nombre o número..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-gray-500 transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        {/* Métricas */}
        {data?.metricas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Reservas</p>
                  <p className="text-3xl font-bold text-white">
                    {data.metricas.total_reservas.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Ingresos Totales</p>
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency(data.metricas.ingresos_total)}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Asientos Vendidos</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {data.metricas.asientos_vendidos.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Precio Promedio</p>
                  <p className="text-3xl font-bold text-orange-400">
                    {formatCurrency(data.metricas.precio_promedio)}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Calendar className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Reservas */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                📋 Detalle de Ventas
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value="10">10 por página</option>
                  <option value="20">20 por página</option>
                  <option value="50">50 por página</option>
                  <option value="100">100 por página</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-blue-200 font-medium">Código</th>
                    <th className="text-left p-4 text-blue-200 font-medium">Cliente</th>
                    <th className="text-left p-4 text-blue-200 font-medium">Película</th>
                    <th className="text-left p-4 text-blue-200 font-medium">Sala</th>
                    <th className="text-left p-4 text-blue-200 font-medium">Función</th>
                    <th className="text-left p-4 text-blue-200 font-medium">Asientos</th>
                    <th className="text-left p-4 text-blue-200 font-medium">Total</th>
                    <th className="text-left p-4 text-blue-200 font-medium">Estado</th>
                    <th className="text-left p-4 text-blue-200 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.reservas.map((reserva) => (
                    <tr key={reserva.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="p-4">
                        <span className="text-white font-mono text-sm">
                          {reserva.codigo_reserva}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">
                            {reserva.usuario.nombre} {reserva.usuario.apellido}
                          </p>
                          <p className="text-blue-300 text-sm">
                            {reserva.usuario.email}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {reserva.funcion.pelicula.poster_url && (
                            <Image
                              src={reserva.funcion.pelicula.poster_url}
                              alt={`Póster de ${reserva.funcion.pelicula.titulo}`}
                              width={40}
                              height={56}
                              className="object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {reserva.funcion.pelicula.titulo}
                            </p>
                            <p className="text-blue-300 text-sm">
                              {reserva.funcion.pelicula.clasificacion}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">
                            Sala {reserva.funcion.sala.numero}
                          </p>
                          <p className="text-blue-300 text-sm">
                            {reserva.funcion.sala.nombre}
                          </p>
                          <p className="text-blue-300 text-sm">
                            {reserva.funcion.sala.tipo_sala}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">
                          {formatDate(reserva.funcion.fecha_hora_inicio)}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-medium">
                          {reserva.cantidad_asientos}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-green-400 font-bold">
                          {formatCurrency(reserva.precio_total)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(reserva.estado)}`}>
                          {reserva.estado}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">
                          {formatDate(reserva.fecha_reserva)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data?.reservas.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-blue-300 text-lg">
                    No se encontraron ventas para los filtros seleccionados
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-6 border-t border-white/10 flex items-center justify-between">
              <div className="text-blue-200 text-sm">
                Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, pagination.total)} de {pagination.total} resultados
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
                >
                  Anterior
                </button>
                
                <span className="px-4 py-2 text-white">
                  {page} de {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
