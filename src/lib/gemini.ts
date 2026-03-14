import type { Message, Scenario, Struggle, SupportFeedback } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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

// ─── Dynamic agent prompt generation ─────────────────────────────────────────

export interface AgentPrompt {
  systemPrompt: string;
  firstMessage: string;
}

export async function generateAgentPrompt(scenario: Scenario): Promise<AgentPrompt> {
  const prompt = `You are configuring a voice AI for an English practice app for newcomer mothers.

Scenario: "${scenario.title}"
Role: ${scenario.aiRole}
Learner's goal: ${scenario.goal}
Key words to practice: ${scenario.targetVocab.slice(0, 5).join(', ')}
Total exchanges: ${scenario.maxTurns}

Write a system prompt (under 150 words) that:
1. Tells the AI who it is and where it works (keep it simple and specific)
2. Says to ALWAYS wait for the user to finish speaking before responding
3. Says to use short, simple sentences — no jargon
4. Says to ask only ONE question at a time
5. Says to naturally work these words into the conversation: ${scenario.targetVocab.slice(0, 4).join(', ')}
6. Says to ONLY say goodbye and end after the user has spoken at least ${scenario.maxTurns} times
7. Says to be warm, patient, and encouraging if the English is imperfect

Also write a natural opening line (1 sentence) as the ${scenario.aiRole}.

Return ONLY valid JSON, no markdown:
{
  "systemPrompt": "...",
  "firstMessage": "..."
}`;

  const raw = await generate(prompt, undefined, 0.3, 400);
  try {
    const cleaned = raw.replace(/```json\n?|\n?```|```/g, '').trim();
    return JSON.parse(cleaned) as AgentPrompt;
  } catch {
    // Fallback to scenario defaults
    return {
      systemPrompt: `You are a ${scenario.aiRole}. Speak simply and clearly. Be warm and patient. Ask one question at a time. After ${scenario.maxTurns} exchanges, thank the person and say goodbye.`,
      firstMessage: scenario.openingLine,
    };
  }
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

// ─── Pronunciation feedback ───────────────────────────────────────────────────

export interface PronunciationFeedback {
  score: 'great' | 'good' | 'try_again';
  message: string;
  word_tips: string;
}

export async function getPronunciationFeedback(
  target: string,
  spoken: string,
): Promise<PronunciationFeedback> {
  const prompt = `A language learner was asked to say this phrase:
TARGET: "${target}"

The speech recognition heard them say:
HEARD: "${spoken}"

Analyze how close the spoken version is to the target. Consider:
- Words that are correct or nearly correct
- Words that were missed or very different
- Whether the overall meaning came through

Return ONLY a valid JSON object. No markdown. No explanation:
{
  "score": "great" | "good" | "try_again",
  "message": "1 warm sentence of encouragement",
  "word_tips": "1 short specific tip on which word(s) to improve and how. If score is great, say 'Keep it up!'"
}

Use "great" if 90%+ of words match or are very close.
Use "good" if the meaning came through but some words were off.
Use "try_again" if many key words were missing or very different.`;

  const raw = await generate(prompt, undefined, 0.3, 150);

  try {
    const cleaned = raw.replace(/```json\n?|\n?```|```/g, '').trim();
    return JSON.parse(cleaned) as PronunciationFeedback;
  } catch {
    const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const targetWords = normalize(target).split(/\s+/);
    const spokenWords = normalize(spoken).split(/\s+/);
    const matches = targetWords.filter((w, i) => spokenWords[i] === w).length;
    const ratio = targetWords.length > 0 ? matches / targetWords.length : 0;
    return {
      score: ratio >= 0.9 ? 'great' : ratio >= 0.6 ? 'good' : 'try_again',
      message: ratio >= 0.9 ? 'Great job!' : ratio >= 0.6 ? 'Good try!' : "Let's try again.",
      word_tips: 'Keep practicing!',
    };
  }
}
