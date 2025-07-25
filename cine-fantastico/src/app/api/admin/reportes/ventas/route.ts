import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros de filtrado
    const periodo = searchParams.get('periodo') || 'month'; // today, week, month, year, custom
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const pelicula = searchParams.get('pelicula') || '';
    const sala = searchParams.get('sala') || '';
    const estado = searchParams.get('estado') || '';
    
    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Validar límites para evitar consultas masivas
    const maxLimit = 100;
    const finalLimit = Math.min(limit, maxLimit);

    // Calcular fechas según el período
    let startDate: Date, endDate: Date;
    const now = new Date();

    switch (periodo) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        if (fechaInicio && fechaFin) {
          // Arreglar procesamiento de fechas sin zona horaria
          const [yearInicio, monthInicio, dayInicio] = fechaInicio.split('-').map(Number);
          const [yearFin, monthFin, dayFin] = fechaFin.split('-').map(Number);
          
          startDate = new Date(yearInicio, monthInicio - 1, dayInicio, 0, 0, 0, 0);
          endDate = new Date(yearFin, monthFin - 1, dayFin, 23, 59, 59, 999);
        } else {
          // Default to current month if custom dates not provided
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Construcción del WHERE clause optimizado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      fecha_reserva: {
        gte: startDate,
        lte: endDate
      }
    };

    if (estado && estado !== 'all') {
      where.estado = estado as 'pendiente' | 'confirmada' | 'pagada' | 'cancelada';
    }

    // Filtros con búsqueda en relaciones usando OR
    if (pelicula || sala) {
      where.funcion = {};
      
      if (pelicula) {
        where.funcion.pelicula = {
          titulo: {
            contains: pelicula,
            mode: 'insensitive'
          }
        };
      }
      
      if (sala) {
        where.funcion.sala = {
          OR: [
            {
              nombre: {
                contains: sala,
                mode: 'insensitive'
              }
            },
            {
              numero: {
                equals: isNaN(parseInt(sala)) ? undefined : parseInt(sala)
              }
            }
          ]
        };
      }
    }

    // Obtener total de registros para paginación (consulta optimizada)
    const total = await prisma.reservas.count({ where });

    // Consulta principal con JOIN optimizado
    const reservas = await prisma.reservas.findMany({
      where,
      skip,
      take: finalLimit,
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        },
        funcion: {
          select: {
            fecha_hora_inicio: true,
            precio_base: true,
            pelicula: {
              select: {
                titulo: true,
                poster_url: true,
                clasificacion: true
              }
            },
            sala: {
              select: {
                numero: true,
                nombre: true,
                tipo_sala: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha_reserva: 'desc'
      }
    });

    // Calcular métricas agregadas con una sola consulta
    const metricas = await prisma.reservas.aggregate({
      where,
      _sum: {
        precio_total: true,
        cantidad_asientos: true
      },
      _count: true,
      _avg: {
        precio_total: true
      }
    });

    // Métricas por estado (consulta separada optimizada)
    const metricasPorEstado = await prisma.reservas.groupBy({
      by: ['estado'],
      where: {
        fecha_reserva: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        precio_total: true
      },
      _count: {
        id: true
      }
    });

    // Top películas en el período (consulta optimizada)
    const topPeliculas = await prisma.reservas.groupBy({
      by: ['funcion_id'],
      where,
      _sum: {
        precio_total: true,
        cantidad_asientos: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          precio_total: 'desc'
        }
      },
      take: 5
    });

    // Obtener detalles de las top películas
    const funcionIds = topPeliculas.map(tp => tp.funcion_id);
    const funcionesDetalles = await prisma.funciones.findMany({
      where: {
        id: { in: funcionIds }
      },
      include: {
        pelicula: {
          select: {
            titulo: true,
            poster_url: true
          }
        }
      }
    });

    // Mapear detalles a top películas
    const topPeliculasConDetalles = topPeliculas.map(tp => {
      const funcionDetalle = funcionesDetalles.find(fd => fd.id === tp.funcion_id);
      return {
        ...tp,
        pelicula: funcionDetalle?.pelicula || null
      };
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(total / finalLimit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        reservas,
        metricas: {
          total_reservas: metricas._count || 0,
          ingresos_total: Number(metricas._sum?.precio_total) || 0,
          asientos_vendidos: metricas._sum?.cantidad_asientos || 0,
          precio_promedio: Number(metricas._avg?.precio_total) || 0,
          por_estado: metricasPorEstado.map(m => ({
            estado: m.estado,
            cantidad: m._count.id,
            ingresos: Number(m._sum.precio_total) || 0
          }))
        },
        top_peliculas: topPeliculasConDetalles,
        filtros: {
          periodo,
          fecha_inicio: startDate,
          fecha_fin: endDate,
          pelicula,
          sala,
          estado
        }
      },
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
    console.error('Error fetching sales report:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
