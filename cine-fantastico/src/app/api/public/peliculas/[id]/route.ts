import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('🎬 DEBUGGING - Buscando película con ID:', id);

    // Obtener la película con sus funciones
    const pelicula = await prisma.peliculas.findUnique({
      where: {
        id: id,
        activa: true
      },
      include: {
        funciones: {
          where: {
            activa: true,
            fecha_hora_inicio: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Incluir funciones de las últimas 24 horas para debugging
            }
          },
          include: {
            sala: true
          },
          orderBy: {
            fecha_hora_inicio: 'asc'
          }
        },
        peliculas_generos: {
          include: {
            genero: true
          }
        }
      }
    });

    if (!pelicula) {
      console.log('❌ DEBUGGING - Película no encontrada');
      return NextResponse.json(
        { error: 'Película no encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ DEBUGGING - Película encontrada:', pelicula.titulo);
    console.log('📊 DEBUGGING - Funciones encontradas:', pelicula.funciones?.length || 0);

    // Transformar los datos para el cliente
    const peliculaTransformada = {
      id: pelicula.id,
      titulo: pelicula.titulo,
      sinopsis: pelicula.sinopsis,
      poster_url: pelicula.poster_url,
      trailer_url: pelicula.trailer_url,
      duracion_minutos: pelicula.duracion_minutos,
      clasificacion: pelicula.clasificacion,
      director: pelicula.director,
      actores_principales: pelicula.reparto, // Mapear reparto a actores_principales
      calificacion_imdb: pelicula.calificacion_imdb ? Number(pelicula.calificacion_imdb) : null,
      fecha_estreno_mundial: pelicula.fecha_estreno_mundial,
      fecha_estreno_local: pelicula.fecha_estreno_local,
      generos: pelicula.peliculas_generos?.map(pg => pg.genero.nombre) || [],
      funciones: pelicula.funciones?.map(funcion => ({
        id: funcion.id,
        fecha_hora_inicio: funcion.fecha_hora_inicio,
        fecha_hora_fin: funcion.fecha_hora_fin,
        precio_base: Number(funcion.precio_base),
        asientos_disponibles: funcion.asientos_disponibles,
        asientos_reservados: funcion.asientos_reservados,
        sala: {
          id: funcion.sala.id,
          numero: funcion.sala.numero,
          nombre: funcion.sala.nombre,
          tipo_sala: funcion.sala.tipo_sala,
          capacidad_total: funcion.sala.capacidad_total
        }
      })) || []
    };

    return NextResponse.json({
      success: true,
      pelicula: peliculaTransformada
    });

  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
