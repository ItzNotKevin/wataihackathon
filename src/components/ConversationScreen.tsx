import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Home, Loader2, PhoneOff, Play, Target, Turtle } from 'lucide-react';
import type { Mode } from '@11labs/client';
import type { Message, Scenario, Struggle, SupportFeedback } from '../types';
import { checkStepCompleted, detectStruggle, generateSupportFeedback } from '../lib/gemini';
import { startConversationSession } from '../lib/elevenLabsConversation';
import type { ConversationSession } from '../lib/elevenLabsConversation';
import { ROHINGYA_UI } from '../lib/rohingya';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;

interface ConversationScreenProps {
  scenario: Scenario;
  categoryColor: string;
  onComplete: (messages: Message[], feedback: SupportFeedback, struggles: Struggle[]) => void;
  onBack: () => void;
  onGoHome: () => void;
}

type Phase = 'connecting' | 'active' | 'ending' | 'analyzing' | 'error';

export function ConversationScreen({
  scenario,
  categoryColor: _categoryColor,
  onComplete,
  onBack,
  onGoHome,
}: ConversationScreenProps) {
  const primarySurface = 'linear-gradient(135deg, #33424d, #5a6772)';
  const warmSurface = 'linear-gradient(160deg, rgba(255, 252, 247, 0.96) 0%, rgba(243, 236, 227, 0.92) 100%)';
  const softPanel = 'rgba(255, 251, 247, 0.88)';
  const accentColor = '#b47b67';

  const [phase, setPhase] = useState<Phase>('connecting');
  const [mode, setMode] = useState<Mode>('listening');
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [stepsPassed, setStepsPassed] = useState<boolean[]>(
    () => new Array(scenario.userSteps.length).fill(false),
  );
  const { speak, speakSlow, isSpeaking } = useTextToSpeech();

  const sessionRef = useRef<ConversationSession | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const userTurnCountRef = useRef(0);
  const stepsPassedRef = useRef<boolean[]>(new Array(scenario.userSteps.length).fill(false));
  const analysisRanRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    stepsPassedRef.current = stepsPassed;
  }, [stepsPassed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const runAnalysis = useCallback(async () => {
    if (analysisRanRef.current) return;
    analysisRanRef.current = true;
    setPhase('analyzing');

    const transcript = messagesRef.current;
    const userMsgs = transcript.filter((m) => m.role === 'user');
    const aiMsgs = transcript.filter((m) => m.role === 'ai');

    const struggles = await Promise.all(
      userMsgs.map((userMsg, i) => {
        const aiQuestion = aiMsgs[i]?.text ?? scenario.openingLine;
        return detectStruggle(scenario, aiQuestion, userMsg.text, i + 1);
      }),
    );

    const feedback = await generateSupportFeedback(scenario, transcript, struggles);
    onComplete(transcript, feedback, struggles);
  }, [scenario, onComplete]);

  const endConversation = useCallback(async () => {
    if (analysisRanRef.current) return;
    setPhase('ending');
    try {
      await sessionRef.current?.endSession();
    } catch {
      await runAnalysis();
    }
  }, [runAnalysis]);

  useEffect(() => {
    if (!AGENT_ID) {
      setErrorMsg('VITE_ELEVENLABS_AGENT_ID is not set.');
      setPhase('error');
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        // Explicitly request mic permission before ElevenLabs tries to claim it
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const session = await startConversationSession({
          agentId: AGENT_ID!,
          firstMessage: scenario.openingLine,
          onMessage: ({ role, text }) => {
            const msg: Message = { role, text };
            setMessages((prev) => {
              const updated = [...prev, msg];
              messagesRef.current = updated;
              return updated;
            });

            if (role === 'user') {
              userTurnCountRef.current += 1;
              // Find the first step not yet passed and check it
              const stepIndex = stepsPassedRef.current.findIndex((p) => !p);
              const stepInstruction = stepIndex >= 0 ? scenario.userSteps[stepIndex]?.en : undefined;
              if (stepInstruction) {
                const lastAiMsg = messagesRef.current
                  .filter((m) => m.role === 'ai')
                  .slice(-1)[0]?.text;
                void checkStepCompleted(stepInstruction, text, lastAiMsg).then((passed) => {
                  if (passed) {
                    setStepsPassed((prev) => {
                      const next = [...prev];
                      next[stepIndex] = true;
                      stepsPassedRef.current = next;
                      return next;
                    });
                  }
                });
              }
            }
          },
          onModeChange: (nextMode) => setMode(nextMode),
          onStatusChange: (status) => {
            if (status === 'connected') setPhase('active');
          },
          onDisconnect: () => {
            if (cancelled) return;
            if (userTurnCountRef.current > 0) {
              void runAnalysis();
            } else {
              // Delay the error slightly — StrictMode fires a mount/unmount/remount
              // cycle in dev, causing a spurious disconnect on the first mount.
              setTimeout(() => {
                if (!cancelled) {
                  setErrorMsg('Connection ended before the conversation started. Please try again.');
                  setPhase('error');
                }
              }, 1500);
            }
          },
          onError: (err) => {
            setErrorMsg(err);
            setPhase('error');
          },
        });

        if (cancelled) {
          await session.endSession().catch(() => {});
          return;
        }

        sessionRef.current = session;
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(String(err));
          setPhase('error');
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
      sessionRef.current?.endSession().catch(() => {});
    };
  }, [runAnalysis, scenario.openingLine]);

  const stepsDone = stepsPassed.filter(Boolean).length;
  const isActive = phase === 'active';
  const isBusy = phase === 'connecting' || phase === 'ending' || phase === 'analyzing';
  const statusLabel =
    phase === 'active' ? 'live' : phase === 'connecting' ? 'connecting' : phase === 'ending' ? 'ending' : phase;

  return (
    <div className="app-shell">
      <div className="app-backdrop" aria-hidden="true" />
      <div className="app-container">
        <header className="app-header">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <p className="brand-kicker">Voice practice for newcomer moms</p>
              <h1>MotherMind</h1>
            </div>
          </div>

          <button className="btn btn-secondary btn-icon" onClick={onGoHome} title="Return home">
            <Home size={18} />
            <span className="flex flex-col items-start leading-tight">
              <span>Home</span>
              <span className="text-[0.72rem] font-medium opacity-75">{ROHINGYA_UI.home}</span>
            </span>
          </button>
        </header>

        <main className="main-content">
          <section
            className="practice-view animate-fade-in glass-panel"
            aria-label="Conversation practice"
            style={{ background: warmSurface }}
          >
            {/* Progress bar — based on steps passed */}
            <div className="progress-bar" aria-hidden="true">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.max(8, (stepsDone / scenario.maxTurns) * 100)}%`,
                  background: 'linear-gradient(90deg, #b47b67, #d8b79a)',
                }}
              />
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <button onClick={onBack} disabled={isBusy} className="btn btn-secondary">
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-slate-300'}`} />
                <span className="capitalize">{statusLabel}</span>
              </div>
            </div>

            <div className="practice-intro mt-6">
              <span
                className="category-tag"
                style={{ color: accentColor, borderColor: 'rgba(180, 123, 103, 0.24)' }}
              >
                {scenario.title} · {stepsDone} / {scenario.maxTurns} steps done
              </span>
              <p className="practice-support">Speak with the AI helper and answer in your own words.</p>
            </div>

            {/* Step checklist */}
            <div
              className="mx-auto mb-6 w-full max-w-2xl rounded-[1.4rem] px-4 py-4"
              style={{ background: 'rgba(255,251,247,0.88)', border: '1px solid rgba(180, 123, 103, 0.16)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} style={{ color: accentColor }} />
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em]" style={{ color: accentColor }}>
                  Your steps
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {scenario.userSteps.map((step, i) => {
                  const passed = stepsPassed[i];
                  const isNext = !passed && stepsPassed.slice(0, i).every(Boolean);
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: passed
                            ? 'linear-gradient(135deg, #b47b67, #d8b79a)'
                            : isNext
                            ? 'rgba(180,123,103,0.15)'
                            : '#f1f5f9',
                          color: passed ? 'white' : isNext ? accentColor : '#94a3b8',
                        }}
                      >
                        {passed ? '✓' : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm leading-snug font-medium"
                          style={{
                            color: passed ? '#94a3b8' : isNext ? '#1e293b' : '#94a3b8',
                            textDecoration: passed ? 'line-through' : 'none',
                          }}
                        >
                          {step.en}
                        </p>
                        <p
                          className="text-xs leading-snug mt-0.5"
                          style={{ color: passed ? '#cbd5e1' : isNext ? accentColor : '#cbd5e1' }}
                        >
                          {step.roh}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hear prompt buttons */}
            <div className="mx-auto mb-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                className="btn action-btn text-white"
                onClick={() => void speak(scenario.openingLine)}
                disabled={isSpeaking || isBusy}
                style={{ background: primarySurface, boxShadow: '0 18px 32px rgba(35, 49, 63, 0.16)' }}
              >
                <Play size={18} fill="currentColor" />
                <span className="flex flex-col items-start leading-tight">
                  <span>Hear prompt</span>
                  <span className="text-[0.72rem] font-medium opacity-75">{ROHINGYA_UI.hearIt}</span>
                </span>
              </button>

              <button
                className="btn btn-secondary action-btn"
                onClick={() => void speakSlow(scenario.openingLine)}
                disabled={isSpeaking || isBusy}
              >
                <Turtle size={18} />
                <span className="flex flex-col items-start leading-tight">
                  <span>Repeat slowly</span>
                  <span className="text-[0.72rem] font-medium opacity-75">{ROHINGYA_UI.repeatSlowly}</span>
                </span>
              </button>
            </div>

            {/* Chat window */}
            <div
              className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-[1.8rem] border border-white/80 p-4 shadow-sm"
              style={{ background: softPanel }}
            >
              <div className="flex items-center gap-3 border-b border-[rgba(35,49,63,0.08)] pb-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #b47b67, #d8b79a)' }}
                >
                  AI
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{scenario.aiRole}</p>
                  <p className="text-sm text-slate-500">{scenario.openingLine}</p>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto space-y-3 px-1 py-2">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === 'ai'
                          ? 'rounded-tl-sm border border-white/80 bg-white text-slate-800'
                          : 'rounded-tr-sm text-white'
                      }`}
                      style={msg.role === 'user' ? { background: primarySurface } : undefined}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {!messages.length && (
                  <div className="rounded-[1.3rem] border border-dashed border-[rgba(35,49,63,0.12)] bg-white/55 px-4 py-6 text-center text-sm text-slate-500">
                    Your conversation will appear here.
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Status / voice orb panel */}
            <div className="feedback-panel mt-8 max-w-none border-t-0 pt-0">
              {phase === 'error' && (
                <div className="rounded-[1.4rem] border border-red-100 bg-red-50 px-4 py-4 text-sm leading-relaxed text-red-600">
                  {errorMsg}
                </div>
              )}

              {(phase === 'connecting' || phase === 'ending' || phase === 'analyzing') && (
                <div className="flex flex-col items-center gap-3 rounded-[1.4rem] border border-white/80 bg-white/78 px-5 py-6 text-center shadow-sm">
                  <Loader2 size={28} className="animate-spin" style={{ color: accentColor }} />
                  <p className="text-sm font-medium text-slate-600">
                    {phase === 'connecting' && 'Connecting...'}
                    {phase === 'ending' && 'Finishing up...'}
                    {phase === 'analyzing' && 'Preparing your practice...'}
                  </p>
                </div>
              )}

              {isActive && (
                <div className="flex flex-col items-center gap-5 rounded-[1.6rem] border border-white/80 bg-white/78 px-5 py-6 shadow-sm">
                  <VoiceOrb mode={mode} color={accentColor} />
                  <button onClick={() => void endConversation()} className="btn btn-secondary">
                    <PhoneOff size={18} />
                    <span>End conversation</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function VoiceOrb({ mode, color }: { mode: Mode; color: string }) {
  const isSpeaking = mode === 'speaking';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 80 + i * 22,
              height: 80 + i * 22,
              background: `${color}${isSpeaking ? Math.max(8, 18 - i * 5).toString(16).padStart(2, '0') : '08'}`,
              animation: isSpeaking
                ? `ping ${0.8 + i * 0.2}s cubic-bezier(0,0,0.2,1) infinite`
                : `pulse ${2 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}

        <div
          className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        >
          <div className="flex h-8 items-center gap-1">
            {[1, 1.5, 1, 1.8, 1, 1.4, 1].map((h, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full bg-white"
                style={{
                  height: isSpeaking ? `${h * 14}px` : '6px',
                  transition: 'height 0.15s ease',
                  animation: isSpeaking
                    ? `bounce ${0.5 + i * 0.07}s ease-in-out infinite alternate`
                    : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm font-medium text-slate-500">
        {isSpeaking ? 'AI is speaking...' : 'Listening — speak now'}
      </p>
    </div>
  );
}
