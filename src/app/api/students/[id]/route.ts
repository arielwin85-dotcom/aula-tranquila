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

    // 2. Sync Grades
    if (detailedGrades && detailedGrades.length > 0) {
      // Get existing grades to handle deletions or updates
      const existingGrades = await getGrades(id);
      
      for (const grade of detailedGrades) {
        // If it's a new grade (id is like grade-auto-...) or from frontend
        // we upsert it.
        await upsertGrade({
          ...grade,
          id: grade.id?.startsWith('grade-') ? undefined : grade.id,
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
