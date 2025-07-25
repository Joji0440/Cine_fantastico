"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminProtection } from "@/hooks/useAdminProtection";

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fecha_nacimiento?: string;
  tipo_usuario: 'cliente' | 'empleado' | 'administrador' | 'gerente';
  email_verificado: boolean;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function AdminUsuariosPage() {
  // Protección de rutas - solo empleados, administradores y gerentes
  const { isAuthorized } = useAdminProtection({
    allowedRoles: ['empleado', 'administrador', 'gerente'],
    showError: true
  });

  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterEstado, setFilterEstado] = useState("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    fetchUsuarios();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsuarios = async (newPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterTipo !== 'all') params.append('tipo', filterTipo);
      if (filterEstado !== 'all') params.append('activo', filterEstado);
      params.append('page', newPage.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/usuarios?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUsuarios(data.usuarios);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsuarios(1); // Reset to page 1 when searching
  };

  const handlePageChange = (newPage: number) => {
    fetchUsuarios(newPage);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar la lista local
        setUsuarios(prev => prev.map(user => 
          user.id === userId ? { ...user, activo: !currentStatus } : user
        ));
      } else {
        alert('Error al actualizar el estado del usuario');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error de conexión');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setUsuarios(prev => prev.filter(user => user.id !== userId));
        alert('Usuario eliminado exitosamente');
      } else {
        alert(data.error || 'Error al eliminar el usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error de conexión');
    }
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      cliente: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      empleado: 'bg-green-500/20 text-green-300 border-green-500/30',
      administrador: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      gerente: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  // Si no está autorizado, mostrar loader mientras se procesa la redirección
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando usuarios...</p>
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
                onClick={() => router.push('/dashboard/admin')}
                className="text-gray-400 hover:text-white transition-colors focus:outline-none"
                type="button"
                aria-label="Volver al dashboard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Gestión de Usuarios</h1>
                <p className="text-sm text-gray-400">Administra clientes, empleados y administradores</p>
              </div>
            </div>
            <Link
              href="/admin/usuarios/nuevo"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
            >
              + Nuevo Usuario
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
                Buscar usuario
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, email o teléfono..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Usuario
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all" className="bg-gray-800">Todos</option>
                <option value="cliente" className="bg-gray-800">Clientes</option>
                <option value="empleado" className="bg-gray-800">Empleados</option>
                <option value="administrador" className="bg-gray-800">Administradores</option>
                <option value="gerente" className="bg-gray-800">Gerentes</option>
              </select>
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
                <option value="true" className="bg-gray-800">Activos</option>
                <option value="false" className="bg-gray-800">Inactivos</option>
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
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} encontrado{usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map((usuario) => (
            <div key={usuario.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg hover:bg-white/10 transition-all duration-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {usuario.nombre} {usuario.apellido}
                  </h3>
                  <p className="text-gray-300 text-sm">{usuario.email}</p>
                  {usuario.telefono && (
                    <p className="text-gray-400 text-sm">{usuario.telefono}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    usuario.activo
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium border ${getTipoColor(usuario.tipo_usuario)}`}>
                    {usuario.tipo_usuario.charAt(0).toUpperCase() + usuario.tipo_usuario.slice(1)}
                  </span>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Email verificado:</span>
                  <span className={`font-medium ${usuario.email_verificado ? 'text-green-400' : 'text-yellow-400'}`}>
                    {usuario.email_verificado ? 'Sí' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Fecha de registro:</span>
                  <span className="text-white font-medium">{formatDate(usuario.fecha_creacion)}</span>
                </div>
                {usuario.fecha_nacimiento && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Fecha de nacimiento:</span>
                    <span className="text-white font-medium">{formatDate(usuario.fecha_nacimiento)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="flex space-x-2">
                  <Link
                    href={`/admin/usuarios/${usuario.id}/edit`}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/admin/usuarios/${usuario.id}`}
                    className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                  >
                    Ver Detalles
                  </Link>
                  <button
                    onClick={() => toggleUserStatus(usuario.id, usuario.activo)}
                    className={`text-sm font-medium transition-colors ${
                      usuario.activo
                        ? 'text-yellow-400 hover:text-yellow-300'
                        : 'text-green-400 hover:text-green-300'
                    }`}
                  >
                    {usuario.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
                <button
                  onClick={() => deleteUser(usuario.id)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {usuarios.length > 0 && pagination.totalPages > 1 && (
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
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} usuarios)
            </div>
          </div>
        )}

        {/* Empty State */}
        {usuarios.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No hay usuarios</h3>
            <p className="text-gray-400 mb-6">No se encontraron usuarios con los criterios de búsqueda actuales</p>
            <Link
              href="/admin/usuarios/nuevo"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
            >
              Crear Primer Usuario
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
