import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { nombre, nivelEducativo, zonaHoraria } = await request.json();
    
    // 1. Obtener la sesión actual desde nuestra cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin no está configurado' }, { status: 500 });
    }

    // 2. Actualizar el perfil usando el cliente Admin (para saltar RLS si es necesario)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        name: nombre.trim(),
        level: nivelEducativo,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 });
  }
}
