import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProfileById } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await getProfileById(userId);

    if (!user || user.active === false) {
      cookieStore.delete('auth_session');
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
