import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 });
    }

    const db = await readDB();
    const user = db.users.find(u => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // En un entorno real usaríamos JWT o una sesión firmada.
    // Para este MVP usaremos una cookie simple con el ID del usuario.
    const cookieStore = await cookies();
    cookieStore.set('auth_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 semana
    });

    // Devolvemos el usuario (sin el password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
