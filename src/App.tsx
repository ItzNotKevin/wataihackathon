import { useState } from 'react';
import {
  Play, Mic, MicOff, CheckCircle2,
  Stethoscope, GraduationCap, ShoppingBag, Briefcase,
  Home, Trophy, RotateCcw,
} from 'lucide-react';
import './index.css';

const CATEGORIES = [
  { id: 'healthcare', label: 'Healthcare', icon: Stethoscope, color: '#ec4899' },
  { id: 'school',     label: 'School',     icon: GraduationCap, color: '#8b5cf6' },
  { id: 'everyday',  label: 'Everyday',   icon: ShoppingBag,   color: '#f59e0b' },
  { id: 'work',      label: 'Work',        icon: Briefcase,     color: '#10b981' },
];

const PHRASES = {
  healthcare: [
    { en: "My child has a fever today.",        translation: "طفلي يعاني من حمى اليوم." },
    { en: "I need to schedule an appointment.", translation: "أحتاج إلى تحديد موعد." },
    { en: "Where is the emergency room?",       translation: "أين غرفة الطوارئ؟" },
    { en: "I am allergic to penicillin.",       translation: "أنا حساس للبنسلين." },
    { en: "My baby is not eating well.",        translation: "طفلي لا يأكل جيداً." },
  ],
  school: [
    { en: "What time is the parent meeting?",   translation: "في أي وقت اجتماع أولياء الأمور؟" },
    { en: "My child will be absent tomorrow.",  translation: "سيتغيب طفلي غداً." },
    { en: "Can I speak to the teacher?",        translation: "هل يمكنني التحدث مع المعلم؟" },
    { en: "What homework does my child have?",  translation: "ما الواجب المنزلي لطفلي؟" },
    { en: "My child needs help with reading.",  translation: "يحتاج طفلي مساعدة في القراءة." },
  ],
  everyday: [
    { en: "How much does this cost?",                    translation: "كم يكلف هذا؟" },
    { en: "Where is the nearest bus stop?",              translation: "أين أقرب محطة حافلات؟" },
    { en: "Can you repeat that slowly, please?",         translation: "هل يمكنك تكرار ذلك ببطء؟" },
    { en: "I need help filling out this form.",          translation: "أحتاج مساعدة في ملء هذا النموذج." },
    { en: "What time do you close?",                     translation: "متى تغلقون؟" },
  ],
  work: [
    { en: "I am applying for this job.",          translation: "أنا أتقدم لهذه الوظيفة." },
    { en: "I can work on weekends.",              translation: "يمكنني العمل في عطلة نهاية الأسبوع." },
    { en: "When do I start?",                    translation: "متى أبدأ؟" },
    { en: "I am a fast learner.",                translation: "أنا سريع التعلم." },
    { en: "Thank you for the opportunity.",      translation: "شكراً لك على الفرصة." },
  ],
};

