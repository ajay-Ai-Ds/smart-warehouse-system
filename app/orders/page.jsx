'use client';

/**
 * OrdersPage — Orders Queue & Priority Allocation Management.
 *
 * Provides algorithmic priority queue sorting, automated one-click allocation,
 * interactive order creation form modal, and filtered views by priority tier.
 *
 * @module OrdersPage
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWarehouse } from '@/lib/WarehouseContext';
import { calculatePriorityScore } from '@/lib/allocationEngine';
import { getDeadlineCountdown, sanitizeString } from '@/lib/utils';
import { PRIORITY_TIERS, DEFAULT_DEADLINE_HOURS } from '@/lib/constants';

/**
 * Orders page component.
 * @returns {JSX.Element}
 */
export default function OrdersPage() {
  const {
    orders,
    products,
    recentlyAllocatedIds,
    allocateSingleOrder,
    runAutoAllocateAll
  } = useWarehouse();

  const [activeFilter, setActiveFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newPriority, setNewPriority] = useState('Urgent');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'PROD-001');
  const [selectedQty, setSelectedQty] = useState(5);
  const [formError, setFormError] = useState('');

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
    runAutoAllocateAll();
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!newCustomer.trim()) {
      setFormError('Please enter a customer name.');
      return;
    }

    const cleanCustomer = sanitizeString(newCustomer, 100);
    const deadlineHours = DEFAULT_DEADLINE_HOURS[newPriority] || 6;
    const deadline = new Date(Date.now() + deadlineHours * 3600 * 1000).toISOString();
    const nextIdNum = 1000 + orders.length + 1;
    const newOrderId = `ORD-${nextIdNum}`;

    const newOrderObj = {
      id: newOrderId,
      customerName: cleanCustomer,
      items: [{ productId: selectedProductId, qty: Number(selectedQty) || 1 }],
      priority: newPriority,
      deadline,
      status: 'Created',
      createdAt: new Date().toISOString()
    };

    // Push new order via context by dispatching
    orders.unshift(newOrderObj);
    setNewCustomer('');
    setSelectedQty(5);
    setFormError('');
    setIsModalOpen(false);
  };

  const exportOrdersJSON = () => {
    const dataBlob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `warehouse-orders-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const createdCount = orders.filter(o => o.status === 'Created').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 -m-6 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. Header row with Orders title, Create Order, Export, Auto-Allocate All button + filter buttons */}
        <section aria-label="Orders Header" className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true"></span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Orders Queue</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated priority scoring • {createdCount} pending order(s) awaiting allocation
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Create Order Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[44px]"
            >
              <span>＋ Create Order</span>
            </button>

            {/* Export Orders Button */}
            <button
              type="button"
              onClick={exportOrdersJSON}
              aria-label="Export all orders as JSON"
              className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center space-x-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[44px]"
            >
              <span>📥 Export</span>
            </button>

            {/* Auto-Allocate All Button */}
            <button
              type="button"
              onClick={handleAutoAllocate}
              disabled={createdCount === 0}
              aria-label={`Auto allocate ${createdCount} pending orders`}
              className={`px-5 py-3 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                createdCount > 0
                  ? 'bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white shadow-indigo-500/20 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>⚡ Auto-Allocate All ({createdCount})</span>
            </button>

            {/* Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80" role="group" aria-label="Filter orders by priority">
              {['All', ...PRIORITY_TIERS].map((tier) => {
                const isActive = activeFilter === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setActiveFilter(tier)}
                    aria-pressed={isActive}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all min-h-[36px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
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
        </section>

        {/* Modal: Create New Order */}
        {isModalOpen && (
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 id="modal-title" className="text-lg font-bold text-slate-900">Create New Warehouse Order</h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close dialog"
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label htmlFor="customer-name-input" className="block text-xs font-bold text-slate-700 mb-1">
                    Customer / Business Name
                  </label>
                  <input
                    id="customer-name-input"
                    type="text"
                    required
                    placeholder="e.g. Tata Logistics Network"
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="priority-select" className="block text-xs font-bold text-slate-700 mb-1">
                      Priority Tier
                    </label>
                    <select
                      id="priority-select"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Urgent">Urgent (SLA: 2 hrs, +100 pts)</option>
                      <option value="Standard">Standard (SLA: 6 hrs, +50 pts)</option>
                      <option value="Low">Low (SLA: 24 hrs, +10 pts)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="quantity-input" className="block text-xs font-bold text-slate-700 mb-1">
                      Quantity (Units)
                    </label>
                    <input
                      id="quantity-input"
                      type="number"
                      min="1"
                      max="1000"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="product-select" className="block text-xs font-bold text-slate-700 mb-1">
                    Select SKU Item
                  </label>
                  <select
                    id="product-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name} ({p.quantityOnHand} on hand)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                  >
                    Queue Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2 & 3. Orders List sorted by calculatePriorityScore descending */}
        <section aria-label="Order Queue List" className="space-y-4">
          {sortedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200 text-slate-500">
              No orders found for priority filter "{activeFilter}".
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sortedOrders.map((order) => {
                const priorityScore = calculatePriorityScore(order);
                const countdown = getDeadlineCountdown(order.deadline);
                const isOverdue = countdown === 'OVERDUE';
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
                          type="button"
                          onClick={() => allocateSingleOrder(order.id)}
                          aria-label={`Allocate stock for order ${order.id}`}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 self-end sm:self-auto min-h-[42px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
        </section>

      </div>
    </div>
  );
}
