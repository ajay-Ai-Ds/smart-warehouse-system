'use client';

import { useState } from 'react';
import { useWarehouse } from '@/lib/WarehouseContext';

export default function WarehouseCopilot() {
  const { orders, products, decisionLogs } = useWarehouse();
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your Logistics AI Copilot. Ask me live questions about order delays, SKU reorders, or SLA fulfillment rates.'
    }
  ]);

  const SAMPLE_QUERIES = [
    "Why was Order #ORD-1019 delayed?",
    "Which SKUs need emergency reorder?",
    "What is our current fulfillment rate?"
  ];

  const handleAsk = (textToAsk) => {
    const q = textToAsk || query;
    if (!q.trim()) return;

    const userMsg = { sender: 'user', text: q };
    let aiResponse = '';
    const lowerQ = q.toLowerCase();

    // 1. Order Specific Delay Lookup (Dynamically inspects orders & decisionLogs state)
    const orderIdMatch = q.match(/ORD-\d+/i) || q.match(/\b\d{4}\b/);
    
    if (orderIdMatch || lowerQ.includes('delay') || lowerQ.includes('why')) {
      let targetOrder = null;
      if (orderIdMatch) {
        const matchedIdStr = orderIdMatch[0].toUpperCase();
        targetOrder = orders.find(o => o.id.toUpperCase().includes(matchedIdStr));
      }

      if (!targetOrder && lowerQ.includes('1019')) {
        targetOrder = orders.find(o => o.id.includes('1019'));
      }

      if (!targetOrder) {
        // Find any delayed / waiting / partial order from live state
        targetOrder = orders.find(o => o.status === 'Waiting' || o.status === 'Partial') || orders[0];
      }

      if (targetOrder) {
        // Find decision log entry corresponding to this order ID
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
    // 2. Emergency Reorder SKUs (Queries current product state)
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
    // 3. Live Fulfillment Rate Calculation
    else if (lowerQ.includes('rate') || lowerQ.includes('fulfillment') || lowerQ.includes('dispatched') || lowerQ.includes('stat')) {
      const totalOrders = orders.length;
      const dispatchedCount = orders.filter(o => o.status === 'Dispatched').length;
      const allocatedCount = orders.filter(o => o.status === 'Allocated').length;
      const pickingCount = orders.filter(o => o.status === 'Picking').length;

      const rate = totalOrders > 0 ? Math.round((dispatchedCount / totalOrders) * 100) : 0;

      aiResponse = `Live SLA Fulfillment Completion Rate: ${rate}% (${dispatchedCount} of ${totalOrders} total orders dispatched). Currently ${pickingCount} orders in active picking and ${allocatedCount} orders fully allocated.`;
    } 
    // 4. Default Dynamic Fallback
    else {
      const urgentCount = orders.filter(o => o.priority === 'Urgent').length;
      aiResponse = `Logistics AI Copilot evaluated ${orders.length} live orders and ${products.length} SKUs. Currently tracking ${urgentCount} Urgent SLA orders. System priority scoring algorithm is active.`;
    }

    setChatHistory(prev => [...prev, userMsg, { sender: 'ai', text: aiResponse }]);
    setQuery('');
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center font-bold text-white text-sm shadow-md">
            🤖
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Warehouse AI Copilot</h2>
            <p className="text-[11px] text-slate-400">Live dynamic inspector connected to system state</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-mono font-bold rounded-full animate-pulse">
          LIVE DATA CONNECTED
        </span>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2 pt-1">
        {SAMPLE_QUERIES.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(sq)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition text-left"
          >
            💡 {sq}
          </button>
        ))}
      </div>

      {/* Chat History Feed */}
      <div className="bg-slate-950/80 rounded-xl p-4 max-h-56 overflow-y-auto space-y-3 border border-slate-800 text-xs font-sans">
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

      {/* Chat Input Bar */}
      <div className="flex items-center space-x-2 pt-1">
        <input
          type="text"
          placeholder="Ask AI Copilot about any order ID, SKU reorder, or rate..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => handleAsk()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
