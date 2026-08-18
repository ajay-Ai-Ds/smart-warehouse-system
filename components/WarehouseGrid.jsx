'use client';

/**
 * WarehouseGrid — 2.5D Isometric Inventory Matrix.
 *
 * Displays 24 visual warehouse storage zones using pure CSS 3D transforms.
 * Dynamically color-codes each storage bin by stock health and provides
 * keyboard accessible inspect tooltips.
 *
 * @module WarehouseGrid
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWarehouse } from '@/lib/WarehouseContext';

/**
 * WarehouseGrid component rendering 2.5D storage zones.
 *
 * @returns {JSX.Element}
 */
export default function WarehouseGrid() {
  const { products, recentlyAllocatedIds } = useWarehouse();
  const [hoveredBin, setHoveredBin] = useState(null);

  // 24 bins (6 columns x 4 rows)
  const totalBins = 24;
  const bins = Array.from({ length: totalBins }, (_, i) => {
    const product = products.length > 0 ? products[i % products.length] : null;
    return {
      binId: `ZONE-${String.fromCharCode(65 + Math.floor(i / 6))}${(i % 6) + 1}`,
      index: i,
      product
    };
  });

  const isAllocatingActive = recentlyAllocatedIds && recentlyAllocatedIds.size > 0;

  return (
    <section 
      aria-label="Warehouse Storage Grid" 
      className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 space-y-4 shadow-xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" aria-hidden="true"></span>
            <h2 className="text-lg font-bold text-white tracking-tight">Warehouse Storage Zones</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">2.5D Isometric Inventory Storage Grid (24 Zones)</p>
        </div>

        {/* Bin Color & Symbol Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold" role="region" aria-label="Inventory status legend">
          <span className="flex items-center space-x-1.5">
            <span className="w-4 h-4 rounded bg-emerald-500 shadow-sm shadow-emerald-500/50 flex items-center justify-center text-[10px] font-bold text-white" aria-hidden="true">✓</span>
            <span className="text-slate-300">Healthy (&gt;1.5x)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-4 h-4 rounded bg-amber-500 shadow-sm shadow-amber-500/50 flex items-center justify-center text-[10px] font-bold text-white" aria-hidden="true">▲</span>
            <span className="text-slate-300">Low (1-1.5x)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-4 h-4 rounded bg-red-500 shadow-sm shadow-red-500/50 flex items-center justify-center text-[10px] font-bold text-white" aria-hidden="true">!</span>
            <span className="text-slate-300">Reorder Triggered</span>
          </span>
        </div>
      </div>

      {/* 2.5D Isometric Canvas Container */}
      <div className="relative py-8 px-2 sm:px-4 flex justify-center items-center min-h-[340px] overflow-x-auto bg-slate-950/80 rounded-xl border border-slate-800 scrollbar-thin">
        {/* Subtle background gridline pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" aria-hidden="true"></div>

        <div className="min-w-[480px] sm:min-w-[550px] flex justify-center items-center py-6">
          {/* Isometric 6x4 Grid Container */}
          <div
            role="grid"
            aria-label="2.5D Warehouse Zone Layout"
            className="grid grid-cols-6 gap-2.5 sm:gap-4 md:gap-5 transition-transform duration-500"
            style={{
              transform: 'rotateX(55deg) rotateZ(-45deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            {bins.map((bin) => {
              const p = bin.product;
              if (!p) return null;

              const onHand = Number(p.quantityOnHand);
              const reorder = Number(p.reorderPoint);
              const isReorder = onHand <= reorder;
              const isLow = !isReorder && onHand <= reorder * 1.5;
              const statusText = isReorder ? 'Reorder Triggered' : isLow ? 'Low Stock' : 'Healthy Stock';
              const statusIcon = isReorder ? '!' : isLow ? '▲' : '✓';

              let bgStyle = 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400 text-emerald-50 shadow-emerald-950/60';
              
              if (isReorder) {
                bgStyle = 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-red-50 shadow-red-950/60';
              } else if (isLow) {
                bgStyle = 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-300 text-amber-50 shadow-amber-950/60';
              }

              return (
                <motion.div
                  key={bin.index}
                  role="button"
                  tabIndex={0}
                  aria-label={`${bin.binId}: ${p.name}, Stock level ${onHand} units. Status: ${statusText} (${statusIcon})`}
                  onMouseEnter={() => setHoveredBin(bin)}
                  onMouseLeave={() => setHoveredBin(null)}
                  onFocus={() => setHoveredBin(bin)}
                  onBlur={() => setHoveredBin(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setHoveredBin(hoveredBin?.index === bin.index ? null : bin);
                    }
                  }}
                  animate={isAllocatingActive ? {
                    scale: [1, 1.15, 1],
                    filter: ['brightness(1)', 'brightness(1.6)', 'brightness(1)']
                  } : {}}
                  transition={{ duration: 0.8, delay: (bin.index % 6) * 0.1 }}
                  whileHover={{ scale: 1.18, z: 20 }}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl ${bgStyle} border-2 cursor-pointer shadow-xl flex flex-col items-center justify-center font-mono font-extrabold text-[10px] sm:text-xs transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900`}
                  style={{
                    boxShadow: '4px 8px 12px rgba(0,0,0,0.6), inset 0px 2px 4px rgba(255,255,255,0.3)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div className="flex items-center space-x-0.5">
                    <span>{bin.binId}</span>
                    <span className="text-[8px] font-black bg-black/30 px-1 py-0.2 rounded-xs" aria-hidden="true">
                      {statusIcon}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] opacity-90">{onHand}u</span>

                  {/* Tooltip on Hover or Focus */}
                  {hoveredBin?.index === bin.index && (
                    <div
                      role="tooltip"
                      className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-sans p-2.5 rounded-lg border border-slate-700 shadow-2xl z-50 w-44 pointer-events-none"
                      style={{ transform: 'rotateZ(45deg) rotateX(-55deg) translateY(-20px)' }}
                    >
                      <p className="font-bold text-teal-300 truncate">{p.name}</p>
                      <div className="flex justify-between text-[10px] text-slate-300 mt-1">
                        <span>SKU: {p.sku}</span>
                        <span>Stock: <strong className="text-white">{onHand}</strong></span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
