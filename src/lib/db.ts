import { Classroom, User } from '@/types';
import { supabase, supabaseAdmin } from './supabase';

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

// Always use admin client (bypasses RLS). Falls back to anon only if admin key is missing.
const db = () => supabaseAdmin || supabase;

export async function getUsers(): Promise<User[]> {
  const { data, error } = await db().from('profiles').select('*');
  if (error) throw error;
  return data || [];
}

export async function getUsersAdmin(): Promise<User[]> {
  return getUsers();
}

export async function getProfileById(id: string): Promise<User | null> {
  const { data, error } = await db().from('profiles').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function getClassrooms(userId?: string): Promise<Classroom[]> {
  let query = db().from('classrooms').select('*, students_list:students(*, grades_list:grades(*))');
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) {
    // Fallback if joined tables don't exist yet (migration period)
    const { data: fallbackData, error: fallbackError } = await db().from('classrooms').select('*');
    if (fallbackError) throw fallbackError;
    return (fallbackData || []).map((c: any) => ({
      ...c,
      userId: c.user_id,
      students: c.students || [],
    }));
  }

  return (data || []).map((c: any) => ({
    ...c,
    userId: c.user_id,
    students: c.students_list?.length > 0 
      ? c.students_list.map((s: any) => ({
          ...s,
          classroomId: s.classroom_id,
          duaContextTags: s.dua_context_tags || [],
          detailedGrades: s.grades_list || [],
          grades: s.grades_list?.map((g: any) => g.score) || []
        }))
      : (c.students || []) // Fallback to legacy JSON if table is empty
  }));
}

export async function getWeeklyPlans(classroomId?: string): Promise<any[]> {
  let query = db().from('weekly_plans').select('*');
  if (classroomId) query = query.eq('classroom_id', classroomId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((p: any) => ({
    ...p,
    classroomId: p.classroom_id,
    weekStartDate: p.week_start_date,
  }));
}

export async function readDB(): Promise<Database> {
  const [users, classrooms, weeklyPlans] = await Promise.all([
    getUsers(),
    getClassrooms(),
    getWeeklyPlans(),
  ]);
  return { users, tickets: [], classrooms, weeklyPlans };
}

export async function saveClassroom(classroom: Classroom) {
  const { data, error } = await db().from('classrooms').upsert({
    id: classroom.id,
    user_id: classroom.userId,
    name: classroom.name,
    grade: classroom.grade,
    year: classroom.year,
    description: classroom.description,
    subjects: classroom.subjects,
    students: classroom.students,
  });
  if (error) throw error;
  return data;
}

export async function saveWeeklyPlan(plan: any) {
  const { data, error } = await db().from('weekly_plans').upsert({
    id: plan.id,
    classroom_id: plan.classroomId,
    subject_id: plan.subjectId,
    week_start_date: plan.weekStartDate,
    days: plan.days,
  });
  if (error) throw error;
  return data;
}

export async function deleteWeeklyPlan(id: string) {
  const { error } = await db().from('weekly_plans').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function saveProfile(profile: any) {
  const { error } = await db().from('profiles').upsert({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    level: profile.level,
    credits: profile.credits,
    plan: profile.plan,
    role: profile.role,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteClassroom(id: string) {
  const { error } = await db().from('classrooms').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getStudents(classroomId: string): Promise<any[]> {
  const { data, error } = await db()
    .from('students')
    .select('*')
    .eq('classroom_id', classroomId);
  if (error) throw error;
  return data || [];
}

export async function upsertStudent(student: any) {
  const { data, error } = await db().from('students').upsert({
    id: student.id,
    classroom_id: student.classroom_id || student.classroomId,
    user_id: student.user_id || student.userId,
    name: student.name,
    attendance: student.attendance,
    dua_context_tags: student.dua_context_tags || student.duaContextTags || [],
  }).select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteStudentFromDB(id: string) {
  const { error } = await db().from('students').delete().eq('id', id);
  if (error) throw error;
}

export async function getGrades(studentId: string): Promise<any[]> {
  const { data, error } = await db()
    .from('grades')
    .select('*')
    .eq('student_id', studentId);
  if (error) throw error;
  return data || [];
}

export async function upsertGrade(grade: any) {
  const { data, error } = await db().from('grades').upsert({
    id: grade.id,
    student_id: grade.student_id || grade.studentId,
    classroom_id: grade.classroom_id || grade.classroomId,
    subject_id: grade.subject_id || grade.subjectId,
    topic: grade.topic,
    score: grade.score,
    date: grade.date,
  }).select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteGrade(id: string) {
  const { error } = await db().from('grades').delete().eq('id', id);
  if (error) throw error;
}

// Legacy support / Maintenance
export async function getTickets(): Promise<SupportTicket[]> {
  const { data, error } = await db().from('tickets').select('*');
  if (error) throw error;
  return (data || []).map((t: any) => ({
    ...t,
    createdAt: t.created_at,
    userEmail: t.user_email,
  }));
}

export async function saveTicket(ticket: SupportTicket) {
  const { error } = await db().from('tickets').upsert({
    id: ticket.id,
    user_id: ticket.userId,
    user_email: ticket.userEmail,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    attachments: ticket.attachments,
    created_at: ticket.createdAt,
  });
  if (error) throw error;
}
