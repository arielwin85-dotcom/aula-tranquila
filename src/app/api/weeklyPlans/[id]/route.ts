import { NextResponse } from 'next/server';
import { getWeeklyPlans, saveWeeklyPlan, deleteWeeklyPlan } from '@/lib/db';
import { WeeklyPlan } from '@/types';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const updates = await request.json();
    
    // In Supabase we can just upsert
    const updatedPlan = { id, ...updates };
    await saveWeeklyPlan(updatedPlan);
    
    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteWeeklyPlan(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
