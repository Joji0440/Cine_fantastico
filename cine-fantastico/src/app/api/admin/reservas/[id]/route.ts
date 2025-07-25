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
          include: {
            pelicula: {
              select: {
                titulo: true,
                poster_url: true,
                duracion_minutos: true,
                clasificacion: true,
                sinopsis: true
              }
            },
            sala: {
              select: {
                numero: true,
                nombre: true,
                tipo_sala: true,
                capacidad_total: true
              }
            }
          }
        },
        reservas_asientos: true
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
    console.error('Error fetching reservation:', error);
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

    console.log('🔍 PATCH reserva - ID:', id, 'Body:', body);

    // Obtener usuario autenticado
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('🔍 PATCH reserva - Usuario autenticado:', { id: user.id, tipo: user.tipo_usuario });

    // Verificar que la reserva existe
    const reservaExistente = await prisma.reservas.findUnique({
      where: { id }
    });

    if (!reservaExistente) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};

    if (body.estado !== undefined) {
      updateData.estado = body.estado;
      
      // Si se marca como pagada, añadir fecha de pago y quién la confirmó
      if (body.estado === 'pagada' && !reservaExistente.fecha_pago) {
        updateData.fecha_pago = new Date();
        updateData.empleado_vendedor_id = user.id; // Guardar quién confirmó el pago
        console.log('🔍 Confirmando pago - Empleado vendedor:', user.id, user.nombre, user.apellido);
      }
    }

    if (body.metodo_pago !== undefined) {
      updateData.metodo_pago = body.metodo_pago;
    }

    if (body.notas !== undefined) {
      updateData.notas = body.notas;
    }

    if (body.cantidad_asientos !== undefined) {
      updateData.cantidad_asientos = parseInt(body.cantidad_asientos);
      
      // Recalcular precio si cambia la cantidad
      const funcion = await prisma.funciones.findUnique({
        where: { id: reservaExistente.funcion_id },
        include: { sala: true }
      });

      if (funcion) {
        const precioBase = parseFloat(funcion.precio_base?.toString() || '0');
        const precioExtra = parseFloat(funcion.sala?.precio_extra?.toString() || '0');
        const nuevoPrecioTotal = (precioBase + precioExtra) * parseInt(body.cantidad_asientos);
        
        updateData.precio_subtotal = nuevoPrecioTotal;
        updateData.precio_total = nuevoPrecioTotal;
      }
    }

    const reservaActualizada = await prisma.reservas.update({
      where: { id },
      data: updateData,
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        },
        funcion: {
          include: {
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
      reserva: reservaActualizada
    });

  } catch (error) {
    console.error('Error updating reservation:', error);
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

    // Verificar que la reserva existe
    const reservaExistente = await prisma.reservas.findUnique({
      where: { id },
      include: {
        funcion: {
          select: {
            fecha_hora_inicio: true
          }
        }
      }
    });

    if (!reservaExistente) {
      return NextResponse.json(
        { success: false, error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no sea una reserva usada (no se puede eliminar)
    if (reservaExistente.estado === 'usada') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una reserva que ya fue usada' },
        { status: 409 }
      );
    }

    // Verificar que no sea una función que ya pasó (opcional, según reglas de negocio)
    const fechaFuncion = new Date(reservaExistente.funcion.fecha_hora_inicio);
    const ahora = new Date();
    
    if (fechaFuncion < ahora && reservaExistente.estado === 'pagada') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una reserva pagada de una función que ya pasó. Considere cancelarla en su lugar.' },
        { status: 409 }
      );
    }

    // Eliminar asientos de la reserva primero (por la relación)
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
    console.error('Error deleting reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
