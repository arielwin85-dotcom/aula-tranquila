import { NextResponse } from 'next/server';
import { upsertStudent, upsertGrade, getStudents, getFullStudent, deleteStudentFromLegacy } from '@/lib/db';
import { Student } from '@/types';

// GET students for a classroom
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');

    if (!classroomId) {
      return NextResponse.json({ error: 'Missing classroomId' }, { status: 400 });
    }

    const students = await getStudents(classroomId);
    return NextResponse.json(students);
  } catch (error: any) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json({ error: `Failed to fetch students: ${error.message}` }, { status: 500 });
  }
}

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

    // 2. Sync Grades (Initial)
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

    // 3. Migration: Ensure no duplicates in legacy JSON
    await deleteStudentFromLegacy(result.id, studentData.classroomId);

    // 4. Return Fully Hydrated Student
    const fullStudent = await getFullStudent(result.id);
    return NextResponse.json(fullStudent || result, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add student:', error);
    return NextResponse.json({ error: `Failed to add student: ${error.message}` }, { status: 500 });
  }
}
