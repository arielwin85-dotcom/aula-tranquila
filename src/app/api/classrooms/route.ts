import { NextResponse } from 'next/server';
import { getClassrooms, saveClassroom } from '@/lib/db';
import { Classroom } from '@/types';

import { cookies } from 'next/headers';

// GET all classrooms for the logged-in user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classrooms = await getClassrooms(userId);
    return NextResponse.json(classrooms);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch classrooms' }, { status: 500 });
  }
}

// POST a new classroom
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: Classroom = await request.json();
    const newClassroom = { ...data, userId }; // Force current userId

    const classrooms = await getClassrooms(userId);
    
    // Check if classroom exists for this user
    if (classrooms.find(c => c.id === newClassroom.id)) {
        return NextResponse.json({ error: 'Classroom already exists' }, { status: 400 });
    }

    await saveClassroom(newClassroom);
    
    return NextResponse.json(newClassroom, { status: 201 });
  } catch (error) {
    console.error('Failed to create classroom:', error);
    return NextResponse.json({ error: 'Failed to create classroom' }, { status: 500 });
  }
}
