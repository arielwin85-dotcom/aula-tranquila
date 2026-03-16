import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { WeeklyPlan } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');
    const subjectId = searchParams.get('subjectId');

    const db = readDB();
    let plans = db.weeklyPlans || [];

    if (classroomId) {
      plans = plans.filter((p: WeeklyPlan) => p.classroomId === classroomId);
    }
    
    if (subjectId) {
      plans = plans.filter((p: WeeklyPlan) => p.subjectId === subjectId);
    }

    // Sort by most recent start date
    plans.sort((a: WeeklyPlan, b: WeeklyPlan) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching weekly plans:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly plans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDB();

    if (!db.weeklyPlans) {
      db.weeklyPlans = [];
    }

    const newPlan: WeeklyPlan = {
      id: uuidv4(),
      classroomId: body.classroomId,
      subjectId: body.subjectId,
      weekStartDate: body.weekStartDate,
      days: body.days,
      createdAt: new Date().toISOString(),
    };

    db.weeklyPlans.push(newPlan);
    writeDB(db);

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating weekly plan:', error);
    return NextResponse.json({ error: 'Failed to create weekly plan' }, { status: 500 });
  }
}
