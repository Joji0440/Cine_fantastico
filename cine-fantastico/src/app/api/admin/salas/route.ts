import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const activa = searchParams.get('activa');

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
      OR?: Array<{
        nombre?: { contains: string; mode: 'insensitive' };
        numero?: { equals: number | undefined };
      }>;
    } = {};

    if (activa !== null && activa !== 'all') {
      where.activa = activa === 'true';
    }

    if (search) {
      where.OR = [
        {
          nombre: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          numero: {
            equals: isNaN(parseInt(search)) ? undefined : parseInt(search)
          }
        }
      ];
    }

    // Obtener total de registros para paginación
    const total = await prisma.salas.count({ where });

    // Obtener salas con paginación
    const salas = await prisma.salas.findMany({
      where,
      skip,
      take: finalLimit,
      select: {
        id: true,
        numero: true,
        nombre: true,
        tipo_sala: true,
        capacidad_total: true,
        filas: true,
        asientos_por_fila: true,
        precio_extra: true,
        activa: true,
        equipamiento: true,
        notas: true,
        fecha_creacion: true,
        fecha_actualizacion: true
      },
      orderBy: {
        numero: 'asc'
      }
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(total / finalLimit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      salas,
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
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      numero,
      nombre,
      tipo_sala,
      capacidad_total,
      filas,
      asientos_por_fila,
      precio_extra,
      equipamiento,
      notas
    } = body;

    // Validate required fields
    if (!numero || !nombre || !tipo_sala || !capacidad_total || !filas || !asientos_por_fila) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos obligatorios son requeridos' },
        { status: 400 }
      );
    }

    // Check if room number already exists
    const existingRoom = await prisma.salas.findFirst({
      where: { numero: parseInt(numero) }
    });

    if (existingRoom) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una sala con este número' },
        { status: 409 }
      );
    }

    // Validate capacity calculation
    const calculatedCapacity = parseInt(filas) * parseInt(asientos_por_fila);
    if (calculatedCapacity !== parseInt(capacidad_total)) {
      return NextResponse.json(
        { success: false, error: 'La capacidad total no coincide con filas × asientos por fila' },
        { status: 400 }
      );
    }

    // Create the room
    const nuevaSala = await prisma.salas.create({
      data: {
        numero: parseInt(numero),
        nombre,
        tipo_sala,
        capacidad_total: parseInt(capacidad_total),
        filas: parseInt(filas),
        asientos_por_fila: parseInt(asientos_por_fila),
        precio_extra: parseFloat(precio_extra) || 0,
        activa: true,
        equipamiento: equipamiento || {},
        notas: notas || null
      }
    });

    return NextResponse.json({
      success: true,
      sala: nuevaSala
    });

  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
