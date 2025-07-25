"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    nombre: '',
    apellido: '',
    telefono: '',
    fecha_nacimiento: '',
    tipo_usuario: 'cliente' as const,
    email_verificado: true,
    activo: true,
  });

  const [empleadoData, setEmpleadoData] = useState({
    cargo: '',
    salario: '',
    fecha_contratacion: '',
    turno: 'mañana' as const,
    activo: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        const updatedErrors = { ...newErrors };
        delete updatedErrors[name];
        return updatedErrors;
      });
    }
  };

  const handleEmpleadoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setEmpleadoData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validaciones básicas
    if (!formData.email) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    
    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Las contraseñas no coinciden';
    }

    if (!formData.nombre) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido) newErrors.apellido = 'El apellido es requerido';

    // Validaciones para empleados
    if (isEmployee()) {
      if (!empleadoData.cargo) newErrors.cargo = 'El cargo es requerido';
      if (!empleadoData.salario) newErrors.salario = 'El salario es requerido';
      else if (isNaN(Number(empleadoData.salario))) newErrors.salario = 'El salario debe ser un número';
      if (!empleadoData.fecha_contratacion) newErrors.fecha_contratacion = 'La fecha de contratación es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isEmployee = () => {
    return ['empleado', 'administrador', 'gerente'].includes(formData.tipo_usuario);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const submitData = {
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        tipo_usuario: formData.tipo_usuario,
        email_verificado: formData.email_verificado,
        activo: formData.activo,
        empleado_detalles: isEmployee() ? empleadoData : null
      };

      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/usuarios');
      } else {
        setErrors({ general: data.error || 'Error al crear el usuario' });
      }
    } catch {
      setErrors({ general: 'Error de conexión' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Crear Nuevo Usuario</h1>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error general */}
        {errors.general && (
          <div className="bg-red-500/10 backdrop-blur border border-red-500/20 rounded-lg p-4 text-red-400">
            {errors.general}
          </div>
        )}

        {/* Información básica */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Información Básica</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="usuario@ejemplo.com"
                required
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Tipo de Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Usuario *
              </label>
              <select
                name="tipo_usuario"
                value={formData.tipo_usuario}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                required
              >
                <option value="cliente">Cliente</option>
                <option value="empleado">Empleado</option>
                <option value="administrador">Administrador</option>
                <option value="gerente">Gerente</option>
              </select>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Nombre"
                required
              />
              {errors.nombre && <p className="text-red-400 text-sm mt-1">{errors.nombre}</p>}
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Apellido"
                required
              />
              {errors.apellido && <p className="text-red-400 text-sm mt-1">{errors.apellido}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="+123456789"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Contraseña */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Contraseña</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
              {errors.password_confirm && <p className="text-red-400 text-sm mt-1">{errors.password_confirm}</p>}
            </div>
          </div>
        </div>

        {/* Información del Empleado (solo si es empleado, administrador o gerente) */}
        {isEmployee() && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Información del Empleado</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cargo *
                </label>
                <input
                  type="text"
                  name="cargo"
                  value={empleadoData.cargo}
                  onChange={handleEmpleadoChange}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Ej: Taquillero, Administrador..."
                  required={isEmployee()}
                />
                {errors.cargo && <p className="text-red-400 text-sm mt-1">{errors.cargo}</p>}
              </div>

              {/* Salario */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Salario *
                </label>
                <input
                  type="number"
                  name="salario"
                  value={empleadoData.salario}
                  onChange={handleEmpleadoChange}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required={isEmployee()}
                />
                {errors.salario && <p className="text-red-400 text-sm mt-1">{errors.salario}</p>}
              </div>

              {/* Fecha de Contratación */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de Contratación *
                </label>
                <input
                  type="date"
                  name="fecha_contratacion"
                  value={empleadoData.fecha_contratacion}
                  onChange={handleEmpleadoChange}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                  required={isEmployee()}
                />
                {errors.fecha_contratacion && <p className="text-red-400 text-sm mt-1">{errors.fecha_contratacion}</p>}
              </div>

              {/* Turno */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Turno
                </label>
                <select
                  name="turno"
                  value={empleadoData.turno}
                  onChange={handleEmpleadoChange}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="mañana">Mañana</option>
                  <option value="tarde">Tarde</option>
                  <option value="noche">Noche</option>
                  <option value="rotativo">Rotativo</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Estado */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Estado</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Verificado */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="email_verificado"
                checked={formData.email_verificado}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-black/20 border-white/10 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="ml-2 text-sm font-medium text-gray-300">
                Email Verificado
              </label>
            </div>

            {/* Activo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-black/20 border-white/10 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="ml-2 text-sm font-medium text-gray-300">
                Usuario Activo
              </label>
            </div>
          </div>

          {/* Empleado Activo (solo para empleados) */}
          {isEmployee() && (
            <div className="mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="activo"
                  checked={empleadoData.activo}
                  onChange={handleEmpleadoChange}
                  className="w-4 h-4 text-blue-600 bg-black/20 border-white/10 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label className="ml-2 text-sm font-medium text-gray-300">
                  Empleado Activo
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={() => router.push('/admin/usuarios')}
            className="px-6 py-3 bg-gray-600/20 hover:bg-gray-600/30 text-white rounded-lg transition-colors border border-white/10"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
}
