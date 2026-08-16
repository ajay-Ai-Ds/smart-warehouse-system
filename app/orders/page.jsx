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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 -m-6 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. Header row with Orders title, Auto-Allocate All button + filter buttons */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              className={`px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 ${
                createdCount > 0
                  ? 'bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white shadow-indigo-500/20 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span className={`text-base ${isAllocatingAnim ? 'animate-spin' : ''}`}>⚡</span>
              <span>Auto-Allocate All ({createdCount})</span>
            </button>

            {/* Priority Filters */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/70">
              {['All', 'Urgent', 'Standard', 'Low'].map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      isActive
                        ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2 & 3. Orders List sorted by calculatePriorityScore descending */}
        <div className="space-y-4">
          {sortedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
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
                    className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 space-y-4 shadow-sm hover:shadow-md ${
                      isRecentlyUpdated
                        ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20 shadow-indigo-100'
                        : 'border-slate-200/80 hover:border-indigo-200'
                    }`}
                  >
                    {/* Top Row: Order ID, Customer Name, Score & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center flex-wrap gap-3">
                        <span className="font-mono text-base font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                          {order.id}
                        </span>
                        <h2 className="text-base font-bold text-slate-800">{order.customerName}</h2>

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

                      <div className="flex items-center space-x-3">
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

                    {/* Middle Row: Items List & Allocation Action */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                      <div className="space-y-1.5 flex-1">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Items Requested</span>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, idx) => {
                            const productName = productMap.get(item.productId) || item.productId;
                            return (
                              <span
                                key={idx}
                                className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200/80 flex items-center space-x-1.5"
                              >
                                <span className="font-bold text-indigo-600">{item.qty}x</span>
                                <span>{productName}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* "Allocate Stock" button (only visible if status is "Created") */}
                      {order.status === 'Created' && (
                        <div className="md:self-end">
                          <button
                            onClick={() => allocateSingleOrder(order.id)}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5"
                          >
                            <span>⚡ Allocate Stock</span>
                          </button>
                        </div>
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
