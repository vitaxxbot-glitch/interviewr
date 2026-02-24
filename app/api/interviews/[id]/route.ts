export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getInterview, createSession, getSession, getMessages, completeSession, getSessionsForInterview, updateInterview } from '@/lib/db';
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

    const { name, email, phone } = await req.json();
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const sessionId = uuidv4();
    createSession(sessionId, id, name, email || '', phone || '');
    return NextResponse.json({ sessionId });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Edit interview settings
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ['title', 'goal', 'intro_message', 'success_message', 'fields', 'max_questions'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    updateInterview(id, update as Parameters<typeof updateInterview>[1]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
