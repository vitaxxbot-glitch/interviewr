export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getInterview, getSessionsForInterview, getMessages, getAllSessionMessages } from '@/lib/db';
import { generateSummary } from '@/lib/ai';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const interview = getInterview(id);
    if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sessions = getSessionsForInterview(id);
    const allMessages = getAllSessionMessages(id);

    // Build per-session transcripts
    const sessionDetails = sessions.map(s => {
      const msgs = getMessages(s!.id);
      return { ...s, messages: msgs };
    });

    const url = new URL(req.url);
    const withSummary = url.searchParams.get('summary') === '1';
    let summary: string | null = null;

    if (withSummary && allMessages.length > 0) {
      summary = await generateSummary(interview.goal, allMessages);
    }

    return NextResponse.json({
      interview,
      sessions: sessionDetails,
      totalResponses: sessions.length,
      completedResponses: sessions.filter(s => s!.completed).length,
      summary,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
