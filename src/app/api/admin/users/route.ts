import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = readDB();
  // No devolvemos los passwords por seguridad
  const secureUsers = db.users.map(({ password: _, ...user }) => user);
  return NextResponse.json(secureUsers);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const db = readDB();
    
    const newUser = {
      id: uuidv4(),
      name: data.name,
      email: data.email,
      password: data.password || 'aula123',
      role: data.role || 'docente',
      level: data.level || 'Primaria',
      credits: 0,
      plan: 'Gratuito' as const
    };

    db.users.push(newUser);
    writeDB(db);

    return NextResponse.json(newUser);
  } catch (err) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  const db = readDB();
  db.users = db.users.filter(u => u.id !== id);
  writeDB(db);
  return NextResponse.json({ success: true });
}

// Para actualizar usaremos el ID en el cuerpo o URL. 
// Para simplificar aquí, implementaremos PUT en el mismo archivo si es necesario 
// o en un archivo con [id]. Vamos a crear el archivo con [id] para consistencia con students.
