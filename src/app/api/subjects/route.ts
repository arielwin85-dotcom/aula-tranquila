import { NextResponse } from 'next/server';
import { getSubjects } from '@/lib/db';

export async function GET() {
  try {
    const subjects = await getSubjects();
    return NextResponse.json(subjects);
  } catch (error: any) {
    console.error('Failed to fetch subjects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
