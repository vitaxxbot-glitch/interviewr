import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function getInterviewerResponse(
  goal: string,
  instructions: string,
  intervieweeName: string,
  history: ChatMessage[],
  questionCount: number,
  maxQuestions = 99, // unused — AI decides
): Promise<string> {
  const isFirst = history.length === 0;

  const systemPrompt = `You are a warm, skilled AI interviewer. Your job is to have a real conversation — not run a survey.

Interview goal: ${goal}
${instructions ? `Additional context: ${instructions}` : ''}
You are interviewing: ${intervieweeName}

RULES:
- Ask ONE question at a time, never multiple
- Keep questions short and conversational
- Adapt based on answers — go deeper when interesting, skip what's irrelevant
- Prefer questions with brief answers when possible
- Make the person feel heard, not interrogated

WHEN TO WRAP UP:
- When you've genuinely understood what the goal asks for
- Usually after 5–10 exchanges — use your judgment based on richness, not a fixed count
- When you have enough, thank ${intervieweeName} warmly and specifically, summarize what you heard in 1–2 sentences, then end with exactly: INTERVIEW_COMPLETE

${isFirst ? `Start: greet ${intervieweeName} by name, say it'll be a short conversation (~5 min), then ask your first question.` : ''}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system: systemPrompt,
    messages: history.length ? history : [{ role: 'user', content: '__START__' }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function generateSummary(
  goal: string,
  allMessages: { name: string; email: string; role: string; content: string }[]
): Promise<string> {
  if (allMessages.length === 0) return 'No hay respuestas todavía.';

  const byParticipant: Record<string, typeof allMessages> = {};
  for (const m of allMessages) {
    const key = `${m.name} <${m.email}>`;
    if (!byParticipant[key]) byParticipant[key] = [];
    byParticipant[key].push(m);
  }

  const transcripts = Object.entries(byParticipant)
    .map(([person, msgs]) => {
      const firstName = person.split(' ')[0];
      const lines = msgs
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => `${m.role === 'user' ? firstName : 'AI'}: ${m.content}`)
        .join('\n');
      return `### ${person}\n${lines}`;
    }).join('\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Analyze these interview transcripts. Goal: "${goal}"

${transcripts}

Write a structured summary in markdown:

## Key Themes
Patterns across multiple people (with names).

## Standout Insights
Surprising or rich individual responses — quote directly when powerful.

## Recommended Actions
3-5 concrete next steps based on what you learned.

## Per-Person Highlights
One sentence per participant with their most important point.

Be specific and direct. No filler.`
    }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
