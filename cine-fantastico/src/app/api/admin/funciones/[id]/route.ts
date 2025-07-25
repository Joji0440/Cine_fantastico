import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const funcion = await prisma.funciones.findUnique({
      where: { id },
      include: {
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
            tipo_sala: true,
            capacidad_total: true
          }
        }
      }
    });

    if (!funcion) {
      return NextResponse.json(
        { success: false, error: 'Función no encontrada' },
        { status: 404 }
      );
    }

    // Calculate reserved seats for this function
    const reservasCount = await prisma.reservas.aggregate({
      where: {
        funcion_id: funcion.id,
        estado: 'confirmada'
      },
      _sum: {
        cantidad_asientos: true
      }
    });

    const asientos_reservados = reservasCount._sum?.cantidad_asientos || 0;

    return NextResponse.json({
      success: true,
      funcion: {
        ...funcion,
        asientos_reservados
      }
    });

  } catch (error) {
    console.error('Error fetching function:', error);
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

    // Check if function exists
    const existingFunction = await prisma.funciones.findUnique({
      where: { id },
      include: {
        pelicula: true,
        sala: true
      }
    });

    if (!existingFunction) {
      return NextResponse.json(
        { success: false, error: 'Función no encontrada' },
        { status: 404 }
      );
    }

    // Check if there are confirmed reservations when trying to modify critical data
    const hasReservations = await prisma.reservas.count({
      where: {
        funcion_id: id,
        estado: 'confirmada'
      }
    });

    // If there are reservations, only allow certain fields to be updated
    if (hasReservations > 0) {
      const allowedFields = ['activa', 'precio_base'];
      const updateData: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(body)) {
        if (allowedFields.includes(key)) {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { success: false, error: 'No se pueden modificar estos campos cuando hay reservas confirmadas' },
          { status: 400 }
        );
      }

      const updatedFunction = await prisma.funciones.update({
        where: { id },
        data: updateData,
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
              numero: true,
              nombre: true,
              tipo_sala: true,
              capacidad_total: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        funcion: updatedFunction
      });
    }

    // If no reservations, allow full update
    const updateData: Record<string, unknown> = {};
    
    if (body.pelicula_id) updateData.pelicula_id = body.pelicula_id;
    if (body.sala_id) updateData.sala_id = body.sala_id;
    if (body.fecha_hora_inicio) {
      updateData.fecha_hora_inicio = new Date(body.fecha_hora_inicio);
      
      // Recalculate end time if movie or start time changed
      const pelicula = await prisma.peliculas.findUnique({
        where: { id: body.pelicula_id || existingFunction.pelicula_id }
      });
      
      if (pelicula) {
        const startTime = new Date(body.fecha_hora_inicio);
        updateData.fecha_hora_fin = new Date(startTime.getTime() + (pelicula.duracion_minutos + 30) * 60000);
      }
    }
    if (body.precio_base !== undefined) updateData.precio_base = parseFloat(body.precio_base);
    if (body.activa !== undefined) updateData.activa = body.activa;

    // Update available seats if sala changed
    if (body.sala_id && body.sala_id !== existingFunction.sala_id) {
      const newSala = await prisma.salas.findUnique({
        where: { id: body.sala_id }
      });
      
      if (newSala) {
        updateData.asientos_disponibles = newSala.capacidad_total;
        updateData.asientos_reservados = 0;
      }
    }

    // Check for conflicts if scheduling data changed
    if (updateData.fecha_hora_inicio || updateData.fecha_hora_fin || body.sala_id) {
      const startTime = (updateData.fecha_hora_inicio as Date) || existingFunction.fecha_hora_inicio;
      const endTime = (updateData.fecha_hora_fin as Date) || existingFunction.fecha_hora_fin;
      const salaId = body.sala_id || existingFunction.sala_id;

      const conflictingFunctions = await prisma.funciones.findMany({
        where: {
          id: { not: id }, // Exclude current function
          sala_id: salaId,
          activa: true,
          OR: [
            {
              AND: [
                { fecha_hora_inicio: { lte: startTime } },
                { fecha_hora_fin: { gt: startTime } }
              ]
            },
            {
              AND: [
                { fecha_hora_inicio: { lt: endTime } },
                { fecha_hora_fin: { gte: endTime } }
              ]
            },
            {
              AND: [
                { fecha_hora_inicio: { gte: startTime } },
                { fecha_hora_inicio: { lt: endTime } }
              ]
            }
          ]
        }
      });

      if (conflictingFunctions.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Conflicto de horario con otra función en la misma sala' },
          { status: 409 }
        );
      }
    }

    const updatedFunction = await prisma.funciones.update({
      where: { id },
      data: updateData,
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
            numero: true,
            nombre: true,
            tipo_sala: true,
            capacidad_total: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      funcion: updatedFunction
    });

  } catch (error) {
    console.error('Error updating function:', error);
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

    // Check if function exists
    const existingFunction = await prisma.funciones.findUnique({
      where: { id }
    });

    if (!existingFunction) {
      return NextResponse.json(
        { success: false, error: 'Función no encontrada' },
        { status: 404 }
      );
    }

    // Check if there are confirmed reservations
    const reservationsCount = await prisma.reservas.count({
      where: {
        funcion_id: id,
        estado: 'confirmada'
      }
    });

    if (reservationsCount > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una función con reservas confirmadas' },
        { status: 400 }
      );
    }

    // Delete any pending reservations first
    await prisma.reservas.deleteMany({
      where: {
        funcion_id: id,
        estado: { not: 'confirmada' }
      }
    });

    // Delete the function
    await prisma.funciones.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Función eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting function:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
