import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cine-fantastico-secret-key-2025';

export interface AuthUser {
  userId: string;
  email: string;
  tipo_usuario: 'cliente' | 'empleado' | 'administrador' | 'gerente';
}

interface JwtPayload {
  userId: string;
  email: string;
  tipo_usuario: 'cliente' | 'empleado' | 'administrador' | 'gerente';
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      tipo_usuario: decoded.tipo_usuario
    };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Intentar obtener el token de la cookie
  const tokenFromCookie = request.cookies.get('auth-token')?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  // Intentar obtener el token del header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export function getUserFromRequest(request: NextRequest): AuthUser | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}
