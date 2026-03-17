export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Para el login
  role: 'admin' | 'docente'; // admin = maestro administrador
  level: string; // Primaria, Secundaria, etc.
  credits: number;
  plan: 'Gratuito' | 'Docente Pro' | 'Institución';
}

export interface GradeEntry {
  id: string;
  studentDni: string; // Refers to the student's DNI
  subjectId: string;
  subject_id?: string; // Database field
  topic: string;
  score: number;
  date: string;
}

export interface Student {
  dni: string; // National ID as the primary unique identifier
  classroomId: string;
  name: string;
  grades: number[]; // Legacy simple grades
  detailedGrades?: GradeEntry[]; // New structured grades
  attendance: number; // Porcentaje 0-100
  duaContextTags: string[]; // Ej: ['TDAH', 'Dislexia Viso-Espacial', 'Altas Capacidades']
}

export interface Subject {
  id: string;
  name: string; // e.g., 'Matemática', 'Prácticas del Lenguaje'
}

export interface Classroom {
  id: string;
  userId: string;
  name: string; // Ej: "1er Grado A"
  grade: string; // Ej: "1er Grado"
  year: number;
  description?: string; // Ej: "Turno Tarde - Grupo con muchos TDAH"
  subjects: Subject[]; // Materias que da este docente en este curso
  students: Student[];
}

export interface Resource {
  id: string;
  userId: string;
  type: 'Planificación' | 'Examen' | 'Rúbrica' | 'Actividad';
  title: string;
  content: string; // Markdown o HTML
  createdAt: string;
  subject: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type DayStatus = 'Pendiente' | 'Completado' | 'Atrasado';

export interface PlanDay {
  id: string;
  date: string;
  dayOfWeek: string;
  topic: string; // What the AI planned for this day
  description: string;
  isHoliday: boolean; // Marked explicitly by the teacher
  status: DayStatus; 
  resources?: any[];
}

export interface WeeklyPlan {
  id: string;
  classroomId: string;
  subjectId: string;
  weekStartDate: string;
  days: PlanDay[];
  createdAt: string;
}
