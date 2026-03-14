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
  {
    id: 'work',
    title: 'Work',
    emoji: '💼',
    color: '#5874c9',
    lightColor: '#e7edff',
    description: 'Interviews, schedules, and starting a new job',
  },
  {
    id: 'general',
    title: 'General Conversation',
    emoji: '💬',
    color: '#6b7280',
    lightColor: '#f1f2f4',
    description: 'Warm up with greetings, help, and simple everyday talk',
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
    userSteps: [
      { en: 'Say your child is sick and will not come today', roh: 'Kou — tumar bacha aij aste farbo na, se asom' },
      { en: 'Give your child\'s name and grade', roh: 'Tumar bachar nam o class kou' },
      { en: 'Say when your child will return', roh: 'Kou — tumar bacha kobe aisbo' },
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
    userSteps: [
      { en: 'Say your child needs help with reading', roh: 'Kou — tumar bacha porar help dorkar' },
      { en: 'Say if your child reads at home', roh: 'Kou — se bariate pore kina' },
      { en: 'Ask what help is available', roh: 'Jiggesh koro — ki help pawa zabe' },
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
    userSteps: [
      { en: 'Say you need a doctor appointment for your sick child', roh: 'Kou — tumar bachar jonno daktar dorkar, se asom' },
      { en: 'Give your child\'s name and choose a time', roh: 'Bachar nam kou ar time bachho' },
      { en: 'Confirm the appointment details', roh: 'Appointment er din ar time pakka koro' },
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
    userSteps: [
      { en: 'Describe your child\'s symptoms — fever, stomach pain', roh: 'Kou — bachar ki hoise, jor, pet betha' },
      { en: 'Say if your child has been eating or drinking', roh: 'Kou — se khaisse kina ba pani khaise kina' },
      { en: 'Say if your child has taken any medicine', roh: 'Kou — se kono dawai khaise kina' },
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
    userSteps: [
      { en: 'Ask where to find baby formula', roh: 'Jiggesh koro — baby formula kothai ase' },
      { en: 'Say your baby\'s age — 6 months', roh: 'Kou — tumar bachar bois koto, choi mas' },
      { en: 'Thank them and confirm the item', roh: 'Shukriya kou ar jinis pakka koro' },
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
    userSteps: [
      { en: 'Ask how to get to the library by bus', roh: 'Jiggesh koro — library zaibar jonno kon bus nibo' },
      { en: 'Ask which bus number and where to get off', roh: 'Jiggesh koro — kon number bus ar kothai nambo' },
      { en: 'Ask how long it will take', roh: 'Jiggesh koro — koto time lagbo' },
    ],
  },

  // ── WORK ───────────────────────────────────────────────────────────────────
  {
    id: 'work-first-day',
    categoryId: 'work',
    title: 'Ask about your first day',
    description: 'Talk to a supervisor about when to start and what to bring',
    goal: 'Find out when your first shift starts and what you should bring with you',
    aiRole: 'friendly shift supervisor at a grocery store',
    openingLine:
      "Hi! Welcome. I'm your supervisor, Daniel. I'm glad you're here. What would you like to ask before your first day?",
    maxTurns: 3,
    targetVocab: ['start', 'first day', 'shift', 'bring', 'uniform', 'time', 'work', 'tomorrow'],
    followUpPrompts: [
      'Ask when their first shift is and confirm the date and time',
      'Explain what they should bring or wear on the first day',
      'Offer encouragement and confirm where to meet when they arrive',
    ],
    userSteps: [
      { en: 'Ask what time your first shift starts', roh: 'Jiggesh koro — prothom din koto baje ashbo' },
      { en: 'Ask what to bring on the first day', roh: 'Jiggesh koro — prothom din ki niye ashbo' },
      { en: 'Ask where to meet when you arrive', roh: 'Jiggesh koro — ashar pore kothai zabo' },
    ],
  },
  {
    id: 'work-repeat',
    categoryId: 'work',
    title: 'Ask someone to repeat',
    description: 'Tell a coworker you are still learning English and ask them to speak slowly',
    goal: 'Ask a coworker to repeat instructions slowly because you are still learning English',
    aiRole: 'helpful coworker during a training shift',
    openingLine:
      "Hey! We need to stock these shelves first, then clean the cart area. Do you have any questions before we start?",
    maxTurns: 3,
    targetVocab: ['repeat', 'slowly', 'English', 'learning', 'understand', 'help', 'again'],
    followUpPrompts: [
      'Repeat the instructions in a slightly different way and ask what part was confusing',
      'Speak more slowly and check if they understand the first task',
      'Encourage them to ask again anytime they need help',
    ],
    userSteps: [
      { en: 'Ask them to repeat slowly — you are learning English', roh: 'Kou — amar Ingreji sikh te ase, asta asta abar kou' },
      { en: 'Say which part you did not understand', roh: 'Kou — ki bujhi nai sheta kou' },
      { en: 'Say thank you and that you understand now', roh: 'Kou — shukriya, ekhon bujhi gesi' },
    ],
  },

  // ── GENERAL CONVERSATION ───────────────────────────────────────────────────
  {
    id: 'general-greeting',
    categoryId: 'general',
    title: 'Introduce yourself',
    description: 'Practice a simple greeting and short introduction',
    goal: 'Say hello, share your name, and tell someone you are new here',
    aiRole: 'friendly neighbour meeting you for the first time',
    openingLine:
      "Hi there! I don't think we've met before. My name is Sarah. What's your name?",
    maxTurns: 3,
    targetVocab: ['hello', 'my name is', 'new', 'from', 'nice to meet you', 'learning English'],
    followUpPrompts: [
      'Ask their name and where they are from',
      'Ask if they are new to the neighbourhood and how they are settling in',
      'Respond warmly and say it was nice meeting them',
    ],
    userSteps: [
      { en: 'Say hello and tell them your name', roh: 'Salam kou ar tumar nam kou' },
      { en: 'Say where you are from and that you are new here', roh: 'Kou — tumi kothai theke aseso ar ei jaiga naya' },
      { en: 'Say it is nice to meet them', roh: 'Kou — tomar shathe dekha hoise bhalo lagse' },
    ],
  },
  {
    id: 'general-help',
    categoryId: 'general',
    title: 'Ask for simple help',
    description: 'Practice asking someone for help politely',
    goal: 'Ask someone for help because you do not understand something yet',
    aiRole: 'kind volunteer at a community centre',
    openingLine:
      "Hello! Welcome to the community centre. Is there something I can help you with today?",
    maxTurns: 3,
    targetVocab: ['help', 'please', 'understand', 'again', 'slowly', 'thank you'],
    followUpPrompts: [
      'Ask what they need help with and encourage them to explain in simple words',
      'Repeat the information slowly and ask if it makes more sense now',
      'Offer one more chance for questions and reassure them that asking is okay',
    ],
    userSteps: [
      { en: 'Ask for help politely', roh: 'Bhalo moto help maango' },
      { en: 'Say what you need help with', roh: 'Kou — kisher jonno help dorkar' },
      { en: 'Say thank you', roh: 'Shukriya kou' },
    ],
  },
];

export function getScenariosForCategory(categoryId: string): Scenario[] {
  return SCENARIOS.filter((s) => s.categoryId === categoryId);
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
