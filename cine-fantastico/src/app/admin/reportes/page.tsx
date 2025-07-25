'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, DollarSign, TrendingUp, Users, Film, Clock, Download, Eye } from 'lucide-react';

interface ReporteSummary {
  ventasHoy: {
    total_reservas: number;
    ingresos_total: number;
    pagadas: number;
  };
  ocupacionPromedio: number;
  peliculasActivas: number;
  usuariosRegistrados: number;
}

export default function ReportesPage() {
  const [summary, setSummary] = useState<ReporteSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reportes/summary');
      if (response.ok) {
        const data = await response.json();
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportes = [
    {
      title: 'Ventas y Ingresos',
      description: 'Reporte detallado de ventas, ingresos por película, sala y período',
      icon: DollarSign,
      href: '/admin/reportes/ventas',
      color: 'from-green-500 to-emerald-600',
      stats: summary ? `$${summary.ventasHoy.ingresos_total?.toLocaleString() || '0'} hoy` : 'Cargando...'
    },
    {
      title: 'Ocupación de Salas',
      description: 'Análisis de ocupación por sala, función y horarios pico',
      icon: TrendingUp,
      href: '/admin/reportes/ocupacion',
      color: 'from-blue-500 to-cyan-600',
      stats: summary ? `${summary.ocupacionPromedio?.toFixed(1) || '0'}% promedio` : 'Cargando...'
    },
    {
      title: 'Películas Populares',
      description: 'Ranking de películas más vistas y mejor calificadas',
      icon: Film,
      href: '/admin/reportes/peliculas',
      color: 'from-purple-500 to-indigo-600',
      stats: summary ? `${summary.peliculasActivas || '0'} activas` : 'Cargando...'
    },
    {
      title: 'Usuarios y Clientes',
      description: 'Análisis de registro, actividad y comportamiento de usuarios',
      icon: Users,
      href: '/admin/reportes/usuarios',
      color: 'from-orange-500 to-red-600',
      stats: summary ? `${summary.usuariosRegistrados || '0'} registrados` : 'Cargando...'
    },
    {
      title: 'Horarios y Tendencias',
      description: 'Análisis de horarios más populares y tendencias temporales',
      icon: Clock,
      href: '/admin/reportes/horarios',
      color: 'from-teal-500 to-cyan-600',
      stats: 'Ver análisis'
    },
    {
      title: 'Auditoría del Sistema',
      description: 'Logs de actividad, cambios y acceso al sistema',
      icon: Eye,
      href: '/admin/reportes/auditoria',
      color: 'from-slate-500 to-gray-600',
      stats: 'Ver logs'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                📊 Centro de Reportes
              </h1>
              <p className="text-blue-200">
                Análisis completo y métricas del negocio
              </p>
            </div>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300"
            >
              <Download size={20} />
              Exportar Todo
            </button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        {!loading && summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Ventas Hoy</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.ventasHoy.total_reservas || 0}
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
                  <p className="text-blue-200 text-sm">Ingresos Hoy</p>
                  <p className="text-2xl font-bold text-white">
                    ${summary.ventasHoy.ingresos_total?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Ocupación Promedio</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.ocupacionPromedio?.toFixed(1) || '0'}%
                  </p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Películas Activas</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.peliculasActivas || 0}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Film className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportes.map((reporte, index) => {
            const Icon = reporte.icon;
            return (
              <Link
                key={index}
                href={reporte.href}
                className="group block"
              >
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform group-hover:scale-[1.02] h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-r ${reporte.color} rounded-xl shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-200">
                        {reporte.stats}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                    {reporte.title}
                  </h3>
                  
                  <p className="text-blue-200 text-sm leading-relaxed">
                    {reporte.description}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <span className="text-blue-300 text-sm font-medium">
                      Ver reporte completo
                    </span>
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <span className="text-white text-xs">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-4">
            🚀 Acceso Rápido
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/admin/reportes/ventas?periodo=today"
              className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Calendar className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-medium">Ventas Hoy</p>
                <p className="text-blue-200 text-sm">Reporte diario</p>
              </div>
            </Link>

            <Link 
              href="/admin/reportes/ocupacion?sala=all&fecha=today"
              className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Ocupación Actual</p>
                <p className="text-blue-200 text-sm">Estado en tiempo real</p>
              </div>
            </Link>

            <Link 
              href="/admin/reportes/peliculas?orden=popularidad"
              className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Film className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-white font-medium">Top Películas</p>
                <p className="text-blue-200 text-sm">Ranking semanal</p>
              </div>
            </Link>

            <Link 
              href="/admin/reportes/auditoria?accion=all&limit=50"
              className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Eye className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-white font-medium">Actividad Reciente</p>
                <p className="text-blue-200 text-sm">Logs del sistema</p>
              </div>
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
}
