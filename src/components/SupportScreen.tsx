import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Home,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Turtle,
  Volume2,
} from 'lucide-react';
import type { PronunciationFeedback } from '../lib/gemini';
import { getPronunciationFeedback } from '../lib/gemini';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import type { Scenario, Struggle, SupportFeedback } from '../types';
import { ROHINGYA_UI } from '../lib/rohingya';

interface SupportScreenProps {
  scenario: Scenario;
  feedback: SupportFeedback;
  struggles: Struggle[];
  categoryColor: string;
  onRetryScenario: () => void;
  onGoHome: () => void;
  onStartLesson?: () => void;
}

type PracticePhase = 'ready' | 'record' | 'analyzing' | 'result' | 'complete';

interface PracticeStep {
  id: string;
  label: string;
  text: string;
}

const SCORE_STYLES = {
  great: { color: '#16a34a', emoji: '🌟' },
  good: { color: '#854d0e', emoji: '👍' },
  try_again: { color: '#dc2626', emoji: '💪' },
} as const;

function normalizeText(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function getSimplePracticeSentence(feedback: SupportFeedback): string {
  const cleanedSentence = feedback.practice_sentence
    .replace(/[—–-]/g, ', ')
    .replace(/[:;]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  const firstClause = cleanedSentence
    .split(/[,.!?]/)
    .map((part) => part.trim())
    .find(Boolean);

  if (firstClause) {
    return `${firstClause.charAt(0).toUpperCase()}${firstClause.slice(1)}.`;
  }

  return feedback.practice_sentence;
}

function getBuildUpPhrase(feedback: SupportFeedback): string {
  const sentence = getSimplePracticeSentence(feedback).replace(/[.!?]+$/, '');
  const words = sentence.split(/\s+/).filter(Boolean);

  if (words.length >= 3) {
    return words.slice(0, Math.min(4, words.length - 1)).join(' ');
  }

  return feedback.practice_phrase;
}

function levenshteinDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}

function isCloseWordMatch(targetWord: string, spokenWord: string): boolean {
  if (targetWord === spokenWord) return true;
  if (targetWord.includes(spokenWord) || spokenWord.includes(targetWord)) return true;

  const distance = levenshteinDistance(targetWord, spokenWord);
  const longest = Math.max(targetWord.length, spokenWord.length);

  return longest > 0 && distance / longest <= 0.34;
}

function getTranscriptPass(target: string, spoken: string): boolean {
  const targetWords = normalizeText(target);
  const spokenWords = normalizeText(spoken);

  if (targetWords.length === 0 || spokenWords.length === 0) return false;

  const matchedWords = targetWords.filter((targetWord) =>
    spokenWords.some((spokenWord) => isCloseWordMatch(targetWord, spokenWord)),
  ).length;
  const ratio = matchedWords / targetWords.length;

  if (targetWords.length === 1) return ratio >= 1;
  if (targetWords.length === 2) return ratio >= 0.5;

  return ratio >= 0.6;
}

export function SupportScreen({
  scenario,
  feedback,
  struggles,
  categoryColor: _categoryColor,
  onRetryScenario,
  onGoHome,
  onStartLesson: _onStartLesson,
}: SupportScreenProps) {
  const warmSurface = 'linear-gradient(160deg, rgba(255, 252, 247, 0.96) 0%, rgba(243, 236, 227, 0.92) 100%)';
  const primarySurface = 'linear-gradient(135deg, #33424d, #5a6772)';
  const { speak, speakSlow, isSpeaking } = useTextToSpeech();
  const {
    isListening,
    transcript,
    transcriptRef,
    isSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const struggleTerms = useMemo(
    () =>
      [...new Set(
        struggles
          .flatMap((struggle) => struggle.missingWords)
          .map((term) => term.trim())
          .filter(Boolean),
      )],
    [struggles],
  );

  const practiceSteps = useMemo<PracticeStep[]>(() => {
    const focusSteps = struggleTerms.slice(0, 2).map((term, index) => ({
      id: `focus-${index}`,
      label: term.includes(' ') ? 'Focus phrase' : 'Focus word',
      text: term,
    }));

    const fallbackSteps: PracticeStep[] = [
      { id: 'word', label: 'Word', text: feedback.practice_word },
      { id: 'phrase', label: 'Phrase', text: getBuildUpPhrase(feedback) },
      { id: 'sentence', label: 'Short sentence', text: getSimplePracticeSentence(feedback) },
    ];

    return [...focusSteps, ...fallbackSteps]
      .filter((step, index, steps) => steps.findIndex((candidate) => candidate.text === step.text) === index)
      .slice(0, 3);
  }, [feedback.practice_phrase, feedback.practice_sentence, feedback.practice_word, struggleTerms]);

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<PracticePhase>('ready');
  const [spokenText, setSpokenText] = useState('');
  const [feedbackResult, setFeedbackResult] = useState<PronunciationFeedback | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [didPassStep, setDidPassStep] = useState(false);

  const currentStep = practiceSteps[stepIndex];
  const stepProgress = practiceSteps.length > 0 ? ((stepIndex + 1) / practiceSteps.length) * 100 : 0;
  const scoreStyle = feedbackResult ? SCORE_STYLES[feedbackResult.score] : null;
  const passedCurrentStep = feedbackResult !== null && didPassStep;

  useEffect(() => {
    if (phase !== 'record' || isListening) return;

    const spoken = transcriptRef.current.trim();
    if (!spoken || !currentStep) {
      setPhase('ready');
      return;
    }

    setSpokenText(spoken);
    setPhase('analyzing');
    resetTranscript();

    getPronunciationFeedback(currentStep.text, spoken)
      .then((result) => {
        const localPass = getTranscriptPass(currentStep.text, spoken);
        const passed = result.score !== 'try_again' || localPass;
        setFeedbackResult(result);
        setDidPassStep(passed);
        if (passed) {
          setCompletedCount((count) => Math.max(count, stepIndex + 1));
        }
        setPhase('result');
      })
      .catch(() => {
        const localPass = getTranscriptPass(currentStep.text, spoken);
        setFeedbackResult({
          score: localPass ? 'good' : 'try_again',
          message: localPass ? 'Good try!' : 'Try again.',
          word_tips: localPass ? 'Good enough to move on.' : 'Listen again and try once more.',
        });
        setDidPassStep(localPass);
        if (localPass) {
          setCompletedCount((count) => Math.max(count, stepIndex + 1));
        }
        setPhase('result');
      });
  }, [currentStep, isListening, phase, resetTranscript, stepIndex, transcriptRef]);

  const handleListen = async (slow = false) => {
    if (!currentStep) return;
    await (slow ? speakSlow(currentStep.text) : speak(currentStep.text));
  };

  const handleStartRecording = () => {
    setFeedbackResult(null);
    setSpokenText('');
    setDidPassStep(false);
    resetTranscript();
    setPhase('record');
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
  };

  const handleTryAgain = () => {
    setFeedbackResult(null);
    setSpokenText('');
    setDidPassStep(false);
    resetTranscript();
    setPhase('ready');
  };

  const handleNext = () => {
    setFeedbackResult(null);
    setSpokenText('');
    setDidPassStep(false);
    resetTranscript();

    if (stepIndex < practiceSteps.length - 1) {
      setStepIndex((index) => index + 1);
      setPhase('ready');
      return;
    }

    onGoHome();
  };

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
          <section className="complete-view animate-fade-in glass-panel" style={{ background: warmSurface }}>
            <div className="mt-2 text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: '#b47b67' }}>
                Practice
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Say it</h2>
              <p className="mt-2 text-sm text-slate-500">{scenario.title}</p>
            </div>

            <div className="mt-6 grid gap-4 text-left">
              <SupportCard title="Practice" emoji="🎯">
                {practiceSteps.length === 0 ? (
                  <p>No practice words available yet.</p>
                ) : (
                  <div className="space-y-4">
                    <div
                      className="h-2 overflow-hidden rounded-full bg-[rgba(180,123,103,0.12)]"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${stepProgress}%`,
                          background: 'linear-gradient(90deg, #b47b67, #d8b79a)',
                        }}
                      />
                    </div>

                    <div className="rounded-[1.2rem] border border-white/80 bg-white/82 p-4">
                      <p className="text-sm font-medium text-slate-500">
                        {Math.min(stepIndex + 1, practiceSteps.length)} / {practiceSteps.length}
                      </p>
                      <p className="mt-2 text-xl font-semibold leading-snug text-slate-900">{currentStep?.text}</p>
                      {struggleTerms.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {struggleTerms.slice(0, 3).map((term) => (
                            <span
                              key={term}
                              className="rounded-full px-3 py-1.5 text-xs font-semibold"
                              style={{ background: 'rgba(180, 123, 103, 0.12)', color: '#b47b67' }}
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {speechError && (
                      <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {speechError}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        className="btn btn-secondary"
                        onClick={() => void handleListen(false)}
                        disabled={!currentStep || isSpeaking || isListening || phase === 'analyzing' || phase === 'complete'}
                      >
                        <Volume2 size={18} />
                        <span>Listen</span>
                      </button>

                      <button
                        className="btn btn-secondary"
                        onClick={() => void handleListen(true)}
                        disabled={!currentStep || isSpeaking || isListening || phase === 'analyzing' || phase === 'complete'}
                      >
                        <Turtle size={18} />
                        <span>Slow</span>
                      </button>

                      <button
                        className="btn text-white"
                        onClick={isListening ? handleStopRecording : handleStartRecording}
                        disabled={!isSupported || isSpeaking || phase === 'analyzing' || phase === 'complete'}
                        style={
                          isListening
                            ? ({ background: 'linear-gradient(135deg, #d46b4d, #b9472d)' } as CSSProperties)
                            : ({ background: primarySurface } as CSSProperties)
                        }
                      >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        <span>{isListening ? 'Listening...' : 'Speak'}</span>
                      </button>

                      {phase !== 'complete' && (
                        <button
                          className="btn text-white"
                          onClick={handleNext}
                          disabled={!currentStep}
                          style={{ background: primarySurface }}
                        >
                          <span>{stepIndex < practiceSteps.length - 1 ? 'Next' : 'Finish'}</span>
                          <ChevronRight size={18} />
                        </button>
                      )}
                    </div>

                    <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-4">
                      <p className="mt-1 text-sm text-slate-700">
                        {!isSupported
                          ? 'Mic not available.'
                          : isListening
                          ? 'Listening...'
                          : phase === 'analyzing'
                          ? 'Checking...'
                          : 'Tap Speak.'}
                      </p>
                      {(transcript || spokenText) && (
                        <>
                          <p className="mt-1 text-sm text-slate-700">{transcript || spokenText}</p>
                        </>
                      )}
                    </div>

                    {phase === 'analyzing' && (
                      <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Loader2 size={18} className="animate-spin" style={{ color: '#b47b67' }} />
                          <p className="text-sm font-semibold text-slate-800">Checking</p>
                        </div>
                      </div>
                    )}

                    {phase === 'result' && feedbackResult && scoreStyle && (
                      <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={18} style={{ color: scoreStyle.color }} />
                          <p className="text-sm font-semibold" style={{ color: scoreStyle.color }}>
                            {passedCurrentStep ? 'Right' : 'Wrong'}
                          </p>
                        </div>
                        {passedCurrentStep && (
                          <div className="mt-4 flex items-center justify-center rounded-[1.2rem] bg-green-50 px-4 py-5">
                            <div className="flex items-center gap-3 text-green-600">
                              <CheckCircle2 size={30} />
                              <span className="text-base font-semibold">Correct</span>
                            </div>
                          </div>
                        )}
                        <p className="mt-2 text-sm font-medium text-slate-700">
                          {passedCurrentStep ? 'You can go to the next one.' : 'Listen. Then try again.'}
                        </p>
                        {!passedCurrentStep && (
                          <p className="mt-2 text-sm text-slate-700">{feedbackResult.word_tips}</p>
                        )}
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          {!passedCurrentStep && (
                            <button className="btn btn-secondary" onClick={handleTryAgain}>
                              <RotateCcw size={18} />
                              <span>Try again</span>
                            </button>
                          )}
                          <button
                            className="btn text-white"
                            onClick={handleNext}
                            style={{ background: primarySurface }}
                          >
                            <span>{stepIndex < practiceSteps.length - 1 ? 'Next' : 'Finish'}</span>
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    {phase === 'complete' && (
                      <div className="rounded-[1.2rem] border border-white/80 bg-white/82 px-4 py-4">
                        <p className="text-sm font-semibold text-slate-800">Done</p>
                        <p className="mt-2 text-sm text-slate-600">{completedCount} / {practiceSteps.length}</p>
                      </div>
                    )}
                  </div>
                )}
              </SupportCard>
            </div>

            <div className="complete-actions mt-8">
              <button className="btn text-white" onClick={onRetryScenario} style={{ background: primarySurface }}>
                <RotateCcw size={18} />
                <span className="flex flex-col items-start leading-tight">
                  <span>Try this again</span>
                  <span className="text-[0.72rem] font-medium opacity-80">{ROHINGYA_UI.practiceAgain}</span>
                </span>
              </button>

              <button className="btn btn-secondary" onClick={onGoHome}>
                <Home size={18} />
                <span className="flex flex-col items-start leading-tight">
                  <span>Choose another topic</span>
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

function SupportCard({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <div className="support-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl leading-none">{emoji}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
