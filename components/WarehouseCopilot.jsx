'use client';

/**
 * WarehouseCopilot — Interactive AI/heuristic diagnostics assistant.
 *
 * Connects directly to live orders, products, and decision logs to answer
 * natural-language operational queries regarding stockouts, bottlenecks,
 * SLA breach risks, and individual order audit trails.
 *
 * @module WarehouseCopilot
 */

import { useState } from 'react';
import { useWarehouse } from '@/lib/WarehouseContext';
import { sanitizeString } from '@/lib/utils';

/**
 * WarehouseCopilot component rendering a real-time conversational query interface.
 *
 * @returns {JSX.Element}
 */
export default function WarehouseCopilot() {
  const { orders, products, decisionLogs } = useWarehouse();
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your Logistics AI Copilot. Ask me live questions about order delays, SKU reorders, SLA fulfillment rates, or floor bottlenecks.'
    }
  ]);

  const SAMPLE_QUERIES = [
    "Why was Order #ORD-1019 delayed?",
    "Which SKUs need emergency reorder?",
    "What is our current fulfillment rate?",
    "Identify current floor bottlenecks",
    "Are any orders at risk of SLA breach?"
  ];

  const handleAsk = (textToAsk) => {
    const raw = textToAsk || query;
    const q = sanitizeString(raw, 300);
    if (!q.trim()) return;

    const userMsg = { sender: 'user', text: q };
    let aiResponse = '';
    const lowerQ = q.toLowerCase();

    // 1. Bottleneck Analysis
    if (lowerQ.includes('bottleneck') || lowerQ.includes('congestion') || lowerQ.includes('block')) {
      const stages = ['Picking', 'Packing', 'QC', 'Allocated'];
      const counts = stages.map(st => ({
        stage: st,
        count: orders.filter(o => o.status === st).length
      })).sort((a, b) => b.count - a.count);

      const top = counts[0];
      if (top && top.count > 0) {
        aiResponse = `⚠️ Floor Bottleneck Detected: "${top.stage}" currently holds ${top.count} orders. Recommendation: Rebalance floor staff and prioritize urgent SLA items in ${top.stage}.`;
      } else {
        aiResponse = `All fulfillment stages are balanced. No significant floor congestion detected across ${orders.length} active orders.`;
      }
    }
    // 2. SLA Breach Risk
    else if (lowerQ.includes('risk') || lowerQ.includes('breach') || lowerQ.includes('overdue') || lowerQ.includes('sla')) {
      const now = new Date();
      const atRiskOrders = orders.filter(o => {
        if (o.status === 'Dispatched' || o.status === 'Cancelled') return false;
        const deadline = new Date(o.deadline);
        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
        return hoursLeft <= 2;
      });

      if (atRiskOrders.length > 0) {
        const orderSummary = atRiskOrders.slice(0, 3).map(o => `#${o.id} (${o.customerName}, ${o.priority})`).join(', ');
        aiResponse = `🚨 SLA Breach Alert: ${atRiskOrders.length} active order(s) have ≤ 2 hours remaining until SLA deadline: ${orderSummary}. Immediate expedited processing recommended.`;
      } else {
        aiResponse = `✅ SLA Health Stable: No active orders are currently in imminent danger (≤ 2 hours) of SLA violation.`;
      }
    }
    // 3. Order Specific Delay Lookup (Dynamically inspects orders & decisionLogs state)
    else if (q.match(/ORD-\d+/i) || q.match(/ECOM-\d+/i) || lowerQ.includes('delay') || lowerQ.includes('why')) {
      const orderIdMatch = q.match(/ORD-\d+/i) || q.match(/ECOM-\d+/i) || q.match(/\b\d{4}\b/);
      let targetOrder = null;
      if (orderIdMatch) {
        const matchedIdStr = orderIdMatch[0].toUpperCase();
        targetOrder = orders.find(o => o.id.toUpperCase().includes(matchedIdStr));
      }

      if (!targetOrder && lowerQ.includes('1019')) {
        targetOrder = orders.find(o => o.id.includes('1019'));
      }

      if (!targetOrder) {
        targetOrder = orders.find(o => o.status === 'Waiting' || o.status === 'Partial') || orders[0];
      }

      if (targetOrder) {
        const matchedLog = decisionLogs.find(l => l.text.includes(targetOrder.id));

        if (matchedLog) {
          aiResponse = `Order #${targetOrder.id} (${targetOrder.priority} Priority, Customer: ${targetOrder.customerName}, Status: ${targetOrder.status}) Decision Log Entry: "${matchedLog.text}"`;
        } else {
          aiResponse = `Order #${targetOrder.id} (${targetOrder.priority} Priority, Customer: ${targetOrder.customerName}) is currently in status "${targetOrder.status}". Items requested: ${targetOrder.items.map(i => `${i.qty} units`).join(', ')}. Priority Score: ${targetOrder.status === 'Created' ? 'Pending Allocation' : 'Processed'}.`;
        }
      } else {
        aiResponse = `No specific order matched your query. Currently tracking ${orders.length} active orders in system state.`;
      }
    } 
    // 4. Emergency Reorder SKUs (Queries current product state)
    else if (lowerQ.includes('reorder') || lowerQ.includes('sku') || lowerQ.includes('emergency') || lowerQ.includes('stock')) {
      const lowStockProducts = products.filter(p => Number(p.quantityOnHand) <= Number(p.reorderPoint));

      if (lowStockProducts.length > 0) {
        const skuDetails = lowStockProducts.map(
          (p, i) => `${i + 1}) ${p.sku} (${p.name}): ${p.quantityOnHand} units on hand (Reorder Point: ${p.reorderPoint})`
        ).join('; ');

        aiResponse = `Currently ${lowStockProducts.length} SKU(s) require emergency reorder: ${skuDetails}.`;
      } else {
        aiResponse = `All ${products.length} catalog SKUs currently have healthy stock levels above minimum reorder points.`;
      }
    } 
    // 5. Live Fulfillment Rate Calculation
    else if (lowerQ.includes('rate') || lowerQ.includes('fulfillment') || lowerQ.includes('dispatched') || lowerQ.includes('stat')) {
      const totalOrders = orders.length;
      const dispatchedCount = orders.filter(o => o.status === 'Dispatched').length;
      const allocatedCount = orders.filter(o => o.status === 'Allocated').length;
      const pickingCount = orders.filter(o => o.status === 'Picking').length;

      const rate = totalOrders > 0 ? Math.round((dispatchedCount / totalOrders) * 100) : 0;

      aiResponse = `Live SLA Fulfillment Completion Rate: ${rate}% (${dispatchedCount} of ${totalOrders} total orders dispatched). Currently ${pickingCount} orders in active picking and ${allocatedCount} orders fully allocated.`;
    } 
    // 6. Default Dynamic Fallback
    else {
      const urgentCount = orders.filter(o => o.priority === 'Urgent').length;
      aiResponse = `Logistics AI Copilot evaluated ${orders.length} live orders and ${products.length} SKUs. Currently tracking ${urgentCount} Urgent SLA orders. System priority scoring algorithm is active.`;
    }

    setChatHistory(prev => [...prev, userMsg, { sender: 'ai', text: aiResponse }]);
    setQuery('');
  };

  return (
    <section aria-label="Warehouse AI Copilot" className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center font-bold text-white text-sm shadow-md" aria-hidden="true">
            🤖
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Warehouse AI Copilot</h2>
            <p className="text-[11px] text-slate-400">Live dynamic inspector connected to system telemetry</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-mono font-bold rounded-full animate-pulse" aria-label="Live data connected status">
          LIVE DATA CONNECTED
        </span>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2 pt-1" role="region" aria-label="Suggested quick prompts">
        {SAMPLE_QUERIES.map((sq, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleAsk(sq)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={`Ask query: ${sq}`}
          >
            💡 {sq}
          </button>
        ))}
      </div>

      {/* Chat History Feed */}
      <div 
        role="log"
        aria-live="polite"
        aria-label="Copilot conversation transcript"
        className="bg-slate-950/80 rounded-xl p-4 max-h-56 overflow-y-auto space-y-3 border border-slate-800 text-xs font-sans"
      >
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
              }`}
            >
              {msg.sender === 'ai' && (
                <span className="text-[10px] font-bold text-teal-400 block mb-1 uppercase tracking-wider">
                  Logistics Copilot (Live State)
                </span>
              )}
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input Bar with Accessible Label */}
      <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="flex items-center space-x-2 pt-1">
        <label htmlFor="copilot-input" className="sr-only">
          Ask Warehouse AI Copilot
        </label>
        <input
          id="copilot-input"
          type="text"
          placeholder="Ask AI Copilot about orders, bottlenecks, SLA breach risks, or SKUs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          aria-label="Send question to AI Copilot"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Ask
        </button>
      </form>
    </section>
  );
}
