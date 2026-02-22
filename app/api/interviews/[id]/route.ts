export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getInterview, createSession, getSession, getMessages, completeSession, getSessionsForInterview } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const interview = getInterview(id);
    if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const sessions = getSessionsForInterview(id);
    return NextResponse.json({ ...interview, sessions });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Start a new session for this interview
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const interview = getInterview(id);
    if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { name, email } = await req.json();
    if (!name || !email) return NextResponse.json({ error: 'name and email required' }, { status: 400 });

    const sessionId = uuidv4();
    createSession(sessionId, id, name, email);
    return NextResponse.json({ sessionId });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
