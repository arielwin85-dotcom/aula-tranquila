import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getNotasByStudent, upsertNota, getClassrooms } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');
    const classroomId = searchParams.get('classroomId');

    if (!dni || !classroomId) {
      return NextResponse.json({ error: 'Missing dni or classroomId' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify classroom ownership
    const classrooms = await getClassrooms(userId);
    if (!classrooms.find(c => c.id === classroomId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notas = await getNotasByStudent(dni, classroomId);
    return NextResponse.json(notas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const classroomId = body.clase_id || body.classroomId;

    if (!classroomId) {
      return NextResponse.json({ error: 'Missing classroomId' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify classroom ownership
    const classrooms = await getClassrooms(userId);
    if (!classrooms.find(c => c.id === classroomId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await upsertNota(body);
    if (!result) throw new Error('Failed to save nota');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
