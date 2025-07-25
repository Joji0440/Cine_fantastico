import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('📽️ SIMPLE GET /api/admin/peliculas/simple - Iniciando...');
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    console.log('📽️ Buscando:', search);

    // Construir filtros de búsqueda
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { director: { contains: search, mode: 'insensitive' } },
        { genero: { contains: search, mode: 'insensitive' } }
      ];
    }

    const peliculas = await prisma.peliculas.findMany({
      where,
      orderBy: { fecha_creacion: 'desc' },
      take: 50 // Límite de 50 películas
    });

    console.log('📽️ Películas encontradas:', peliculas.length);

    return NextResponse.json({
      success: true,
      peliculas,
      total: peliculas.length
    });

  } catch (error) {
    console.error("📽️ ERROR en simple GET:", error);
    return NextResponse.json(
      { error: "Error interno", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
