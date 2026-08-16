'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// 3D Warehouse Box Stack Component (8-10 simple Box meshes)
function WarehouseBoxStack() {
  const boxes = [
    // Base Layer
    { position: [-1.2, 0, -1.2], args: [1.8, 1.2, 1.8], color: '#d97706' }, // Cardboard brown
    { position: [1.2, 0, -1.2], args: [1.8, 1.2, 1.8], color: '#475569' },  // Slate crate
    { position: [-1.2, 0, 1.2], args: [1.8, 1.2, 1.8], color: '#2563eb' },  // Indigo container
    { position: [1.2, 0, 1.2], args: [1.8, 1.2, 1.8], color: '#d97706' },   // Cardboard brown

    // Second Layer
    { position: [-0.6, 1.3, -0.6], args: [1.6, 1.1, 1.6], color: '#059669' }, // Emerald container
    { position: [0.6, 1.3, -0.6], args: [1.6, 1.1, 1.6], color: '#d97706' },  // Cardboard brown
    { position: [0, 1.3, 0.6], args: [1.6, 1.1, 1.6], color: '#dc2626' },     // Urgent red box

    // Top Layer
    { position: [0, 2.5, 0], args: [1.4, 1.0, 1.4], color: '#7c3aed' }        // Purple QC crate
  ];

  return (
    <group position={[0, -0.8, 0]}>
      {/* Wooden Pallet Base */}
      <mesh position={[0, -0.7, 0]}>
        <boxGeometry args={[4.8, 0.2, 4.8]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>

      {/* Stacked Crates */}
      {boxes.map((box, idx) => (
        <mesh key={idx} position={box.position}>
          <boxGeometry args={box.args} />
          <meshStandardMaterial
            color={box.color}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// Simple fallback while Three.js initializes
function HeroFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950/50">
      <div className="flex items-center space-x-3 text-slate-400 font-mono text-xs">
        <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
        <span>Initializing 3D Scene...</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-slate-950 text-white flex flex-col justify-center overflow-hidden -m-6 px-6 py-12">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-12 z-10">
        
        {/* Left Column: Overlay Copy & CTA */}
        <div className="space-y-8 text-center lg:text-left">
          
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Decision-Driven Warehouse Logistics</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Smart Warehouse <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Operations
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-xl font-medium leading-relaxed mx-auto lg:mx-0">
              Real-time decisions. Real-time fulfillment.
            </p>
          </div>

          <p className="text-sm text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Automated stock allocation algorithms, 2.5D storage zone matrix, 5-stage Kanban pipeline, and plain-English decision auditing.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center space-x-2"
            >
              <span>View Dashboard ➔</span>
            </Link>

            <Link
              href="/orders"
              className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm rounded-2xl border border-slate-800 hover:border-slate-700 transition-all"
            >
              Orders Queue
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-900 max-w-lg mx-auto lg:mx-0">
            <div>
              <p className="text-xl font-extrabold text-white">20 SKUs</p>
              <p className="text-[11px] text-slate-400">Tracked Catalog</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-teal-400">100%</p>
              <p className="text-[11px] text-slate-400">Plain-English Logs</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-indigo-400">5 Stages</p>
              <p className="text-[11px] text-slate-400">Fulfillment Pipeline</p>
            </div>
          </div>

        </div>

        {/* Right Column: Lightweight 3D Three.js Rotating Scene */}
        <div className="w-full h-[400px] sm:h-[480px] rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          <Suspense fallback={<HeroFallback />}>
            <Canvas
              camera={{ position: [5, 4, 6], fov: 45 }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.7} />
              <directionalLight position={[10, 15, 10]} intensity={1.2} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              
              <WarehouseBoxStack />

              <OrbitControls
                autoRotate
                autoRotateSpeed={1.8}
                enableZoom={false}
                enablePan={false}
                enableRotate={false}
              />
            </Canvas>
          </Suspense>

          {/* Subtle Scene Label Overlay */}
          <div className="absolute bottom-4 left-4 pointer-events-none px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400">
            3D Pallet Telemetry • R3F Renderer
          </div>
        </div>

      </div>
    </div>
  );
}
