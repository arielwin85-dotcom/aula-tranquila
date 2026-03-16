import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { Classroom } from '@/types';

// Use asynchronous params as required by Next.js 15+ App Router
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedClassroom: Classroom = await request.json();
    const db = readDB();
    
    const index = db.classrooms.findIndex(c => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    // Keep existing students if not provided in the update
    updatedClassroom.students = updatedClassroom.students || db.classrooms[index].students;
    
    db.classrooms[index] = updatedClassroom;
    writeDB(db);
    
    return NextResponse.json(updatedClassroom);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update classroom' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDB();
    
    const index = db.classrooms.findIndex(c => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    db.classrooms.splice(index, 1);
    writeDB(db);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete classroom' }, { status: 500 });
  }
}
