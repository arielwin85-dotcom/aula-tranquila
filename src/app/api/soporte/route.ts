import { NextResponse } from 'next/server';
import { getTickets, saveTicket } from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

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

    // Note: In a real production app on Vercel, we would upload to Supabase Storage.
    // For now, we simulate file attachments to avoid breaking the UI, 
    // but we don't save to the read-only filesystem.
    for (const file of files) {
      if (file && file.name) {
        attachmentNames.push(file.name);
      }
    }

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

    await saveTicket(newTicket);

    return NextResponse.json(newTicket);
  } catch (err) {
    console.error('Error creating ticket:', err);
    return NextResponse.json({ error: 'Error al crear el ticket' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tickets = await getTickets();
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener tickets' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    const tickets = await getTickets();
    const ticketIndex = tickets.findIndex(t => t.id === id);
    
    if (ticketIndex === -1) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = tickets[ticketIndex];
    ticket.status = status;
    
    await saveTicket(ticket);

    return NextResponse.json(ticket);
  } catch (err) {
    console.error('Error updating ticket:', err);
    return NextResponse.json({ error: 'Error al actualizar ticket' }, { status: 500 });
  }
}
