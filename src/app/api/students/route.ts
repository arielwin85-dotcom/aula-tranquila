import { NextResponse } from 'next/server';
import { getClassrooms, saveClassroom } from '@/lib/db';
import { Student } from '@/types';

// POST a new student into a specific classroom
export async function POST(request: Request) {
  try {
    const studentData: Student = await request.json();
    const classrooms = await getClassrooms();
    
    // Find the classroom this student belongs to
    const classIndex = classrooms.findIndex(c => c.id === studentData.classroomId);
    if (classIndex === -1) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    // Add student
    const classroom = classrooms[classIndex];
    classroom.students.push(studentData);
    
    await saveClassroom(classroom);
    
    return NextResponse.json(studentData, { status: 201 });
  } catch (error) {
    console.error('Failed to add student:', error);
    return NextResponse.json({ error: 'Failed to add student' }, { status: 500 });
  }
}
