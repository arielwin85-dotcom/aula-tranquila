import { NextResponse } from 'next/server';
import { getClassrooms, saveClassroom, deleteClassroom } from '@/lib/db';
import { Classroom } from '@/types';

// Use asynchronous params as required by Next.js 15+ App Router
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedClassroom: Classroom = await request.json();
    
    // Verify ownership
    const classrooms = await getClassrooms(userId);
    const index = classrooms.findIndex(c => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Force correct userId
    updatedClassroom.userId = userId;

    // Keep existing students if not provided in the update
    updatedClassroom.students = updatedClassroom.students || classrooms[index].students;
    
    await saveClassroom(updatedClassroom);
    
    return NextResponse.json(updatedClassroom);
  } catch (error) {
    console.error('Failed to update classroom:', error);
    return NextResponse.json({ error: 'Failed to update classroom' }, { status: 500 });
  }
}

import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const classrooms = await getClassrooms(userId);
    if (!classrooms.find(c => c.id === id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteClassroom(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete classroom:', error);
    return NextResponse.json({ error: 'Failed to delete classroom' }, { status: 500 });
  }
}
