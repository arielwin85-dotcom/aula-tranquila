import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Also need classroomId to find the student efficiently, 
    // let's grab it from search params
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');

    if (!classroomId) {
      return NextResponse.json({ error: 'Missing classroomId' }, { status: 400 });
    }

    const db = readDB();
    
    const classIndex = db.classrooms.findIndex(c => c.id === classroomId);
    if (classIndex === -1) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    const students = db.classrooms[classIndex].students;
    const studentIndex = students.findIndex(s => s.id === id);

    if (studentIndex === -1) {
      return NextResponse.json({ error: 'Student not found in classroom' }, { status: 404 });
    }

    // Remove student
    students.splice(studentIndex, 1);
    
    writeDB(db);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { classroomId, ...studentData } = body;

    if (!classroomId) {
      return NextResponse.json({ error: 'Missing classroomId' }, { status: 400 });
    }

    const db = readDB();
    
    const classIndex = db.classrooms.findIndex(c => c.id === classroomId);
    if (classIndex === -1) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    const students = db.classrooms[classIndex].students;
    const studentIndex = students.findIndex(s => s.id === id);

    if (studentIndex === -1) {
      return NextResponse.json({ error: 'Student not found in classroom' }, { status: 404 });
    }

    // Update student
    db.classrooms[classIndex].students[studentIndex] = {
      ...db.classrooms[classIndex].students[studentIndex],
      ...studentData
    };
    
    writeDB(db);
    
    return NextResponse.json(db.classrooms[classIndex].students[studentIndex]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}
