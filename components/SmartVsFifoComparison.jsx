'use client';

/**
 * SmartVsFifoComparison — Algorithmic proof & benchmark visualizer.
 *
 * Compares the priority-based Smart Allocation engine against a traditional
 * First-Come-First-Served (FIFO) queue, demonstrating measurable gains in
 * SLA compliance and stockout prevention.
 *
 * @module SmartVsFifoComparison
 */

import { useMemo } from 'react';
import { useWarehouse } from '@/lib/WarehouseContext';
import { compareSmartVsFIFO } from '@/lib/allocationEngine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

/**
 * SmartVsFifoComparison component rendering comparative telemetry metrics and Recharts visualization.
 *
 * @returns {JSX.Element}
 */
export default function SmartVsFifoComparison() {
  const { orders, products } = useWarehouse();

  // Run dynamic comparison computation
  const comparison = useMemo(() => {
    return compareSmartVsFIFO(orders, products);
  }, [orders, products]);

  const chartData = [
    {
      metric: 'Urgent SLA Fulfilled (%)',
      SmartAllocation: comparison.smartUrgentPct,
      NaiveFIFO: comparison.fifoUrgentPct
    },
    {
      metric: 'Stockout Incidents',
      SmartAllocation: comparison.smartStockouts,
      NaiveFIFO: comparison.fifoStockouts
    }
  ];

  return (
    <section aria-label="Benchmark Comparison Section" className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl text-white">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse" aria-hidden="true"></span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">Benchmark Comparison (Simulated Dataset)</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Smart Priority Allocation vs First-Come-First-Served (FIFO)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Algorithmic proof of SLA optimization comparing priority-based scoring against naive FIFO queuing (Live Calculated Results on Simulated Dataset).
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-emerald-400 font-bold">+{comparison.diffPct}% SLA Boost</span>
        </div>
      </div>

      {/* Dynamic Headline Stat Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-teal-900/60 p-5 rounded-2xl border border-indigo-500/30 flex items-start space-x-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold shrink-0" aria-hidden="true">
          💡
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Key Comparison Metric</span>
          <p className="text-base sm:text-lg font-extrabold text-white leading-relaxed">
            "{comparison.headline}"
          </p>
        </div>
      </div>

      {/* Side-by-Side Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Comparative benchmark metrics">
        
        {/* Card 1: Smart Urgent SLA % */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-indigo-500/30 space-y-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Smart Urgent SLA</span>
          <p className="text-3xl font-extrabold text-indigo-300">{comparison.smartUrgentPct}%</p>
          <p className="text-[11px] text-slate-400">
            {comparison.smartUrgentFulfilled} of {comparison.totalUrgent} urgent orders fulfilled
          </p>
        </div>

        {/* Card 2: FIFO Urgent SLA % */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Naive FIFO Urgent SLA</span>
          <p className="text-3xl font-extrabold text-slate-400">{comparison.fifoUrgentPct}%</p>
          <p className="text-[11px] text-slate-500">
            {comparison.fifoUrgentFulfilled} of {comparison.totalUrgent} urgent orders fulfilled
          </p>
        </div>

        {/* Card 3: Smart Stockouts */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-emerald-500/30 space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Smart Stockout Delays</span>
          <p className="text-3xl font-extrabold text-emerald-400">{comparison.smartStockouts}</p>
          <p className="text-[11px] text-slate-400">Unfulfilled line items on urgent SLA</p>
        </div>

        {/* Card 4: FIFO Stockouts */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-red-500/30 space-y-2">
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">FIFO Stockout Delays</span>
          <p className="text-3xl font-extrabold text-red-400">{comparison.fifoStockouts}</p>
          <p className="text-[11px] text-slate-500">Unfulfilled line items on naive queue</p>
        </div>

      </div>

      {/* Recharts Side-by-Side Bar Chart */}
      <div className="pt-2">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Urgent SLA Performance Comparison Chart</h3>
        <div className="h-64 w-full" role="region" aria-label="Interactive bar chart comparing Smart Allocation vs Naive FIFO">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="metric" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="SmartAllocation" name="Smart Priority Allocation" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="NaiveFIFO" name="First-Come-First-Served (FIFO)" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  );
}
