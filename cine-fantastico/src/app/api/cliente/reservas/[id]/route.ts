import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservaId = id;

    const reserva = await prisma.reservas.findUnique({
      where: {
        id: reservaId
      },
      include: {
        funcion: {
          include: {
            pelicula: {
              select: {
                titulo: true,
                poster_url: true,
                duracion_minutos: true,
                clasificacion: true
              }
            },
            sala: {
              select: {
                nombre: true
              }
            }
          }
        },
        reservas_asientos: {
          include: {
            asiento: {
              select: {
                numero: true,
                fila: true
              }
            }
          }
        }
      }
    });

    if (!reserva) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Formatear los datos para la respuesta
    const reservaFormatted = {
      id: reserva.id,
      codigo_reserva: reserva.codigo_reserva,
      cantidad_entradas: reserva.cantidad_asientos,
      precio_total: parseFloat(reserva.precio_total?.toString() || '0'),
      estado: reserva.estado,
      fecha_reserva: reserva.fecha_reserva?.toISOString(),
      fecha_limite_pago: reserva.fecha_vencimiento?.toISOString(),
      funcion: {
        id: reserva.funcion?.id,
        fecha_hora_inicio: reserva.funcion?.fecha_hora_inicio?.toISOString(),
        fecha_hora_fin: reserva.funcion?.fecha_hora_fin?.toISOString(),
        pelicula: {
          titulo: reserva.funcion?.pelicula?.titulo,
          poster_url: reserva.funcion?.pelicula?.poster_url,
          duracion_minutos: reserva.funcion?.pelicula?.duracion_minutos,
          clasificacion: reserva.funcion?.pelicula?.clasificacion
        },
        sala: {
          nombre: reserva.funcion?.sala?.nombre
        }
      },
      asientos: reserva.reservas_asientos?.map(detalle => ({
        numero: detalle.asiento?.numero,
        fila: detalle.asiento?.fila
      })) || []
    };

    return NextResponse.json({
      success: true,
      reserva: reservaFormatted
    });

  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
