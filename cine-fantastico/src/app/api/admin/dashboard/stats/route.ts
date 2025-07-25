import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('📊 Obteniendo estadísticas completas...');

    // Obtener fecha actual (inicio y fin del día) - SIN ZONA HORARIA
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
    const mañana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);

    console.log('📊 Calculando para fecha:', { 
      desde: hoy.toISOString(), 
      hasta: mañana.toISOString() 
    });

    // 1. Estadísticas de películas
    const [totalPeliculas, peliculasActivas] = await Promise.all([
      prisma.peliculas.count(),
      prisma.peliculas.count({ where: { activa: true } })
    ]);

    // 2. Estadísticas de usuarios
    const totalUsuarios = await prisma.usuarios.count({
      where: { activo: true }
    });

    // 3. Estadísticas de salas
    const salasActivas = await prisma.salas.count({
      where: { activa: true }
    });

    // 4. Estadísticas de funciones hoy
    const funcionesHoy = await prisma.funciones.count({
      where: {
        fecha_hora_inicio: {
          gte: hoy,
          lte: mañana
        },
        activa: true
      }
    });

    // 5. Estadísticas de reservas hoy
    const [reservasHoy, reservasHoyPagadas] = await Promise.all([
      prisma.reservas.count({
        where: {
          fecha_reserva: {
            gte: hoy,
            lte: mañana
          }
        }
      }),
      prisma.reservas.findMany({
        where: {
          fecha_reserva: {
            gte: hoy,
            lte: mañana
          },
          estado: 'pagada'
        },
        select: {
          cantidad_asientos: true,
          precio_total: true
        }
      })
    ]);

    // 6. Calcular asientos vendidos e ingresos de hoy
    const asientosVendidos = reservasHoyPagadas.reduce((total, reserva) => 
      total + reserva.cantidad_asientos, 0
    );

    const ingresosHoy = reservasHoyPagadas.reduce((total, reserva) => 
      total + parseFloat(reserva.precio_total.toString()), 0
    );

    // 7. Estadísticas de ocupación (basado en funciones de hoy)
    const funcionesConCapacidad = await prisma.funciones.findMany({
      where: {
        fecha_hora_inicio: {
          gte: hoy,
          lte: mañana
        },
        activa: true
      },
      include: {
        sala: {
          select: {
            capacidad_total: true
          }
        },
        reservas: {
          where: {
            estado: {
              in: ['confirmada', 'pagada', 'usada']
            }
          },
          select: {
            cantidad_asientos: true
          }
        }
      }
    });

    let capacidadTotal = 0;
    let asientosOcupados = 0;

    funcionesConCapacidad.forEach(funcion => {
      capacidadTotal += funcion.sala.capacidad_total;
      const asientosReservados = funcion.reservas.reduce((total, reserva) => 
        total + reserva.cantidad_asientos, 0
      );
      asientosOcupados += asientosReservados;
    });

    const porcentajeOcupacion = capacidadTotal > 0 ? Math.round((asientosOcupados / capacidadTotal) * 100) : 0;

    // 8. Estadísticas por estado de reservas
    const reservasPorEstado = await prisma.reservas.groupBy({
      by: ['estado'],
      where: {
        fecha_reserva: {
          gte: hoy,
          lte: mañana
        }
      },
      _count: {
        id: true
      }
    });

    const porEstado: Record<string, number> = {};
    reservasPorEstado.forEach(grupo => {
      porEstado[grupo.estado] = grupo._count.id;
    });

    const estadisticas = {
      peliculas: {
        total: totalPeliculas,
        activas: peliculasActivas
      },
      reservas: {
        hoy: reservasHoy,
        asientos_vendidos: asientosVendidos,
        por_estado: porEstado
      },
      ingresos: {
        hoy: ingresosHoy
      },
      usuarios: {
        total: totalUsuarios
      },
      funciones: {
        hoy: funcionesHoy
      },
      salas: {
        activas: salasActivas
      },
      ocupacion: {
        porcentaje: porcentajeOcupacion,
        capacidad_total: capacidadTotal,
        asientos_ocupados: asientosOcupados
      }
    };

    console.log('📊 Estadísticas calculadas:', estadisticas);
    return NextResponse.json(estadisticas);

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
