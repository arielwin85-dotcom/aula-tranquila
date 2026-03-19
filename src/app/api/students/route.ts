import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStudents, getClassrooms, getFullStudent, upsertStudent, upsertGrade, deleteStudentFromLegacy } from '@/lib/db';
import { Student } from '@/types';

// GET students for a classroom (Secure)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');

    if (!classroomId) {
      return NextResponse.json({ error: 'Missing classroomId' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify classroom belongs to user
    const classrooms = await getClassrooms(userId);
    if (!classrooms.find(c => c.id === classroomId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const students = await getStudents(classroomId);
    return NextResponse.json(students);
  } catch (error: any) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json({ error: `Failed to fetch students: ${error.message}` }, { status: 500 });
  }
}

// POST a new student into a specific classroom (Secure)
export async function POST(request: Request) {
  try {
    const studentData: Student = await request.json();
    const classroomId = studentData.classroomId;

    if (!classroomId) {
      return NextResponse.json({ error: 'Missing classroomId' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify classroom belongs to user
    const classrooms = await getClassrooms(userId);
    if (!classrooms.find(c => c.id === classroomId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Hybrid Upsert Student (Force userId matching session)
    const result = await upsertStudent({
      ...studentData,
      dni: studentData.dni, 
      userId: userId, // Ensure correct ownership in DB
    });

    if (!result) throw new Error('Failed to create student in hybrid storage');

    // 2. Sync Grades (Initial)
    if (studentData.detailedGrades && studentData.detailedGrades.length > 0) {
      for (const grade of studentData.detailedGrades) {
        await upsertGrade({
          ...grade,
          id: undefined, 
          studentDni: studentData.dni,
          classroomId: classroomId,
        });
      }
    }

    // 3. Migration: Ensure no duplicates in legacy JSON
    await deleteStudentFromLegacy(studentData.dni, classroomId);

    // 4. Return Fully Hydrated Student
    const fullStudent = await getFullStudent(studentData.dni);
    return NextResponse.json(fullStudent || result, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add student:', error);
    return NextResponse.json({ error: `Failed to add student: ${error.message}` }, { status: 500 });
  }
}
