import { NextResponse } from 'next/server';
import { getClassrooms, saveClassroom } from '@/lib/db';
import { Classroom } from '@/types';

// GET all classrooms
export async function GET() {
  try {
    const classrooms = await getClassrooms();
    return NextResponse.json(classrooms);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch classrooms' }, { status: 500 });
  }
}

// POST a new classroom
export async function POST(request: Request) {
  try {
    const newClassroom: Classroom = await request.json();
    const classrooms = await getClassrooms();
    
    // Check if classroom exists
    if (classrooms.find(c => c.id === newClassroom.id)) {
        return NextResponse.json({ error: 'Classroom already exists' }, { status: 400 });
    }

    await saveClassroom(newClassroom);
    
    return NextResponse.json(newClassroom, { status: 201 });
  } catch (error) {
    console.error('Failed to create classroom:', error);
    return NextResponse.json({ error: 'Failed to create classroom' }, { status: 500 });
  }
}
