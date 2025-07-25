import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getUserFromRequest } from '@/lib/middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // 🔒 SEGURIDAD: Verificar autenticación
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('🔒 SECURITY: Unauthorized access attempt to admin/usuarios GET');
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // 🔒 SEGURIDAD: Verificar permisos
    if (!['empleado', 'administrador', 'gerente'].includes(user.tipo_usuario)) {
      console.log(`🔒 SECURITY: Access denied to admin/usuarios GET for user type: ${user.tipo_usuario} (${user.email})`);
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    console.log(`✅ SECURITY: Admin/usuarios GET access granted to ${user.tipo_usuario}: ${user.email}`);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tipo = searchParams.get('tipo');
    const activo = searchParams.get('activo');
    
    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Validar límites para evitar consultas masivas
    const maxLimit = 100;
    const finalLimit = Math.min(limit, maxLimit);

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (tipo && tipo !== 'all') {
      where.tipo_usuario = tipo;
    }

    if (activo !== null && activo !== 'all') {
      where.activo = activo === 'true';
    }

    // Obtener total de registros para paginación
    const total = await prisma.usuarios.count({ where });

    // Obtener usuarios con paginación
    const usuarios = await prisma.usuarios.findMany({
      where,
      skip,
      take: finalLimit,
      orderBy: [
        { fecha_creacion: 'desc' }
      ],
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        fecha_nacimiento: true,
        tipo_usuario: true,
        email_verificado: true,
        activo: true,
        fecha_creacion: true,
        fecha_actualizacion: true
      }
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(total / finalLimit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      usuarios,
      pagination: {
        total,
        page,
        limit: finalLimit,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 SEGURIDAD: Verificar autenticación
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('🔒 SECURITY: Unauthorized access attempt to admin/usuarios POST');
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // 🔒 SEGURIDAD: Verificar permisos
    if (!['empleado', 'administrador', 'gerente'].includes(user.tipo_usuario)) {
      console.log(`🔒 SECURITY: Access denied to admin/usuarios POST for user type: ${user.tipo_usuario} (${user.email})`);
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    console.log(`✅ SECURITY: Admin/usuarios POST access granted to ${user.tipo_usuario}: ${user.email}`);

    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.nombre || !body.apellido) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: email, password, nombre, apellido' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.usuarios.findUnique({
      where: { email: body.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12);

    const newUser = await prisma.usuarios.create({
      data: {
        email: body.email,
        password_hash: hashedPassword,
        nombre: body.nombre,
        apellido: body.apellido,
        telefono: body.telefono || null,
        fecha_nacimiento: body.fecha_nacimiento ? new Date(body.fecha_nacimiento) : null,
        tipo_usuario: body.tipo_usuario || 'cliente',
        activo: body.activo !== undefined ? body.activo : true,
        email_verificado: body.email_verificado !== undefined ? body.email_verificado : false
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        fecha_nacimiento: true,
        tipo_usuario: true,
        email_verificado: true,
        activo: true,
        fecha_creacion: true,
        fecha_actualizacion: true
      }
    });

    // If it's an employee, create employee details
    if (body.tipo_usuario === 'empleado' || body.tipo_usuario === 'administrador' || body.tipo_usuario === 'gerente') {
      if (body.empleado_detalles) {
        await prisma.empleados_detalles.create({
          data: {
            usuario_id: newUser.id,
            numero_empleado: body.empleado_detalles.numero_empleado || `EMP${Date.now()}`,
            posicion: body.empleado_detalles.posicion || 'cajero',
            salario: body.empleado_detalles.salario ? parseFloat(body.empleado_detalles.salario) : null,
            fecha_contratacion: body.empleado_detalles.fecha_contratacion ? new Date(body.empleado_detalles.fecha_contratacion) : new Date(),
            turno: body.empleado_detalles.turno || 'mañana',
            activo: true
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      usuario: newUser
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
