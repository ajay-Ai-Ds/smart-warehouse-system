'use client';

/**
 * InventoryPage — Catalog, Stock Health & Reorder Recommendations.
 *
 * Real-time table view of 20 catalog SKUs with search, velocity filters,
 * health status badges, and automated reorder quantity suggestions.
 *
 * @module InventoryPage
 */

import { useState, useMemo } from 'react';
import { useWarehouse } from '@/lib/WarehouseContext';

/**
 * Inventory page component.
 * @returns {JSX.Element}
 */
export default function InventoryPage() {
  const { products } = useWarehouse();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('All');

  // Filter products by search query and stock status
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const onHand = Number(product.quantityOnHand);
      const reorder = Number(product.reorderPoint);

      if (filterMode === 'LowStock') return onHand <= reorder;
      if (filterMode === 'Fast') return product.velocity === 'Fast';
      if (filterMode === 'Medium') return product.velocity === 'Medium';
      if (filterMode === 'Slow') return product.velocity === 'Slow';

      return true;
    });
  }, [products, searchQuery, filterMode]);

  const lowStockTotal = products.filter(p => Number(p.quantityOnHand) <= Number(p.reorderPoint)).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 -m-6 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <section aria-label="Inventory Header" className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500" aria-hidden="true"></span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Inventory Catalog</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Stock levels, velocity metrics, and automated reorder recommendations • {products.length} total SKUs
            </p>
          </div>

          {/* Quick Search & Filters with accessible label */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-60">
              <label htmlFor="inventory-search" className="sr-only">
                Search SKU or product name
              </label>
              <input
                id="inventory-search"
                type="text"
                placeholder="Search SKU or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full min-h-[42px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 w-full sm:w-auto justify-center" role="group" aria-label="Filter products by velocity or stock">
              {[
                { id: 'All', label: 'All' },
                { id: 'LowStock', label: `Low Stock (${lowStockTotal})` },
                { id: 'Fast', label: 'Fast' },
                { id: 'Medium', label: 'Medium' },
                { id: 'Slow', label: 'Slow' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  aria-pressed={filterMode === tab.id}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition min-h-[36px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    filterMode === tab.id
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products Inventory Table */}
        <section aria-label="Inventory Table" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 divide-y divide-slate-100 min-w-[700px]">
              <caption className="sr-only">Warehouse Inventory Stock and Health Status Catalog</caption>
              <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-4 font-bold">SKU</th>
                  <th scope="col" className="px-5 py-4 font-bold">Product Name</th>
                  <th scope="col" className="px-5 py-4 font-bold text-center">On Hand</th>
                  <th scope="col" className="px-5 py-4 font-bold text-center">Reorder Point</th>
                  <th scope="col" className="px-5 py-4 font-bold text-center">Velocity</th>
                  <th scope="col" className="px-5 py-4 font-bold text-center">Stock Health</th>
                  <th scope="col" className="px-5 py-4 font-bold text-right">Suggested Reorder Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-xs">
                      No products match search query or status filter.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const onHand = Number(product.quantityOnHand);
                    const reorder = Number(product.reorderPoint);

                    let healthStatus = 'Healthy';
                    let healthStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    
                    if (onHand <= reorder) {
                      healthStatus = 'Reorder Triggered';
                      healthStyle = 'bg-red-100 text-red-800 border-red-200 font-extrabold';
                    } else if (onHand <= reorder * 1.5) {
                      healthStatus = 'Getting Low';
                      healthStyle = 'bg-amber-100 text-amber-800 border-amber-200';
                    }

                    // Suggested Reorder Qty = (reorderPoint * 2 - quantityOnHand) for low-stock items only
                    const suggestedReorder = onHand <= reorder ? Math.max(0, reorder * 2 - onHand) : 0;

                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-slate-50 transition ${
                          onHand <= reorder ? 'bg-red-50/30' : ''
                        }`}
                      >
                        <td className="px-5 py-4 font-mono text-xs font-bold text-slate-900">{product.sku}</td>
                        <td className="px-5 py-4 font-semibold text-slate-800">{product.name}</td>
                        <td className="px-5 py-4 text-center font-mono font-extrabold text-slate-900">{onHand}</td>
                        <td className="px-5 py-4 text-center font-mono text-slate-500">{reorder}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${
                            product.velocity === 'Fast' ? 'bg-indigo-100 text-indigo-700' :
                            product.velocity === 'Medium' ? 'bg-slate-100 text-slate-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {product.velocity}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${healthStyle}`}>
                            {healthStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {suggestedReorder > 0 ? (
                            <span className="px-3 py-1 font-mono font-extrabold text-xs rounded-lg bg-red-600 text-white shadow-sm">
                              +{suggestedReorder} units
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
