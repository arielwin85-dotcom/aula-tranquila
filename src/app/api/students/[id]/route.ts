import { NextResponse } from 'next/server';
import { upsertStudent, deleteStudentFromDB, upsertGrade, deleteGrade, getGrades, getFullStudent, deleteStudentFromLegacy } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dni } = await params;
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');

    if (!classroomId) {
      return NextResponse.json({ error: 'Missing classroomId for hybrid delete' }, { status: 400 });
    }
    
    // Deleting from both possible locations
    const success = await deleteStudentFromDB(dni, classroomId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete student from any storage' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete student:', error);
    return NextResponse.json({ error: `Failed to delete student: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dni } = await params; // The "id" in parameter is now treated as DNI
    const body = await request.json();
    const { classroomId, detailedGrades, ...studentData } = body;

    // 1. Update Student
    const result = await upsertStudent({
      ...studentData,
      dni: dni,
      classroomId: classroomId
    });

    if (!result) throw new Error('Failed to update student');

    // 2. Sync Grades (Full Impact Strategy)
    // A) Wipe all existing grades for this student
    const existingGrades = await getGrades(dni);
    for (const eg of existingGrades) {
      await deleteGrade(eg.id);
    }

    // B) Re-insert current structure
    if (detailedGrades && detailedGrades.length > 0) {
      for (const grade of detailedGrades) {
        await upsertGrade({
          ...grade,
          id: undefined, // Fresh start for IDs
          studentDni: dni,
          classroomId: classroomId,
        });
      }
    }

    // 3. Finalize Migration (Cleanup Legacy)
    await deleteStudentFromLegacy(dni, classroomId);

    // 4. Return Fully Hydrated Student
    const fullStudent = await getFullStudent(dni);
    return NextResponse.json(fullStudent || result);
  } catch (error: any) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ error: `Failed to update student: ${error.message}` }, { status: 500 });
  }
}
