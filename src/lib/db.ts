import { Classroom, User, Subject, Student, GradeEntry } from '@/types';
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

export async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await db().from('subjects').select('*').order('id', { ascending: true });
  if (error) {
    console.error('Failed to fetch subjects from DB, table might not exist yet:', error);
    return [];
  }
  return data || [];
}

export async function getClassrooms(userId?: string): Promise<Classroom[]> {
  // 1. Fetch classrooms with students
  let query = db().from('classrooms').select('*, students_list:students(*, grades_list:grades(*))');
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error || !data) {
    const { data: fallback, error: fbErr } = await db().from('classrooms').select('*');
    if (fbErr) throw fbErr;
    return (fallback || []).map((c: any) => ({ ...c, userId: c.user_id, students: c.students || [] }));
  }

  // 2. Fetch all "notas" (new system) for all classrooms to avoid N+1
  const allStudentDnis = data.flatMap((c: any) => (c.students_list || []).map((s: any) => s.dni));
  const { data: allNotas, error: notasErr } = allStudentDnis.length > 0 
    ? await db().from('notas').select('*').in('alumno_dni', allStudentDnis)
    : { data: [], error: null };

  return data.map((c: any) => {
    const subjects = (c.subjects || []).map((s: any) => ({
      ...s,
      id: s.id || s.name || `sub-${Math.random().toString(36).substr(2, 9)}`,
    }));

    const normalizedStudents: Student[] = (c.students_list || []).map((s: any) => {
      // Find notas for this specific student
      const studentNotas = (allNotas || []).filter((n: any) => String(n.alumno_dni) === String(s.dni));
      
      const detailedGrades = studentNotas.length > 0
        ? studentNotas.map((n: any) => ({
            id: n.id,
            studentDni: n.alumno_dni,
            subjectId: n.materia,
            topic: n.evaluacion || '',
            score: Number(n.nota) || 0,
            date: n.fecha || '',
          }))
        : (s.grades_list || []).map((g: any) => ({
            ...g,
            subjectId: g.subject_id || g.subjectId,
          }));

      return {
        ...s,
        classroomId: s.classroom_id,
        duaContextTags: s.dua_context_tags || [],
        detailedGrades,
        grades: detailedGrades.map((g: any) => g.score),
      };
    });

    const legacyStudents = (c.students || []).filter((ls: any) =>
      !normalizedStudents.some((ns: Student) => String(ns.dni) === String(ls.dni || ls.id))
    );

    return {
      ...c,
      subjects,
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
  // Heal subjects before saving to ensure consistency
  const healedSubjects = (classroom.subjects || []).map(s => ({
    ...s,
    id: s.id || s.name || `sub-${Math.random().toString(36).substr(2, 9)}`,
  }));

  const { data, error } = await db().from('classrooms').upsert({
    id: classroom.id,
    user_id: classroom.userId,
    name: classroom.name,
    grade: classroom.grade,
    year: classroom.year,
    description: classroom.description,
    subjects: healedSubjects,
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

export async function getStudents(classroomId: string): Promise<Student[]> {
  // 1. Fetch students for this classroom
  const { data: students, error: studentError } = await db()
    .from('students')
    .select('*')
    .eq('classroom_id', classroomId);
    
  if (studentError) throw studentError;
  if (!students) return [];

  // 2. Fetch all grades for these students to avoid N+1 queries
  const studentDnis = (students as any[]).map((s: any) => s.dni);
  const { data: allGrades, error: gradesError } = await db()
    .from('grades')
    .select('*')
    .in('student_dni', studentDnis);

  if (gradesError) {
    console.error('Grades table fetch failed (might be empty or missing):', gradesError);
    return (students as any[]).map((s: any) => ({ 
      ...s, 
      classroomId: s.classroom_id,
      duaContextTags: s.dua_context_tags || [],
      detailedGrades: [], 
      grades: [] 
    }));
  }

  // 3. Map grades back to students
  return (students as any[]).map((student: any) => {
    const studentGrades = (allGrades || []).filter((g: any) => String(g.student_dni) === String(student.dni));
    return {
      ...student,
      classroomId: student.classroom_id,
      duaContextTags: student.dua_context_tags || [],
      detailedGrades: studentGrades.map((g: any) => ({
        ...g,
        subjectId: g.subject_id || g.subjectId
      })),
      grades: studentGrades.map((g: any) => g.score),
    };
  });
}

export async function getFullStudent(dni: string): Promise<Student | null> {
  const { data: student, error: studentError } = await db()
    .from('students')
    .select('*, grades_list:grades(*)')
    .eq('dni', dni)
    .single();
    
  if (studentError || !student) return null;

  return {
    ...student,
    classroomId: student.classroom_id,
    duaContextTags: student.dua_context_tags || [],
    detailedGrades: (student.grades_list || []).map((g: any) => ({
      ...g,
      subjectId: g.subject_id || g.subjectId, 
    })),
    grades: (student.grades_list || []).map((g: any) => g.score)
  } as any;
}


export async function deleteStudentFromLegacy(dni: string, classroomId: string) {
  const { data: classroom, error: fetchErr } = await db()
    .from('classrooms')
    .select('students')
    .eq('id', classroomId)
    .single();

  if (fetchErr || !classroom) return false;

  const students = classroom.students || [];
  const filtered = students.filter((s: any) => String(s.dni || s.id) !== String(dni));
  
  if (filtered.length === students.length) return true; // Already gone

  const { error: saveErr } = await db()
    .from('classrooms')
    .update({ students: filtered })
    .eq('id', classroomId);

  return !saveErr;
}

export async function deleteStudentFromDB(dni: string, classroomId: string) {
  try {
    // 1. Delete notas (new grades system) - cascade by alumno_dni
    await db().from('notas').delete().eq('alumno_dni', dni);

    // 2. Delete grades (old grades table) - cascade by student_dni
    await db().from('grades').delete().eq('student_dni', dni);

    // 3. Delete the student record itself
    const { error } = await db().from('students').delete().eq('dni', dni);
    if (error) {
      console.error('Error deleting from students table:', error);
    }

    // 4. Also clean up from legacy classrooms.students array
    await deleteStudentFromLegacy(dni, classroomId);

    return true;
  } catch (e) {
    console.error('Error in cascade delete:', e);
    // Fallback: at minimum remove from legacy
    return deleteStudentFromLegacy(dni, classroomId);
  }
}

export async function upsertStudent(student: any) {
  try {
    const { data, error } = await db().from('students').upsert({
      dni: student.dni,
      classroom_id: student.classroom_id || student.classroomId,
      user_id: student.user_id || student.userId,
      name: student.name,
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
  const index = students.findIndex((s: any) => String(s.dni || s.id) === String(student.dni));
  
  if (index !== -1) {
    students[index] = { ...students[index], ...student };
  } else {
    students.push({ ...student, dni: student.dni });
  }

  const { error: saveErr } = await db()
    .from('classrooms')
    .update({ students })
    .eq('id', classroomId);

  if (saveErr) throw saveErr;
  return student;
}

export async function getGrades(studentDni: string): Promise<any[]> {
  const { data, error } = await db()
    .from('grades')
    .select('*')
    .eq('student_dni', studentDni);
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
      student_dni: grade.student_dni || grade.studentDni,
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

// --- NEW NOTAS SYSTEM (v4.0.0) ---

export async function getNotasByStudent(dni: string, classroomId: string) {
  const { data, error } = await db()
    .from('notas')
    .select('*')
    .eq('alumno_dni', dni)
    .eq('clase_id', classroomId)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error fetching notas:', error);
    return [];
  }
  return data || [];
}

export async function upsertNota(nota: any) {
  const { data, error } = await db()
    .from('notas')
    .upsert({
      ...nota,
      id: nota.id?.startsWith('grade-') ? undefined : nota.id // Handle fresh IDs
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting nota:', error);
    return null;
  }
  return data;
}

export async function deleteNota(id: string) {
  const { error } = await db()
    .from('notas')
    .delete()
    .eq('id', id);
    
  return !error;
}

export async function getAveragesByStudent(dni: string, classroomId: string) {
  const notas = await getNotasByStudent(dni, classroomId);
  if (!notas.length) return { general: 0, bySubject: {} };

  const subjects: Record<string, number[]> = {};
  notas.forEach((n: any) => {
    if (!subjects[n.materia]) subjects[n.materia] = [];
    subjects[n.materia].push(Number(n.nota));
  });

  const bySubject: Record<string, number> = {};
  let totalSum = 0;
  let totalCount = 0;

  Object.entries(subjects).forEach(([sub, scores]) => {
    const sum = scores.reduce((a, b) => a + b, 0);
    bySubject[sub] = Number((sum / scores.length).toFixed(2));
    totalSum += sum;
    totalCount += scores.length;
  });

  return {
    general: Number((totalSum / totalCount).toFixed(2)),
    bySubject
  };
}
