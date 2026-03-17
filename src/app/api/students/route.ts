import { NextResponse } from 'next/server';
import { upsertStudent, upsertGrade } from '@/lib/db';
import { Student } from '@/types';

// POST a new student into a specific classroom
export async function POST(request: Request) {
  try {
    const studentData: Student = await request.json();
    
    // 1. Create/Update student in normalized table
    const result = await upsertStudent({
      ...studentData,
      id: undefined, // Let Supabase generate a UUID
    });

    if (!result) throw new Error('Failed to create student');

    // 2. Create initial grades if any
    if (studentData.detailedGrades && studentData.detailedGrades.length > 0) {
      for (const grade of studentData.detailedGrades) {
        await upsertGrade({
          ...grade,
          id: undefined, // Let Supabase generate a UUID
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
