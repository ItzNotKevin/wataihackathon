import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { Category, Scenario } from '../types';
import { ROHINGYA_UI } from '../lib/rohingya';

interface ScenarioScreenProps {
  category: Category;
  scenarios: Scenario[];
  onSelectScenario: (scenario: Scenario) => void;
  onBack: () => void;
}

export function ScenarioScreen({
  category,
  scenarios,
  onSelectScenario,
  onBack,
}: ScenarioScreenProps) {
  const warmSurface =
    'linear-gradient(160deg, rgba(255, 253, 249, 0.96) 0%, rgba(243, 236, 227, 0.92) 100%)';
  const primarySurface = 'linear-gradient(135deg, #33424d, #5a6772)';

  return (
    <section className="animate-fade-in flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <ArrowLeft size={18} />
          <span className="flex flex-col items-start leading-tight">
            <span>Back</span>
            <span className="text-[0.72rem] font-medium opacity-75">{ROHINGYA_UI.back}</span>
          </span>
        </button>

        <div className="rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          <span className="block">Choose practice</span>
          <span className="block text-[0.72rem] font-medium opacity-75">{ROHINGYA_UI.pickScenario}</span>
        </div>
      </div>

      <div
        className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-sm sm:p-6"
        style={{ background: warmSurface }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: '#b47b67' }}>
              {category.title}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Pick one scenario
            </h2>
            <p className="mt-1 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#b47b67]/80">
              {ROHINGYA_UI.pickScenario}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
              Choose one card and start speaking.
            </p>
            <p className="mt-1 text-[0.82rem] font-medium text-slate-400 sm:text-sm">
              {ROHINGYA_UI.chooseCardSpeak}
            </p>
          </div>

          <div
            className="flex h-20 w-20 items-center justify-center rounded-[1.8rem] border border-white/80 bg-white/85 text-5xl shadow-sm"
            aria-hidden="true"
          >
            {category.emoji}
          </div>
        </div>

        <div className="grid gap-4">
          {scenarios.map((scenario, index) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onSelectScenario(scenario)}
              className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 p-5 text-left shadow-sm transition-transform hover:-translate-y-1 active:scale-[0.99] sm:p-6"
            >
              <div
                className="absolute inset-y-0 left-0 w-2 rounded-l-[2rem]"
                style={{ background: 'linear-gradient(180deg, #b47b67, #d8b79a)' }}
              />

              <div className="ml-2 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div
                    className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{ background: 'rgba(180, 123, 103, 0.12)', color: '#b47b67' }}
                  >
                    <span>{category.title}</span>
                    <span className="opacity-60">•</span>
                    <span>{index + 1}</span>
                  </div>

                  <h3 className="max-w-[20ch] text-[1.55rem] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[1.75rem]">
                    {scenario.title}
                  </h3>
                  <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-slate-600 sm:text-base">
                    {scenario.description}
                  </p>
                </div>

                <div className="hidden rounded-full bg-[#faf3ec] px-3 py-1 text-xs font-semibold text-[#b47b67] sm:block">
                  {ROHINGYA_UI.quick}
                </div>
              </div>

              <div
                className="ml-2 mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold text-white shadow-sm"
                style={{ background: primarySurface }}
              >
                <span className="flex flex-col items-start leading-tight">
                  <span>Start</span>
                  <span className="text-[0.72rem] font-medium opacity-80">{ROHINGYA_UI.start}</span>
                </span>
                <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
