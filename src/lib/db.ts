import fs from 'fs';
import path from 'path';
import { Classroom, User } from '@/types';
import { mockClassrooms } from '@/mocks/data';

// Path to the local JSON database
const dbFilePath = path.join(process.cwd(), 'src', 'data', 'db.json');

export interface Database {
  users: User[];
  tickets: SupportTicket[];
  classrooms: Classroom[];
  weeklyPlans: any[]; // Using any to avoid circular import pain, we know it's WeeklyPlan[]
}

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

// Ensure the DB file exists, if not, create it with mock data
export function initDB() {
  const dirPath = path.dirname(dbFilePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  if (!fs.existsSync(dbFilePath)) {
    const initialData: Database = { 
      users: [
        {
          id: 'admin-1',
          name: 'Administrador Maestro',
          email: 'admin@aulatranquila.com',
          password: 'admin', // En producción usar hashing
          role: 'admin',
          level: 'Administración',
          credits: 9999,
          plan: 'Institución'
        }
      ],
      tickets: [],
      classrooms: mockClassrooms, 
      weeklyPlans: [] 
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

// Read from DB
export function readDB(): Database {
  initDB();
  const data = fs.readFileSync(dbFilePath, 'utf-8');
  return JSON.parse(data);
}

// Write to DB
export function writeDB(data: Database) {
  initDB();
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
}
