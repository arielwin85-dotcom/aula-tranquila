import { NextResponse } from 'next/server';
import { getSubjects } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subjects = await getSubjects();
    return NextResponse.json(subjects);
  } catch (error: any) {
    console.error('Failed to fetch subjects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
