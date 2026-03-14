import { useState, useEffect } from 'react';
import { Volume2, ChevronRight, RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';
import { MicButton } from './MicButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { getPronunciationFeedback } from '../lib/gemini';
import type { PronunciationFeedback } from '../lib/gemini';

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
  great:     { bg: '#dcfce7', color: '#16a34a', emoji: '🌟' },
  good:      { bg: '#fef9c3', color: '#854d0e', emoji: '👍' },
  try_again: { bg: '#fee2e2', color: '#dc2626', emoji: '💪' },
};

export function PronunciationScreen({ items, categoryColor, onDone }: PronunciationScreenProps) {
  const [itemIndex, setItemIndex]     = useState(0);
  const [phase, setPhase]             = useState<Phase>('listen');
  const [feedback, setFeedback]       = useState<PronunciationFeedback | null>(null);
  const [spokenText, setSpokenText]   = useState('');
  const [isComplete, setIsComplete]   = useState(false);
  const [passedCount, setPassedCount] = useState(0);

  const { speak, speakSlow, isSpeaking } = useTextToSpeech();
  const { isListening, transcript, transcriptRef, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  const currentItem = items[itemIndex];

  // When mic stops, send to Gemini for feedback
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
          if (result.score !== 'try_again') setPassedCount((n) => n + 1);
          setPhase('result');
        })
        .catch(() => {
          // Fallback if Gemini fails
          setFeedback({ score: 'good', message: 'Good try! Keep practicing.', word_tips: 'Listen again and try once more.' });
          setPhase('result');
        });
    }
  }, [isListening]);

  const handleStartRecord = () => {
    resetTranscript();
    startListening();
    setPhase('record');
  };

  const handleTryAgain = () => {
    setFeedback(null);
    setSpokenText('');
    setPhase('listen');
  };

  const handleNext = () => {
    setFeedback(null);
    setSpokenText('');
    if (itemIndex < items.length - 1) {
      setItemIndex((i) => i + 1);
      setPhase('listen');
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    return <CompletionScreen passed={passedCount} total={items.length} color={categoryColor} onDone={onDone} />;
  }

  const style = feedback ? SCORE_STYLES[feedback.score] : null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #f5f0ff 0%, #fff5fb 50%, #fffbf0 100%)' }}
    >
      {/* Header */}
      <div className="px-6 pt-12 pb-4 text-center">
        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Pronunciation Practice</p>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
          Say it out loud
        </h1>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pb-4">
        {items.map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
            style={{
              background: i <= itemIndex ? categoryColor : '#e5e7eb',
              opacity: i === itemIndex ? 1 : i < itemIndex ? 0.5 : 0.3,
            }}
          />
        ))}
      </div>

      <div className="flex-1 px-5 pb-8 flex flex-col gap-4">

        {/* Phrase card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: categoryColor }}>
            {currentItem.label}
          </span>
          <p className="mt-2 text-2xl font-bold text-gray-900 leading-snug">{currentItem.text}</p>
        </div>

        {/* Listen buttons — hidden while analyzing/result */}
        {(phase === 'listen' || phase === 'record') && (
          <div className="flex gap-2">
            <button
              onClick={() => speak(currentItem.text)}
              disabled={isSpeaking || isListening}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm active:scale-95 disabled:opacity-40"
              style={{ background: `${categoryColor}18`, color: categoryColor }}
            >
              <Volume2 size={16} /> Listen
            </button>
            <button
              onClick={() => speakSlow(currentItem.text)}
              disabled={isSpeaking || isListening}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-500 font-semibold text-sm border border-gray-100 active:scale-95 disabled:opacity-40"
            >
              🐢 Slow
            </button>
          </div>
        )}

        {/* Phase: listen */}
        {phase === 'listen' && (
          <div className="flex flex-col items-center gap-4 mt-4">
            <p className="text-gray-500 text-sm text-center">
              Listen to the phrase, then tap the mic to try it yourself.
            </p>
            <MicButton
              isListening={false}
              isSupported={isSupported}
              disabled={isSpeaking}
              size="lg"
              onStart={handleStartRecord}
              onStop={stopListening}
            />
          </div>
        )}

        {/* Phase: record */}
        {phase === 'record' && (
          <div className="flex flex-col items-center gap-4 mt-2">
            <div className="w-full min-h-[48px] bg-white rounded-xl border border-gray-100 px-4 py-3 text-center">
              {transcript
                ? <p className="text-gray-700 text-base">{transcript}</p>
                : <p className="text-gray-300 text-sm">Listening…</p>
              }
            </div>
            <MicButton
              isListening={isListening}
              isSupported={isSupported}
              size="lg"
              onStart={handleStartRecord}
              onStop={stopListening}
            />
          </div>
        )}

        {/* Phase: analyzing */}
        {phase === 'analyzing' && (
          <div className="flex flex-col items-center gap-3 mt-6">
            <Loader2 size={32} className="animate-spin" style={{ color: categoryColor }} />
            <p className="text-gray-500 text-sm">Analyzing your pronunciation…</p>
            {spokenText && (
              <div className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3 text-center">
                <p className="text-xs text-gray-400 mb-1">You said</p>
                <p className="text-gray-700">"{spokenText}"</p>
              </div>
            )}
          </div>
        )}

        {/* Phase: result */}
        {phase === 'result' && feedback && style && (
          <div className="flex flex-col gap-3 mt-1">

            {/* Score banner */}
            <div className="rounded-2xl px-4 py-4" style={{ background: style.bg }}>
              <p className="font-bold text-lg" style={{ color: style.color }}>
                {style.emoji} {feedback.message}
              </p>
              {feedback.word_tips && (
                <p className="mt-1 text-sm" style={{ color: style.color, opacity: 0.85 }}>
                  {feedback.word_tips}
                </p>
              )}
            </div>

            {/* What you said */}
            {spokenText && (
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">You said</p>
                <p className="text-gray-600 mt-0.5">"{spokenText}"</p>
              </div>
            )}

            {/* Listen again */}
            <button
              onClick={() => speak(currentItem.text)}
              disabled={isSpeaking}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-95"
              style={{ background: `${categoryColor}18`, color: categoryColor }}
            >
              <Volume2 size={16} /> Listen again
            </button>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleTryAgain}
                className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95"
              >
                <RotateCcw size={15} /> Try again
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95"
                style={{ background: categoryColor }}
              >
                {itemIndex < items.length - 1 ? 'Next' : 'Finish'}
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Completion ──────────────────────────────────────────────────────────────

function CompletionScreen({ passed, total, color, onDone }: {
  passed: number; total: number; color: string; onDone: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 gap-6"
      style={{ background: 'linear-gradient(160deg, #f5f0ff 0%, #fff5fb 50%, #fffbf0 100%)' }}
    >
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center text-6xl shadow-md"
        style={{ background: `${color}15`, border: `2px solid ${color}30` }}
      >
        🎉
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
          Lesson complete!
        </h2>
        <p className="mt-2 text-gray-500 text-base">
          You passed <span className="font-bold" style={{ color }}>{passed} of {total}</span> phrases.
        </p>
        {passed === total && (
          <p className="mt-1 text-green-600 font-semibold text-sm">Perfect score! Amazing work. 🌟</p>
        )}
      </div>
      <button
        onClick={onDone}
        className="w-full max-w-xs py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        style={{ background: color }}
      >
        <CheckCircle2 size={18} /> All done
      </button>
    </div>
  );
}
