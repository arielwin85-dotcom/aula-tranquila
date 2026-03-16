import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { WeeklyPlan } from '@/types';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const updates = await request.json();
    const db = readDB();

    if (!db.weeklyPlans) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const planIndex = db.weeklyPlans.findIndex((p: WeeklyPlan) => p.id === id);

    if (planIndex === -1) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const updatedPlan = { ...db.weeklyPlans[planIndex], ...updates };
    db.weeklyPlans[planIndex] = updatedPlan;

    writeDB(db);
    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const db = readDB();

    if (!db.weeklyPlans) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const planIndex = db.weeklyPlans.findIndex((p: WeeklyPlan) => p.id === id);

    if (planIndex === -1) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    db.weeklyPlans.splice(planIndex, 1);
    writeDB(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
