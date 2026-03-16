import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const db = readDB();
    
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const updatedUser = {
      ...db.users[userIndex],
      name: data.name ?? db.users[userIndex].name,
      email: data.email ?? db.users[userIndex].email,
      role: data.role ?? db.users[userIndex].role,
      level: data.level ?? db.users[userIndex].level,
    };

    if (data.password) {
      updatedUser.password = data.password;
    }

    db.users[userIndex] = updatedUser;
    writeDB(db);

    return NextResponse.json(updatedUser);
  } catch (err) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
