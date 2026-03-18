import { NextResponse } from 'next/server';
import { getNotasByStudent, upsertNota } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get('dni');
  const classroomId = searchParams.get('classroomId');

  if (!dni || !classroomId) {
    return NextResponse.json({ error: 'Missing dni or classroomId' }, { status: 400 });
  }

  try {
    const notas = await getNotasByStudent(dni, classroomId);
    return NextResponse.json(notas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await upsertNota(body);
    if (!result) throw new Error('Failed to save nota');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
