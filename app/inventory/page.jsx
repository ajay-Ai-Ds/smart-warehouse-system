'use client';

import { useState, useMemo } from 'react';
import { useWarehouse } from '@/lib/WarehouseContext';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 -m-6 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500"></span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Inventory Catalog</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Stock levels, velocity metrics, and automated reorder recommendations • {products.length} total SKUs
            </p>
          </div>

          {/* Quick Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Search SKU or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-60"
            />

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              {[
                { id: 'All', label: 'All' },
                { id: 'LowStock', label: `Low Stock (${lowStockTotal})` },
                { id: 'Fast', label: 'Fast' },
                { id: 'Medium', label: 'Medium' },
                { id: 'Slow', label: 'Slow' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
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
        </div>

        {/* Products Inventory Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 divide-y divide-slate-100">
              <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4 font-bold">SKU</th>
                  <th className="px-5 py-4 font-bold">Product Name</th>
                  <th className="px-5 py-4 font-bold text-center">On Hand</th>
                  <th className="px-5 py-4 font-bold text-center">Reorder Point</th>
                  <th className="px-5 py-4 font-bold text-center">Velocity</th>
                  <th className="px-5 py-4 font-bold text-center">Stock Health</th>
                  <th className="px-5 py-4 font-bold text-right">Suggested Reorder Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                      No products match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const onHand = Number(product.quantityOnHand);
                    const reorder = Number(product.reorderPoint);

                    let healthStatus = 'Healthy';
                    let rowBg = 'hover:bg-slate-50/80';
                    let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                    if (onHand <= reorder) {
                      healthStatus = 'Reorder Triggered';
                      rowBg = 'bg-red-50/40 hover:bg-red-50/70';
                      badgeBg = 'bg-red-100 text-red-800 border-red-200';
                    } else if (onHand <= reorder * 1.5) {
                      healthStatus = 'Getting Low';
                      rowBg = 'bg-amber-50/40 hover:bg-amber-50/70';
                      badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
                    }

                    // Suggested Reorder Qty = (reorderPoint * 2 - quantityOnHand) for low-stock items
                    const suggestedReorder = onHand <= reorder
                      ? Math.max(0, reorder * 2 - onHand)
                      : null;

                    return (
                      <tr key={product.id} className={`transition ${rowBg}`}>
                        <td className="px-5 py-4 font-mono font-bold text-indigo-600 text-xs">{product.sku}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">{product.name}</td>
                        <td className={`px-5 py-4 font-mono font-extrabold text-center text-base ${
                          onHand <= reorder ? 'text-red-600' : 'text-slate-800'
                        }`}>
                          {onHand}
                        </td>
                        <td className="px-5 py-4 font-mono text-center text-slate-500 text-xs">{reorder}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                            product.velocity === 'Fast' ? 'bg-emerald-100 text-emerald-800' :
                            product.velocity === 'Medium' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {product.velocity}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-3 py-1 text-xs font-extrabold rounded-full border ${badgeBg}`}>
                            {healthStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold">
                          {suggestedReorder !== null ? (
                            <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-lg text-xs shadow-xs">
                              +{suggestedReorder} units
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
