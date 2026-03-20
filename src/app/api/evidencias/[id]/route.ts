import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteEvidencia } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const ok = await deleteEvidencia(id);

    return NextResponse.json({ ok });
  } catch (error) {
    console.error('Error deleting evidencia:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
