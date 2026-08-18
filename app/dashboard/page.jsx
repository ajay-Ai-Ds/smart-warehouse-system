'use client';

/**
 * DashboardPage — Main Operations Control Center.
 *
 * Provides real-time telemetry metrics, live simulation controls,
 * AI Copilot, 2.5D storage grid, recent orders stream, and real-time
 * decision logs with export capability.
 *
 * @module DashboardPage
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWarehouse } from '@/lib/WarehouseContext';
import WarehouseGrid from '@/components/WarehouseGrid';
import WarehouseCopilot from '@/components/WarehouseCopilot';
import DisruptionSimulator from '@/components/DisruptionSimulator';
import { getDeadlineCountdown, formatINR } from '@/lib/utils';

/**
 * Operations dashboard component.
 * @returns {JSX.Element}
 */
export default function DashboardPage() {
  const { orders, products, decisionLogs, isSimulationActive, toggleSimulation } = useWarehouse();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Stat metrics computation from live context state
  const pendingOrdersCount = orders.filter(o => o.status === 'Created').length;
  const fulfilledTodayCount = orders.filter(o => o.status === 'Dispatched').length;
  const lowStockProducts = products.filter(p => Number(p.quantityOnHand) <= Number(p.reorderPoint));
  const activePickingCount = orders.filter(o => o.status === 'Picking').length;

  // 10 most recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  /**
   * Exports the decision logs as a formatted JSON file download.
   */
  const exportDecisionLogs = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      system: 'Smart Warehouse Operations System',
      totalLogs: decisionLogs.length,
      logs: decisionLogs
    };

    const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `warehouse-decision-logs-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 -m-6 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section with Live Simulation Mode Toggle */}
        <section aria-label="Dashboard Header" className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
              <span className="text-xs uppercase tracking-widest font-bold text-slate-400">Warehouse Control Center (India Logistics Hub)</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Operations Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time order flow, AI Copilot, and inventory telemetry in INR (₹)</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Simulation Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleSimulation}
              aria-label={isSimulationActive ? "Stop live simulation mode" : "Start live simulation mode"}
              aria-pressed={isSimulationActive}
              className={`px-5 py-3 rounded-xl font-bold text-xs transition flex items-center space-x-2.5 shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                isSimulationActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isSimulationActive ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" aria-hidden="true"></span>
                  <span>🟢 LIVE — ⏸ Stop Simulation</span>
                </>
              ) : (
                <>
                  <span>▶ Start Live Simulation Mode</span>
                </>
              )}
            </button>

            {/* ROI & Financial Value Saved Counter in Indian Rupees (₹) */}
            <div className="flex items-center space-x-4 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl" role="region" aria-label="ROI financial metrics">
              <div className="border-r border-slate-800 pr-4">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Stockout Value Saved</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">₹12,45,000</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Labor Hours Saved</span>
                <span className="text-base font-extrabold text-indigo-400 font-mono">18.4 hrs</span>
              </div>
            </div>
          </div>
        </section>

        {/* Smart vs FIFO Benchmark Shortcut Banner */}
        <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900 to-teal-900/90 rounded-2xl p-5 border border-indigo-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl" aria-hidden="true">
              📊
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Algorithmic Proof</span>
              <h2 className="text-base font-bold text-white">Compare: Smart Priority Allocation vs First-Come-First-Served (FIFO)</h2>
              <p className="text-xs text-slate-300">Smart Allocation fulfills up to 33% more urgent orders on time compared to naive queuing.</p>
            </div>
          </div>
          <Link
            href="/analytics"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow transition shrink-0 text-center"
          >
            View Benchmark Analytics ➔
          </Link>
        </div>

        {/* 1. Top Row — 4 Stat Cards */}
        <section aria-label="Key Operational Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Pending Orders */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Orders</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg" aria-hidden="true">
                📋
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-slate-900">{pendingOrdersCount}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">Created</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Orders waiting to be allocated</p>
          </div>

          {/* Card 2: Fulfilled Today */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fulfilled Today</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg" aria-hidden="true">
                🚚
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-slate-900">{fulfilledTodayCount}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">Dispatched</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Dispatched to carrier today</p>
          </div>

          {/* Card 3: Low Stock Items */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Items</span>
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg" aria-hidden="true">
                ⚠️
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-red-600">{lowStockProducts.length}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-100 text-red-800">Below Reorder</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Products requiring restock</p>
          </div>

          {/* Card 4: Active Picking Tasks */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Picking Tasks</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg" aria-hidden="true">
                📦
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-slate-900">{activePickingCount}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">In Progress</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Orders currently on warehouse floor</p>
          </div>
        </section>

        {/* AI Copilot & Crisis Simulator Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WarehouseCopilot />
          <DisruptionSimulator />
        </div>

        {/* 2.5D Isometric Warehouse Overview Grid */}
        <WarehouseGrid />

        {/* Middle Section: Live Order Feed + Live Decision Log Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Live Order Feed (2 Cols) */}
          <section aria-label="Live Order Feed" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Live Order Feed</h2>
                <p className="text-xs text-slate-500 mt-0.5">Showing 10 most recent incoming and active orders</p>
              </div>
              <div className="flex items-center space-x-2">
                {isSimulationActive && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-mono font-bold rounded-full animate-pulse">
                    🟢 LIVE SIMULATION ACTIVE
                  </span>
                )}
                <span className="text-xs font-semibold px-3 py-1 bg-slate-200 text-slate-700 rounded-full">
                  Total Orders: {orders.length}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[520px] divide-y divide-slate-100">
              {recentOrders.map((order) => {
                const countdown = getDeadlineCountdown(order.deadline);
                const isOverdue = countdown === 'OVERDUE';

                return (
                  <div key={order.id} className="p-5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-extrabold text-slate-900">{order.id}</span>
                        
                        {order.priority === 'Urgent' && (
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                            Urgent
                          </span>
                        )}
                        {order.priority === 'Standard' && (
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                            Standard
                          </span>
                        )}
                        {order.priority === 'Low' && (
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            Low
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-700">{order.customerName}</p>
                      <p className="text-xs text-slate-400">
                        {order.items.length} SKU(s) • Total Qty: {order.items.reduce((acc, i) => acc + i.qty, 0)} units
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                        order.status === 'Allocated' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        order.status === 'Partial' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        order.status === 'Waiting' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        order.status === 'Dispatched' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        order.status === 'Picking' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        order.status === 'Created' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {order.status}
                      </span>

                      <div className="flex items-center space-x-1.5 text-xs font-medium">
                        <span className="text-slate-400">Deadline:</span>
                        <span className={`font-mono font-bold ${
                          isOverdue ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' : 'text-slate-700'
                        }`}>
                          ⏱️ {countdown}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Sidebar — Real-Time Live Decision Log Panel with Export Button */}
          <section aria-label="Real-time Decision Log" className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" aria-hidden="true"></span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Decision Log</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={exportDecisionLogs}
                  aria-label="Export decision logs as JSON"
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-[10px] font-mono font-bold rounded border border-slate-700 cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-teal-400"
                >
                  📥 EXPORT
                </button>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-teal-300 rounded border border-slate-700">
                  LIVE ({decisionLogs.length})
                </span>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[520px] font-mono text-xs space-y-3 bg-slate-950/90 text-slate-300" role="log" aria-label="System decision log entries">
              {decisionLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-1 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-bold">{log.timestamp}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      log.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      log.type === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      log.type === 'alert' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {log.type}
                    </span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">{log.text}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500">Log entries auto-generated by Allocation Engine</p>
            </div>
          </section>
        </div>

        {/* Bottom Section — Low Stock Alert Banner */}
        <section aria-label="Low Stock Alert Banner" className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg" aria-hidden="true">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Low Stock Alert Banner</h2>
                <p className="text-xs text-slate-500">Products with on-hand inventory at or below minimum reorder point thresholds</p>
              </div>
            </div>
            <span className="text-xs font-extrabold px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg">
              {lowStockProducts.length} Product(s) Need Reorder
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="region" aria-label="Low stock product cards">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-xl flex flex-col justify-between space-y-3 hover:border-red-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-500">{product.sku}</span>
                    <span className="px-2 py-0.5 text-[11px] font-extrabold bg-red-600 text-white rounded shadow-sm">
                      Reorder Suggested
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{product.name}</h3>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">On Hand</span>
                    <span className="text-base font-extrabold text-red-600">{product.quantityOnHand} units</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Reorder Point</span>
                    <span className="text-sm font-semibold text-slate-700">{product.reorderPoint} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
