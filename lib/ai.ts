import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 2,
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function isOverloaded(e: unknown): boolean {
  const err = e as { status?: number; message?: string };
  return err?.status === 529 || String(err?.message ?? '').includes('overloaded');
}

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

  const systemPrompt = `You are a friendly, concise AI interviewer. Your job: get to the point fast.

Interview goal: ${goal}
You are interviewing: ${intervieweeName}
Max questions: ${maxQuestions}

RULES — follow strictly:
- LANGUAGE: always respond in the same language as the interview goal. If the goal is in Spanish, respond in Spanish. If in English, respond in English. Never mix languages.
- ONE question per message, never two
- KEEP IT SHORT: each question must be 12 words or fewer. Be direct.
- Sound human and warm, not formal or corporate
- Don't explain why you're asking — just ask
- If the goal is simple (dinner choice, quick preference), 2–3 questions is enough
- Adapt: go deeper on interesting answers, skip what's already clear
- Never restate what they said back to them
- DO NOT ask more than ${maxQuestions} questions total

GOOD question examples:
- "What are you in the mood for?"
- "Any foods you want to avoid?"
- "How hungry are you right now?"
- "Can you give me an example?"

BAD (too long/complex):
- "That's really interesting — could you elaborate more on how that process affects your day-to-day workflow?"

WHEN TO WRAP UP:
- Wrap up as SOON as you have enough information — don't drag it out
- For simple goals: 2–3 questions is plenty
- For complex research: up to ${maxQuestions} questions max
- Say a brief thank-you (1 sentence), then end with exactly: INTERVIEW_COMPLETE

${isFirst ? `Opening: greet ${intervieweeName} by name in one short sentence, then immediately ask your first question. Keep the whole opening under 20 words.` : ''}`;

  const messages = history.length ? history : [{ role: 'user' as const, content: '__START__' }];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      system: systemPrompt,
      messages,
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (e) {
    if (isOverloaded(e) && openai) {
      console.log('Anthropic overloaded — falling back to OpenAI');
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
      });
      return res.choices[0].message.content ?? '';
    }
    throw e;
  }
}

export async function generateSuggestions(
  goal: string,
  question: string,
): Promise<string[]> {
  const prompt = `Interview goal: "${goal}"
The interviewer just asked: "${question}"

Generate 3 very short suggested answers a participant might give (max 5 words each).
Write the suggestions in the same language as the interview goal.
Return ONLY the 3 answers, one per line, no numbering, no bullets, no extra text.`;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 80,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 3);
  } catch {
    return [];
  }
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

  const prompt = `Analyze these interview transcripts. Goal: "${goal}"

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

Be specific and direct. No filler.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (e) {
    if (isOverloaded(e) && openai) {
      console.log('Anthropic overloaded — falling back to OpenAI for summary');
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });
      return res.choices[0].message.content ?? '';
    }
    throw e;
  }
}