type Screen = 'home' | 'practice' | 'complete';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentCategoryData = CATEGORIES.find(c => c.id === activeCategory);
  const currentCategoryPhrases = activeCategory ? PHRASES[activeCategory as keyof typeof PHRASES] : [];
  const currentPhrase = currentCategoryPhrases[currentPhraseIndex];

  const handleCategorySelect = (id: string) => {
    setActiveCategory(id);
    setCurrentPhraseIndex(0);
    setFeedback(null);
    setScreen('practice');
  };

  const handleGoHome = () => {
    setScreen('home');
    setActiveCategory(null);
    setCurrentPhraseIndex(0);
    setFeedback(null);
    setIsRecording(false);
  };

  const handlePlayAudio = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setTimeout(() => {
        setFeedback("Great effort! Try to say each word clearly and at a steady pace.");
      }, 800);
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
      setScreen('complete');
    }
  };

  const handlePracticeAgain = () => {
    setCurrentPhraseIndex(0);
    setFeedback(null);
    setScreen('practice');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <img src="/cute lil stuff.png" alt="MotherMind logo" className="logo-img" />
          <h1>MotherMind</h1>
        </div>
        {screen !== 'home' && (
          <button className="btn btn-secondary btn-icon" onClick={handleGoHome} title="Home">
            <Home size={20} />
          </button>
        )}
      </header>

      <main className="main-content">

        {/* ── HOME: Category Picker ── */}
        {screen === 'home' && (
          <div className="category-selection animate-fade-in">
            <p className="subtitle">What would you like to practice?</p>
            <div className="category-grid">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className="category-card"
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{ '--card-color': cat.color } as React.CSSProperties}
                >
                  <div className="card-icon-bg" style={{ background: `${cat.color}1a` }}>
                    <cat.icon size={44} strokeWidth={1.5} color={cat.color} />
                  </div>
                  <span className="card-label">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PRACTICE ── */}
        {screen === 'practice' && currentPhrase && (
          <div className="practice-view animate-fade-in glass-panel">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentPhraseIndex + 1) / currentCategoryPhrases.length) * 100}%`,
                  background: `linear-gradient(90deg, ${currentCategoryData?.color}, ${currentCategoryData?.color}bb)`,
                }}
              />
            </div>

            <div className="phrase-container">
              <span
                className="category-tag"
                style={{ color: currentCategoryData?.color, borderColor: `${currentCategoryData?.color}40` }}
              >
                {currentCategoryData?.label} · {currentPhraseIndex + 1}/{currentCategoryPhrases.length}
              </span>

              <h2 className="english-phrase">{currentPhrase.en}</h2>
              <p className="home-translation">{currentPhrase.translation}</p>

              <div className="actions-container">
                <button
                  className={`btn btn-secondary action-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={handlePlayAudio}
                  disabled={isRecording}
                >
                  <Play size={22} fill={isPlaying ? 'currentColor' : 'none'} />
                  {isPlaying ? 'Playing…' : 'Hear it'}
                </button>

                <div className="record-container">
                  <button
                    className={`record-btn ${isRecording ? 'recording-pulse' : ''}`}
                    onClick={toggleRecording}
                    style={isRecording ? {} : { background: `linear-gradient(135deg, ${currentCategoryData?.color}, ${currentCategoryData?.color}bb)` }}
                  >
                    {isRecording ? <MicOff size={30} /> : <Mic size={30} />}
                  </button>
                  <span className="record-label">
                    {isRecording ? 'Tap to Stop' : 'Tap to Speak'}
                  </span>
                </div>
              </div>
            </div>

            {feedback && (
              <div className="feedback-panel animate-fade-in">
                <div className="feedback-header">
                  <CheckCircle2 color="var(--primary)" size={22} />
                  <h4>Feedback</h4>
                </div>
                <p>{feedback}</p>
                <button className="btn btn-primary next-btn" onClick={handleNextPhrase}>
                  {currentPhraseIndex < currentCategoryPhrases.length - 1 ? 'Next Phrase →' : 'Finish →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── COMPLETE ── */}
        {screen === 'complete' && (
          <div className="complete-view animate-fade-in glass-panel">
            <div
              className="trophy-ring"
              style={{ background: `${currentCategoryData?.color}18`, border: `2px solid ${currentCategoryData?.color}40` }}
            >
              <Trophy size={56} color={currentCategoryData?.color} strokeWidth={1.5} />
            </div>
            <h2 className="complete-title">Well done!</h2>
            <p className="complete-subtitle">
              You completed <strong>{currentCategoryPhrases.length} phrases</strong> in{' '}
              <strong style={{ color: currentCategoryData?.color }}>{currentCategoryData?.label}</strong>
            </p>
            <div className="complete-actions">
              <button className="btn btn-primary" onClick={handlePracticeAgain}>
                <RotateCcw size={18} />
                Practice Again
              </button>
              <button className="btn btn-secondary" onClick={handleGoHome}>
                <Home size={18} />
                Home
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
