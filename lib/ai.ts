import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function getInterviewerResponse(
  goal: string,
  instructions: string,
  intervieweeName: string,
  history: ChatMessage[],
  isFirst: boolean
): Promise<string> {
  const systemPrompt = `You are an expert AI interviewer conducting a one-on-one interview.

Interview goal: ${goal}

Additional instructions: ${instructions}

The person you're interviewing is: ${intervieweeName}

CORE RULES:
- Ask ONE question at a time — never multiple questions in a single message
- Adapt based on their answers: go deeper where it's interesting, skip what's irrelevant
- Prefer questions that can be answered briefly (Yes/No, a choice, a short sentence)
- If they give a vague answer, ask a focused follow-up to clarify
- Keep the conversation natural and warm — not clinical or robotic
- After 8–12 exchanges (when you have enough rich information), wrap up gracefully
- When wrapping up, thank them and say the interview is complete with the exact phrase: "INTERVIEW_COMPLETE"

${isFirst ? `Start by greeting ${intervieweeName} warmly and asking your first focused question.` : ''}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    system: systemPrompt,
    messages: history,
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function generateSummary(
  goal: string,
  allMessages: { name: string; email: string; role: string; content: string }[]
): Promise<string> {
  if (allMessages.length === 0) return 'No hay respuestas todavía.';

  // Group by participant
  const byParticipant: Record<string, typeof allMessages> = {};
  for (const m of allMessages) {
    const key = `${m.name} (${m.email})`;
    if (!byParticipant[key]) byParticipant[key] = [];
    byParticipant[key].push(m);
  }

  const transcripts = Object.entries(byParticipant)
    .map(([person, msgs]) => {
      const lines = msgs.map(m => `${m.role === 'user' ? person.split(' ')[0] : 'AI'}: ${m.content}`).join('\n');
      return `=== ${person} ===\n${lines}`;
    })
    .join('\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You analyzed interview transcripts. The goal was: "${goal}"

TRANSCRIPTS:
${transcripts}

Generate a structured summary in markdown with:
1. **Key Themes** — patterns that appeared across multiple people
2. **Notable Insights** — surprising or especially rich individual responses worth highlighting
3. **Recommendations** — concrete actions based on what you learned
4. **Individual Highlights** — one sentence per participant capturing their most important point

Be specific. Use quotes where impactful. Keep it scannable.`
    }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
