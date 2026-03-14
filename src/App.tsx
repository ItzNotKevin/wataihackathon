import { useState, useCallback } from 'react';
import type { CategoryId, Scenario, Message, Struggle, SupportFeedback } from './types';
import { CATEGORIES, getScenariosForCategory, getCategoryById } from './lib/scenarios';
import { HomeScreen } from './components/HomeScreen';
import { ScenarioScreen } from './components/ScenarioScreen';
import { ConversationScreen } from './components/ConversationScreen';
import { SupportScreen } from './components/SupportScreen';
import { PronunciationScreen } from './components/PronunciationScreen';
import type { PronunciationItem } from './components/PronunciationScreen';
import './index.css';

const TEST_ITEMS: PronunciationItem[] = [
  { label: 'Word', text: 'appointment' },
  { label: 'Phrase', text: 'My child is sick today' },
  { label: 'Full sentence', text: 'My child has a fever and will not be coming to school today.' },
];

type Screen = 'home' | 'scenario' | 'conversation' | 'support' | 'pronunciation' | 'pronunciation-test';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [supportFeedback, setSupportFeedback] = useState<SupportFeedback | null>(null);
  const [struggles, setStruggles] = useState<Struggle[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [pronunciationItems, setPronunciationItems] = useState<PronunciationItem[]>([]);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId as CategoryId);
    setScreen('scenario');
  }, []);

  const handleSelectScenario = useCallback((scenario: Scenario) => {
    setSelectedScenario(scenario);
    setRetryCount(0);
    setSupportFeedback(null);
    setStruggles([]);
    setScreen('conversation');
  }, []);

  const handleConversationComplete = useCallback(
    (_messages: Message[], feedback: SupportFeedback, sessionStruggles: Struggle[]) => {
      setSupportFeedback(feedback);
      setStruggles(sessionStruggles);
      setScreen('support');
    },
    [],
  );

  const handleStartLesson = useCallback(() => {
    if (!supportFeedback) return;
    setPronunciationItems([
      { label: 'Word', text: supportFeedback.practice_word },
      { label: 'Phrase', text: supportFeedback.practice_phrase },
      { label: 'Full sentence', text: supportFeedback.practice_sentence },
    ]);
    setScreen('pronunciation');
  }, [supportFeedback]);

  const handleRetryScenario = useCallback(() => {
    setRetryCount((c) => c + 1);
    setSupportFeedback(null);
    setStruggles([]);
    setScreen('conversation');
  }, []);

  const handleGoHome = useCallback(() => {
    setSelectedCategory(null);
    setSelectedScenario(null);
    setSupportFeedback(null);
    setStruggles([]);
    setRetryCount(0);
    setScreen('home');
  }, []);

  const category = selectedCategory ? getCategoryById(selectedCategory) : null;
  const scenarios = selectedCategory ? getScenariosForCategory(selectedCategory) : [];

  if (screen === 'home') {
    return (
      <HomeScreen
        categories={CATEGORIES}
        onSelectCategory={handleSelectCategory}
        onTestPronunciation={() => setScreen('pronunciation-test')}
      />
    );
  }

  if (screen === 'pronunciation-test') {
    return (
      <PronunciationScreen
        items={TEST_ITEMS}
        categoryColor="#7c3aed"
        onDone={handleGoHome}
      />
    );
  }

  if (screen === 'scenario') {
    if (!category) return null;
    return (
      <ScenarioScreen
        category={category}
        scenarios={scenarios}
        onSelectScenario={handleSelectScenario}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'conversation') {
    if (!selectedScenario || !category) return null;
    return (
      <ConversationScreen
        key={`${selectedScenario.id}-${retryCount}`}
        scenario={selectedScenario}
        categoryColor={category.color}
        onComplete={handleConversationComplete}
        onBack={() => setScreen('scenario')}
      />
    );
  }

  if (screen === 'support') {
    if (!selectedScenario || !category || !supportFeedback) return null;
    void struggles;
    return (
      <SupportScreen
        scenario={selectedScenario}
        feedback={supportFeedback}
        categoryColor={category.color}
        onRetryScenario={handleRetryScenario}
        onGoHome={handleGoHome}
        onStartLesson={handleStartLesson}
      />
    );
  }

  if (screen === 'pronunciation') {
    return (
      <PronunciationScreen
        items={pronunciationItems}
        categoryColor={category?.color ?? '#7c3aed'}
        onDone={handleGoHome}
      />
    );
  }

  return null;
}
