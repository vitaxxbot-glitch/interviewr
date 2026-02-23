export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getInterview, getSessionsForInterview, getMessages, getAllSessionMessages, saveSummary } from '@/lib/db';
import { generateSummary } from '@/lib/ai';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const interview = getInterview(id);
    if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sessions = getSessionsForInterview(id);
    const sessionDetails = sessions.map(s => {
      const msgs = getMessages(s!.id);
      return { ...s, messages: msgs };
    });

    const url = new URL(req.url);
    const withSummary = url.searchParams.get('summary') === '1';

    // Generate + persist summary if requested (force=1 regenerates even if exists)
    const force = url.searchParams.get('force') === '1';
    if (withSummary && (!interview.summary || force)) {
      const allMessages = getAllSessionMessages(id);
      if (allMessages.length > 0) {
        const summary = await generateSummary(interview.goal, allMessages);
        saveSummary(id, summary);
        interview.summary = summary;
      }
    }

    return NextResponse.json({
      interview,
      sessions: sessionDetails,
      totalResponses: sessions.length,
      completedResponses: sessions.filter(s => s!.completed).length,
      summary: interview.summary ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
