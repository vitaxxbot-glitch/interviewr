export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getInterview, getSession, getMessages, addMessage, completeSession } from '@/lib/db';
import { getInterviewerResponse, generateSuggestions } from '@/lib/ai';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { sessionId, message } = await req.json();

    const interview = getInterview(id);
    if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

    const session = getSession(sessionId);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.completed) return NextResponse.json({ error: 'Already completed' }, { status: 400 });

    const maxQ = interview.max_questions || 5;
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

    const cleanReply = reply.replace('INTERVIEW_COMPLETE', '').trim();
    const suggestions = isComplete ? [] : await generateSuggestions(interview.goal, cleanReply);

    return NextResponse.json({
      reply: cleanReply,
      isComplete,
      questionCount: questionCount + (isFirst ? 0 : 1),
      maxQuestions: maxQ,
      suggestions,
    });
  } catch (e: unknown) {
    console.error(e);
    const status = (e as { status?: number })?.status;
    if (status === 529 || String(e).includes('overloaded')) {
      return NextResponse.json({
        error: 'AI is temporarily overloaded. Please try again in a moment.',
        retryable: true,
      }, { status: 503 });
    }
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
      maxQuestions: interview?.max_questions || 5,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
