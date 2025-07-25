import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const usuario = await prisma.usuarios.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        fecha_nacimiento: true,
        tipo_usuario: true,
        activo: true,
        fecha_creacion: true,
        reservas: {
          select: {
            id: true,
            estado: true,
            fecha_reserva: true,
            fecha_actualizacion: true,
            precio_total: true,
            funcion: {
              select: {
                id: true,
                fecha_hora_inicio: true,
                pelicula: {
                  select: {
                    titulo: true,
                    poster_url: true
                  }
                },
                sala: {
                  select: {
                    numero: true,
                    nombre: true
                  }
                }
              }
            }
          },
          orderBy: {
            fecha_reserva: 'desc'
          }
        }
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // If it's an employee, get employee details
    let empleadoDetalles = null;
    if (usuario.tipo_usuario === 'empleado' || usuario.tipo_usuario === 'administrador' || usuario.tipo_usuario === 'gerente') {
      empleadoDetalles = await prisma.empleados_detalles.findFirst({
        where: { usuario_id: id }
      });
    }

    return NextResponse.json({
      success: true,
      usuario: {
        ...usuario,
        empleado_detalles: empleadoDetalles
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if user exists
    const existingUser = await prisma.usuarios.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const empleadoUpdateData: Record<string, unknown> = {};

    // Handle basic user fields
    if (body.nombre) updateData.nombre = body.nombre;
    if (body.apellido) updateData.apellido = body.apellido;
    if (body.telefono !== undefined) updateData.telefono = body.telefono;
    if (body.fecha_nacimiento) updateData.fecha_nacimiento = new Date(body.fecha_nacimiento);
    if (body.tipo_usuario) updateData.tipo_usuario = body.tipo_usuario;
    if (body.activo !== undefined) updateData.activo = body.activo;

    // Handle password update
    if (body.password && body.password.trim() !== '') {
      updateData.password_hash = await bcrypt.hash(body.password, 12);
    }

    // Handle employee details
    const isEmployee = body.tipo_usuario && ['empleado', 'administrador', 'gerente'].includes(body.tipo_usuario);
    
    if (isEmployee) {
      if (body.numero_empleado) empleadoUpdateData.numero_empleado = body.numero_empleado;
      if (body.posicion) empleadoUpdateData.posicion = body.posicion;
      if (body.salario !== undefined) empleadoUpdateData.salario = parseFloat(body.salario);
      if (body.fecha_contratacion) empleadoUpdateData.fecha_contratacion = new Date(body.fecha_contratacion);
      if (body.turno) empleadoUpdateData.turno = body.turno;
      if (body.activo !== undefined) empleadoUpdateData.activo = body.activo;
    }

    // Update user
    const updatedUser = await prisma.usuarios.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        fecha_nacimiento: true,
        tipo_usuario: true,
        activo: true,
        fecha_creacion: true,
        fecha_actualizacion: true
      }
    });

    // Handle employee details update/create
    let empleadoDetalles = null;
    if (isEmployee && Object.keys(empleadoUpdateData).length > 0) {
      const existingEmpleado = await prisma.empleados_detalles.findFirst({
        where: { usuario_id: id }
      });

      if (existingEmpleado) {
        // Update existing employee details
        empleadoDetalles = await prisma.empleados_detalles.update({
          where: { id: existingEmpleado.id },
          data: empleadoUpdateData
        });
      } else {
        // Create new employee details
        empleadoDetalles = await prisma.empleados_detalles.create({
          data: {
            usuario_id: id,
            numero_empleado: body.numero_empleado || `EMP${Date.now()}`,
            posicion: body.posicion || 'cajero',
            salario: body.salario ? parseFloat(body.salario.toString()) : null,
            fecha_contratacion: body.fecha_contratacion ? new Date(body.fecha_contratacion) : new Date(),
            turno: body.turno || 'mañana',
            activo: body.activo !== undefined ? body.activo : true
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      usuario: {
        ...updatedUser,
        empleado_detalles: empleadoDetalles
      },
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user exists
    const existingUser = await prisma.usuarios.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Check if user has active reservations
    const activeReservations = await prisma.reservas.count({
      where: {
        usuario_id: id,
        estado: {
          in: ['pendiente', 'confirmada', 'pagada']
        }
      }
    });

    if (activeReservations > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `No se puede eliminar el usuario porque tiene ${activeReservations} reserva(s) activa(s)` 
        },
        { status: 400 }
      );
    }

    // Delete employee details first if they exist
    await prisma.empleados_detalles.deleteMany({
      where: { usuario_id: id }
    });

    // Delete user
    await prisma.usuarios.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
