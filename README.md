# MotherMind 
MotherMind is a voice-first English practice app for newcomer mothers. Users pick a category (School, Healthcare, Everyday Life), see the English phrase with a home-language text translation for comprehension, hear the English phrase spoken aloud, then record themselves repeating it. AI gives simple encouraging spoken feedback.

Built with React, TypeScript, and Vite.

## Setup

**1. Install dependencies**
```bash
npm install
```

**2. Create a `.env.local` file** in the project root with your API keys:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
VITE_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
```

- Gemini API key: [Google AI Studio](https://aistudio.google.com/app/apikey)
- ElevenLabs API key + Agent ID: [ElevenLabs](https://elevenlabs.io)

**3. Run the dev server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.
