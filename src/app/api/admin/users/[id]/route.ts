import { NextResponse } from 'next/server';
import { saveProfile } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin no configurado' }, { status: 500 });
    }

    // 1. Actualizar en Supabase Auth si hay cambios sensibles (email/password)
    const authUpdates: any = {};
    if (data.email) authUpdates.email = data.email;
    if (data.password) authUpdates.password = data.password;

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
      if (authError) throw authError;
    }

    // 2. Actualizar el perfil en la tabla profiles
    const profileUpdate: any = {
      id,
      name: data.name,
      email: data.email,
      role: data.role,
      level: data.level,
      active: data.active !== undefined ? data.active : true
    };

    if (data.tokens_disponibles !== undefined && Number(data.tokens_disponibles) > 0) {
      // Leer saldo actual y SUMAR los nuevos tokens (no reemplazar)
      const { data: perfilActual } = await supabaseAdmin
        .from('profiles')
        .select('tokens_disponibles')
        .eq('id', id)
        .single();
      const saldoActual = perfilActual?.tokens_disponibles ?? 0;
      profileUpdate.tokens_disponibles = saldoActual + Number(data.tokens_disponibles);
      profileUpdate.tokens_totales = saldoActual + Number(data.tokens_disponibles);
    }

    await saveProfile(profileUpdate);

    return NextResponse.json(profileUpdate);
  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 });
  }
}
