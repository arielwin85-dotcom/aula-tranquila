import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getProfileById } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // EMERGENCY BYPASS PARA SURFEAR LA APP SIN SUPABASE
    if (email === 'admin' && password === 'admin') {
      const cookieStore = await cookies();
      cookieStore.set('auth_session', 'bypass-admin', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 semana
      });
      return NextResponse.json({ 
        user: { 
          id: 'bypass-admin', 
          name: 'Admin Maestro (Bypass)', 
          email: 'admin@aulatranquila.com', 
          role: 'admin',
          level: 'Administración',
          plan: 'Premium',
          credits: 9999
        } 
      });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 });
    }

    // 1. Intentar hacer login con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // 2. Obtener el perfil extendido desde la tabla profiles (usando helper admin para saltar RLS)
    const profile = await getProfileById(authData.user.id);

    if (!profile) {
      return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 });
    }

    // 3. Mantener el sistema de cookies del MVP por compatibilidad
    const cookieStore = await cookies();
    cookieStore.set('auth_session', profile.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 semana
    });

    return NextResponse.json({ user: profile });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 });
  }
}
