export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getInterview, getSession, getMessages, addMessage, completeSession } from '@/lib/db';
import { getInterviewerResponse } from '@/lib/ai';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { sessionId, message } = await req.json();

    const interview = getInterview(id);
    if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

    const session = getSession(sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.completed) return NextResponse.json({ error: 'Interview already completed' }, { status: 400 });

    const history = getMessages(sessionId);
    const isFirst = history.length === 0;

    // If user sent a message, add it
    if (message && !isFirst) {
      addMessage(sessionId, 'user', message);
    }

    // Build message history for AI
    const aiHistory = isFirst
      ? []
      : [...history, { role: 'user' as const, content: message }].map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

    const reply = await getInterviewerResponse(
      interview.goal,
      interview.instructions,
      session.name,
      aiHistory,
      isFirst
    );

    addMessage(sessionId, 'assistant', reply);

    const isComplete = reply.includes('INTERVIEW_COMPLETE');
    if (isComplete) completeSession(sessionId);

    return NextResponse.json({ reply, isComplete });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET: start interview (first message from AI)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const interview = getInterview(id);
    if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const session = getSession(sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const history = getMessages(sessionId);
    return NextResponse.json({ messages: history, completed: session.completed === 1 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
