import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cine-fantastico-secret-key-2025';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    let decoded: { userId: string; email: string; nombre: string; apellido: string; tipo_usuario: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; nombre: string; apellido: string; tipo_usuario: string };
    } catch {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { funcion_id, cantidad_entradas } = body;

    // Validaciones
    if (!funcion_id || !cantidad_entradas || cantidad_entradas < 1) {
      return NextResponse.json(
        { error: 'Datos de reserva inválidos' },
        { status: 400 }
      );
    }

    // Verificar que la función existe y está activa
    const funcion = await prisma.funciones.findUnique({
      where: { id: funcion_id },
      include: {
        pelicula: {
          select: {
            titulo: true,
            poster_url: true
          }
        },
        sala: {
          select: {
            nombre: true,
            capacidad_total: true
          }
        }
      }
    });

    if (!funcion || !funcion.activa) {
      return NextResponse.json(
        { error: 'Función no disponible' },
        { status: 400 }
      );
    }

    // Verificar que hay asientos disponibles
    if (funcion.asientos_disponibles < cantidad_entradas) {
      return NextResponse.json(
        { error: 'No hay suficientes asientos disponibles' },
        { status: 400 }
      );
    }

    // Calcular precio total
    const precio_unitario = funcion.precio_con_descuento || funcion.precio_base;
    const precio_total = Number(precio_unitario) * cantidad_entradas;

    // Crear la reserva (versión simplificada para evitar errores de esquema)
    const reserva = await prisma.$transaction(async (tx) => {
      // Crear la reserva con código más corto
      const codigoReserva = `R${Date.now().toString().slice(-8)}`; // R + últimos 8 dígitos
      
      const nuevaReserva = await tx.reservas.create({
        data: {
          codigo_reserva: codigoReserva,
          usuario_id: decoded.userId,
          funcion_id: funcion_id,
          cantidad_asientos: cantidad_entradas,
          precio_subtotal: precio_total,
          precio_total: precio_total,
          estado: 'pendiente',
          fecha_vencimiento: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
          metodo_pago: 'efectivo',
        }
      });

      // Actualizar asientos disponibles
      await tx.funciones.update({
        where: { id: funcion_id },
        data: {
          asientos_disponibles: {
            decrement: cantidad_entradas
          },
          asientos_reservados: {
            increment: cantidad_entradas
          }
        }
      });

      return nuevaReserva;
    });

    // Obtener datos completos para la respuesta
    const reservaCompleta = await prisma.reservas.findUnique({
      where: { id: reserva.id },
      include: {
        funcion: {
          include: {
            pelicula: {
              select: {
                titulo: true,
                poster_url: true
              }
            },
            sala: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });

    // Formatear respuesta
    if (!reservaCompleta) {
      throw new Error('Error al obtener datos de la reserva');
    }

    const reservaResponse = {
      id: reservaCompleta.id,
      codigo_reserva: reservaCompleta.codigo_reserva,
      cantidad_entradas: reservaCompleta.cantidad_asientos,
      precio_total: Number(reservaCompleta.precio_total),
      estado: reservaCompleta.estado,
      fecha_reserva: reservaCompleta.fecha_creacion,
      fecha_limite_pago: reservaCompleta.fecha_vencimiento,
      funcion: {
        id: reservaCompleta.funcion.id,
        fecha_hora_inicio: reservaCompleta.funcion.fecha_hora_inicio,
        fecha_hora_fin: reservaCompleta.funcion.fecha_hora_fin,
        pelicula: {
          titulo: reservaCompleta.funcion.pelicula.titulo,
          poster_url: reservaCompleta.funcion.pelicula.poster_url
        },
        sala: {
          nombre: reservaCompleta.funcion.sala.nombre
        }
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Reserva creada exitosamente',
      reserva: reservaResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
