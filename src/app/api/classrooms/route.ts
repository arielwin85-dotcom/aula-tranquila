import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { Classroom } from '@/types';

// GET all classrooms
export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json(db.classrooms);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch classrooms' }, { status: 500 });
  }
}

// POST a new classroom
export async function POST(request: Request) {
  try {
    const newClassroom: Classroom = await request.json();
    const db = readDB();
    
    // Check if classroom exists
    if (db.classrooms.find(c => c.id === newClassroom.id)) {
        return NextResponse.json({ error: 'Classroom already exists' }, { status: 400 });
    }

    db.classrooms.push(newClassroom);
    writeDB(db);
    
    return NextResponse.json(newClassroom, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create classroom' }, { status: 500 });
  }
}
