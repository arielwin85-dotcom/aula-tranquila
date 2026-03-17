import { NextResponse } from 'next/server';
import { upsertStudent, upsertGrade } from '@/lib/db';
import { Student } from '@/types';

// POST a new student into a specific classroom
export async function POST(request: Request) {
  try {
    const studentData: Student = await request.json();
    
    if (!studentData.classroomId) {
      return NextResponse.json({ error: 'Missing classroomId' }, { status: 400 });
    }

    // 1. Hybrid Upsert Student
    const result = await upsertStudent({
      ...studentData,
      id: studentData.id || `s-${Date.now()}`, 
    });

    if (!result) throw new Error('Failed to create student in hybrid storage');

    // 2. Optional: Initial grades (Best effort if table exists)
    if (studentData.detailedGrades && studentData.detailedGrades.length > 0) {
      for (const grade of studentData.detailedGrades) {
        await upsertGrade({
          ...grade,
          id: undefined, 
          studentId: result.id,
          classroomId: studentData.classroomId,
        });
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add student:', error);
    return NextResponse.json({ error: `Failed to add student: ${error.message}` }, { status: 500 });
  }
}
