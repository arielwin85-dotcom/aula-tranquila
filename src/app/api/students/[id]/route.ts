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
    // Find student in classroom
    console.log(`Attempting to delete student with ID: ${id} from classroom: ${classroomId}`);
    const studentIndex = classroom.students.findIndex(s => String(s.id) === String(id));

    if (studentIndex === -1) {
      console.error(`Student not found. Available IDs: ${classroom.students.map(s => s.id).join(', ')}`);
      return NextResponse.json({ error: 'Student not found in classroom' }, { status: 404 });
    }

    // Remove student
    classroom.students.splice(studentIndex, 1);
    await saveClassroom(classroom);
    console.log('Student deleted successfully');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete student:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
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
    // Find student in classroom
    console.log(`Attempting to update student with ID: ${id} in classroom: ${classroomId}`);
    const studentIndex = classroom.students.findIndex(s => String(s.id) === String(id));

    if (studentIndex === -1) {
      console.error(`Student not found for update. Available IDs: ${classroom.students.map(s => s.id).join(', ')}`);
      return NextResponse.json({ error: 'Student not found in classroom' }, { status: 404 });
    }

    // Update student
    console.log('Updating student data:', JSON.stringify(studentData));
    classroom.students[studentIndex] = {
      ...classroom.students[studentIndex],
      ...studentData
    };
    
    await saveClassroom(classroom);
    console.log('Student updated and classroom saved successfully');
    
    return NextResponse.json(classroom.students[studentIndex]);
  } catch (error: any) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
