import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto py-12 text-center space-y-8">
      <div className="inline-block px-4 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-sm font-semibold">
        Smart Warehouse Optimization System
      </div>

      <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
        Automated Inventory &amp; Order Allocation Engine
      </h1>

      <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Real-time telemetry, priority-based stock fulfillment scoring, and automated decision logging for next-generation logistics centers.
      </p>

      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition"
        >
          View Operational Dashboard
        </Link>
        <Link
          href="/fulfillment"
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition"
        >
          Run Allocation Engine
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold mb-4">
            📦
          </div>
          <h3 className="text-lg font-bold text-white mb-2">20 Warehouse SKUs</h3>
          <p className="text-sm text-slate-400">Complete catalog with velocity ratings, on-hand counts, and reorder point thresholds.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl font-bold mb-4">
            ⚡
          </div>
          <h3 className="text-lg font-bold text-white mb-2">40 Orders Tracked</h3>
          <p className="text-sm text-slate-400">Multi-item customer orders categorized by Urgent, Standard, and Low priority tiers.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold mb-4">
            🧠
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Allocation Engine</h3>
          <p className="text-sm text-slate-400">Algorithmic stock assignment stubs in <code className="text-indigo-300">/lib/allocationEngine.js</code>.</p>
        </div>
      </div>
    </div>
  );
}
