import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validateEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombre, apellido, telefono, fecha_nacimiento } = await request.json();

    // Validaciones
    if (!email || !password || !nombre || !apellido || !telefono || !fecha_nacimiento) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    // Validar edad (debe ser mayor de 13 años)
    const today = new Date();
    const birthDate = new Date(fecha_nacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) {
      return NextResponse.json(
        { success: false, error: 'Debes ser mayor de 13 años para registrarte' },
        { status: 400 }
      );
    }

    // Validar contraseña con reglas más flexibles para clientes
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con este email' },
        { status: 409 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await hashPassword(password);

    // Crear el usuario
    const newUser = await prisma.usuarios.create({
      data: {
        email,
        password_hash: hashedPassword,
        nombre,
        apellido,
        telefono: telefono || null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        tipo_usuario: 'cliente',
        email_verificado: false,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        tipo_usuario: true,
        fecha_creacion: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: newUser
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
