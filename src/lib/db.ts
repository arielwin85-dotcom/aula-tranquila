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

  return (data || []).map((c: any) => {
    const normalizedStudents = (c.students_list || []).map((s: any) => ({
      ...s,
      classroomId: s.classroom_id,
      duaContextTags: s.dua_context_tags || [],
      detailedGrades: (s.grades_list || []).map((g: any) => ({
        ...g,
        subjectId: g.subject_id, // Ensure both formats are available
      })),
      grades: (s.grades_list || []).map((g: any) => g.score)
    }));

    // Find legacy students that are NOT yet in the normalized table
    const legacyStudents = (c.students || []).filter((ls: any) => 
      !normalizedStudents.some(ns => String(ns.id) === String(ls.id))
    );

    return {
      ...c,
      userId: c.user_id,
      students: [...normalizedStudents, ...legacyStudents]
    };
  });
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
  // 1. Fetch students for this classroom
  const { data: students, error: studentError } = await db()
    .from('students')
    .select('*')
    .eq('classroom_id', classroomId);
    
  if (studentError) throw studentError;
  if (!students) return [];

  // 2. Fetch all grades for these students to avoid N+1 queries
  const studentIds = students.map(s => s.id);
  const { data: allGrades, error: gradesError } = await db()
    .from('grades')
    .select('*')
    .in('student_id', studentIds);

  if (gradesError) {
    console.error('Grades table fetch failed (might be empty or missing):', gradesError);
    return students.map(s => ({ ...s, detailedGrades: [], grades: [] }));
  }

  // 3. Map grades back to students
  return students.map(student => {
    const studentGrades = (allGrades || []).filter(g => g.student_id === student.id);
    return {
      ...student,
      detailedGrades: studentGrades,
      grades: studentGrades.map(g => g.score),
      // Map database fields to types if needed
      duaContextTags: student.dua_context_tags || [],
    };
  });
}


export async function deleteStudentFromDB(id: string, classroomId: string) {
  try {
    // 1. Try deleting from normalized students table
    const { error } = await db().from('students').delete().eq('id', id);
    if (!error) {
      // If student was in the new table, we are done
      return true;
    }
  } catch (e) {
    console.error('Students table might not exist yet:', e);
  }

  // 2. Fallback: Legacy JSON delete
  const { data: classroom, error: fetchErr } = await db()
    .from('classrooms')
    .select('students')
    .eq('id', classroomId)
    .single();

  if (fetchErr || !classroom) return false;

  const students = classroom.students || [];
  const filtered = students.filter((s: any) => String(s.id) !== String(id));
  
  const { error: saveErr } = await db()
    .from('classrooms')
    .update({ students: filtered })
    .eq('id', classroomId);

  return !saveErr;
}

export async function upsertStudent(student: any) {
  try {
    const { data, error } = await db().from('students').upsert({
      id: student.id,
      classroom_id: student.classroom_id || student.classroomId,
      user_id: student.user_id || student.userId,
      name: student.name,
      attendance: student.attendance,
      dua_context_tags: student.dua_context_tags || student.duaContextTags || [],
    }).select();
    
    if (!error) return data?.[0];
  } catch (e) {
    console.error('Students table might not exist yet:', e);
  }

  // 3. Fallback: Legacy JSON update
  const classroomId = student.classroom_id || student.classroomId;
  const { data: classroom, error: fetchErr } = await db()
    .from('classrooms')
    .select('students')
    .eq('id', classroomId)
    .single();

  if (fetchErr || !classroom) throw new Error('Classroom not found for legacy update');

  const students = classroom.students || [];
  const index = students.findIndex((s: any) => String(s.id) === String(student.id));
  
  if (index !== -1) {
    students[index] = { ...students[index], ...student };
  } else {
    students.push({ ...student, id: student.id || `s-${Date.now()}` });
  }

  const { error: saveErr } = await db()
    .from('classrooms')
    .update({ students })
    .eq('id', classroomId);

  if (saveErr) throw saveErr;
  return student;
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
  const finalSubjectId = grade.subject_id || grade.subjectId;
  if (!finalSubjectId) {
    console.error('Refusing to save grade without subject identifier');
    return null;
  }

  try {
    const { data, error } = await db().from('grades').upsert({
      id: grade.id,
      student_id: grade.student_id || grade.studentId,
      classroom_id: grade.classroom_id || grade.classroomId,
      subject_id: grade.subject_id || grade.subjectId,
      topic: grade.topic,
      score: grade.score,
      date: grade.date,
    }).select();
    if (!error) return data?.[0];
  } catch (e) {
    console.error('Grades table might not exist yet:', e);
  }
  return null;
}

export async function deleteGrade(id: string) {
  try {
    const { error } = await db().from('grades').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.error('Grades table might not exist yet:', e);
  }
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
