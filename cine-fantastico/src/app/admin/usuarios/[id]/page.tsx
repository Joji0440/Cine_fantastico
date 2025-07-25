"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

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
  empleado_detalles?: {
    id: string;
    cargo: string;
    salario: number;
    fecha_contratacion: string;
    turno: 'mañana' | 'tarde' | 'noche' | 'rotativo';
    activo: boolean;
  };
}

export default function DetalleUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUsuario();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUsuario = async () => {
    try {
      const response = await fetch(`/api/admin/usuarios/${userId}`);
      const data = await response.json();

      if (data.success) {
        setUsuario(data.usuario);
      } else {
        console.error('Error loading user:', data.error);
        router.push('/admin/usuarios');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      router.push('/admin/usuarios');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!usuario) return;

    try {
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: !usuario.activo }),
      });

      const data = await response.json();

      if (data.success) {
        setUsuario(prev => prev ? { ...prev, activo: !prev.activo } : null);
      } else {
        alert('Error al actualizar el estado del usuario');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error de conexión');
    }
  };

  const deleteUser = async () => {
    if (!usuario) return;

    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Usuario eliminado exitosamente');
        router.push('/admin/usuarios');
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
      cliente: 'from-blue-500 to-blue-600',
      empleado: 'from-green-500 to-green-600',
      administrador: 'from-purple-500 to-purple-600',
      gerente: 'from-orange-500 to-orange-600'
    };
    return colors[tipo as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateSimple = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSalary = (amount: number) => {
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
          <p className="text-gray-300">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300">Usuario no encontrado</p>
          <Link
            href="/admin/usuarios"
            className="mt-4 inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
          >
            Volver a Usuarios
          </Link>
        </div>
      </div>
    );
  }

  const isEmployee = ['empleado', 'administrador', 'gerente'].includes(usuario.tipo_usuario);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/usuarios"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {usuario.nombre} {usuario.apellido}
                </h1>
                <p className="text-sm text-gray-400">Detalles del usuario</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/admin/usuarios/${userId}/edit`}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
              >
                Editar
              </Link>
              <button
                onClick={toggleUserStatus}
                className={`px-4 py-2 rounded-lg transition-all duration-200 shadow-lg ${
                  usuario.activo
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                } text-white`}
              >
                {usuario.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={deleteUser}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {usuario.nombre} {usuario.apellido}
                  </h2>
                  <p className="text-gray-300 text-lg">{usuario.email}</p>
                  {usuario.telefono && (
                    <p className="text-gray-400">{usuario.telefono}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-block px-4 py-2 rounded-full text-white font-medium bg-gradient-to-r ${getTipoColor(usuario.tipo_usuario)}`}>
                    {usuario.tipo_usuario.charAt(0).toUpperCase() + usuario.tipo_usuario.slice(1)}
                  </span>
                </div>
              </div>

              {/* Estados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Estado del Usuario</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      usuario.activo
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Email Verificado</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      usuario.email_verificado
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {usuario.email_verificado ? 'Verificado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {usuario.fecha_nacimiento && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <p className="text-white">{formatDateSimple(usuario.fecha_nacimiento)}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Tipo de Usuario
                    </label>
                    <p className="text-white">{usuario.tipo_usuario.charAt(0).toUpperCase() + usuario.tipo_usuario.slice(1)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Empleado (si aplica) */}
            {isEmployee && usuario.empleado_detalles && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">
                  Información del Empleado
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Cargo
                    </label>
                    <p className="text-white">{usuario.empleado_detalles.cargo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Salario
                    </label>
                    <p className="text-white font-semibold">{formatSalary(usuario.empleado_detalles.salario)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Fecha de Contratación
                    </label>
                    <p className="text-white">{formatDateSimple(usuario.empleado_detalles.fecha_contratacion)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Turno
                    </label>
                    <p className="text-white">{usuario.empleado_detalles.turno.charAt(0).toUpperCase() + usuario.empleado_detalles.turno.slice(1)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Estado del Empleado
                    </label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      usuario.empleado_detalles.activo
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {usuario.empleado_detalles.activo ? 'Empleado Activo' : 'Empleado Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fechas del Sistema */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">
                Información del Sistema
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Fecha de Creación
                  </label>
                  <p className="text-white text-sm">{formatDate(usuario.fecha_creacion)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Última Actualización
                  </label>
                  <p className="text-white text-sm">{formatDate(usuario.fecha_actualizacion)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    ID del Usuario
                  </label>
                  <p className="text-gray-300 text-xs font-mono">{usuario.id}</p>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/admin/usuarios/${userId}/edit`}
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-center"
                >
                  ✏️ Editar Usuario
                </Link>
                <button
                  onClick={toggleUserStatus}
                  className={`block w-full px-4 py-2 rounded-lg transition-all duration-200 text-white ${
                    usuario.activo
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                  }`}
                >
                  {usuario.activo ? '⏸️ Desactivar' : '▶️ Activar'}
                </button>
                {isEmployee && (
                  <Link
                    href={`/admin/empleados/${usuario.empleado_detalles?.id || userId}`}
                    className="block w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-center"
                  >
                    👔 Ver como Empleado
                  </Link>
                )}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={deleteUser}
                    className="block w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
                  >
                    🗑️ Eliminar Usuario
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
