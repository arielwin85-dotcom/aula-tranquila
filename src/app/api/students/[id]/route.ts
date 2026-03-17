import { NextResponse } from 'next/server';
import { upsertStudent, deleteStudentFromDB, upsertGrade, deleteGrade, getGrades } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');

    if (!classroomId) {
      return NextResponse.json({ error: 'Missing classroomId for hybrid delete' }, { status: 400 });
    }
    
    // Deleting from both possible locations
    const success = await deleteStudentFromDB(id, classroomId);
    
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
    const { id } = await params;
    const body = await request.json();
    const { classroomId, detailedGrades, ...studentData } = body;

    // 1. Update Student
    const result = await upsertStudent({
      ...studentData,
      id: id,
      classroomId: classroomId
    });

    if (!result) throw new Error('Failed to update student');

    // 2. Sync Grades (Bidirectional)
    const existingGrades = await getGrades(id);
    const incomingGradeIds = (detailedGrades || [])
      .map((g: any) => g.id)
      .filter((gid: string) => gid && !gid.startsWith('grade-'));

    // A) Delete grades that are no longer in the incoming list
    const gradesToDelete = existingGrades.filter(eg => !incomingGradeIds.includes(eg.id));
    for (const dg of gradesToDelete) {
      await deleteGrade(dg.id);
    }

    // B) Upsert incoming grades
    if (detailedGrades && detailedGrades.length > 0) {
      for (const grade of detailedGrades) {
        await upsertGrade({
          ...grade,
          // If it's a frontend-only ID (grade-...), strip it to let DB generate one
          id: String(grade.id).startsWith('grade-') ? undefined : grade.id,
          studentId: id,
          classroomId: classroomId,
        });
      }
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ error: `Failed to update student: ${error.message}` }, { status: 500 });
  }
}
