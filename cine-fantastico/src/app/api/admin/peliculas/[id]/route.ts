import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que sea empleado, administrador o gerente
    if (!['empleado', 'administrador', 'gerente'].includes(user.tipo_usuario)) {
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Buscar la película con sus relaciones
    const pelicula = await prisma.peliculas.findUnique({
      where: { id },
      include: {
        peliculas_generos: {
          include: {
            genero: true
          }
        }
      }
    });

    if (!pelicula) {
      return NextResponse.json(
        { error: "Película no encontrada" },
        { status: 404 }
      );
    }

    // Formatear los datos para el frontend
    const peliculaFormateada = {
      ...pelicula,
      genero: pelicula.peliculas_generos[0]?.genero?.nombre || '',
      // Mapear campos para compatibilidad con el frontend - incluir ambos nombres
      fecha_estreno: pelicula.fecha_estreno_local,
      url_imagen: pelicula.poster_url,
      url_trailer: pelicula.trailer_url,
      poster_url: pelicula.poster_url,  // Mantener nombre original también
      trailer_url: pelicula.trailer_url,  // Mantener nombre original también
      // Asegurar que las fechas originales estén disponibles
      fecha_estreno_local: pelicula.fecha_estreno_local,
      fecha_estreno_mundial: pelicula.fecha_estreno_mundial
    };

    return NextResponse.json({
      success: true,
      pelicula: peliculaFormateada
    });

  } catch (error) {
    console.error("Error obteniendo película:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que sea empleado, administrador o gerente
    if (!['empleado', 'administrador', 'gerente'].includes(user.tipo_usuario)) {
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    console.log("=== DEBUG PUT: Body completo recibido ===", body);
    console.log("=== DEBUG PUT: URLs recibidas ===", {
      poster_url: body.poster_url,
      url_imagen: body.url_imagen,
      trailer_url: body.trailer_url,
      url_trailer: body.url_trailer
    });

    // Validaciones básicas
    if (!body.titulo || !body.titulo.trim()) {
      return NextResponse.json(
        { error: "El título es obligatorio" },
        { status: 400 }
      );
    }

    if (!body.duracion_minutos || body.duracion_minutos <= 0) {
      return NextResponse.json(
        { error: "La duración debe ser mayor a 0 minutos" },
        { status: 400 }
      );
    }

    // Preparar los datos para actualizar
    const peliculaData = {
      titulo: body.titulo.trim(),
      sinopsis: body.sinopsis?.trim() || null,
      director: body.director?.trim() || null,
      reparto: body.reparto?.trim() || null,
      duracion_minutos: parseInt(body.duracion_minutos),
      clasificacion: body.clasificacion || 'PG',
      idioma_original: body.idioma_original?.trim() || null,
      fecha_estreno_local: body.fecha_estreno_local ? new Date(body.fecha_estreno_local) : null,
      fecha_estreno_mundial: body.fecha_estreno_mundial ? new Date(body.fecha_estreno_mundial) : null,
      poster_url: body.poster_url?.trim() || body.url_imagen?.trim() || null,
      trailer_url: body.trailer_url?.trim() || body.url_trailer?.trim() || null,
      activa: body.activa !== false
    };

    console.log("=== DEBUG PUT: Datos preparados para actualizar ===", {
      poster_url: peliculaData.poster_url,
      trailer_url: peliculaData.trailer_url,
      fecha_estreno_local: peliculaData.fecha_estreno_local,
      fecha_estreno_mundial: peliculaData.fecha_estreno_mundial
    });

    // Actualizar la película
    const peliculaActualizada = await prisma.peliculas.update({
      where: { id },
      data: peliculaData,
      include: {
        peliculas_generos: {
          include: {
            genero: true
          }
        }
      }
    });

    // Actualizar géneros si se proporcionaron
    if (body.generos && Array.isArray(body.generos)) {
      // Eliminar géneros existentes
      await prisma.peliculas_generos.deleteMany({
        where: { pelicula_id: id }
      });

      // Agregar nuevos géneros
      if (body.generos.length > 0) {
        const generosData = body.generos.map((generoId: string) => ({
          pelicula_id: id,
          genero_id: generoId
        }));

        await prisma.peliculas_generos.createMany({
          data: generosData
        });
      }
    }

    // Formatear los datos para el frontend
    const peliculaFormateada = {
      ...peliculaActualizada,
      genero: peliculaActualizada.peliculas_generos[0]?.genero?.nombre || '',
      // Mapear campos para compatibilidad con el frontend - incluir ambos nombres
      fecha_estreno: peliculaActualizada.fecha_estreno_local,
      url_imagen: peliculaActualizada.poster_url,
      url_trailer: peliculaActualizada.trailer_url,
      poster_url: peliculaActualizada.poster_url,  // Mantener nombre original también
      trailer_url: peliculaActualizada.trailer_url,  // Mantener nombre original también
      // Asegurar que las fechas originales estén disponibles
      fecha_estreno_local: peliculaActualizada.fecha_estreno_local,
      fecha_estreno_mundial: peliculaActualizada.fecha_estreno_mundial
    };

    return NextResponse.json({
      success: true,
      message: "Película actualizada exitosamente",
      pelicula: peliculaFormateada
    });

  } catch (error) {
    console.error("Error actualizando película:", error);
    
    // Manejar errores específicos de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "Ya existe una película con ese título" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que sea empleado, administrador o gerente
    if (!['empleado', 'administrador', 'gerente'].includes(user.tipo_usuario)) {
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que la película existe
    const peliculaExistente = await prisma.peliculas.findUnique({
      where: { id },
      include: {
        funciones: true
      }
    });

    if (!peliculaExistente) {
      return NextResponse.json(
        { error: "Película no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si tiene funciones asociadas
    if (peliculaExistente.funciones && peliculaExistente.funciones.length > 0) {
      // En lugar de eliminar, desactivar la película
      const peliculaDesactivada = await prisma.peliculas.update({
        where: { id },
        data: { activa: false }
      });

      return NextResponse.json({
        success: true,
        message: "Película desactivada debido a funciones asociadas",
        pelicula: peliculaDesactivada
      });
    }

    // Eliminar relaciones de géneros primero
    await prisma.peliculas_generos.deleteMany({
      where: { pelicula_id: id }
    });

    // Eliminar la película
    await prisma.peliculas.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Película eliminada exitosamente"
    });
  } catch (error) {
    console.error("Error eliminando película:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔧 PATCH /api/admin/peliculas/[id] - Iniciando...');

    // Verificar autenticación
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('🔒 SECURITY: Unauthorized access attempt to PATCH película');
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar permisos (solo administrador y gerente pueden modificar películas)
    if (!['administrador', 'gerente'].includes(user.tipo_usuario)) {
      console.log(`🔒 SECURITY: Access denied to PATCH película for user type: ${user.tipo_usuario}`);
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    console.log('🔧 PATCH película - ID:', id, 'Body:', body);

    // Verificar que la película existe
    const peliculaExistente = await prisma.peliculas.findUnique({
      where: { id }
    });

    if (!peliculaExistente) {
      return NextResponse.json(
        { error: "Película no encontrada" },
        { status: 404 }
      );
    }

    // Preparar datos para actualización
    const datosActualizacion: Record<string, unknown> = {};
    
    if (body.hasOwnProperty('activa')) {
      datosActualizacion.activa = body.activa;
      console.log(`🎬 Cambiando estado de película a: ${body.activa ? 'activa' : 'inactiva'}`);
    }

    // Actualizar la película
    const peliculaActualizada = await prisma.peliculas.update({
      where: { id },
      data: datosActualizacion,
      include: {
        peliculas_generos: {
          include: {
            genero: true
          }
        }
      }
    });

    console.log('✅ Película actualizada exitosamente:', peliculaActualizada.titulo);

    return NextResponse.json({
      message: "Película actualizada exitosamente",
      pelicula: peliculaActualizada
    });

  } catch (error) {
    console.error("Error actualizando película:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
