import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'cine-fantastico-secret-key-2025';

// Función auxiliar para obtener usuario autenticado
async function getUserFromRequest(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.usuarios.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        tipo_usuario: true,
        activo: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reserva = await prisma.reservas.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        },
        funcion: {
          select: {
            id: true,
            fecha_hora_inicio: true,
            fecha_hora_fin: true,
            precio_base: true,
            pelicula: {
              select: {
                id: true,
                titulo: true,
                poster_url: true,
                duracion_minutos: true,
                clasificacion: true
              }
            },
            sala: {
              select: {
                id: true,
                numero: true,
                nombre: true,
                tipo_sala: true
              }
            }
          }
        },
        reservas_asientos: {
          include: {
            asiento: {
              select: {
                id: true,
                fila: true,
                numero: true,
                codigo: true
              }
            }
          }
        }
      }
    });

    if (!reserva) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      reserva
    });

  } catch (error) {
    console.error('Error fetching reserva:', error);
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
    // Verificar autenticación
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar permisos (empleado, admin o gerente)
    if (!['empleado', 'administrador', 'gerente'].includes(user.tipo_usuario)) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Verificar que la reserva existe
    const existingReserva = await prisma.reservas.findUnique({
      where: { id }
    });

    if (!existingReserva) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Actualizar estado si se proporciona
    if (body.estado) {
      const validStates = ['pendiente', 'confirmada', 'pagada', 'cancelada', 'usada', 'vencida'];
      if (!validStates.includes(body.estado)) {
        return NextResponse.json(
          { success: false, error: 'Estado de reserva inválido' },
          { status: 400 }
        );
      }
      updateData.estado = body.estado;

      // Si se marca como pagada, registrar fecha de pago
      if (body.estado === 'pagada') {
        updateData.fecha_pago = new Date();
      }
    }

    // Actualizar método de pago si se proporciona
    if (body.metodo_pago) {
      const validMethods = ['efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'paypal'];
      if (!validMethods.includes(body.metodo_pago)) {
        return NextResponse.json(
          { success: false, error: 'Método de pago inválido' },
          { status: 400 }
        );
      }
      updateData.metodo_pago = body.metodo_pago;
    }

    // Actualizar notas si se proporcionan
    if (body.notas !== undefined) {
      updateData.notas = body.notas;
    }

    // Actualizar empleado vendedor
    updateData.empleado_vendedor_id = user.id;

    const updatedReserva = await prisma.reservas.update({
      where: { id },
      data: updateData,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        funcion: {
          select: {
            fecha_hora_inicio: true,
            pelicula: {
              select: {
                titulo: true
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
      }
    });

    return NextResponse.json({
      success: true,
      reserva: updatedReserva,
      message: 'Reserva actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating reserva:', error);
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
    // Verificar autenticación
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar permisos (solo admin o gerente pueden eliminar)
    if (!['administrador', 'gerente'].includes(user.tipo_usuario)) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que la reserva existe
    const existingReserva = await prisma.reservas.findUnique({
      where: { id },
      include: {
        reservas_asientos: true
      }
    });

    if (!existingReserva) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // No permitir eliminar reservas pagadas o usadas
    if (['pagada', 'usada'].includes(existingReserva.estado)) {
      return NextResponse.json(
        { success: false, error: 'No se pueden eliminar reservas pagadas o usadas' },
        { status: 400 }
      );
    }

    // Eliminar asientos asociados primero
    await prisma.reservas_asientos.deleteMany({
      where: { reserva_id: id }
    });

    // Eliminar la reserva
    await prisma.reservas.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Reserva eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting reserva:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
