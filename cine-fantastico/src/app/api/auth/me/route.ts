import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'cine-fantastico-secret-key-2025';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar el token
    let decoded: { userId: string; email: string; nombre: string; apellido: string; tipo_usuario: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; nombre: string; apellido: string; tipo_usuario: string };
    } catch {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar el usuario en la base de datos
    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        fecha_nacimiento: true,
        tipo_usuario: true,
        activo: true,
        fecha_creacion: true,
      }
    });

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Preparar datos del usuario
    const userData = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      telefono: usuario.telefono,
      fecha_nacimiento: usuario.fecha_nacimiento,
      fecha_registro: usuario.fecha_creacion,
      tipo_usuario: usuario.tipo_usuario,
      activo: usuario.activo,
      email_verificado: true // Agregamos este campo también por si se necesita
    };

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
