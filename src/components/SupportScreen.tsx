import { useState } from 'react';
import { Volume2, RotateCcw, Home, Mic } from 'lucide-react';
import type { Scenario, SupportFeedback } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface SupportScreenProps {
  scenario: Scenario;
  feedback: SupportFeedback;
  categoryColor: string;
  onRetryScenario: () => void;
  onGoHome: () => void;
  onStartLesson?: () => void;
}

export function SupportScreen({
  scenario,
  feedback,
  categoryColor,
  onRetryScenario,
  onGoHome,
  onStartLesson,
}: SupportScreenProps) {
  const { speak, speakSlow } = useTextToSpeech();
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleSpeak = async (text: string, id: string, slow = false) => {
    setSpeakingId(id);
    try {
      if (slow) {
        await speakSlow(text);
      } else {
        await speak(text);
      }
    } finally {
      setSpeakingId(null);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #f5f0ff 0%, #fff5fb 50%, #fffbf0 100%)' }}
    >
      {/* Header */}
      <div className="px-6 pt-14 pb-6 text-center">
        <div className="text-5xl mb-3">🌟</div>
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
        >
          Practice Support
        </h1>

        {/* Encouragement box */}
        <div
          className="mt-4 mx-auto max-w-xs px-4 py-3 rounded-2xl"
          style={{ background: `${categoryColor}15`, border: `1.5px solid ${categoryColor}25` }}
        >
          <p className="text-base font-medium leading-snug" style={{ color: categoryColor }}>
            {feedback.encouragement}
          </p>
        </div>

        {/* Scenario label */}
        <p className="mt-3 text-xs text-gray-400">
          Practice:{' '}
          <span className="font-medium text-gray-500">{scenario.title}</span>
        </p>
      </div>

      <div className="px-5 space-y-4 pb-10">
        {/* Say it better */}
        <SupportCard title="Say it better" emoji="💬">
          <p className="text-gray-700 text-base leading-relaxed">{feedback.say_it_better}</p>
          <AudioRow
            text={feedback.say_it_better}
            id="say"
            speakingId={speakingId}
            color={categoryColor}
            onSpeak={handleSpeak}
          />
        </SupportCard>

        {/* Understand it better */}
        <SupportCard title="Understand it better" emoji="💡">
          <p className="text-gray-700 text-base leading-relaxed">
            {feedback.understand_it_better}
          </p>
        </SupportCard>

        {/* Practice */}
        <SupportCard title="Practice these" emoji="🎯">
          <div className="space-y-3">
            <PracticeItem
              label="Word"
              text={feedback.practice_word}
              id="word"
              speakingId={speakingId}
              color={categoryColor}
              onSpeak={handleSpeak}
            />
            <PracticeItem
              label="Phrase"
              text={feedback.practice_phrase}
              id="phrase"
              speakingId={speakingId}
              color={categoryColor}
              onSpeak={handleSpeak}
            />
            <PracticeItem
              label="Full sentence"
              text={feedback.practice_sentence}
              id="sentence"
              speakingId={speakingId}
              color={categoryColor}
              onSpeak={handleSpeak}
            />
          </div>
        </SupportCard>

        {/* Home language note */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 text-center mb-1 uppercase tracking-wide font-medium">
            🌐 In your language
          </p>
          <p className="text-gray-300 text-sm text-center italic">
            (Home language support coming soon)
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          {onStartLesson && (
            <button
              onClick={onStartLesson}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
            >
              <Mic size={18} />
              Practice Pronunciation
            </button>
          )}
          <button
            onClick={onRetryScenario}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
            style={{ background: categoryColor }}
          >
            <RotateCcw size={18} />
            Try this again
          </button>
          <button
            onClick={onGoHome}
            className="w-full py-4 rounded-2xl bg-white text-gray-600 font-semibold text-base flex items-center justify-center gap-2 border border-gray-200 active:scale-[0.98] transition-transform shadow-sm"
          >
            <Home size={18} />
            Choose another topic
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl leading-none">{emoji}</span>
        <h2
          className="font-bold text-gray-900 text-base"
          style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function AudioRow({
  text,
  id,
  speakingId,
  color,
  onSpeak,
}: {
  text: string;
  id: string;
  speakingId: string | null;
  color: string;
  onSpeak: (text: string, id: string, slow?: boolean) => void;
}) {
  const slowId = `${id}-slow`;
  const busy = speakingId !== null && speakingId !== id && speakingId !== slowId;

  return (
    <div className="mt-3 flex gap-2">
      <button
        onClick={() => onSpeak(text, id)}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
        style={{ background: `${color}15`, color }}
      >
        <Volume2 size={14} />
        Listen
      </button>
      <button
        onClick={() => onSpeak(text, slowId, true)}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-40"
      >
        🐢 Slow
      </button>
    </div>
  );
}

function PracticeItem({
  label,
  text,
  id,
  speakingId,
  color,
  onSpeak,
}: {
  label: string;
  text: string;
  id: string;
  speakingId: string | null;
  color: string;
  onSpeak: (text: string, id: string, slow?: boolean) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block">
          {label}
        </span>
        <p className="text-gray-800 font-semibold mt-0.5 leading-snug">{text}</p>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={() => onSpeak(text, id)}
          disabled={speakingId !== null && speakingId !== id}
          className="p-2 rounded-lg disabled:opacity-30 transition-colors active:scale-95"
          style={{ color }}
          aria-label="Listen"
        >
          <Volume2 size={18} />
        </button>
        <button
          onClick={() => onSpeak(text, `${id}-slow`, true)}
          disabled={speakingId !== null && speakingId !== `${id}-slow`}
          className="text-[10px] text-gray-400 font-medium px-1 disabled:opacity-30"
          aria-label="Listen slowly"
        >
          🐢
        </button>
      </div>
    </div>
  );
}
