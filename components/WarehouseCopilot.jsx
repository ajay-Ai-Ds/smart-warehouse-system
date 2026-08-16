'use client';

import { useState } from 'react';
import { useWarehouse } from '@/lib/WarehouseContext';

export default function WarehouseCopilot() {
  const { orders, products, decisionLogs } = useWarehouse();
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your Logistics AI Copilot. Ask me anything about stock availability, order delays, or reorder priorities.'
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

    // Append user question
    const userMsg = { sender: 'user', text: q };
    let aiResponse = '';

    const lowerQ = q.toLowerCase();

    if (lowerQ.includes('delay') || lowerQ.includes('1019') || lowerQ.includes('why')) {
      const order1019 = orders.find(o => o.id.includes('1019'));
      if (order1019) {
        aiResponse = `Order ${order1019.id} (${order1019.priority} priority) was delayed because requested item quantity exceeded current available stock. High-priority Urgent orders (Scores >180) claimed inventory first.`;
      } else {
        aiResponse = `Orders are delayed when required stock falls below requested quantities and higher-priority Urgent orders consume available stock first.`;
      }
    } else if (lowerQ.includes('reorder') || lowerQ.includes('sku') || lowerQ.includes('emergency')) {
      const lowStock = products.filter(p => Number(p.quantityOnHand) <= Number(p.reorderPoint));
      if (lowStock.length > 0) {
        const skus = lowStock.map(p => `${p.sku} (${p.name})`).join(', ');
        aiResponse = `Top emergency reorder priorities: ${skus}. Total ${lowStock.length} SKU(s) currently below threshold.`;
      } else {
        aiResponse = `All 20 SKU stock levels are currently healthy above minimum reorder points.`;
      }
    } else if (lowerQ.includes('rate') || lowerQ.includes('fulfillment') || lowerQ.includes('stat')) {
      const dispatched = orders.filter(o => o.status === 'Dispatched').length;
      const rate = Math.round((dispatched / orders.length) * 100);
      aiResponse = `Current fulfillment completion rate is ${rate}% (${dispatched}/${orders.length} orders dispatched today).`;
    } else {
      aiResponse = `Logistics Engine Analysis: Evaluated ${orders.length} orders across 20 SKUs. Priority scoring algorithm is active and enforcing SLA deadlines.`;
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
            <p className="text-[11px] text-slate-400">Ask natural language questions about logistics decisions</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-mono font-bold rounded-full">
          AI ONLINE
        </span>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2 pt-1">
        {SAMPLE_QUERIES.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(sq)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition"
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
                  Logistics Copilot
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
          placeholder="Ask AI Copilot about any order or stock item..."
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
