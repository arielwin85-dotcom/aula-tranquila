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
    const updatedClassroom: Classroom = await request.json();
    const classrooms = await getClassrooms();
    
    const index = classrooms.findIndex(c => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    // Keep existing students if not provided in the update
    updatedClassroom.students = updatedClassroom.students || classrooms[index].students;
    
    await saveClassroom(updatedClassroom);
    
    return NextResponse.json(updatedClassroom);
  } catch (error) {
    console.error('Failed to update classroom:', error);
    return NextResponse.json({ error: 'Failed to update classroom' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteClassroom(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete classroom:', error);
    return NextResponse.json({ error: 'Failed to delete classroom' }, { status: 500 });
  }
}
