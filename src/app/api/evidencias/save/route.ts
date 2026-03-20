import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveEvidencia } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const result = await saveEvidencia({
      ...data,
      userId
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving evidencia:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
