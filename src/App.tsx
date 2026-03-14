import { useState } from 'react';
import { Play, Mic, MicOff, CheckCircle2, ChevronRight, Stethoscope, GraduationCap, Coffee, Home } from 'lucide-react';
import './index.css';

// Mock Data
const CATEGORIES = [
  { id: 'healthcare', label: 'Healthcare', icon: Stethoscope, color: '#ec4899' },
  { id: 'school', label: 'School', icon: GraduationCap, color: '#8b5cf6' },
  { id: 'everyday', label: 'Everyday Life', icon: Coffee, color: '#f59e0b' },
];

const PHRASES = {
  healthcare: [
    {
      en: "My child has a fever today.",
      translation: "Mój syn ma dzisiaj gorączkę.", // Using Polish as an example home language snippet
      audioSrc: "#"
    },
    {
      en: "I need to schedule an appointment.",
      translation: "Muszę umówić wizytę.",
      audioSrc: "#"
    }
  ],
  school: [
    {
      en: "What time is the parent meeting?",
      translation: "O której godzinie jest spotkanie z rodzicami?",
      audioSrc: "#"
    }
  ],
  everyday: [
    {
      en: "How much does this cost?",
      translation: "Ile to kosztuje?",
      audioSrc: "#"
    }
  ]
};

function App() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const handleCategorySelect = (id: string) => {
    setActiveCategory(id);
    setCurrentPhraseIndex(0);
    setFeedback(null);
  };

  const currentCategoryPhrases = activeCategory ? PHRASES[activeCategory as keyof typeof PHRASES] : [];
  const currentPhrase = currentCategoryPhrases[currentPhraseIndex];

  const handlePlayAudio = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000); // mock playback duration
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Mock AI Feedback processing
      setTimeout(() => {
        setFeedback("Good try, focus on pronouncing 'child'.");
      }, 1000);
    } else {
      setIsRecording(true);
      setFeedback(null);
    }
  };

  const handleNextPhrase = () => {
    if (currentPhraseIndex < currentCategoryPhrases.length - 1) {
      setCurrentPhraseIndex(prev => prev + 1);
      setFeedback(null);
    } else {
      // Completed category
      setActiveCategory(null);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-pulse"></div>
          <h1>MotherMind</h1>
        </div>
        {activeCategory && (
          <button className="btn btn-secondary btn-icon" onClick={() => setActiveCategory(null)} title="Home">
            <Home size={20} />
          </button>
        )}
      </header>

      <main className="main-content">
        {!activeCategory ? (
          <div className="category-selection animate-fade-in">
            <h2>What would you like to practice today?</h2>
            <p className="subtitle">Select a topic to start your English practice</p>

            <div className="category-grid">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className="category-card glass-panel"
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{ '--card-color': cat.color } as React.CSSProperties}
                >
                  <div className="icon-wrapper" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                    <cat.icon size={32} />
                  </div>
                  <h3>{cat.label}</h3>
                  <div className="card-arrow">
                    <ChevronRight size={24} color="var(--text-muted)" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="practice-view animate-fade-in glass-panel">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentPhraseIndex + 1) / currentCategoryPhrases.length) * 100}%` }}
              ></div>
            </div>

            <div className="phrase-container">
              <span className="category-tag">
                {CATEGORIES.find(c => c.id === activeCategory)?.label}
              </span>

              <h2 className="english-phrase">{currentPhrase?.en}</h2>
              <p className="home-translation">{currentPhrase?.translation}</p>

              <div className="actions-container">
                <button
                  className={`btn btn-secondary action-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={handlePlayAudio}
                  disabled={isRecording}
                >
                  <Play size={24} fill={isPlaying ? "currentColor" : "none"} />
                  {isPlaying ? 'Playing...' : 'Hear Native'}
                </button>

                <div className="record-container">
                  <button
                    className={`btn btn-icon record-btn ${isRecording ? 'recording-pulse' : ''}`}
                    onClick={toggleRecording}
                  >
                    {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                  </button>
                  <span className="record-label">
                    {isRecording ? 'Tap to Stop' : 'Tap to Practice'}
                  </span>
                </div>
              </div>
            </div>

            {feedback && (
              <div className="feedback-panel animate-fade-in">
                <div className="feedback-header">
                  <CheckCircle2 color="var(--primary)" size={24} />
                  <h4>AI Feedback</h4>
                </div>
                <p>{feedback}</p>
                <button className="btn btn-primary next-btn" onClick={handleNextPhrase}>
                  {currentPhraseIndex < currentCategoryPhrases.length - 1 ? 'Next Phrase' : 'Finish Category'}
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
