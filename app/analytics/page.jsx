'use client';

/**
 * AnalyticsPage — Telemetry, Charts & Optimization Intelligence.
 *
 * Visualizes order distributions, priority breakdown, stock-level thresholds,
 * Smart-vs-FIFO benchmark comparisons, dynamic bottleneck detection,
 * and comprehensive report export.
 *
 * @module AnalyticsPage
 */

import { useMemo } from 'react';
import { useWarehouse } from '@/lib/WarehouseContext';
import SmartVsFifoComparison from '@/components/SmartVsFifoComparison';
import { STAGE_COLORS, PRIORITY_COLORS, STAGE_FLOW } from '@/lib/constants';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

/**
 * Analytics and optimization page component.
 * @returns {JSX.Element}
 */
export default function AnalyticsPage() {
  const { orders, products, decisionLogs } = useWarehouse();

  // 1. Stat Summary Cards Computation
  const totalOrdersCount = orders.length;
  const dispatchedCount = orders.filter(o => o.status === 'Dispatched').length;
  const fulfillmentRate = totalOrdersCount > 0
    ? Math.round((dispatchedCount / totalOrdersCount) * 100)
    : 0;

  // Average time estimate (calculated hours per stage)
  const avgTimePerStage = useMemo(() => {
    if (orders.length === 0) return '0.0';
    const now = new Date();
    const activeOrders = orders.filter(o => o.status !== 'Dispatched' && o.createdAt);
    if (activeOrders.length === 0) return '1.2';
    
    const totalHours = activeOrders.reduce((sum, o) => {
      const hoursElapsed = (now - new Date(o.createdAt)) / (1000 * 60 * 60);
      return sum + hoursElapsed;
    }, 0);

    return (totalHours / activeOrders.length / 2.5).toFixed(1);
  }, [orders]);

  // Total Exceptions count
  const exceptionsCount = orders.filter(o => o.hasException).length +
    decisionLogs.filter(l => l.text.includes('flagged') || l.text.includes('exception')).length;

  // 2. Chart 1 Data — Orders by Stage
  const ordersByStageData = STAGE_FLOW.map(stage => ({
    stage,
    count: orders.filter(o => o.status === stage).length
  }));

  // 3. Chart 2 Data — Priority Breakdown
  const priorityBreakdownData = [
    { name: 'Urgent', value: orders.filter(o => o.priority === 'Urgent').length },
    { name: 'Standard', value: orders.filter(o => o.priority === 'Standard').length },
    { name: 'Low', value: orders.filter(o => o.priority === 'Low').length }
  ].filter(d => d.value > 0);

  // 4. Chart 3 Data — Stock Levels vs Reorder Point
  const stockLevelData = products.map(product => ({
    name: product.sku,
    fullName: product.name,
    quantityOnHand: product.quantityOnHand,
    reorderPoint: product.reorderPoint,
    isLow: Number(product.quantityOnHand) <= Number(product.reorderPoint)
  }));

  // 5. Dynamic Bottleneck Analysis computation
  const bottleneckInfo = useMemo(() => {
    const counts = STAGE_FLOW.map(stage => ({
      stage,
      count: orders.filter(o => o.status === stage).length
    }));

    // Find active non-dispatched stage with max orders
    const activeStages = counts.filter(c => c.stage !== 'Dispatched');
    const sorted = [...activeStages].sort((a, b) => b.count - a.count);
    const topStage = sorted[0];

    if (!topStage || topStage.count === 0) {
      return {
        stageName: 'None',
        description: 'Operations are running smoothly with no immediate floor bottlenecks detected.'
      };
    }

    let recommendation = '';
    if (topStage.stage === 'Picking') {
      recommendation = 'High volume of orders queued for floor picking. Recommend re-assigning 2 packers to assist pickers.';
    } else if (topStage.stage === 'Packing') {
      recommendation = 'Packing station queue exceeds threshold. Recommend opening secondary packing line B.';
    } else if (topStage.stage === 'QC') {
      recommendation = 'Quality Check inspection queue holding shipments. Recommend prioritizing urgent SLA orders first.';
    } else if (topStage.stage === 'Allocated') {
      recommendation = 'Orders allocated but waiting to be picked up. Dispatch picking tasks to floor staff immediately.';
    } else {
      recommendation = 'Orders queued for allocation. Run Auto-Allocate All to release items.';
    }

    return {
      stageName: topStage.stage,
      count: topStage.count,
      description: recommendation
    };
  }, [orders]);

  /**
   * Exports full telemetry summary as an operational analytics report JSON.
   */
  const exportAnalyticsReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      reportTitle: 'Smart Warehouse Telemetry & Analytics Report',
      metrics: {
        totalOrders: totalOrdersCount,
        dispatchedOrders: dispatchedCount,
        fulfillmentRatePercent: fulfillmentRate,
        averageTimePerStageHours: avgTimePerStage,
        totalExceptions: exceptionsCount,
        activeBottleneckStage: bottleneckInfo.stageName,
        bottleneckRecommendation: bottleneckInfo.description
      },
      ordersByStage: ordersByStageData,
      priorityBreakdown: priorityBreakdownData,
      lowStockSkus: products.filter(p => Number(p.quantityOnHand) <= Number(p.reorderPoint))
    };

    const dataBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `warehouse-analytics-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 -m-6 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <section aria-label="Analytics Header" className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="h-3 w-3 rounded-full bg-teal-400 animate-pulse" aria-hidden="true"></span>
              <span className="text-xs uppercase tracking-widest font-bold text-slate-400">System Telemetry & Insights</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Analytics & Optimization</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time performance metrics, stage volumes, and benchmark comparisons</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={exportAnalyticsReport}
              aria-label="Download analytics telemetry report"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <span>📥 Export Report</span>
            </button>
            <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-teal-400 font-bold">● Live Analytics Active</span>
            </div>
          </div>
        </section>

        {/* 1. Top Row — 3 Summary Stat Cards */}
        <section aria-label="Analytics Overview Metrics" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Fulfillment Rate Today */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fulfillment Rate Today</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg" aria-hidden="true">
                📈
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-slate-900">{fulfillmentRate}%</p>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${fulfillmentRate}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">Dispatched orders vs total order volume</p>
          </div>

          {/* Card 2: Average Time Per Stage */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Time Per Stage</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg" aria-hidden="true">
                ⏱️
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-slate-900">{avgTimePerStage} <span className="text-lg text-slate-500 font-normal">hrs</span></p>
            </div>
            <p className="text-xs text-slate-500 mt-3">Estimated dwell time per fulfillment column</p>
          </div>

          {/* Card 3: Total Exceptions Today */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Exceptions Today</span>
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg" aria-hidden="true">
                🚨
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-red-600">{exceptionsCount}</p>
            </div>
            <p className="text-xs text-slate-500 mt-3">Damaged/missing stock flags in Kanban board</p>
          </div>

        </section>

        {/* Feature 2: Smart vs FIFO Benchmark Comparison Card */}
        <SmartVsFifoComparison />

        {/* Charts Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1 — Orders by Stage (Bar Chart) */}
          <section aria-label="Orders by Stage Chart" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Orders by Stage</h2>
              <p className="text-xs text-slate-500">Distribution of orders across fulfillment columns</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="stage" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {ordersByStageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Chart 2 — Priority Breakdown (Donut Chart) */}
          <section aria-label="Priority Breakdown Donut Chart" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Priority Breakdown</h2>
              <p className="text-xs text-slate-500">Proportion of Urgent vs Standard vs Low priority orders</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityBreakdownData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

        </div>

        {/* Chart 3 — Stock Levels vs Reorder Point (Horizontal Bar Chart) */}
        <section aria-label="Stock Levels vs Reorder Thresholds Chart" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Stock Levels vs Reorder Thresholds</h2>
              <p className="text-xs text-slate-500">Inventory quantity on hand per SKU (Red = at or below reorder point)</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold" role="region" aria-label="Stock level chart legend">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500" aria-hidden="true"></span>
                <span className="text-slate-600">Healthy Stock</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true"></span>
                <span className="text-slate-600">Below Reorder Point</span>
              </span>
            </div>
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={stockLevelData}
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(value, name, props) => [`${value} units`, props.payload.fullName]}
                />
                <Bar dataKey="quantityOnHand" radius={[0, 4, 4, 0]}>
                  {stockLevelData.map((entry, index) => (
                    <Cell key={`stock-cell-${index}`} fill={entry.isLow ? '#ef4444' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Dynamic Bottleneck Insight Card */}
        <section aria-label="Automated Bottleneck Insight" className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl" aria-hidden="true">
              ⚡
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">Automated Logistics Intelligence</span>
              <h2 className="text-xl font-extrabold text-white">Dynamically Generated Bottleneck Insight</h2>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-400">Active Bottleneck Stage:</span>
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {bottleneckInfo.stageName} ({bottleneckInfo.count || 0} orders)
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-200 leading-relaxed">
              "{bottleneckInfo.description}"
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
