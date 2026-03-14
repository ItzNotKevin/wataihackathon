export type CategoryId = 'school' | 'healthcare' | 'everyday' | 'work' | 'general';

export interface Category {
  id: CategoryId;
  title: string;
  emoji: string;
  color: string;
  lightColor: string;
  description: string;
}

export interface Scenario {
  id: string;
  categoryId: CategoryId;
  title: string;
  description: string;
  /** Shown to the user before the conversation starts — what they are trying to accomplish */
  goal: string;
  aiRole: string;
  openingLine: string;
  maxTurns: number;
  /** Key words/phrases the user should use in this scenario */
  targetVocab: string[];
  /** Natural follow-up questions the AI should work through, in order */
  followUpPrompts: string[];
  /** User-facing step instructions shown as a checklist during the conversation */
  userSteps: Array<{ en: string; roh: string }>;
}

export interface Message {
  role: 'ai' | 'user';
  text: string;
}

export interface SupportFeedback {
  say_it_better: string;
  understand_it_better: string;
  practice_word: string;
  practice_phrase: string;
  practice_sentence: string;
  encouragement: string;
}

export type StruggleType = 'incomplete' | 'unclear' | 'missing_info' | 'wrong_vocab' | 'none';

/** Records what the learner struggled with on a single turn */
export interface Struggle {
  turn: number;
  aiAsked: string;
  userSaid: string;
  hasIssue: boolean;
  issueType: StruggleType;
  /** Specific words or phrases they should have used but didn't */
  missingWords: string[];
  /** What a clear, natural response would have sounded like */
  betterResponse: string;
  /** Short coach note — e.g. "forgot to give the child's name" */
  note: string;
}
