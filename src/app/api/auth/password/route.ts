import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { nuevaPassword } = await request.json();
    
    // 1. Obtener la sesión actual desde nuestra cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin no está configurado' }, { status: 500 });
    }

    // 2. Actualizar la contraseña usando el cliente Admin (auth.admin)
    // El método updateById en auth.admin es la forma correcta de forzar el cambio desde el servidor
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: nuevaPassword
    });

    if (authError) throw authError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update password error:', error);
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 });
  }
}
