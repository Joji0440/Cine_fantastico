import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const clasificacion = searchParams.get('clasificacion') || '';
    const ordenarPor = searchParams.get('ordenarPor') || 'fecha_estreno';

    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Validar límites para evitar consultas masivas
    const maxLimit = 50;
    const finalLimit = Math.min(limit, maxLimit);

    // Construcción del WHERE clause optimizado - Solo películas activas para clientes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      activa: true // Solo películas activas para el público
    };

    // Filtro por búsqueda
    if (search) {
      where.OR = [
        {
          titulo: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          director: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          reparto: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Filtro por clasificación - manejar mapeo de enum
    if (clasificacion) {
      // Convertir valores de UI a valores de enum Prisma
      let clasificacionEnum;
      switch (clasificacion) {
        case 'PG-13':
          clasificacionEnum = 'PG_13';
          break;
        case 'NC-17':
          clasificacionEnum = 'NC_17';
          break;
        default:
          clasificacionEnum = clasificacion;
      }
      where.clasificacion = clasificacionEnum;
    }

    // Obtener total de registros para paginación
    const total = await prisma.peliculas.count({ where });

    // Determinar ordenamiento
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = {};
    switch (ordenarPor) {
      case 'titulo':
        orderBy = { titulo: 'asc' };
        break;
      case 'calificacion_imdb':
        orderBy = { calificacion_imdb: 'desc' };
        break;
      case 'fecha_estreno':
      default:
        orderBy = { fecha_estreno_local: 'desc' };
        break;
    }

    // Consulta principal optimizada con géneros
    const peliculas = await prisma.peliculas.findMany({
      where,
      skip,
      take: finalLimit,
      orderBy,
      include: {
        peliculas_generos: {
          include: {
            genero: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });

    // Transformar los datos para incluir géneros como string
    const peliculasTransformadas = peliculas.map(pelicula => ({
      id: pelicula.id,
      titulo: pelicula.titulo,
      sinopsis: pelicula.sinopsis,
      poster_url: pelicula.poster_url,
      trailer_url: pelicula.trailer_url,
      duracion_minutos: pelicula.duracion_minutos,
      clasificacion: pelicula.clasificacion,
      genero: pelicula.peliculas_generos.map(pg => pg.genero.nombre).join(', ') || 'No especificado',
      director: pelicula.director,
      actores_principales: pelicula.reparto,
      calificacion_imdb: pelicula.calificacion_imdb ? Number(pelicula.calificacion_imdb) : null,
      fecha_estreno_mundial: pelicula.fecha_estreno_mundial,
      fecha_estreno_local: pelicula.fecha_estreno_local,
      activa: pelicula.activa
    }));

    // Calcular información de paginación
    const totalPages = Math.ceil(total / finalLimit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      peliculas: peliculasTransformadas,
      pagination: {
        total,
        page,
        limit: finalLimit,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      filtros: {
        search,
        clasificacion,
        ordenarPor
      }
    });

  } catch (error) {
    console.error('Error fetching movies for public:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
