import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'cine-fantastico-secret-key-2025';

interface DecodedToken {
  userId: string;
  email: string;
  tipo_usuario: string;
  iat: number;
  exp: number;
}

// Función simple para obtener el usuario del request
function getUserFromRequest(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== DEBUG: POST /api/admin/peliculas - Iniciando ===");
    
    // Verificar autenticación
    const user = getUserFromRequest(request);
    console.log("=== DEBUG: Usuario obtenido ===", user);
    
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    console.log("=== DEBUG: Tipo de usuario ===", user.tipo_usuario);
    if (!['empleado', 'administrador', 'gerente'].includes(user.tipo_usuario)) {
      console.log("=== DEBUG: Usuario no autorizado ===", user.tipo_usuario);
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("=== DEBUG: Datos recibidos ===", body);

    // Validaciones básicas
    if (!body.titulo) {
      console.log("=== DEBUG: Título faltante ===");
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      );
    }

    if (!body.duracion_minutos || isNaN(parseInt(body.duracion_minutos))) {
      console.log("=== DEBUG: Duración inválida ===");
      return NextResponse.json(
        { error: "La duración en minutos debe ser un número válido" },
        { status: 400 }
      );
    }

    // Preparar los datos para la base de datos
    const peliculaData = {
      titulo: body.titulo.trim(),
      sinopsis: body.sinopsis?.trim() || null,
      director: body.director?.trim() || null,
      reparto: body.reparto?.trim() || null,
      duracion_minutos: parseInt(body.duracion_minutos),
      clasificacion: body.clasificacion || 'PG',
      idioma_original: body.idioma_original?.trim() || null,
      fecha_estreno_mundial: body.fecha_estreno_mundial ? new Date(body.fecha_estreno_mundial) : null,
      fecha_estreno_local: body.fecha_estreno_local ? new Date(body.fecha_estreno_local) : null,
      calificacion_imdb: body.calificacion_imdb ? parseFloat(body.calificacion_imdb) : null,
      poster_url: body.poster_url?.trim() || body.url_imagen?.trim() || null,
      trailer_url: body.trailer_url?.trim() || body.url_trailer?.trim() || null,
      activa: body.activa !== false, // Por defecto true
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date()
    };

    console.log("=== DEBUG: Datos preparados para guardar ===", {
      poster_url: peliculaData.poster_url,
      trailer_url: peliculaData.trailer_url
    });

    // Si se proporcionó un país de origen, buscar o crear la relación
    if (body.pais_origen && body.pais_origen.trim()) {
      console.log("=== DEBUG: Buscando país de origen ===", body.pais_origen);
      try {
        const pais = await prisma.paises.findFirst({
          where: { nombre: body.pais_origen.trim() }
        });
        
        if (pais) {
          const peliculaDataWithPais = peliculaData as typeof peliculaData & { pais_origen_id?: string };
          peliculaDataWithPais.pais_origen_id = pais.id;
          console.log("=== DEBUG: País encontrado ===", pais.id, pais.nombre);
        } else {
          console.log("=== DEBUG: País no encontrado ===", body.pais_origen);
        }
      } catch (paisError) {
        console.error("=== DEBUG: Error buscando país ===", paisError);
      }
    }

    console.log("=== DEBUG: Datos preparados para Prisma ===", peliculaData);

    // Crear la película en la base de datos
    const nuevaPelicula = await prisma.peliculas.create({
      data: peliculaData
    });

    console.log("=== DEBUG: Película creada exitosamente ===", nuevaPelicula.id);
    
    // Si se proporcionó un género, crear la relación
    if (body.genero && body.genero.trim()) {
      console.log("=== DEBUG: Creando relación de género ===", body.genero);
      try {
        let genero = await prisma.generos.findFirst({
          where: { nombre: body.genero.trim() }
        });
        
        if (!genero) {
          genero = await prisma.generos.create({
            data: { nombre: body.genero.trim() }
          });
          console.log("=== DEBUG: Género creado ===", genero.id);
        }

        await prisma.peliculas_generos.create({
          data: {
            pelicula_id: nuevaPelicula.id,
            genero_id: genero.id
          }
        });
        console.log("=== DEBUG: Relación película-género creada ===");
      } catch (generoError) {
        console.error("=== DEBUG: Error creando género ===", generoError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Película creada exitosamente",
      pelicula: {
        id: nuevaPelicula.id,
        titulo: nuevaPelicula.titulo,
        director: nuevaPelicula.director,
        duracion_minutos: nuevaPelicula.duracion_minutos,
        clasificacion: nuevaPelicula.clasificacion,
        activa: nuevaPelicula.activa
      }
    });

  } catch (error) {
    console.error("=== DEBUG: Error completo en POST ===", error);
    console.error("=== DEBUG: Error stack ===", error instanceof Error ? error.stack : 'No stack');
    console.error("=== DEBUG: Error message ===", error instanceof Error ? error.message : 'No message');
    
    // Manejar errores específicos de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      console.log("=== DEBUG: Error de Prisma detectado ===", error.code);
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "Ya existe una película con ese título" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/peliculas - Iniciando...');
    
    // Verificar autenticación - con logs detallados
    const user = getUserFromRequest(request);
    console.log('🔍 GET /api/admin/peliculas - Usuario obtenido:', user ? {
      userId: user.userId,
      email: user.email,
      tipo_usuario: user.tipo_usuario
    } : 'NULL');
    
    if (!user) {
      console.log('🔍 GET /api/admin/peliculas - Usuario no encontrado, retornando 401');
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que sea empleado, administrador o gerente
    if (!['empleado', 'administrador', 'gerente'].includes(user.tipo_usuario)) {
      console.log('🔍 GET /api/admin/peliculas - Usuario no autorizado:', user.tipo_usuario);
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const activa = searchParams.get('activa');

    console.log('🔍 GET /api/admin/peliculas - Parámetros:', { page, limit, search, activa });

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { director: { contains: search, mode: 'insensitive' } },
        { 
          peliculas_generos: {
            some: {
              genero: {
                nombre: { contains: search, mode: 'insensitive' }
              }
            }
          }
        }
      ];
    }

    if (activa !== null && activa !== undefined) {
      where.activa = activa === 'true';
    }

    console.log('🔍 GET /api/admin/peliculas - Where clause:', where);

    // Obtener películas con paginación
    console.log('🔍 GET /api/admin/peliculas - Ejecutando consulta a BD...');
    const [peliculas, total] = await Promise.all([
      prisma.peliculas.findMany({
        where,
        include: {
          peliculas_generos: {
            include: {
              genero: true
            }
          }
        },
        orderBy: { fecha_creacion: 'desc' },
        skip,
        take: limit
      }),
      prisma.peliculas.count({ where })
    ]);

    console.log('🔍 GET /api/admin/peliculas - Resultados:', { 
      peliculas_encontradas: peliculas.length, 
      total 
    });

    return NextResponse.json({
      success: true,
      peliculas,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("🔍 GET /api/admin/peliculas - ERROR:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    if (!['empleado', 'administrador', 'gerente'].includes(user.tipo_usuario)) {
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, activa } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de película requerido" },
        { status: 400 }
      );
    }

    const pelicula = await prisma.peliculas.update({
      where: { id },
      data: { 
        activa,
        fecha_actualizacion: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Película ${activa ? 'activada' : 'desactivada'} exitosamente`,
      pelicula
    });

  } catch (error) {
    console.error("Error en PATCH:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
