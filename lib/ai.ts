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

  const systemPrompt = `You are a friendly, concise AI interviewer. Your job: have a natural conversation to understand what the goal needs.

Interview goal: ${goal}
You are interviewing: ${intervieweeName}

RULES — follow strictly:
- ONE question per message, never two
- KEEP IT SHORT: each question must be 15 words or fewer. Be direct.
- Sound human and warm, not formal or corporate
- Don't explain why you're asking — just ask
- Adapt: go deeper on interesting answers, skip what's already clear
- Never restate what they said back to them

GOOD question examples:
- "What's your biggest frustration with it?"
- "How often does that happen?"
- "What would make it better?"
- "Can you give me an example?"

BAD (too long/complex):
- "That's really interesting — could you elaborate more on how that process affects your day-to-day workflow and what specific challenges you encounter?"

WHEN TO WRAP UP:
- Once you genuinely understand what the goal asks for (usually 5–8 exchanges)
- Say a brief, warm thank-you (1 sentence), then end with exactly: INTERVIEW_COMPLETE

${isFirst ? `Opening: greet ${intervieweeName} by name in one short sentence, then immediately ask your first question. Keep the whole opening under 25 words.` : ''}`;

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
  if (allMessages.length === 0) return 'No responses yet.';

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
