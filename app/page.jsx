'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useWarehouse } from '@/lib/WarehouseContext';

// 3D Warehouse Box Stack Component
function WarehouseBoxStack() {
  const boxes = [
    // Base Layer
    { position: [-1.2, 0, -1.2], args: [1.8, 1.2, 1.8], color: '#d97706' },
    { position: [1.2, 0, -1.2], args: [1.8, 1.2, 1.8], color: '#475569' },
    { position: [-1.2, 0, 1.2], args: [1.8, 1.2, 1.8], color: '#2563eb' },
    { position: [1.2, 0, 1.2], args: [1.8, 1.2, 1.8], color: '#d97706' },

    // Second Layer
    { position: [-0.6, 1.3, -0.6], args: [1.6, 1.1, 1.6], color: '#059669' },
    { position: [0.6, 1.3, -0.6], args: [1.6, 1.1, 1.6], color: '#d97706' },
    { position: [0, 1.3, 0.6], args: [1.6, 1.1, 1.6], color: '#dc2626' },

    // Top Layer
    { position: [0, 2.5, 0], args: [1.4, 1.0, 1.4], color: '#7c3aed' }
  ];

  return (
    <group position={[0, -0.8, 0]}>
      <mesh position={[0, -0.7, 0]}>
        <boxGeometry args={[4.8, 0.2, 4.8]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>

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

function HeroFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950/40">
      <div className="flex items-center space-x-3 text-slate-400 font-mono text-xs">
        <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
        <span>Loading Telemetry...</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { orders, products } = useWarehouse();

  // Dynamically calculate business-impact stockout value saved from live orders state
  const stockoutValueSaved = useMemo(() => {
    const allocatedCount = orders.filter(o => o.status === 'Allocated' || o.status === 'Dispatched').length;
    const baseValue = 1245000;
    return baseValue + (allocatedCount * 15000);
  }, [orders]);

  return (
    <div className="relative min-h-[calc(100vh-65px)] text-white flex flex-col justify-center overflow-hidden -m-6 px-6 py-12 bg-slate-950">
      
      {/* Full Hero Cinematic 3D Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url('/hero-bg.jpg')` }}
      ></div>

      {/* Dark Navy & Slate Gradient Backdrop Overlays */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[3px]"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60"></div>

      {/* Glowing Neon Accent Lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-12 z-10">
        
        {/* Left Column: Overlay Hero Content & CTA */}
        <div className="space-y-8 text-center lg:text-left">
          
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/40 rounded-full text-indigo-300 text-xs font-bold tracking-wide backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Decision-Driven Warehouse Logistics</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-lg">
              Smart Warehouse <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Operations
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-200 max-w-xl font-semibold leading-relaxed mx-auto lg:mx-0 drop-shadow">
              Real-time decisions. Real-time fulfillment.
            </p>
          </div>

          <p className="text-sm text-slate-300 max-w-lg mx-auto lg:mx-0 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md">
            Automated stock allocation algorithms, 2.5D storage zone matrix, 5-stage Kanban pipeline, and plain-English decision auditing.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-indigo-600/40 hover:scale-105 transition-all flex items-center space-x-2"
            >
              <span>View Dashboard ➔</span>
            </Link>

            <Link
              href="/orders"
              className="px-6 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm rounded-2xl border border-slate-700 hover:border-slate-600 backdrop-blur-md transition-all"
            >
              Orders Queue
            </Link>
          </div>

          {/* Metric Highlights with Dynamic Stockout Value Saved */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 backdrop-blur-md">
              <p className="text-xl font-extrabold text-white">20 SKUs</p>
              <p className="text-[11px] text-slate-400">Tracked Catalog</p>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 backdrop-blur-md">
              <p className="text-[15px] sm:text-base font-extrabold text-emerald-400 font-mono leading-tight">
                ₹{stockoutValueSaved.toLocaleString('en-IN')}+
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Stockout Value Saved</p>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 backdrop-blur-md">
              <p className="text-xl font-extrabold text-indigo-400">5 Stages</p>
              <p className="text-[11px] text-slate-400">Fulfillment Pipeline</p>
            </div>
          </div>

        </div>

        {/* Right Column: 3D Three.js Interactive Canvas Container */}
        <div className="w-full h-[400px] sm:h-[480px] rounded-3xl bg-slate-900/50 border border-slate-700/80 shadow-2xl relative overflow-hidden backdrop-blur-md">
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

          <div className="absolute bottom-4 left-4 pointer-events-none px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 backdrop-blur-sm">
            3D Pallet Telemetry • R3F Renderer
          </div>
        </div>

      </div>
    </div>
  );
}
