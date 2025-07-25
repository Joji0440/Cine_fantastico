import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Obtener resumen de ventas del día
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Ventas del día con una sola consulta optimizada
    const ventasHoy = await prisma.reservas.aggregate({
      where: {
        fecha_reserva: {
          gte: today,
          lt: tomorrow
        }
      },
      _count: {
        id: true
      },
      _sum: {
        precio_total: true
      }
    });

    const reservasPagadas = await prisma.reservas.count({
      where: {
        fecha_reserva: {
          gte: today,
          lt: tomorrow
        },
        estado: 'pagada'
      }
    });

    // Ocupación promedio - consulta separada más eficiente
    const totalAsientosReservados = await prisma.funciones.aggregate({
      where: {
        fecha_hora_inicio: {
          gte: today,
          lt: tomorrow
        },
        activa: true
      },
      _sum: {
        asientos_reservados: true
      }
    });

    const totalCapacidad = await prisma.funciones.aggregate({
      where: {
        fecha_hora_inicio: {
          gte: today,
          lt: tomorrow
        },
        activa: true
      },
      _sum: {
        asientos_disponibles: true,
        asientos_reservados: true
      }
    });

    const ocupacionPromedio = totalAsientosReservados._sum.asientos_reservados && 
      (totalCapacidad._sum.asientos_disponibles && totalCapacidad._sum.asientos_reservados)
      ? (totalAsientosReservados._sum.asientos_reservados / 
         (totalCapacidad._sum.asientos_disponibles + totalCapacidad._sum.asientos_reservados)) * 100
      : 0;

    // Películas activas
    const peliculasActivas = await prisma.peliculas.count({
      where: {
        activa: true
      }
    });

    // Usuarios registrados
    const usuariosRegistrados = await prisma.usuarios.count();

    const summary = {
      ventasHoy: {
        total_reservas: ventasHoy._count.id || 0,
        ingresos_total: Number(ventasHoy._sum.precio_total) || 0,
        pagadas: reservasPagadas
      },
      ocupacionPromedio: Number(ocupacionPromedio.toFixed(1)),
      peliculasActivas,
      usuariosRegistrados
    };

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching reports summary:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
