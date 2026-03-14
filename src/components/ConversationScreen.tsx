import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Volume2, RotateCcw, Target } from 'lucide-react';
import type { Message, Scenario, Struggle, SupportFeedback } from '../types';
import { MicButton } from './MicButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { getConversationResponse, detectStruggle, generateSupportFeedback } from '../lib/gemini';

interface ConversationScreenProps {
  scenario: Scenario;
  categoryColor: string;
  onComplete: (messages: Message[], feedback: SupportFeedback, struggles: Struggle[]) => void;
  onBack: () => void;
}

export function ConversationScreen({
  scenario,
  categoryColor,
  onComplete,
  onBack,
}: ConversationScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [struggles, setStruggles] = useState<Struggle[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [draftText, setDraftText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();
  const { speak, isSpeaking } = useTextToSpeech();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAIThinking]);

  useEffect(() => {
    if (transcript) setDraftText(transcript);
  }, [transcript]);

  // Speak opening line once on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    const opening: Message = { role: 'ai', text: scenario.openingLine };
    setMessages([opening]);
    void speak(scenario.openingLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    const text = draftText.trim();
    if (!text || isAIThinking) return;

    stopListening();
    resetTranscript();
    setDraftText('');
    setError(null);

    const withUser: Message[] = [...messages, { role: 'user', text }];
    setMessages(withUser);
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);

    // The AI message that prompted this user response
    const lastAiMessage =
      [...messages].reverse().find((m) => m.role === 'ai')?.text ?? scenario.openingLine;

    setIsAIThinking(true);
    try {
      // Run AI response + struggle detection in parallel — no added latency
      const [aiText, struggle] = await Promise.all([
        getConversationResponse(scenario, withUser, text),
        detectStruggle(scenario, lastAiMessage, text, newTurn),
      ]);

      const newStruggles = [...struggles, struggle];
      setStruggles(newStruggles);

      const withAI: Message[] = [...withUser, { role: 'ai', text: aiText }];
      setMessages(withAI);
      await speak(aiText);

      if (newTurn >= scenario.maxTurns) {
        setIsDone(true);
        setIsAnalyzing(true);
        const feedback = await generateSupportFeedback(scenario, withAI, newStruggles);
        onComplete(withAI, feedback, newStruggles);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please check your API key and try again.');
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleReplayLast = () => {
    const lastAI = [...messages].reverse().find((m) => m.role === 'ai');
    if (lastAI) void speak(lastAI.text);
  };

  const canSend = draftText.trim().length > 0 && !isAIThinking && !isSpeaking && !isDone;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-400 mb-3 -ml-1 px-1 py-1 rounded active:bg-gray-100"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Exit</span>
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: categoryColor }}
          >
            AI
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-semibold text-gray-900 text-sm leading-tight truncate"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              {scenario.title}
            </p>
            <p className="text-xs text-gray-400 leading-tight">
              Speaking with {scenario.aiRole}
            </p>
          </div>
          <button
            onClick={handleReplayLast}
            disabled={isSpeaking || messages.length === 0}
            className="p-2 text-gray-300 hover:text-gray-500 disabled:opacity-30 rounded-lg active:bg-gray-100"
            aria-label="Replay last message"
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>

      {/* Goal banner */}
      <div
        className="mx-4 mt-3 px-4 py-2.5 rounded-xl flex items-start gap-2"
        style={{ background: `${categoryColor}12`, border: `1px solid ${categoryColor}25` }}
      >
        <Target size={15} className="mt-0.5 flex-shrink-0" style={{ color: categoryColor }} />
        <p className="text-xs leading-relaxed font-medium" style={{ color: categoryColor }}>
          {scenario.goal}
        </p>
      </div>

      {/* Turn progress */}
      <div className="px-4 pt-2.5">
        <div className="flex gap-1.5">
          {Array.from({ length: scenario.maxTurns }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{ background: i < turnCount ? categoryColor : '#e5e7eb' }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 text-right mt-1">
          {turnCount} / {scenario.maxTurns} turns
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'ai'
                  ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                  : 'text-white rounded-tr-sm shadow-sm'
              }`}
              style={msg.role === 'user' ? { background: categoryColor } : undefined}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* AI typing indicator */}
        {isAIThinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex justify-center py-2">
            <div
              className="px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium"
              style={{
                background: `${categoryColor}15`,
                color: categoryColor,
                border: `1px solid ${categoryColor}30`,
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              Preparing your practice...
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl max-w-xs text-center">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!isDone && (
        <div className="bg-white border-t border-gray-100 px-5 py-5 space-y-4">
          {/* Live transcript preview */}
          {(draftText || isListening) && (
            <div
              className="rounded-xl px-4 py-3 text-sm min-h-[44px] leading-relaxed"
              style={{ background: `${categoryColor}10`, color: categoryColor }}
            >
              {draftText || <span className="opacity-60 italic">Listening...</span>}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1 flex justify-center">
              <MicButton
                isListening={isListening}
                isSupported={isSupported}
                disabled={isAIThinking || isSpeaking}
                onStart={startListening}
                onStop={stopListening}
              />
            </div>

            {draftText && !isListening && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => void handleSubmit()}
                  disabled={!canSend}
                  className="px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-sm disabled:opacity-40 transition-all active:scale-95"
                  style={{ background: categoryColor }}
                >
                  Send →
                </button>
                <button
                  onClick={() => {
                    setDraftText('');
                    resetTranscript();
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium flex items-center gap-1.5 justify-center"
                >
                  <RotateCcw size={13} />
                  Redo
                </button>
              </div>
            )}
          </div>

          {/* Text fallback if speech not supported */}
          {!isSupported && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your response here..."
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-300"
                disabled={isAIThinking}
              />
              <button
                onClick={() => void handleSubmit()}
                disabled={!canSend}
                className="px-4 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-40"
                style={{ background: categoryColor }}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
