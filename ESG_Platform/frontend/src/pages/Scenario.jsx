import { useState } from 'react';
import { simulateScenario } from '../services/api';

const scenarioOptions = [
  {
    id: 1,
    name: 'Renewable Energy Shift',
    description: 'Increase renewable electricity sourcing from 20% to 60%.',
    impact: '30% reduction in Scope 2 emissions.',
    baseline: 1200,
  },
  {
    id: 2,
    name: 'Efficiency Upgrade',
    description: 'Deploy energy efficiency improvements across facilities.',
    impact: '15% reduction in Scope 1 emissions.',
    baseline: 800,
  },
];

export default function Scenario() {
  const [selectedScenario, setSelectedScenario] = useState(scenarioOptions[0]);
  const [renewablePercent, setRenewablePercent] = useState(20);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await simulateScenario(renewablePercent , selectedScenario.id);
  
      setResult({
        scenario: selectedScenario.name,
        renewablePercent,
        ...response.data, 
      });

    } catch (error) {
      const serverMessage = error.response?.data?.message || error.message;
      console.error('Simulation failed Details:', error.response?.data || error);
      
      alert(`Simulation Error: ${serverMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Scenario Planning</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">Climate impact simulation</h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl">
              Evaluate potential emissions reductions from targeted sustainability initiatives and compare outcomes instantly.
            </p>
          </div>
          <div className="rounded-3xl bg-green-50 p-4 text-green-700 dark:bg-green-900/30 dark:text-green-200">
            <p className="text-sm font-semibold">Scenario summary</p>
            <p className="mt-2 text-base">Use preset plans to model measurable impact.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {scenarioOptions.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario)}
                  className={`rounded-3xl border p-5 text-left transition ${
                    selectedScenario.id === scenario.id
                      ? 'border-green-600 bg-green-50 text-green-900 dark:border-green-400 dark:bg-green-900/30 dark:text-white'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-green-500 hover:bg-green-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200'
                  }`}
                >
                  <p className="text-sm font-semibold">{scenario.name}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{scenario.description}</p>
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-950">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Renewable energy target</label>
              <div className="mt-4 flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={renewablePercent}
                  onChange={(e) => setRenewablePercent(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-green-200 accent-green-600"
                />
                <span className="w-16 text-right text-lg font-semibold text-gray-900 dark:text-white">{renewablePercent}%</span>
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Adjust the renewable mix for this scenario and estimate savings.
              </p>
            </div>

            <button
              onClick={runSimulation}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/10 transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Running...' : 'Run simulation'}
            </button>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-950">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Selected scenario</p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{selectedScenario.name}</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">{selectedScenario.impact}</p>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl bg-gray-50 p-4 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Baseline emissions</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{selectedScenario.baseline} tCO₂e</p>
              </div>
              <div className="rounded-3xl bg-gray-50 p-4 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Potential reduction</p>
                <p className="mt-2 text-3xl font-semibold text-green-700 dark:text-green-300">Up to 30%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Simulation results</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-green-50 p-6 dark:bg-green-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-300">Scenario</p>
              <p className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">{result.scenario}</p>
            </div>
            <div className="rounded-3xl bg-gray-50 p-6 dark:bg-gray-950">
              <p className="text-sm text-gray-600 dark:text-gray-300">Emission reduction</p>
              <p className="mt-3 text-xl font-semibold text-green-700 dark:text-green-300">{result.emissionReduction} tCO₂e</p>
            </div>
            <div className="rounded-3xl bg-gray-50 p-6 dark:bg-gray-950">
              <p className="text-sm text-gray-600 dark:text-gray-300">New estimated total</p>
              <p className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">{result.newTotal} tCO₂e</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}