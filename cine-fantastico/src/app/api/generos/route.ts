import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const generos = await prisma.generos.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true
      }
    });

    return NextResponse.json({
      success: true,
      generos
    });

  } catch (error) {
    console.error("Error obteniendo géneros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
