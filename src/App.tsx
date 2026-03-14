import { useState, useCallback } from 'react';
import type { CategoryId, Scenario, Message, Struggle, SupportFeedback } from './types';
import { CATEGORIES, getScenariosForCategory, getCategoryById } from './lib/scenarios';
import { HomeScreen } from './components/HomeScreen';
import { ScenarioScreen } from './components/ScenarioScreen';
import { ConversationScreen } from './components/ConversationScreen';
import { SupportScreen } from './components/SupportScreen';
import './index.css';

type Screen = 'home' | 'scenario' | 'conversation' | 'support';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [supportFeedback, setSupportFeedback] = useState<SupportFeedback | null>(null);
  // Collected per-turn struggle data — ready to power support mode
  const [struggles, setStruggles] = useState<Struggle[]>([]);
  const [retryCount, setRetryCount] = useState(0);

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
    return <HomeScreen categories={CATEGORIES} onSelectCategory={handleSelectCategory} />;
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
    // struggles is stored in state and ready — pass it to SupportScreen when implemented
    void struggles; // explicitly consumed to satisfy noUnusedLocals
    return (
      <SupportScreen
        scenario={selectedScenario}
        feedback={supportFeedback}
        categoryColor={category.color}
        onRetryScenario={handleRetryScenario}
        onGoHome={handleGoHome}
      />
    );
  }

  return null;
}
