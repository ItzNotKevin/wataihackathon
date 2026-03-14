import type { Category, Scenario } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'school',
    title: 'School',
    emoji: '🎒',
    color: '#7c3aed',
    lightColor: '#ede9fe',
    description: 'Talk to teachers and school office',
  },
  {
    id: 'healthcare',
    title: 'Healthcare',
    emoji: '🏥',
    color: '#db2777',
    lightColor: '#fce7f3',
    description: 'Appointments and describing symptoms',
  },
  {
    id: 'everyday',
    title: 'Everyday Life',
    emoji: '🛒',
    color: '#d97706',
    lightColor: '#fef3c7',
    description: 'Shopping, directions, and daily tasks',
  },
];

export const SCENARIOS: Scenario[] = [
  // ── SCHOOL ──────────────────────────────────────────────────────────────────
  {
    id: 'school-absent',
    categoryId: 'school',
    title: 'My child is sick today',
    description: 'Call the school to report your child absent',
    goal: 'Tell the school your child is sick and will not come in today',
    aiRole: 'school attendance office clerk',
    openingLine:
      "Good morning, Riverside Elementary, attendance office. How can I help you?",
    maxTurns: 3,
    targetVocab: ['sick', 'absent', 'fever', 'staying home', 'child', 'name', 'grade', 'teacher'],
    followUpPrompts: [
      "Ask for the student's full name and grade or teacher's name",
      "Ask what is wrong with the child and if they know when the child will return",
      "Confirm you have recorded the absence and wish them well",
    ],
  },
  {
    id: 'school-teacher',
    categoryId: 'school',
    title: 'Ask the teacher for help',
    description: "Tell the teacher your child is struggling with reading",
    goal: "Ask the teacher if your child can get extra help with reading",
    aiRole: "warm, patient Grade 2 teacher named Ms. Sarah",
    openingLine:
      "Hi! Come in, come in. I'm so glad you stopped by. I'm Ms. Sarah. What's on your mind?",
    maxTurns: 3,
    targetVocab: ['reading', 'struggling', 'help', 'homework', 'understand', 'practice', 'extra'],
    followUpPrompts: [
      "Ask the parent which subject or skill the child is finding difficult",
      "Explain what kind of help is available and ask if the child does reading at home",
      "Offer a concrete next step and thank the parent for coming in",
    ],
  },

  // ── HEALTHCARE ───────────────────────────────────────────────────────────────
  {
    id: 'healthcare-appointment',
    categoryId: 'healthcare',
    title: 'Book a doctor appointment',
    description: 'Call the clinic to make an appointment for your sick child',
    goal: 'Book a doctor appointment for your child who has had a fever for two days',
    aiRole: "friendly receptionist at Westside Family Clinic",
    openingLine:
      "Good morning, Westside Family Clinic, this is Maya speaking. How can I help you today?",
    maxTurns: 3,
    targetVocab: ['appointment', 'doctor', 'fever', 'sick', 'child', 'name', 'morning', 'tomorrow', 'available'],
    followUpPrompts: [
      "Ask for the patient's name, age, and reason for the visit",
      "Offer two available time slots and ask which works better",
      "Confirm the appointment details — date, time, and what to bring",
    ],
  },
  {
    id: 'healthcare-symptoms',
    categoryId: 'healthcare',
    title: 'Describe your child\'s symptoms',
    description: 'Tell the nurse what symptoms your child has',
    goal: 'Tell the nurse your child has a fever, stomach pain, and has not eaten today',
    aiRole: "caring nurse named Nurse Kim at a walk-in clinic",
    openingLine:
      "Hi there, I'm Nurse Kim. I'll ask you a few questions before the doctor comes in. What's going on with your little one today?",
    maxTurns: 3,
    targetVocab: ['fever', 'temperature', 'stomach', 'pain', 'eating', 'vomiting', 'tired', 'since yesterday', 'medicine'],
    followUpPrompts: [
      "Ask how long the child has had these symptoms and if they have a temperature",
      "Ask if the child has been eating or drinking, and if they have vomited",
      "Ask if the child has taken any medicine and note down the information",
    ],
  },

  // ── EVERYDAY LIFE ────────────────────────────────────────────────────────────
  {
    id: 'everyday-store',
    categoryId: 'everyday',
    title: 'Find baby formula in a store',
    description: 'Ask a store worker to help you find the right baby formula',
    goal: 'Ask a store worker where to find baby formula and which one is good for a 6-month-old',
    aiRole: "helpful employee at a grocery store",
    openingLine:
      "Hi there! Welcome to FreshMart. Can I help you find something today?",
    maxTurns: 3,
    targetVocab: ['baby formula', 'aisle', 'brand', 'age', 'months', 'where is', 'recommend', 'this one'],
    followUpPrompts: [
      "Ask what they are looking for specifically and offer to show them the aisle",
      "Ask how old the baby is and recommend a suitable formula option",
      "Confirm the item and ask if there is anything else they need",
    ],
  },
  {
    id: 'everyday-directions',
    categoryId: 'everyday',
    title: 'Ask for directions to the library',
    description: 'Ask someone how to get to the public library by bus',
    goal: 'Find out which bus to take to get to the public library and where to get off',
    aiRole: "friendly neighbour who knows the area well",
    openingLine:
      "Oh hi! Are you looking for somewhere? I know this neighbourhood pretty well — happy to help!",
    maxTurns: 3,
    targetVocab: ['library', 'bus', 'bus stop', 'which bus', 'get off', 'how long', 'minutes', 'walk', 'street'],
    followUpPrompts: [
      "Ask where they are trying to go and confirm the destination",
      "Give simple bus directions — which bus number, where to board, and where to get off",
      "Tell them how long it will take and wish them a good trip",
    ],
  },
];

export function getScenariosForCategory(categoryId: string): Scenario[] {
  return SCENARIOS.filter((s) => s.categoryId === categoryId);
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
