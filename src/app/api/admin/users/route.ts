import { NextResponse } from 'next/server';
import { getUsersAdmin, saveProfile } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

// GET all users
export async function GET() {
  try {
    const users = await getUsersAdmin();
    // No devolvemos los passwords por seguridad (en Supabase Auth no los tenemos)
    const secureUsers = users.map(({ password: _, ...user }) => user);
    return NextResponse.json(secureUsers);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

// POST a new user (Silent Habilitation)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin no configurado' }, { status: 500 });
    }

    // 1. Crear el usuario en Supabase Auth de forma silenciosa
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password || 'aula123',
      email_confirm: true, // Esto activa el usuario inmediatamente
      user_metadata: { name: data.name }
    });

    if (authError) throw authError;

    // 2. Crear el perfil del docente en la tabla profiles
    const newUser = {
      id: authUser.user.id,
      name: data.name,
      email: data.email,
      role: data.role || 'docente',
      level: data.level || 'Primaria',
      credits: 100,
      plan: 'Gratuito'
    };

    await saveProfile(newUser);

    return NextResponse.json(newUser);
  } catch (err: any) {
    console.error('Error creating user:', err);
    return NextResponse.json({ error: err.message || 'Error al crear usuario' }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin no configurado' }, { status: 500 });
    }

    // Al borrar en Auth se borra en cascada en profiles (por el SQL de schema.sql)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al borrar' }, { status: 500 });
  }
}
