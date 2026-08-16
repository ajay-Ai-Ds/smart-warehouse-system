'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWarehouse } from '@/lib/WarehouseContext';

export default function WarehouseGrid() {
  const { products, recentlyAllocatedIds } = useWarehouse();
  const [hoveredBin, setHoveredBin] = useState(null);

  // 24 bins (6 columns x 4 rows)
  const totalBins = 24;
  const bins = Array.from({ length: totalBins }, (_, i) => {
    const product = products.length > 0 ? products[i % products.length] : null;
    return {
      binId: `ZONE-${String.fromCharCode(65 + Math.floor(i / 6))}${ (i % 6) + 1 }`,
      index: i,
      product
    };
  });

  const isAllocatingActive = recentlyAllocatedIds && recentlyAllocatedIds.size > 0;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            <h2 className="text-lg font-bold text-white tracking-tight">Warehouse Overview</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">2.5D Isometric Inventory Storage Grid (24 Zones)</p>
        </div>

        {/* Bin Color Legend */}
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span className="text-slate-300">Healthy (&gt;1.5x)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            <span className="text-slate-300">Low (1-1.5x)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-red-500 shadow-sm shadow-red-500/50"></span>
            <span className="text-slate-300">Reorder Triggered</span>
          </span>
        </div>
      </div>

      {/* 2.5D Isometric Canvas Container */}
      <div className="relative py-10 px-4 flex justify-center items-center min-h-[360px] overflow-hidden bg-slate-950/80 rounded-xl border border-slate-800">
        
        {/* Subtle grid background gridline pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* Isometric 6x4 Grid Container */}
        <div
          className="grid grid-cols-6 gap-3 sm:gap-4 md:gap-5 transition-transform duration-500"
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

            let bgStyle = 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400 text-emerald-50 shadow-emerald-950/60';
            
            if (onHand <= reorder) {
              bgStyle = 'bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-red-50 shadow-red-950/60';
            } else if (onHand <= reorder * 1.5) {
              bgStyle = 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-300 text-amber-50 shadow-amber-950/60';
            }

            return (
              <motion.div
                key={bin.index}
                onMouseEnter={() => setHoveredBin(bin)}
                onMouseLeave={() => setHoveredBin(null)}
                animate={isAllocatingActive ? {
                  scale: [1, 1.15, 1],
                  filter: ['brightness(1)', 'brightness(1.6)', 'brightness(1)']
                } : {}}
                transition={{ duration: 0.8, delay: (bin.index % 6) * 0.1 }}
                whileHover={{ scale: 1.18, z: 20 }}
                className={`relative w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl ${bgStyle} border-2 cursor-pointer shadow-xl flex flex-col items-center justify-center font-mono font-extrabold text-[10px] sm:text-xs transition-all`}
                style={{
                  boxShadow: '4px 8px 12px rgba(0,0,0,0.6), inset 0px 2px 4px rgba(255,255,255,0.3)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <span>{bin.binId}</span>
                <span className="text-[9px] sm:text-[10px] opacity-90">{onHand}u</span>
              </motion.div>
            );
          })}
        </div>

        {/* Floating Tooltip overlay */}
        {hoveredBin && hoveredBin.product && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-md text-xs space-y-2 z-30 min-w-[220px] font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-mono font-extrabold text-teal-400 text-xs">{hoveredBin.binId}</span>
              <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">{hoveredBin.product.sku}</span>
            </div>
            <p className="font-bold text-white text-xs leading-snug">{hoveredBin.product.name}</p>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-400">On Hand Stock:</span>
              <span className={`font-extrabold font-mono ${
                hoveredBin.product.quantityOnHand <= hoveredBin.product.reorderPoint ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {hoveredBin.product.quantityOnHand} units
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Reorder Threshold:</span>
              <span className="font-mono font-semibold text-slate-300">{hoveredBin.product.reorderPoint} units</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
