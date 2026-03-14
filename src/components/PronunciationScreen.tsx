import { useState, useEffect, type CSSProperties } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  CircleX,
  Home,
  Loader2,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Turtle,
  Volume2,
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { getPronunciationFeedback } from '../lib/gemini';
import type { PronunciationFeedback } from '../lib/gemini';
import { ROHINGYA_UI } from '../lib/rohingya';

export interface PronunciationItem {
  label: string;
  text: string;
}

interface PronunciationScreenProps {
  items: PronunciationItem[];
  categoryColor: string;
  onDone: () => void;
}

type Phase = 'listen' | 'record' | 'analyzing' | 'result';

const SCORE_STYLES = {
  great: { bg: '#dcfce7', color: '#16a34a', emoji: '🌟' },
  good: { bg: '#fef9c3', color: '#854d0e', emoji: '👍' },
  try_again: { bg: '#fee2e2', color: '#dc2626', emoji: '💪' },
} as const;

export function PronunciationScreen({ items, categoryColor, onDone }: PronunciationScreenProps) {
  const warmSurface = 'linear-gradient(160deg, rgba(255, 252, 247, 0.96) 0%, rgba(243, 236, 227, 0.92) 100%)';
  const primarySurface = 'linear-gradient(135deg, #33424d, #5a6772)';
  const [itemIndex, setItemIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('listen');
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [spokenText, setSpokenText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [passedCount, setPassedCount] = useState(0);

  const { speak, speakSlow, isSpeaking } = useTextToSpeech();
  const { isListening, transcript, transcriptRef, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  const currentItem = items[itemIndex];
  const progressPercent = ((itemIndex + 1) / items.length) * 100;

  useEffect(() => {
    if (!isListening && phase === 'record') {
      const spoken = transcriptRef.current.trim();
      if (!spoken) return;

      setSpokenText(spoken);
      setPhase('analyzing');
      resetTranscript();

      getPronunciationFeedback(currentItem.text, spoken)
        .then((result) => {
          setFeedback(result);
          if (result.score !== 'try_again') setPassedCount((count) => count + 1);
          setPhase('result');
        })
        .catch(() => {
          setFeedback({
            score: 'good',
            message: 'Good try! Keep practicing.',
            word_tips: 'Listen again and try once more.',
          });
          setPhase('result');
        });
    }
  }, [currentItem.text, isListening, phase, resetTranscript, transcriptRef]);

  const handleStartRecord = () => {
    resetTranscript();
    startListening();
    setPhase('record');
  };

  const handleStopRecord = () => {
    stopListening();
  };

  const handleTryAgain = () => {
    resetTranscript();
    setFeedback(null);
    setSpokenText('');
    setPhase('listen');
  };

  const handleNext = () => {
    setFeedback(null);
    setSpokenText('');

    if (itemIndex < items.length - 1) {
      setItemIndex((index) => index + 1);
      setPhase('listen');
      return;
    }

    setIsComplete(true);
  };

  if (isComplete) {
    return <CompletionScreen passed={passedCount} total={items.length} color={categoryColor} onDone={onDone} />;
  }

  const scoreStyle = feedback ? SCORE_STYLES[feedback.score] : null;

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

          <button className="btn btn-secondary btn-icon" onClick={onDone} title="Return to topics">
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
            aria-label="Pronunciation practice"
            style={{ background: warmSurface }}
          >
            <div className="progress-bar" aria-hidden="true">
              <div
                className="progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #b47b67, #d8b79a)',
                }}
              />
            </div>

            <div className="practice-intro">
              <span
                className="category-tag"
                style={{
                  color: '#b47b67',
                  borderColor: 'rgba(180, 123, 103, 0.24)',
                }}
              >
                Pronunciation · {currentItem.label} · {ROHINGYA_UI.categoryPrompt} {itemIndex + 1} {ROHINGYA_UI.of}{' '}
                {items.length}
              </span>
              <p className="practice-support">
                Listen first. Speak next. Repeat until it feels easier.
              </p>
            </div>

            <div className="phrase-container">
              <h2 className="english-phrase">{currentItem.text}</h2>
              <p className="home-translation">Say the words clearly and at a calm pace.</p>

              <div className="actions-container">
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    className="btn action-btn text-white"
                    onClick={() => speak(currentItem.text)}
                    disabled={isSpeaking || isListening || phase === 'analyzing'}
                    style={{ background: primarySurface }}
                  >
                    <Play size={18} fill="currentColor" />
                    <span className="flex flex-col items-start leading-tight">
                      <span>Hear it</span>
                      <span className="text-[0.72rem] font-medium opacity-75">{ROHINGYA_UI.hearIt}</span>
                    </span>
                  </button>

                  <button
                    className="btn btn-secondary action-btn"
                    onClick={() => speakSlow(currentItem.text)}
                    disabled={isSpeaking || isListening || phase === 'analyzing'}
                  >
                    <Turtle size={18} />
                    <span className="flex flex-col items-start leading-tight">
                      <span>Repeat slowly</span>
                      <span className="text-[0.72rem] font-medium opacity-75">{ROHINGYA_UI.repeatSlowly}</span>
                    </span>
                  </button>
                </div>

                <div className="record-container">
                  {!isSupported ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="record-btn" style={{ background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)' }}>
                        <MicOff size={30} />
                      </div>
                      <span className="record-label text-center">
                        Voice not available
                        <span className="block text-[0.78rem] font-medium opacity-70">
                          Please try another browser
                        </span>
                      </span>
                    </div>
                  ) : (
                    <>
                      <button
                        className={`record-btn ${isListening ? 'recording-pulse' : ''}`}
                        onClick={isListening ? handleStopRecord : handleStartRecord}
                        disabled={isSpeaking || phase === 'analyzing'}
                        style={
                          isListening
                            ? undefined
                            : ({
                                background: 'linear-gradient(135deg, #b47b67, #d8b79a)',
                              } as CSSProperties)
                        }
                        aria-pressed={isListening}
                        aria-label={isListening ? 'Stop recording' : 'Start recording'}
                      >
                        {isListening ? <MicOff size={30} /> : <Mic size={30} />}
                      </button>

                      <span className="record-label text-center">
                        <span className="block">{isListening ? 'Tap to stop' : 'Tap to speak'}</span>
                        <span className="block text-[0.78rem] opacity-75">
                          {isListening ? ROHINGYA_UI.tapToStop : ROHINGYA_UI.tapToSpeak}
                        </span>
                      </span>
                    </>
                  )}
                </div>

                {phase === 'record' && (
                  <div className="w-full max-w-xl rounded-[1.4rem] border border-white/80 bg-white/82 px-4 py-4 text-center shadow-sm">
                    {transcript ? (
                      <p className="text-base text-slate-700">{transcript}</p>
                    ) : (
                      <p className="text-sm font-medium text-slate-400">Listening...</p>
                    )}
                  </div>
                )}

                <div className="practice-inline-actions">
                  <button className="btn btn-secondary practice-inline-btn" onClick={onDone}>
                    <CircleX size={18} />
                    <span className="flex flex-col items-start leading-tight">
                      <span>Exit</span>
                      <span className="text-[0.72rem] font-medium opacity-75">{ROHINGYA_UI.exit}</span>
                    </span>
                  </button>
                  <button
                    className="btn btn-primary practice-inline-btn"
                    onClick={handleNext}
                    disabled={phase === 'analyzing'}
                  >
                    <span className="flex flex-col items-start leading-tight">
                      <span>{itemIndex < items.length - 1 ? 'Next' : 'Finish'}</span>
                      <span className="text-[0.72rem] font-medium opacity-80">
                        {itemIndex < items.length - 1 ? ROHINGYA_UI.nextPhrase : ROHINGYA_UI.finish}
                      </span>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {phase === 'analyzing' && (
                <div className="feedback-panel animate-fade-in">
                  <div className="feedback-header">
                    <Loader2 size={20} className="animate-spin" style={{ color: '#b47b67' }} />
                    <h4>Checking your pronunciation</h4>
                  </div>
                  <p>We are listening for clarity and confidence.</p>
                  {spokenText && (
                    <div className="mt-4 rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-4 text-left shadow-sm">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        You said
                      </p>
                      <p className="mt-1 text-slate-700">"{spokenText}"</p>
                    </div>
                  )}
                </div>
              )}

              {phase === 'result' && feedback && scoreStyle && (
                <div className="feedback-panel animate-fade-in">
                  <div className="feedback-header">
                    <CheckCircle2 size={20} style={{ color: '#b47b67' }} />
                    <h4 style={{ color: '#b47b67' }}>
                      {scoreStyle.emoji} {feedback.message}
                    </h4>
                  </div>

                  <div className="mt-4 flex items-center justify-center rounded-[1.2rem] px-4 py-5"
                    style={{
                      background: feedback.score !== 'try_again' ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${feedback.score !== 'try_again' ? '#bbf7d0' : '#fecaca'}`,
                    }}
                  >
                    <div
                      className="flex items-center gap-3"
                      style={{ color: feedback.score !== 'try_again' ? '#16a34a' : '#dc2626' }}
                    >
                      <CheckCircle2 size={30} />
                      <span className="text-base font-semibold">
                        {feedback.score !== 'try_again' ? 'Right' : 'Wrong'}
                      </span>
                    </div>
                  </div>

                  {feedback.word_tips && <p>{feedback.word_tips}</p>}

                  {spokenText && (
                    <div className="mt-4 rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-4 text-left shadow-sm">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        You said
                      </p>
                      <p className="mt-1 text-slate-700">"{spokenText}"</p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      className="btn btn-secondary action-btn"
                      onClick={() => speak(currentItem.text)}
                      disabled={isSpeaking}
                    >
                      <Volume2 size={18} />
                      <span>Listen again</span>
                    </button>

                    <button className="btn btn-secondary action-btn" onClick={handleTryAgain}>
                      <RotateCcw size={18} />
                      <span>Try again</span>
                    </button>
                  </div>

                  <button className="btn btn-primary next-btn mt-5" onClick={handleNext}>
                    <span className="flex flex-col items-center leading-tight">
                      <span>{itemIndex < items.length - 1 ? 'Next phrase' : 'Finish'}</span>
                      <span className="text-[0.72rem] font-medium opacity-80">
                        {itemIndex < items.length - 1 ? ROHINGYA_UI.nextPhrase : ROHINGYA_UI.finish}
                      </span>
                    </span>
                    <ChevronRight size={18} />
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

function CompletionScreen({
  passed,
  total,
  color: _color,
  onDone,
}: {
  passed: number;
  total: number;
  color: string;
  onDone: () => void;
}) {
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

          <button className="btn btn-secondary btn-icon" onClick={onDone} title="Return to topics">
            <Home size={18} />
            <span className="flex flex-col items-start leading-tight">
              <span>Home</span>
              <span className="text-[0.72rem] font-medium opacity-75">{ROHINGYA_UI.home}</span>
            </span>
          </button>
        </header>
        <main className="main-content">
          <section className="complete-view animate-fade-in glass-panel">
            <div
              className="trophy-ring"
              style={{
                background: 'rgba(180, 123, 103, 0.12)',
                border: '2px solid rgba(180, 123, 103, 0.2)',
              }}
            >
              <span className="text-5xl" aria-hidden="true">
                🎉
              </span>
            </div>

            <h2 className="complete-title">You finished this lesson.</h2>
            <p className="complete-subtitle">
              You passed <strong style={{ color: '#b47b67' }}>{passed}</strong> of <strong>{total}</strong> practice items.
            </p>

            <div className="complete-actions">
              <button className="btn btn-primary" onClick={onDone}>
                <CheckCircle2 size={18} />
                <span className="flex flex-col items-start leading-tight">
                  <span>All done</span>
                  <span className="text-[0.72rem] font-medium opacity-80">{ROHINGYA_UI.finish}</span>
                </span>
              </button>

              <button className="btn btn-secondary" onClick={onDone}>
                <Home size={18} />
                <span className="flex flex-col items-start leading-tight">
                  <span>Back to topics</span>
                  <span className="text-[0.72rem] font-medium opacity-75">{ROHINGYA_UI.backHome}</span>
                </span>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
