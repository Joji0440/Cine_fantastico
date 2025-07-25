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

    console.log('🔍 DEBUGGING - Obteniendo funciones para película:', id);

    // Obtener TODAS las funciones de la película (sin filtros) para debugging
    const todasLasFunciones = await prisma.funciones.findMany({
      where: {
        pelicula_id: id,
      },
      include: {
        sala: {
          select: {
            id: true,
            nombre: true,
            capacidad_total: true,
            tipo_sala: true,
          }
        }
      },
      orderBy: {
        fecha_hora_inicio: 'asc'
      }
    });

    console.log('📊 DEBUGGING - Total funciones encontradas:', todasLasFunciones.length);

    // Obtener funciones con filtros originales
    const funcionesFiltradas = await prisma.funciones.findMany({
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
        }
      },
      orderBy: {
        fecha_hora_inicio: 'asc'
      }
    });

    console.log('🔍 DEBUGGING - Funciones filtradas:', funcionesFiltradas.length);
    console.log('⏰ DEBUGGING - Fecha actual:', new Date());

    // Debug de cada función
    todasLasFunciones.forEach((funcion, index) => {
      console.log(`📋 Función ${index + 1}:`);
      console.log(`   - ID: ${funcion.id}`);
      console.log(`   - Fecha/hora: ${funcion.fecha_hora_inicio}`);
      console.log(`   - Activa: ${funcion.activa}`);
      console.log(`   - Es futura: ${funcion.fecha_hora_inicio > new Date()}`);
      console.log(`   - Sala: ${funcion.sala.nombre}`);
    });

    // Formatear las funciones con filtros normales para el cliente
    const funcionesFormateadas = funcionesFiltradas.map(funcion => ({
      id: funcion.id,
      fecha_hora_inicio: funcion.fecha_hora_inicio,
      fecha_hora_fin: funcion.fecha_hora_fin,
      precio_base: Number(funcion.precio_base),
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
      funciones: funcionesFormateadas,
      debug: {
        totalFunciones: todasLasFunciones.length,
        funcionesFiltradas: funcionesFiltradas.length,
        fechaActual: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching functions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
