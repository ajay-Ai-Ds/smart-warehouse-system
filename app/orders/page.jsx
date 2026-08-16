'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWarehouse } from '@/lib/WarehouseContext';
import { calculatePriorityScore } from '@/lib/allocationEngine';

function getDeadlineCountdown(deadlineString) {
  if (!deadlineString) return 'No deadline';
  const now = new Date();
  const deadline = new Date(deadlineString);
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return 'Overdue';
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}

export default function OrdersPage() {
  const {
    orders,
    products,
    recentlyAllocatedIds,
    allocateSingleOrder,
    runAutoAllocateAll
  } = useWarehouse();

  const [activeFilter, setActiveFilter] = useState('All');
  const [isAllocatingAnim, setIsAllocatingAnim] = useState(false);

  // Build product lookup dictionary
  const productMap = useMemo(() => {
    return new Map(products.map(p => [p.id, p.name]));
  }, [products]);

  // Filter orders by priority tier
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'All') return orders;
    return orders.filter(o => o.priority === activeFilter);
  }, [orders, activeFilter]);

  // Sort filtered orders by calculated priority score descending
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const scoreA = calculatePriorityScore(a);
      const scoreB = calculatePriorityScore(b);
      return scoreB - scoreA;
    });
  }, [filteredOrders]);

  const handleAutoAllocate = () => {
    setIsAllocatingAnim(true);
    runAutoAllocateAll();
    setTimeout(() => setIsAllocatingAnim(false), 1500);
  };

  const createdCount = orders.filter(o => o.status === 'Created').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 -m-6 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. Header row with Orders title, Auto-Allocate All button + filter buttons */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600"></span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Orders Queue</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated priority scoring • {createdCount} pending order(s) awaiting allocation
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-Allocate All Button */}
            <button
              onClick={handleAutoAllocate}
              disabled={createdCount === 0}
              className={`px-5 py-3 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 min-h-[44px] ${
                createdCount > 0
                  ? 'bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white shadow-indigo-500/20 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>⚡ Auto-Allocate All ({createdCount})</span>
            </button>

            {/* Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              {['All', 'Urgent', 'Standard', 'Low'].map((tier) => {
                const isActive = activeFilter === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => setActiveFilter(tier)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2 & 3. Orders List sorted by calculatePriorityScore descending */}
        <div className="space-y-4">
          {sortedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200 text-slate-500">
              No orders found for priority filter "{activeFilter}".
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sortedOrders.map((order) => {
                const priorityScore = calculatePriorityScore(order);
                const countdown = getDeadlineCountdown(order.deadline);
                const isOverdue = countdown === 'Overdue';
                const isRecentlyUpdated = recentlyAllocatedIds.has(order.id);

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-white rounded-2xl border transition-all p-4 sm:p-6 space-y-4 shadow-sm hover:shadow-md ${
                      isRecentlyUpdated
                        ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20 shadow-indigo-100'
                        : 'border-slate-200/80 hover:border-indigo-200'
                    }`}
                  >
                    {/* Top Row: Order ID, Customer Name, Score & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                        <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {order.id}
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-slate-800 break-words leading-tight">{order.customerName}</h2>

                        {/* Priority Badge */}
                        {order.priority === 'Urgent' && (
                          <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-red-100 text-red-700 border border-red-200">
                            Urgent
                          </span>
                        )}
                        {order.priority === 'Standard' && (
                          <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                            Standard
                          </span>
                        )}
                        {order.priority === 'Low' && (
                          <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            Low
                          </span>
                        )}

                        {/* Calculated Priority Score Badge */}
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs">
                          Score: {priorityScore}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Deadline Countdown */}
                        <div className="text-xs font-medium">
                          <span className="text-slate-400">Deadline: </span>
                          <span className={`font-mono font-bold ${
                            isOverdue ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded' : 'text-slate-700'
                          }`}>
                            ⏱️ {countdown}
                          </span>
                        </div>

                        {/* Status Stage Badge */}
                        <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                          order.status === 'Created' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                          order.status === 'Allocated' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          order.status === 'Partial' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          order.status === 'Waiting' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          order.status === 'Picking' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          order.status === 'Packing' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                          order.status === 'QC' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          order.status === 'Dispatched' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section: Items Requested Breakdown */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items Requested:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {order.items.map((item, idx) => {
                          const productName = productMap.get(item.productId) || item.productId;

                          return (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                              <span className="font-semibold text-slate-700 truncate mr-2">{productName}</span>
                              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                {item.qty} u
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="text-[11px] text-slate-400 font-mono">
                        Created: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      {order.status === 'Created' && (
                        <button
                          onClick={() => allocateSingleOrder(order.id)}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 self-end sm:self-auto min-h-[42px]"
                        >
                          Allocate Stock ➔
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

      </div>
    </div>
  );
}
