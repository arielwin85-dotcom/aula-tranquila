import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { Student } from '@/types';

// POST a new student into a specific classroom
export async function POST(request: Request) {
  try {
    const studentData: Student = await request.json();
    const db = readDB();
    
    // Find the classroom this student belongs to
    const classIndex = db.classrooms.findIndex(c => c.id === studentData.classroomId);
    if (classIndex === -1) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    // Add student
    db.classrooms[classIndex].students.push(studentData);
    writeDB(db);
    
    return NextResponse.json(studentData, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add student' }, { status: 500 });
  }
}
