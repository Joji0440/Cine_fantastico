import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de película requerido' },
        { status: 400 }
      );
    }

    // Obtener las funciones de la película con información de sala
    const funciones = await prisma.funciones.findMany({
      where: {
        pelicula_id: id,
        fecha_hora_inicio: {
          gte: new Date(), // Solo funciones futuras
        },
        activa: true
      },
      include: {
        sala: {
          select: {
            id: true,
            nombre: true,
            capacidad_total: true,
            tipo_sala: true,
          }
        },
        reservas: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        fecha_hora_inicio: 'asc'
      }
    });

    // Formatear las funciones con información adicional
    const funcionesFormateadas = funciones.map(funcion => ({
      id: funcion.id,
      fecha_hora_inicio: funcion.fecha_hora_inicio,
      fecha_hora_fin: funcion.fecha_hora_fin,
      precio_base: Number(funcion.precio_base),
      precio_con_descuento: funcion.precio_con_descuento ? Number(funcion.precio_con_descuento) : null,
      asientos_disponibles: funcion.asientos_disponibles,
      asientos_reservados: funcion.asientos_reservados || 0,
      especial: funcion.especial,
      sala: {
        id: funcion.sala.id,
        nombre: funcion.sala.nombre,
        capacidad: funcion.sala.capacidad_total,
        tipo: funcion.sala.tipo_sala,
      }
    }));

    return NextResponse.json({
      success: true,
      funciones: funcionesFormateadas
    });

  } catch (error) {
    console.error('Error fetching functions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
