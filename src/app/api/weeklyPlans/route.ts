import { NextResponse } from 'next/server';
import { getWeeklyPlans, saveWeeklyPlan } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { WeeklyPlan } from '@/types';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;
    
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');

    const plans = await getWeeklyPlans(classroomId || undefined, userId);

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
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;
    const body = await request.json();

    const newPlan: WeeklyPlan = {
      id: body.id || uuidv4(),
      userId,
      classroomId: body.classroomId,
      subjectId: body.subjectId,
      aula_grado: body.aula_grado,
      area_materia: body.area_materia,
      weekStartDate: body.weekStartDate,
      numClasses: body.numClasses,
      days: body.days,
      messages: body.messages,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    await saveWeeklyPlan(newPlan);

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating weekly plan:', error);
    return NextResponse.json({ error: 'Failed to create weekly plan' }, { status: 500 });
  }
}
