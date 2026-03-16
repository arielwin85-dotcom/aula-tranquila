import fs from 'fs';
import path from 'path';
import { Classroom, User } from '@/types';
import { mockClassrooms } from '@/mocks/data';

// Path to the local JSON database
const dbFilePath = path.join(process.cwd(), 'src', 'data', 'db.json');

// In-memory fallback for environments where filesystem is read-only (like Vercel)
let inMemoryDB: Database | null = null;

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

// Ensure the DB file exists, if not, create it with mock data (if possible)
export function initDB() {
  const dirPath = path.dirname(dbFilePath);
  
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(dbFilePath)) {
      fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  } catch (error) {
    // If we are on Vercel or a read-only FS, we just log and continue using in-memory
    console.warn('Filesystem is read-only. Data will not persist across restarts.', error);
    if (!inMemoryDB) {
      inMemoryDB = initialData;
    }
  }
}

// Read from DB
export function readDB(): Database {
  if (inMemoryDB) return inMemoryDB;
  
  try {
    initDB();
    if (fs.existsSync(dbFilePath)) {
      const data = fs.readFileSync(dbFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to read from DB, using fallback', error);
  }
  
  return initialData;
}

// Write to DB
export function writeDB(data: Database) {
  try {
    initDB();
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Write failed, updating in-memory only', error);
    inMemoryDB = data;
  }
}
