import { User, Classroom, Resource, ChatMessage } from '../types';

export const currentUser: User = {
  id: 'profe-1',
  name: 'Laura González',
  email: 'laura.profe@escuela.edu.ar',
  role: 'docente',
  level: 'Secundaria',
  credits: 110,
  plan: 'Docente Pro',
};

export const mockClassrooms: Classroom[] = [
  {
    id: 'grado-1a',
    userId: 'profe-1',
    name: '1er Grado A',
    grade: '1er Grado',
    year: 2026,
    subjects: [
      { id: 'sub-mate1', name: 'Matemática' },
      { id: 'sub-leng1', name: 'Prácticas del Lenguaje' },
      { id: 'sub-nat1', name: 'Ciencias Naturales' }
    ],
    students: [
      { dni: '10000001', classroomId: 'grado-1a', name: 'Martina Rossi', grades: [8, 9, 8.5], duaContextTags: [] },
      { dni: '10000002', classroomId: 'grado-1a', name: 'Facundo Pérez', grades: [5, 6, 6.5], duaContextTags: ['TDAH'] },
      { dni: '10000003', classroomId: 'grado-1a', name: 'Valentina Silva', grades: [9.5, 10, 9], duaContextTags: ['Altas Capacidades'] },
      { dni: '10000004', classroomId: 'grado-1a', name: 'Tomás Castro', grades: [7, 7, 6], duaContextTags: ['Dislexia'] },
    ]
  },
  {
    id: 'grado-7b',
    userId: 'profe-1',
    name: '7mo Grado B',
    grade: '7mo Grado',
    year: 2026,
    subjects: [
       { id: 'sub-mate7', name: 'Matemática' },
       { id: 'sub-fis7', name: 'Física y Química' }
    ],
    students: [
      { dni: '10000005', classroomId: 'grado-7b', name: 'Camila Domínguez', grades: [7, 8], duaContextTags: [] },
      { dni: '10000006', classroomId: 'grado-7b', name: 'Mateo López', grades: [4, 5], duaContextTags: ['Déficit de Atención'] },
    ]
  }
];

export const mockResources: Resource[] = [
  { id: 'r-1', userId: 'profe-1', title: 'Planificación Fracciones', type: 'Planificación', subject: 'Matemática 1er Año', content: '...', createdAt: '2026-03-10' },
  { id: 'r-2', userId: 'profe-1', title: 'Ticket de Salida: Ecuaciones', type: 'Actividad', subject: 'Matemática 1er Año', content: '...', createdAt: '2026-03-11' },
  { id: 'r-3', userId: 'profe-1', title: 'Examen Diagnóstico Dinámica', type: 'Examen', subject: 'Física 3er Año', content: '...', createdAt: '2026-03-05' },
  { id: 'r-4', userId: 'profe-1', title: 'Rúbrica de Laboratorio', type: 'Rúbrica', subject: 'Física 3er Año', content: '...', createdAt: '2026-03-08' },
];

export const mockChats: ChatMessage[] = [
  { id: 'c-1', userId: 'profe-1', role: 'assistant', content: '¡Hola Laura! Soy tu copiloto de Aula Tranquila. ¿En qué te ayudo a ahorrar tiempo hoy? Podés pedirme que planifique una clase o cree una evaluación.', timestamp: '14:00' },
];
