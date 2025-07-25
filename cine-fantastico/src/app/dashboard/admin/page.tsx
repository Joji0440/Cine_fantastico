"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  peliculas: {
    total: number;
    activas: number;
  };
  reservas: {
    hoy: number;
    asientos_vendidos: number;
    por_estado: Record<string, number>;
  };
  ingresos: {
    hoy: number;
  };
  usuarios: {
    total: number;
  };
  funciones: {
    hoy: number;
  };
  salas: {
    activas: number;
  };
  ocupacion: {
    porcentaje: number;
    capacidad_total: number;
    asientos_ocupados: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Simplificar la validación de acceso
  const allowedRoles = ['empleado', 'administrador', 'gerente'];
  const hasAccess = user && user.activo && allowedRoles.includes(user.tipo_usuario);

  useEffect(() => {
    if (!authLoading && !hasAccess) {
      router.push('/auth/login');
    }
  }, [authLoading, hasAccess, router]);

  // ⚠️ TODAS las funciones van aquí
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess && user) {
      fetchStats();
    }
  }, [hasAccess, user, fetchStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Mostrar loading siempre que esté cargando
  if (authLoading || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">
            {authLoading ? 'Verificando sesión...' : 'Verificando permisos...'}
          </p>
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
                <h1 className="text-xl font-bold">
                  <span className="text-red-500">Cine</span>{" "}
                  <span className="text-yellow-500">Fantástico</span>
                </h1>
                <p className="text-sm text-gray-400">Panel de Administración</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-right">
                  <p className="text-white font-medium">{user.nombre} {user.apellido}</p>
                  <p className="text-gray-400 text-sm">
                    {user.tipo_usuario.charAt(0).toUpperCase() + user.tipo_usuario.slice(1)}
                  </p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Panel de Administración{user ? `, ${user.nombre}` : ""}
            </h2>
            <p className="text-gray-400">
              Gestiona el cine, películas, funciones y usuarios desde aquí.
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={statsLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-300 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`text-lg ${statsLoading ? 'animate-spin' : ''}`}>🔄</span>
            Actualizar
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-300 text-sm font-medium">Total Películas</h3>
                <p className="text-3xl font-bold text-white">
                  {statsLoading ? '--' : stats?.peliculas?.total || '0'}
                </p>
                <p className="text-blue-400 text-sm">En cartelera</p>
              </div>
              <div className="text-4xl text-blue-400">🎭</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-300 text-sm font-medium">Reservas Hoy</h3>
                <p className="text-3xl font-bold text-white">
                  {statsLoading ? '--' : (stats?.reservas?.hoy || 0).toLocaleString()}
                </p>
                <p className="text-green-400 text-sm">
                  {statsLoading ? 'Entradas vendidas' : `${stats?.reservas?.asientos_vendidos || 0} asientos`}
                </p>
              </div>
              <div className="text-4xl text-green-400">🎫</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 backdrop-blur-md border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-yellow-300 text-sm font-medium">Ingresos Hoy</h3>
                <p className="text-3xl font-bold text-white">
                  {statsLoading ? '$--' : formatCurrency(stats?.ingresos?.hoy || 0)}
                </p>
                <p className="text-yellow-400 text-sm">MXN</p>
              </div>
              <div className="text-4xl text-yellow-400">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-md border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-purple-300 text-sm font-medium">Usuarios</h3>
                <p className="text-3xl font-bold text-white">
                  {statsLoading ? '--' : (stats?.usuarios?.total || 0).toLocaleString()}
                </p>
                <p className="text-purple-400 text-sm">Registrados</p>
              </div>
              <div className="text-4xl text-purple-400">👥</div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-orange-300 text-sm font-medium">Funciones Hoy</h3>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '--' : stats?.funciones?.hoy || '0'}
                </p>
                <p className="text-orange-400 text-sm">Programadas</p>
              </div>
              <div className="text-3xl text-orange-400">🎬</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-cyan-300 text-sm font-medium">Salas Activas</h3>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '--' : stats?.salas?.activas || '0'}
                </p>
                <p className="text-cyan-400 text-sm">En operación</p>
              </div>
              <div className="text-3xl text-cyan-400">🏛️</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-pink-300 text-sm font-medium">Ocupación</h3>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '--%' : `${stats?.ocupacion?.porcentaje || 0}%`}
                </p>
                <p className="text-pink-400 text-sm">Promedio hoy</p>
              </div>
              <div className="text-3xl text-pink-400">📊</div>
            </div>
          </div>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Gestión de Películas</h3>
                <p className="text-gray-400 text-sm">Agregar, editar, eliminar</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link 
                href="/admin/peliculas"
                className="block text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
              >
                Ver todas las películas →
              </Link>
              <Link 
                href="/admin/peliculas/nueva"
                className="block text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-200"
              >
                Agregar película →
              </Link>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🕐</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Gestión de Funciones</h3>
                <p className="text-gray-400 text-sm">Horarios y salas</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link 
                href="/admin/funciones"
                className="block text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
              >
                Ver funciones →
              </Link>
              <Link 
                href="/admin/funciones/nueva"
                className="block text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-200"
              >
                Programar función →
              </Link>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Gestión de Salas</h3>
                <p className="text-gray-400 text-sm">Salas y asientos</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link 
                href="/admin/salas"
                className="block text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
              >
                Ver salas →
              </Link>
              <Link 
                href="/admin/salas/nueva"
                className="block text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-200"
              >
                Crear sala →
              </Link>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Gestión de Usuarios</h3>
                <p className="text-gray-400 text-sm">Clientes y empleados</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link 
                href="/admin/usuarios"
                className="block text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
              >
                Ver usuarios →
              </Link>
              <Link 
                href="/admin/empleados"
                className="block text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
              >
                Gestionar empleados →
              </Link>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎫</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Gestión de Reservas</h3>
                <p className="text-gray-400 text-sm">Ver y administrar</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link 
                href="/admin/reservas"
                className="block text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
              >
                Ver reservas →
              </Link>
              <Link 
                href="/admin/reportes"
                className="block text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-200"
              >
                Reportes →
              </Link>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Configuración</h3>
                <p className="text-gray-400 text-sm">Sistema y ajustes</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link 
                href="/admin/configuracion"
                className="block text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
              >
                Configuración →
              </Link>
              <Link 
                href="/admin/bitacora"
                className="block text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors duration-200"
              >
                Bitácora →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Acciones Rápidas</h3>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/admin/peliculas/nueva"
              className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              🎬 Agregar Película
            </Link>
            <Link 
              href="/admin/funciones/nueva"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              🕐 Programar Función
            </Link>
            <Link 
              href="/admin/reportes"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              📊 Ver Reportes
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
