import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDB } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const db = readDB();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      cookieStore.delete('auth_session');
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
