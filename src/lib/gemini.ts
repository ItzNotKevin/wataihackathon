import type { Message, Scenario, Struggle, SupportFeedback } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

async function generate(
  prompt: string,
  systemInstruction?: string,
  temperature = 0.7,
  maxTokens = 300,
): Promise<string> {
  const body = {
    ...(systemInstruction && {
      system_instruction: { parts: [{ text: systemInstruction }] },
    }),
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  return data.candidates[0].content.parts[0].text;
}

// ─── Conversation roleplay ────────────────────────────────────────────────────

export async function getConversationResponse(
  scenario: Scenario,
  messages: Message[],
  userMessage: string,
): Promise<string> {
  const turnIndex = messages.filter((m) => m.role === 'user').length; // 0-based
  const followUp = scenario.followUpPrompts[turnIndex] ?? 'Wrap up the conversation warmly.';

  const systemInstruction = `You are playing the role of a ${scenario.aiRole}.
You are having a real conversation with a newcomer mother who is practicing English.

YOUR GOAL FOR THIS TURN: ${followUp}

STRICT RULES:
- Respond in 1-2 SHORT sentences only. Never more.
- Use simple, everyday English. Avoid jargon.
- Be warm, patient, and natural — like a real person.
- Do NOT break character or offer language help.
- React naturally even if the mother's English is imperfect.
- Do not ask more than ONE question per response.`;

  const history = messages
    .map((m) => `${m.role === 'ai' ? 'You' : 'Mother'}: ${m.text}`)
    .join('\n');

  const prompt = `${history ? `Conversation so far:\n${history}\n\n` : ''}Mother just said: "${userMessage}"

Reply as the ${scenario.aiRole}. 1-2 sentences only.`;

  return generate(prompt, systemInstruction, 0.7, 150);
}

// ─── Per-turn struggle detection (runs in parallel with AI response) ──────────

export async function detectStruggle(
  scenario: Scenario,
  aiAsked: string,
  userSaid: string,
  turn: number,
): Promise<Struggle> {
  const systemInstruction = `You are an English language coach evaluating a learner's response.
Be accurate but generous — partial answers are fine if the key message got through.
Return ONLY valid JSON. No markdown. No explanation.`;

  const prompt = `The learner is practicing this situation: "${scenario.title}"
Goal: "${scenario.goal}"
Important vocabulary for this situation: ${scenario.targetVocab.join(', ')}

The other person said: "${aiAsked}"
The learner responded: "${userSaid}"

Evaluate the learner's response. Return ONLY this JSON:
{
  "hasIssue": true or false,
  "issueType": "incomplete" | "unclear" | "missing_info" | "wrong_vocab" | "none",
  "missingWords": ["word or phrase they should have used but didn't — max 3"],
  "betterResponse": "what a clear, natural response would sound like in 1 sentence",
  "note": "one short coach note about what was missing or hard to understand — or empty string if they did well"
}

Rules:
- hasIssue = false if the message was clear enough, even if imperfect grammar
- issueType = "none" when hasIssue is false
- missingWords = [] when hasIssue is false
- betterResponse should always be a natural English sentence they could use`;

  try {
    const raw = await generate(prompt, systemInstruction, 0.2, 200);
    const cleaned = raw.replace(/```json\n?|\n?```|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as Omit<Struggle, 'turn' | 'aiAsked' | 'userSaid'>;
    return { turn, aiAsked, userSaid, ...parsed };
  } catch {
    // Fallback: assume no issue so we never block the app
    return {
      turn,
      aiAsked,
      userSaid,
      hasIssue: false,
      issueType: 'none',
      missingWords: [],
      betterResponse: userSaid,
      note: '',
    };
  }
}

// ─── End-of-conversation support feedback ────────────────────────────────────

export async function generateSupportFeedback(
  scenario: Scenario,
  messages: Message[],
  struggles: Struggle[],
): Promise<SupportFeedback> {
  const userMessages = messages.filter((m) => m.role === 'user');
  const fullConversation = messages
    .map((m) => `${m.role === 'ai' ? 'Staff' : 'Mother'}: ${m.text}`)
    .join('\n');

  const struggleNotes = struggles
    .filter((s) => s.hasIssue)
    .map((s) => `- Turn ${s.turn}: ${s.note} (missing: ${s.missingWords.join(', ') || 'n/a'})`)
    .join('\n');

  const systemInstruction = `You are a warm, supportive English language coach helping a newcomer mother.
Give gentle, practical feedback. Never use grammar jargon. Be encouraging.`;

  const prompt = `Scenario: "${scenario.title}" — talking to a ${scenario.aiRole}
Goal: "${scenario.goal}"

Full conversation:
${fullConversation}

The mother said: ${userMessages.map((m) => `"${m.text}"`).join(' and ')}

${struggleNotes ? `Specific issues detected during the conversation:\n${struggleNotes}\n` : ''}
Return ONLY a valid JSON object. No markdown. No explanation. Just the JSON:
{
  "say_it_better": "Start with 'A clearer way to say it:' then give a natural improved version of what the mother said",
  "understand_it_better": "Start with 'This question means:' then explain in simple words what the staff was asking. Max 2 sentences.",
  "practice_word": "the single most important word from this conversation for the mother to learn",
  "practice_phrase": "a short, high-value phrase (3-6 words) she should memorise for this situation",
  "practice_sentence": "one complete, natural sentence she could say next time in this situation",
  "encouragement": "A warm 1-sentence encouragement. Be gentle. E.g. 'Good try! You got your message across.' or 'Very close — just one small change makes it perfect.'"
}`;

  const raw = await generate(prompt, systemInstruction, 0.5, 400);

  try {
    const cleaned = raw.replace(/```json\n?|\n?```|```/g, '').trim();
    return JSON.parse(cleaned) as SupportFeedback;
  } catch {
    return {
      say_it_better: `A clearer way to say it: "${userMessages[0]?.text ?? 'I need help, please'}"`,
      understand_it_better: 'This question means: How can I help you today?',
      practice_word: scenario.targetVocab[0] ?? 'appointment',
      practice_phrase: 'I need help with',
      practice_sentence: 'I would like to make an appointment, please.',
      encouragement: 'Good try! You got your message across. Keep practicing!',
    };
  }
}
