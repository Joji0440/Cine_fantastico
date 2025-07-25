import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const paises = await prisma.paises.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        codigo_iso: true
      }
    });

    return NextResponse.json({
      success: true,
      paises
    });

  } catch (error) {
    console.error("Error obteniendo países:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
