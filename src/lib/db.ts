import { Classroom, User, Subject, Student, GradeEntry, Evidencia } from '@/types';
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
      id: s.id || s.name || `sub-unknown`,
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

export async function getWeeklyPlans(classroomId?: string, userId?: string, aula_grado?: string, area_materia?: string): Promise<any[]> {
  // Query normalizada con clases anidadas
  let query = db().from('planificaciones').select(`
    *,
    planificacion_clases(*)
  `);
  
  if (userId) query = query.eq('user_id', userId);
  if (aula_grado) query = query.eq('aula_grado', aula_grado);
  if (area_materia) query = query.eq('area_materia', area_materia);

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching planificaciones:', error);
    // Fallback a tabla vieja si la nueva no existe o falla
    const oldRes = await db().from('weekly_plans').select('*').order('created_at', { ascending: false });
    if (!oldRes.error) {
      return (oldRes.data || []).map((p: any) => ({
        ...p,
        classroomId: p.classroom_id,
        weekStartDate: p.week_start_date,
      }));
    }
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    userId: p.user_id,
    aula_grado: p.aula_grado,
    area_materia: p.area_materia,
    weekStartDate: p.fecha_inicio,
    numClasses: p.cant_clases,
    messages: p.chat_historial,
    createdAt: p.created_at,
    days: (p.planificacion_clases || [])
      .sort((a: any, b: any) => a.numero_clase - b.numero_clase)
      .map((c: any) => ({
        id: c.id,
        numero_clase: c.numero_clase,
        dayOfWeek: c.dia_semana || `Clase ${c.numero_clase}`,
        topic: c.titulo,
        objetivo: c.objetivo,
        contenido: c.contenido,
        actividades: c.actividades,
        recursos: c.recursos,
        evaluacion: c.evaluacion,
        status: c.estado === 'COMPLETADO' ? 'Completado' : 'Pendiente',
        isHoliday: false
      }))
  }));
}

export async function obtenerContenidosPrevios(userId: string, aula_grado: string, area_materia: string): Promise<string> {
  const { data, error } = await db()
    .from('contenidos_dados')
    .select('tema, fecha_dada')
    .eq('user_id', userId)
    .eq('aula_grado', aula_grado)
    .eq('area_materia', area_materia)
    .order('fecha_dada', { ascending: true });

  if (error || !data || data.length === 0) return 'Ninguno aún.';
  return (data as any[]).map((c: any) => `- ${c.tema} (${c.fecha_dada})`).join('\n');
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
    id: s.id || s.name || `sub-unknown`,
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
  // 1. Cabezal
  const planPayload = {
    id: plan.id,
    user_id: plan.userId,
    aula_grado: plan.aula_grado || 'Aula',
    area_materia: plan.area_materia || 'Materia',
    fecha_inicio: plan.weekStartDate,
    cant_clases: plan.numClasses || plan.days?.length || 0,
    chat_historial: plan.messages || [],
  };

  const { error: errorPlan } = await db().from('planificaciones').upsert(planPayload);
  if (errorPlan) throw errorPlan;

  // 2. Detalle (Clases)
  await db().from('planificacion_clases').delete().eq('planificacion_id', plan.id);

  const clasesPayload = (plan.days || []).map((day: any, index: number) => ({
    planificacion_id: plan.id,
    numero_clase: day.numero_clase || index + 1,
    fecha: day.fecha || plan.weekStartDate,
    dia_semana: day.dia_semana,
    titulo: day.topic || day.titulo,
    objetivo: day.objetivo || '',
    contenido: day.contenido || day.description || '',
    actividades: day.actividades || day.actividad || '',
    recursos: day.recursos || '',
    evaluacion: day.evaluacion || '',
    estado: day.status === 'Completado' ? 'COMPLETADO' : 'PENDIENTE'
  }));

  const { error: errorClases } = await db().from('planificacion_clases').insert(clasesPayload);
  if (errorClases) console.error('Error saving planificacion_clases:', errorClases);

  // 3. Registrar en memoria de contenidos dados
  const temasPayload = (plan.days || []).map((day: any) => ({
    user_id: plan.userId,
    aula_grado: plan.aula_grado,
    area_materia: plan.area_materia,
    tema: day.topic || day.titulo,
    fecha_dada: day.fecha || plan.weekStartDate
  }));

  const { error: errorTemas } = await db().from('contenidos_dados').upsert(temasPayload, { onConflict: 'user_id,aula_grado,area_materia,tema' });
  if (errorTemas) console.error('Error saving contenidos_dados:', errorTemas);

  return { success: true };
}

export async function deleteWeeklyPlan(id: string) {
  const { error } = await db().from('planificaciones').delete().eq('id', id);
  if (error) {
     // Try old table fallback
     await db().from('weekly_plans').delete().eq('id', id);
  }
  return true;
}

export async function saveProfile(profile: any) {
  const payload: any = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    level: profile.level,
    credits: profile.credits,
    plan: profile.plan,
    role: profile.role,
    active: profile.active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (profile.tokens_disponibles !== undefined) {
    payload.tokens_disponibles = profile.tokens_disponibles;
    payload.tokens_totales = profile.tokens_disponibles; // Igualamos por simplicidad para panel admin
  }

  const { error } = await db().from('profiles').upsert(payload);
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

// --- EVIDENCIAS IA ---

export async function getEvidencias(userId: string): Promise<Evidencia[]> {
  const { data, error } = await db()
    .from('evidencias')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching evidencias:', error);
    return [];
  }
  
  return (data || []).map((e: any) => ({
    id: e.id,
    userId: e.user_id,
    studentName: e.student_name,
    identified: e.identified,
    score: e.score,
    strengths: e.strengths || [],
    weaknesses: e.weaknesses || [],
    feedback: e.feedback,
    exercisesAnalyzed: e.exercises_analyzed,
    createdAt: e.created_at
  }));
}

export async function saveEvidencia(evidencia: Evidencia) {
  const { data, error } = await db()
    .from('evidencias')
    .insert([{
      user_id: evidencia.userId,
      student_name: evidencia.studentName,
      identified: evidencia.identified,
      score: evidencia.score,
      strengths: evidencia.strengths,
      weaknesses: evidencia.weaknesses,
      feedback: evidencia.feedback,
      exercises_analyzed: evidencia.exercisesAnalyzed,
      created_at: evidencia.createdAt || new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving evidencia:', error);
    throw error;
  }
  return data;
}

export async function deleteEvidencia(id: string) {
  const { error } = await db()
    .from('evidencias')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting evidencia:', error);
    return false;
  }
  return true;
}

