import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const subject = formData.get('subject') as string;
    const userEmail = formData.get('userEmail') as string;
    const description = formData.get('description') as string;
    const files = formData.getAll('files') as File[];

    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_session')?.value;

    const attachmentNames: string[] = [];

    // Save files to public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of files) {
      if (file && file.name) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name}`;
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        attachmentNames.push(fileName);
      }
    }

    const db = readDB();
    
    const newTicket = {
      id: uuidv4(),
      userId,
      userEmail,
      subject,
      description,
      status: 'Abierto' as const,
      createdAt: new Date().toISOString(),
      attachments: attachmentNames
    };

    db.tickets.push(newTicket);
    writeDB(db);

    return NextResponse.json(newTicket);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function GET() {
  const db = readDB();
  return NextResponse.json(db.tickets);
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    const db = readDB();
    const ticketIndex = db.tickets.findIndex(t => t.id === id);
    
    if (ticketIndex === -1) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    db.tickets[ticketIndex].status = status;
    writeDB(db);

    return NextResponse.json(db.tickets[ticketIndex]);
  } catch (err) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
