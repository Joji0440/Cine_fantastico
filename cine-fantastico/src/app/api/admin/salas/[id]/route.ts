import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sala = await prisma.salas.findUnique({
      where: { id },
      include: {
        asientos: true,
        funciones: {
          select: {
            id: true,
            fecha_hora_inicio: true,
            fecha_hora_fin: true,
            activa: true,
            pelicula: {
              select: {
                titulo: true
              }
            }
          },
          where: {
            fecha_hora_inicio: {
              gte: new Date()
            }
          },
          orderBy: {
            fecha_hora_inicio: 'asc'
          }
        }
      }
    });

    if (!sala) {
      return NextResponse.json(
        { success: false, error: 'Sala no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sala
    });

  } catch (error) {
    console.error('Error fetching room:', error);
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

    // Check if room exists
    const existingRoom = await prisma.salas.findUnique({
      where: { id }
    });

    if (!existingRoom) {
      return NextResponse.json(
        { success: false, error: 'Sala no encontrada' },
        { status: 404 }
      );
    }

    // Check if there are active functions when trying to modify critical data
    const hasActiveFunctions = await prisma.funciones.count({
      where: {
        sala_id: id,
        activa: true,
        fecha_hora_inicio: {
          gte: new Date()
        }
      }
    });

    // If there are active functions, only allow certain fields to be updated
    if (hasActiveFunctions > 0) {
      const allowedFields = ['activa', 'precio_extra', 'notas', 'equipamiento'];
      const updateData: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(body)) {
        if (allowedFields.includes(key)) {
          if (key === 'precio_extra') {
            updateData[key] = parseFloat(value as string) || 0;
          } else {
            updateData[key] = value;
          }
        }
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { success: false, error: 'No se pueden modificar estos campos cuando hay funciones activas programadas' },
          { status: 400 }
        );
      }

      const updatedRoom = await prisma.salas.update({
        where: { id },
        data: updateData
      });

      return NextResponse.json({
        success: true,
        sala: updatedRoom
      });
    }

    // If no active functions, allow full update
    const updateData: Record<string, unknown> = {};
    
    if (body.numero !== undefined) {
      // Check if new room number already exists (excluding current room)
      const roomWithNumber = await prisma.salas.findFirst({
        where: { 
          numero: parseInt(body.numero),
          id: { not: id }
        }
      });

      if (roomWithNumber) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una sala con este número' },
          { status: 409 }
        );
      }
      updateData.numero = parseInt(body.numero);
    }
    
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.tipo_sala !== undefined) updateData.tipo_sala = body.tipo_sala;
    if (body.capacidad_total !== undefined) updateData.capacidad_total = parseInt(body.capacidad_total);
    if (body.filas !== undefined) updateData.filas = parseInt(body.filas);
    if (body.asientos_por_fila !== undefined) updateData.asientos_por_fila = parseInt(body.asientos_por_fila);
    if (body.precio_extra !== undefined) updateData.precio_extra = parseFloat(body.precio_extra) || 0;
    if (body.activa !== undefined) updateData.activa = body.activa;
    if (body.equipamiento !== undefined) updateData.equipamiento = body.equipamiento;
    if (body.notas !== undefined) updateData.notas = body.notas;

    // Validate capacity calculation if relevant fields are being updated
    if (updateData.filas || updateData.asientos_por_fila || updateData.capacidad_total) {
      const filas = updateData.filas as number || existingRoom.filas;
      const asientos_por_fila = updateData.asientos_por_fila as number || existingRoom.asientos_por_fila;
      const capacidad_total = updateData.capacidad_total as number || existingRoom.capacidad_total;
      
      if (filas * asientos_por_fila !== capacidad_total) {
        return NextResponse.json(
          { success: false, error: 'La capacidad total no coincide con filas × asientos por fila' },
          { status: 400 }
        );
      }
    }

    const updatedRoom = await prisma.salas.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      sala: updatedRoom
    });

  } catch (error) {
    console.error('Error updating room:', error);
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

    // Check if room exists
    const existingRoom = await prisma.salas.findUnique({
      where: { id }
    });

    if (!existingRoom) {
      return NextResponse.json(
        { success: false, error: 'Sala no encontrada' },
        { status: 404 }
      );
    }

    // Check if there are any functions (past or future)
    const functionsCount = await prisma.funciones.count({
      where: { sala_id: id }
    });

    if (functionsCount > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una sala que tiene funciones asociadas' },
        { status: 400 }
      );
    }

    // Delete associated seats first
    await prisma.asientos.deleteMany({
      where: { sala_id: id }
    });

    // Delete the room
    await prisma.salas.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Sala eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
