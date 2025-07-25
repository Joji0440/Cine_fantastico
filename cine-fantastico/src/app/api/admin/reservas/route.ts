import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/reservas - Iniciando...');
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const estado = searchParams.get('estado');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    
    console.log('🔍 GET /api/admin/reservas - Parámetros:', { search, estado, fechaDesde, fechaHasta });
    
    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Validar límites para evitar consultas masivas
    const maxLimit = 100;
    const finalLimit = Math.min(limit, maxLimit);

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (search && search.trim()) {
      const searchTerm = search.trim();
      console.log('🔍 GET /api/admin/reservas - Término de búsqueda:', searchTerm);
      
      where.OR = [
        // Buscar por código de reserva
        { 
          codigo_reserva: { 
            contains: searchTerm, 
            mode: 'insensitive' 
          } 
        },
        // Buscar por datos del usuario
        { 
          usuario: { 
            OR: [
              { nombre: { contains: searchTerm, mode: 'insensitive' } },
              { apellido: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        },
        // Buscar por título de película
        { 
          funcion: { 
            pelicula: { 
              titulo: { contains: searchTerm, mode: 'insensitive' } 
            } 
          } 
        }
      ];
    }

    if (estado && estado !== 'all') {
      where.estado = estado;
    }

    if (fechaDesde || fechaHasta) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      
      if (fechaDesde) {
        console.log('🔍 GET /api/admin/reservas - Fecha desde recibida:', fechaDesde);
        const [year, month, day] = fechaDesde.split('-').map(Number);
        const desde = new Date(year, month - 1, day, 0, 0, 0, 0);
        dateFilter.gte = desde;
        console.log('🔍 GET /api/admin/reservas - Fecha desde procesada:', desde.toISOString());
      }

      if (fechaHasta) {
        console.log('🔍 GET /api/admin/reservas - Fecha hasta recibida:', fechaHasta);
        const [year, month, day] = fechaHasta.split('-').map(Number);
        const hasta = new Date(year, month - 1, day, 23, 59, 59, 999);
        dateFilter.lte = hasta;
        console.log('🔍 GET /api/admin/reservas - Fecha hasta procesada:', hasta.toISOString());
      }
      
      where.fecha_reserva = dateFilter;
    }

    console.log('🔍 GET /api/admin/reservas - Where clause:', JSON.stringify(where, null, 2));

    // Obtener total de registros para paginación
    const total = await prisma.reservas.count({ where });

    // Obtener reservas con paginación
    const reservas = await prisma.reservas.findMany({
      where,
      skip,
      take: finalLimit,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        },
        funcion: {
          select: {
            id: true,
            fecha_hora_inicio: true,
            precio_base: true,
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
                tipo_sala: true
              }
            }
          }
        }
      },
      orderBy: [
        { fecha_reserva: 'desc' }
      ]
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(total / finalLimit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      reservas,
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
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos requeridos
    if (!body.usuario_id || !body.funcion_id || !body.cantidad_asientos) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: usuario_id, funcion_id, cantidad_asientos' },
        { status: 400 }
      );
    }

    // Verificar que la función existe y está activa
    const funcion = await prisma.funciones.findFirst({
      where: { 
        id: body.funcion_id, 
        activa: true,
        fecha_hora_inicio: {
          gt: new Date() // No permitir reservas para funciones pasadas
        }
      },
      include: {
        sala: true,
        pelicula: true
      }
    });

    if (!funcion) {
      return NextResponse.json(
        { success: false, error: 'Función no encontrada o no disponible' },
        { status: 404 }
      );
    }

    // Verificar que el cliente exists
    const cliente = await prisma.usuarios.findFirst({
      where: { 
        id: body.usuario_id,
        activo: true
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar disponibilidad básica de la función
    const reservasExistentes = await prisma.reservas.aggregate({
      where: {
        funcion_id: body.funcion_id,
        estado: { in: ['confirmada', 'pendiente', 'pagada'] }
      },
      _sum: {
        cantidad_asientos: true
      }
    });

    const asientosReservados = reservasExistentes._sum?.cantidad_asientos || 0;
    const asientosDisponibles = funcion.asientos_disponibles || 0;

    if (asientosReservados + parseInt(body.cantidad_asientos) > asientosDisponibles) {
      return NextResponse.json(
        { success: false, error: 'No hay suficientes asientos disponibles para esta función' },
        { status: 409 }
      );
    }

    // Calcular precio total
    const precioBase = parseFloat(funcion.precio_base?.toString() || '0');
    const precioExtra = parseFloat(funcion.sala?.precio_extra?.toString() || '0');
    const precioTotal = (precioBase + precioExtra) * parseInt(body.cantidad_asientos);

    // Generar código de reserva único
    const codigoReserva = `RES${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Crear la reserva
    const nuevaReserva = await prisma.reservas.create({
      data: {
        codigo_reserva: codigoReserva,
        usuario_id: body.usuario_id,
        funcion_id: body.funcion_id,
        cantidad_asientos: parseInt(body.cantidad_asientos),
        precio_subtotal: precioTotal,
        precio_total: precioTotal,
        estado: body.estado || 'pendiente',
        metodo_pago: body.metodo_pago || null,
        notas: body.notas || null
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        },
        funcion: {
          include: {
            pelicula: {
              select: {
                titulo: true
              }
            },
            sala: {
              select: {
                numero: true,
                nombre: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      reserva: nuevaReserva
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
