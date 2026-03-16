import { NextResponse } from 'next/server';
import { getClassrooms, saveClassroom } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');

    if (!classroomId) {
      return NextResponse.json({ error: 'Missing classroomId' }, { status: 400 });
    }

    const classrooms = await getClassrooms();
    const classIndex = classrooms.findIndex(c => c.id === classroomId);
    
    if (classIndex === -1) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    const classroom = classrooms[classIndex];
    const studentIndex = classroom.students.findIndex(s => s.id === id);

    if (studentIndex === -1) {
      return NextResponse.json({ error: 'Student not found in classroom' }, { status: 404 });
    }

    // Remove student
    classroom.students.splice(studentIndex, 1);
    await saveClassroom(classroom);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete student:', error);
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

    const classrooms = await getClassrooms();
    const classIndex = classrooms.findIndex(c => c.id === classroomId);
    
    if (classIndex === -1) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    const classroom = classrooms[classIndex];
    const studentIndex = classroom.students.findIndex(s => s.id === id);

    if (studentIndex === -1) {
      return NextResponse.json({ error: 'Student not found in classroom' }, { status: 404 });
    }

    // Update student
    classroom.students[studentIndex] = {
      ...classroom.students[studentIndex],
      ...studentData
    };
    
    await saveClassroom(classroom);
    
    return NextResponse.json(classroom.students[studentIndex]);
  } catch (error) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}
