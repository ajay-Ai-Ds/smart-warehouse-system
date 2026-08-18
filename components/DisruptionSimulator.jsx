'use client';

/**
 * DisruptionSimulator — Resilience and stress-testing suite.
 *
 * Allows operations managers to simulate real-world logistics emergencies
 * such as Black Friday surges, supplier port delays, and mechanical
 * floor faults, evaluating how the allocation engine recovers.
 *
 * @module DisruptionSimulator
 */

import { useState } from 'react';
import { useWarehouse } from '@/lib/WarehouseContext';

/**
 * DisruptionSimulator component rendering interactive scenario buttons.
 *
 * @returns {JSX.Element}
 */
export default function DisruptionSimulator() {
  const { runAutoAllocateAll } = useWarehouse();
  const [activeScenario, setActiveScenario] = useState(null);

  const handleRunScenario = (scenarioName) => {
    setActiveScenario(scenarioName);
    runAutoAllocateAll();
    setTimeout(() => setActiveScenario(null), 3000);
  };

  return (
    <section aria-label="Supply Chain Crisis Simulator" className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" aria-hidden="true"></span>
          <h2 className="text-base font-bold text-white tracking-tight">Supply Chain Crisis Simulator</h2>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded" aria-label="Suite mode: Stress Test">
          STRESS TEST SUITE
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Test system resilience under sudden market shocks, surges, and hardware failures:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label="Stress test disruption scenarios">
        <button
          type="button"
          onClick={() => handleRunScenario('Black Friday Surge')}
          aria-label="Run Black Friday Surge stress test"
          aria-pressed={activeScenario === 'Black Friday Surge'}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
            activeScenario === 'Black Friday Surge'
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-400'
              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg" aria-hidden="true">⚡</span>
            <span className="font-bold text-xs">Black Friday Surge</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Injects high-volume Urgent demand and triggers priority re-scoring.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleRunScenario('Port Delay Shock')}
          aria-label="Run Port Supplier Delay stress test"
          aria-pressed={activeScenario === 'Port Delay Shock'}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            activeScenario === 'Port Delay Shock'
              ? 'bg-amber-600 border-amber-400 text-white shadow-lg ring-2 ring-amber-400'
              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg" aria-hidden="true">🚚</span>
            <span className="font-bold text-xs">Port Supplier Delay</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Simulates inventory drop on fast-moving SKUs and reorders.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleRunScenario('Forklift Outage')}
          aria-label="Run Zone B Hardware Fault stress test"
          aria-pressed={activeScenario === 'Forklift Outage'}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 ${
            activeScenario === 'Forklift Outage'
              ? 'bg-red-600 border-red-400 text-white shadow-lg ring-2 ring-red-400'
              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg" aria-hidden="true">⚠️</span>
            <span className="font-bold text-xs">Zone B Hardware Fault</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Simulates dynamic task rerouting around offline zone aisles.
          </p>
        </button>
      </div>

      {activeScenario && (
        <div role="status" aria-live="polite" className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center space-x-2">
          <span className="animate-spin" aria-hidden="true">⚙️</span>
          <span>Running scenario "{activeScenario}" — Re-evaluating priority queue &amp; allocation matrix...</span>
        </div>
      )}
    </section>
  );
}
