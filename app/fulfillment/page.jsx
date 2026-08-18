'use client';

/**
 * FulfillmentPage — 5-Stage Kanban Order Pipeline.
 *
 * Real-time Kanban board managing order transitions across:
 * Allocated ➔ Picking ➔ Packing ➔ QC ➔ Dispatched with automated
 * exception simulation and manual resolution controls.
 *
 * @module FulfillmentPage
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWarehouse } from '@/lib/WarehouseContext';
import { KANBAN_COLUMNS } from '@/lib/constants';

/**
 * Fulfillment Kanban page component.
 * @returns {JSX.Element}
 */
export default function FulfillmentPage() {
  const { orders, products, moveOrderStage, resolveException } = useWarehouse();

  // Product Map for resolving product names
  const productMap = useMemo(() => {
    return new Map(products.map(p => [p.id, p.name]));
  }, [products]);

  // Next stage label helper
  const getNextStageLabel = (currentStatus) => {
    switch (currentStatus) {
      case 'Allocated': return 'Move to Picking ➔';
      case 'Picking': return 'Move to Packing ➔';
      case 'Packing': return 'Move to QC ➔';
      case 'QC': return 'Dispatch Order ➔';
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 -m-6 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header & Flow Legend */}
        <section aria-label="Kanban Header" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Order Fulfillment Kanban</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time tracking of order movement through picking, packing, quality control, and dispatch
              </p>
            </div>
          </div>

          {/* Workflow Legend */}
          <div className="pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs overflow-x-auto py-1" role="region" aria-label="Kanban workflow stage sequence">
            <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] shrink-0">Stage Flow:</span>
            <div className="flex items-center space-x-2 font-medium shrink-0">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200">Created</span>
              <span className="text-slate-400 font-bold" aria-hidden="true">➔</span>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md font-bold border border-blue-200">Allocated</span>
              <span className="text-slate-400 font-bold" aria-hidden="true">➔</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md font-bold border border-amber-200">Picking</span>
              <span className="text-slate-400 font-bold" aria-hidden="true">➔</span>
              <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-md font-bold border border-orange-200">Packing</span>
              <span className="text-slate-400 font-bold" aria-hidden="true">➔</span>
              <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-md font-bold border border-purple-200">QC</span>
              <span className="text-slate-400 font-bold" aria-hidden="true">➔</span>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold border border-emerald-200">Dispatched</span>
            </div>
          </div>
        </section>

        {/* Kanban Board Container (Horizontal Scroll for Mobile/Tablet) */}
        <section aria-label="Kanban Columns Board" className="overflow-x-auto pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 min-w-[1250px]">
            {KANBAN_COLUMNS.map((column) => {
              const columnOrders = orders.filter(o => o.status === column.id);

              return (
                <div
                  key={column.id}
                  className={`rounded-2xl border ${column.border} ${column.bg} p-4 flex flex-col min-h-[650px] shadow-sm`}
                  role="region"
                  aria-label={`${column.title} column with ${columnOrders.length} orders`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4">
                    <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">{column.title}</h2>
                    <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full ${column.badgeBg}`}>
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* Column Cards Container */}
                  <div className="flex-1 space-y-4 overflow-y-auto max-h-[750px] pr-1">
                    {columnOrders.length === 0 ? (
                      <div className="h-32 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 font-medium">
                        No orders in {column.title}
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {columnOrders.map((order) => {
                          const totalUnits = order.items.reduce((sum, item) => sum + item.qty, 0);
                          const nextButtonLabel = getNextStageLabel(order.status);

                          return (
                            <motion.div
                              key={order.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.25 }}
                              className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition space-y-3 ${
                                order.hasException
                                  ? 'border-red-300 ring-2 ring-red-400/50 bg-red-50/30'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {/* Order Card Header */}
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {order.id}
                                </span>

                                {/* Priority Badge */}
                                {order.priority === 'Urgent' && (
                                  <span className="px-2 py-0.5 text-[11px] font-extrabold rounded bg-red-100 text-red-700 border border-red-200">
                                    Urgent
                                  </span>
                                )}
                                {order.priority === 'Standard' && (
                                  <span className="px-2 py-0.5 text-[11px] font-extrabold rounded bg-blue-100 text-blue-700 border border-blue-200">
                                    Standard
                                  </span>
                                )}
                                {order.priority === 'Low' && (
                                  <span className="px-2 py-0.5 text-[11px] font-extrabold rounded bg-gray-100 text-gray-700 border border-gray-200">
                                    Low
                                  </span>
                                )}
                              </div>

                              {/* Customer & Items Summary */}
                              <div>
                                <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{order.customerName}</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {order.items.length} item(s) • <span className="font-semibold text-slate-700">{totalUnits} units</span>
                                </p>
                              </div>

                              {/* Items List Preview */}
                              <div className="bg-slate-50 rounded-lg p-2 text-[11px] space-y-1 border border-slate-100">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-slate-600">
                                    <span className="truncate max-w-[140px]">{productMap.get(item.productId) || item.productId}</span>
                                    <span className="font-bold text-indigo-600">x{item.qty}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Exception Warning Banner if Flagged */}
                              {order.hasException && (
                                <div role="alert" className="p-2.5 bg-red-100/80 border border-red-200 rounded-lg space-y-2 text-xs">
                                  <div className="flex items-center space-x-1.5 text-red-800 font-extrabold text-[11px]">
                                    <span aria-hidden="true">⚠️</span>
                                    <span>Exception Flagged!</span>
                                  </div>
                                  <p className="text-[10px] text-red-700 leading-tight">
                                    {order.exceptionReason || 'Missing/damaged item during picking.'}
                                  </p>

                                  <div className="flex flex-col gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => resolveException(order.id, 'resolve')}
                                      aria-label={`Resolve exception for order ${order.id} and move to packing`}
                                      className="w-full py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded text-[11px] shadow-xs transition cursor-pointer"
                                    >
                                      ✓ Resolve &amp; Move to Packing
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => resolveException(order.id, 'cancel')}
                                      aria-label={`Cancel order ${order.id} due to exception`}
                                      className="w-full py-1 px-2 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded text-[11px] transition cursor-pointer"
                                    >
                                      ✖ Cancel Order
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Normal Advance Stage Button */}
                              {!order.hasException && nextButtonLabel && (
                                <button
                                  type="button"
                                  onClick={() => moveOrderStage(order.id, order.status)}
                                  aria-label={`Advance order ${order.id} to next stage: ${nextButtonLabel}`}
                                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center justify-center space-x-1 active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                  <span>{nextButtonLabel}</span>
                                </button>
                              )}

                              {/* Dispatched Checkmark */}
                              {order.status === 'Dispatched' && (
                                <div className="py-1.5 text-center bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-extrabold text-xs">
                                  ✓ Order Completed
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
