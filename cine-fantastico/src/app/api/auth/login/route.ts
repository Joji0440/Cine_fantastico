import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'cine-fantastico-secret-key-2025';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Buscar el usuario en la base de datos
    const usuario = await prisma.usuarios.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        nombre: true,
        apellido: true,
        telefono: true,
        fecha_nacimiento: true,
        tipo_usuario: true,
        activo: true,
        fecha_creacion: true,
      }
    });

    // Verificar si el usuario existe
    if (!usuario) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return NextResponse.json(
        { error: 'La cuenta está desactivada. Contacta al administrador' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        tipo_usuario: usuario.tipo_usuario
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Preparar datos del usuario para la respuesta (sin contraseña)
    const userData = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      telefono: usuario.telefono,
      fecha_nacimiento: usuario.fecha_nacimiento,
      fecha_registro: usuario.fecha_creacion,
      tipo_usuario: usuario.tipo_usuario,
    };

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      user: userData,
      redirectTo: usuario.tipo_usuario === 'empleado' ? '/admin' : '/cliente'
    });

    // Establecer cookie con el token
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: false, // Permitir HTTP en desarrollo
      sameSite: 'strict', // Más permisivo para desarrollo local
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/', // Asegurar que la cookie esté disponible en toda la app
    });

    return response;

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
