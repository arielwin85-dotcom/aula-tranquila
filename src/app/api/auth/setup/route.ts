import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { saveProfile } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Una capa simple de seguridad para evitar que cualquiera cree usuarios
  if (secret !== 'aula2025') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const email = 'admin@aulatranquila.com';
  const password = 'admin123'; // El usuario puede cambiarla luego

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase Admin no configurado' }, { status: 500 });
  }

  try {
    // 1. Crear el usuario en Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Administrador Maestro' }
    });

    if (authError) {
        // Si ya existe, intentamos solo crear el perfil
        if (authError.message.includes('already exists')) {
             console.log('User already exists in Auth, continuing to profile...');
        } else {
             throw authError;
        }
    }

    // 2. Crear o actualizar el perfil
    const userId = authUser?.user?.id;
    if (userId) {
        await saveProfile({
            id: userId,
            name: 'Administrador Maestro',
            email: email,
            role: 'admin',
            level: 'Administración',
            credits: 9999,
            plan: 'Premium'
        });
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Administrador configurado correctamente',
        user: email,
        note: 'Ya podés intentar loguearte con esta cuenta.'
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
