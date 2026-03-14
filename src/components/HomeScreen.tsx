import { ChevronRight } from 'lucide-react';
import type { Category } from '../types';

interface HomeScreenProps {
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
  onTestPronunciation?: () => void;
}

export function HomeScreen({ categories, onSelectCategory, onTestPronunciation }: HomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #f5f0ff 0%, #fff5fb 50%, #fffbf0 100%)' }}>
      {/* Hero */}
      <div className="pt-14 pb-8 px-6 text-center">
        <div className="text-6xl mb-4">💜</div>
        <h1
          className="text-4xl font-bold"
          style={{ fontFamily: 'Outfit, system-ui, sans-serif', background: 'linear-gradient(135deg, #7c3aed, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          MotherMind
        </h1>
        <p className="mt-3 text-gray-500 text-base leading-relaxed max-w-xs mx-auto">
          Practice spoken English for everyday life
        </p>
      </div>

      {/* Welcome card */}
      <div className="mx-6 mb-8 bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
        <p className="text-center text-gray-700 text-base">
          👋 Welcome! Choose a topic to practice today.
        </p>
        <p className="text-center text-gray-400 text-sm mt-1">
          Each practice takes about 3 minutes.
        </p>
      </div>

      {/* Category cards */}
      <div className="px-6 flex flex-col gap-4 flex-1">
        {onTestPronunciation && (
          <button
            onClick={onTestPronunciation}
            className="w-full py-3 rounded-2xl font-semibold text-sm text-center"
            style={{ background: '#7c3aed18', color: '#7c3aed', border: '1.5px dashed #7c3aed60' }}
          >
            🎤 Test Pronunciation Screen
          </button>
        )}
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 text-left transition-all duration-150 hover:shadow-md active:scale-[0.98] focus:outline-none"
            style={{ borderLeft: `5px solid ${cat.color}` }}
          >
            <span className="text-5xl leading-none">{cat.emoji}</span>
            <div className="flex-1 min-w-0">
              <h2
                className="text-xl font-bold text-gray-900 leading-tight"
                style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
              >
                {cat.title}
              </h2>
              <p className="text-gray-400 text-sm mt-0.5 leading-snug">{cat.description}</p>
            </div>
            <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="py-10 text-center">
        <p className="text-gray-300 text-sm">Made with care for newcomer families 💕</p>
      </div>
    </div>
  );
}
