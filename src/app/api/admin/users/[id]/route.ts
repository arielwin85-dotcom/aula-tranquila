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
    const profileUpdate = {
      id,
      name: data.name,
      email: data.email,
      role: data.role,
      level: data.level,
      // Conservar otros campos si es necesario (el helper saveProfile usa upsert)
    };

    await saveProfile(profileUpdate);

    return NextResponse.json(profileUpdate);
  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 });
  }
}
