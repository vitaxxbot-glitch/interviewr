export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createInterview, listInterviews } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    return NextResponse.json(listInterviews());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, goal, instructions, maxQuestions } = await req.json();
    if (!title || !goal) return NextResponse.json({ error: 'title and goal required' }, { status: 400 });
    const id = uuidv4().slice(0, 8);
    createInterview(id, title, goal, instructions || '', Number(maxQuestions) || 8);
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const db = (await import('@/lib/db')).getDb();
    db.prepare('DELETE FROM messages WHERE session_id IN (SELECT id FROM sessions WHERE interview_id = ?)').run(id);
    db.prepare('DELETE FROM sessions WHERE interview_id = ?').run(id);
    db.prepare('DELETE FROM interviews WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
