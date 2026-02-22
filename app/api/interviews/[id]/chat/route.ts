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
    if (session.completed) return NextResponse.json({ error: 'Already completed' }, { status: 400 });

    const maxQ = interview.max_questions || 8;
    const history = getMessages(sessionId);
    const isFirst = history.length === 0;
    const questionCount = history.filter(m => m.role === 'user').length;

    if (!isFirst && message) addMessage(sessionId, 'user', message);

    const aiHistory = isFirst
      ? []
      : [...history, { role: 'user' as const, content: message }].map(m => ({
          role: m.role as 'user' | 'assistant', content: m.content,
        }));

    const reply = await getInterviewerResponse(
      interview.goal, interview.instructions, session.name, aiHistory, questionCount, maxQ
    );

    addMessage(sessionId, 'assistant', reply);
    const isComplete = reply.includes('INTERVIEW_COMPLETE');
    if (isComplete) completeSession(sessionId);

    return NextResponse.json({
      reply: reply.replace('INTERVIEW_COMPLETE', '').trim(),
      isComplete,
      questionCount: questionCount + (isFirst ? 0 : 1),
      maxQuestions: maxQ,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const interview = getInterview(id);
    const session = getSession(sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const messages = getMessages(sessionId);
    return NextResponse.json({
      messages,
      completed: session.completed === 1,
      questionCount: messages.filter(m => m.role === 'user').length,
      maxQuestions: interview?.max_questions || 8,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
