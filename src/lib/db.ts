import { Classroom, User } from '@/types';
import { supabase } from './supabase';

export interface SupportTicket {
  id: string;
  userId?: string;
  userEmail: string;
  subject: string;
  description: string;
  status: 'Abierto' | 'En Proceso' | 'Cerrado';
  createdAt: string;
  attachments?: string[];
}

export interface Database {
  users: User[];
  tickets: SupportTicket[];
  classrooms: Classroom[];
  weeklyPlans: any[]; 
}

// NOTE: With Supabase, we transition from reading a whole "DB" object 
// to querying specific tables. These helper functions will now
// bridge the gap for the existing API routes.

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data || [];
}

// Admin version to bypass RLS
export async function getUsersAdmin(): Promise<User[]> {
  if (!supabaseAdmin) return getUsers();
  const { data, error } = await supabaseAdmin.from('profiles').select('*');
  if (error) throw error;
  return data || [];
}

export async function getProfileById(id: string): Promise<User | null> {
  const client = supabaseAdmin || supabase;
  const { data, error } = await client.from('profiles').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function getClassrooms(userId?: string): Promise<Classroom[]> {
  let query = supabase.from('classrooms').select('*');
  if (userId) query = query.eq('user_id', userId);
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(c => ({
    ...c,
    userId: c.user_id, // Map snake_case to camelCase
  }));
}

export async function getWeeklyPlans(classroomId?: string): Promise<any[]> {
  let query = supabase.from('weekly_plans').select('*');
  if (classroomId) query = query.eq('classroom_id', classroomId);
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(p => ({
    ...p,
    classroomId: p.classroom_id,
    weekStartDate: p.week_start_date
  }));
}

// Legacy-compatible readDB (not recommended for new code)
export async function readDB(): Promise<Database> {
  const [users, classrooms, weeklyPlans] = await Promise.all([
    getUsers(),
    getClassrooms(),
    getWeeklyPlans()
  ]);

  return {
    users,
    tickets: [], // Logic for tickets can be added later if needed
    classrooms,
    weeklyPlans
  };
}

// Write helper for specific entities
export async function saveClassroom(classroom: Classroom) {
    const { data, error } = await supabase.from('classrooms').upsert({
        id: classroom.id,
        user_id: classroom.userId,
        name: classroom.name,
        grade: classroom.grade,
        year: classroom.year,
        description: classroom.description,
        subjects: classroom.subjects,
        students: classroom.students
    });
    if (error) throw error;
    return data;
}

export async function saveWeeklyPlan(plan: any) {
    const { data, error } = await supabase.from('weekly_plans').upsert({
        id: plan.id,
        classroom_id: plan.classroomId,
        subject_id: plan.subjectId,
        week_start_date: plan.weekStartDate,
        days: plan.days
    });
    if (error) throw error;
    return data;
}

export async function deleteWeeklyPlan(id: string) {
    const { error } = await supabase.from('weekly_plans').delete().eq('id', id);
    if (error) throw error;
    return true;
}

export async function saveProfile(profile: any) {
    const { error } = await supabase.from('profiles').upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        level: profile.level,
        credits: profile.credits,
        plan: profile.plan,
        role: profile.role,
        updated_at: new Date().toISOString()
    });
    if (error) throw error;
}

export async function deleteClassroom(id: string) {
    const { error } = await supabase.from('classrooms').delete().eq('id', id);
    if (error) throw error;
    return true;
}

export async function getTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase.from('tickets').select('*');
  if (error) throw error;
  return (data || []).map(t => ({
    ...t,
    createdAt: t.created_at,
    userEmail: t.user_email
  }));
}

export async function saveTicket(ticket: SupportTicket) {
    const { error } = await supabase.from('tickets').upsert({
        id: ticket.id,
        user_id: ticket.userId,
        user_email: ticket.userEmail,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        attachments: ticket.attachments,
        created_at: ticket.createdAt
    });
    if (error) throw error;
}
