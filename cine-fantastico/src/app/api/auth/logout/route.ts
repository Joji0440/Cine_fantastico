import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Crear respuesta de logout exitoso
    const response = NextResponse.json({
      message: 'Logout exitoso'
    });

    // Eliminar la cookie de autenticación
    response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expira inmediatamente
    });

    return response;

  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
