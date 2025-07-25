import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/funciones - Iniciando...');
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const activa = searchParams.get('activa');
    const fecha = searchParams.get('fecha');

    console.log('🔍 GET /api/admin/funciones - Parámetros:', { search, activa, fecha });

    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Validar límites para evitar consultas masivas
    const maxLimit = 100;
    const finalLimit = Math.min(limit, maxLimit);

    // Build where clause
    const where: {
      activa?: boolean;
      fecha_hora_inicio?: { gte: Date; lte: Date };
      sala_id?: string;
      OR?: Array<{
        pelicula?: { titulo?: { contains: string; mode: 'insensitive' } };
        sala?: { numero?: number; nombre?: { contains: string; mode: 'insensitive' } };
      }>;
    } = {};

    if (activa !== null && activa !== 'all') {
      where.activa = activa === 'true';
    }

    if (fecha) {
      console.log('🔍 GET /api/admin/funciones - Fecha recibida:', fecha);
      
      // Crear fechas sin problemas de zona horaria
      const [year, month, day] = fecha.split('-').map(Number);
      const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      console.log('🔍 GET /api/admin/funciones - Rango de fechas:', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      });
      
      where.fecha_hora_inicio = {
        gte: startDate,
        lte: endDate
      };
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      console.log('🔍 GET /api/admin/funciones - Término de búsqueda:', searchTerm);
      
      where.OR = [
        // Buscar por título de película
        {
          pelicula: {
            titulo: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        },
        // Buscar por nombre de sala
        {
          sala: {
            nombre: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        }
      ];

      // Si el término de búsqueda es un número, también buscar por número de sala
      const salaNumero = parseInt(searchTerm);
      if (!isNaN(salaNumero)) {
        where.OR.push({
          sala: {
            numero: salaNumero
          }
        });
      }
    }

    console.log('🔍 GET /api/admin/funciones - Where clause:', JSON.stringify(where, null, 2));

    console.log('🔍 GET /api/admin/funciones - Ejecutando consulta a BD...');
    // Obtener total de registros para paginación
    const total = await prisma.funciones.count({ where });

    console.log('🔍 GET /api/admin/funciones - Total encontrado:', total);

    // Obtener funciones con paginación
    const funciones = await prisma.funciones.findMany({
      where,
      skip,
      take: finalLimit,
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
      },
      orderBy: {
        fecha_hora_inicio: 'asc'
      }
    });

    console.log('🔍 GET /api/admin/funciones - Funciones encontradas:', funciones.length);

    // Calculate reserved seats for each function - OPTIMIZADO para evitar consultas N+1
    const funcionIds = funciones.map(f => f.id);
    
    // Una sola consulta para obtener todas las reservas
    const reservasGrouped = await prisma.reservas.groupBy({
      by: ['funcion_id'],
      where: {
        funcion_id: { in: funcionIds },
        estado: 'confirmada'
      },
      _sum: {
        cantidad_asientos: true
      }
    });

    // Crear mapa para acceso O(1)
    const reservasMap = new Map(
      reservasGrouped.map(r => [r.funcion_id, r._sum?.cantidad_asientos || 0])
    );

    // Aplicar datos de ocupación
    const funcionesWithOccupancy = funciones.map((funcion) => {
      const asientos_reservados = reservasMap.get(funcion.id) || 0;

      return {
        ...funcion,
        asientos_reservados,
        asientos_disponibles: funcion.asientos_disponibles
      };
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(total / finalLimit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      funciones: funcionesWithOccupancy,
      pagination: {
        total,
        page,
        limit: finalLimit,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });

  } catch (error) {
    console.error('🔍 GET /api/admin/funciones - ERROR:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pelicula_id,
      sala_id,
      fecha_hora_inicio,
      precio_base
    } = body;

    // Validate required fields
    if (!pelicula_id || !sala_id || !fecha_hora_inicio || !precio_base) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Get movie duration to calculate end time
    const pelicula = await prisma.peliculas.findUnique({
      where: { id: pelicula_id }
    });

    if (!pelicula) {
      return NextResponse.json(
        { success: false, error: 'Película no encontrada' },
        { status: 404 }
      );
    }

    // Get sala capacity for available seats
    const sala = await prisma.salas.findUnique({
      where: { id: sala_id }
    });

    if (!sala) {
      return NextResponse.json(
        { success: false, error: 'Sala no encontrada' },
        { status: 404 }
      );
    }

    // Calculate end time (movie duration + 30 minutes buffer)
    const startTime = new Date(fecha_hora_inicio);
    const endTime = new Date(startTime.getTime() + (pelicula.duracion_minutos + 30) * 60000);

    // Check for conflicts with existing functions in the same room
    const conflictingFunctions = await prisma.funciones.findMany({
      where: {
        sala_id: sala_id,
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
        { success: false, error: 'Ya existe una función programada en ese horario para esta sala' },
        { status: 409 }
      );
    }

    // Create the function
    const nuevaFuncion = await prisma.funciones.create({
      data: {
        pelicula_id,
        sala_id,
        fecha_hora_inicio: startTime,
        fecha_hora_fin: endTime,
        precio_base: parseFloat(precio_base),
        asientos_disponibles: sala.capacidad_total,
        asientos_reservados: 0,
        activa: true
      },
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
      funcion: nuevaFuncion
    });

  } catch (error) {
    console.error('Error creating function:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
