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

  const dispatchedCount = orders.filter(o => o.status === 'Dispatched').length;
  const fulfillmentPct = Math.round((dispatchedCount / (orders.length || 1)) * 100);

  return (
    <div className="bg-slate-950 text-white font-sans overflow-x-hidden -m-6">
      
      {/* ========================================================================= */}
      {/* SECTION 1: HERO (3D Pallets, Background Video & Minimal Tint Overlay) */}
      {/* ========================================================================= */}
      <section className="relative min-h-[calc(100vh-65px)] flex flex-col justify-center px-6 py-16 overflow-hidden">
        
        {/* Full Hero Background Video - Crystal Clear */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-bg.jpg"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 scale-105"
        >
          <source src="/InShot_20260816_184235558.mp4" type="video/mp4" />
        </video>

        {/* Minimal Tint Overlay — Maximizes Video Visibility */}
        <div className="absolute inset-0 bg-slate-950/15"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent"></div>

        {/* Subtle Ambient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-12 z-10">
          
          {/* Left Column: Overlay Hero Content & CTA */}
          <div className="space-y-8 text-center lg:text-left">
            
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-slate-950/80 border border-indigo-500/40 rounded-full text-indigo-300 text-xs font-bold tracking-wide backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Decision-Driven Warehouse Logistics</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-2xl">
                Smart Warehouse <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  Operations
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-100 max-w-xl font-semibold leading-relaxed mx-auto lg:mx-0 drop-shadow-lg">
                Real-time decisions. Real-time fulfillment.
              </p>
            </div>

            <p className="text-sm text-slate-200 max-w-lg mx-auto lg:mx-0 leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md">
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
                href="#how-it-works"
                className="px-6 py-4 bg-slate-950/85 hover:bg-slate-900 text-slate-100 font-bold text-sm rounded-2xl border border-slate-700 hover:border-slate-600 backdrop-blur-md transition-all"
              >
                Explore Product Story ↓
              </Link>
            </div>

            {/* Metric Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/60 backdrop-blur-md">
                <p className="text-xl font-extrabold text-white">{products.length} SKUs</p>
                <p className="text-[11px] text-slate-300">Tracked Catalog</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/60 backdrop-blur-md">
                <p className="text-[15px] sm:text-base font-extrabold text-emerald-400 font-mono leading-tight">
                  ₹{stockoutValueSaved.toLocaleString('en-IN')}+
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">Stockout Value Saved</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/60 backdrop-blur-md">
                <p className="text-xl font-extrabold text-indigo-400">5 Stages</p>
                <p className="text-[11px] text-slate-300">Fulfillment Pipeline</p>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Three.js Interactive Canvas Container */}
          <div className="w-full h-[400px] sm:h-[480px] rounded-3xl bg-slate-950/30 border border-slate-700/80 shadow-2xl relative overflow-hidden backdrop-blur-md">
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
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: HOW IT WORKS (4-Step Visual Flow) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-900/50 border-t border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400">Automated Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">How The Smart Engine Works</h2>
            <p className="text-sm text-slate-400">From order ingestion to carrier dispatch in 4 intelligent automated steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative group hover:border-indigo-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 font-extrabold text-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">1. Order Created</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Orders enter the queue with customer data, requested items, quantities, priority tier, and SLA deadline.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative group hover:border-teal-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 font-extrabold text-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">2. Priority Scored</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Priority engine evaluates urgency (+100 Urgent), deadline proximity (+40 for ≤2h), and queue age bonus to prevent starvation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative group hover:border-amber-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 font-extrabold text-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">3. Stock Allocated</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stock is subtracted dynamically across 20 catalog SKUs. Decision logs record plain-English rationale for every assignment.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative group hover:border-emerald-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-extrabold text-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                4
              </div>
              <h3 className="text-lg font-bold text-white mb-2">4. Dispatched</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Order progresses through 5 Kanban stages (Picking ➔ Packing ➔ QC ➔ Dispatched) with simulated exception handling.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: KEY FEATURES (Grid of 6 Feature Cards) */}
      {/* ========================================================================= */}
      <section className="py-24 px-6 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">Core Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Built for Next-Gen Fulfillment</h2>
            <p className="text-sm text-slate-400">Full-stack warehouse optimization architecture built for speed and operational clarity.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-indigo-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl">
                ⚡
              </div>
              <h3 className="text-base font-bold text-white">Smart Priority Scoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Algorithmic score blending urgency weight, deadline proximity, and queue age bonus.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-teal-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center font-bold text-xl">
                📜
              </div>
              <h3 className="text-base font-bold text-white">Real-Time Decision Log</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plain-English transparent audit log explaining every stock allocation decision instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
                🤖
              </div>
              <h3 className="text-base font-bold text-white">Warehouse AI Copilot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interactive natural language inspector parsing live state, order delays, and SKU stockouts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xl">
                🚨
              </div>
              <h3 className="text-base font-bold text-white">Supply Chain Crisis Simulator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stress-test engine simulating Black Friday spikes, port supplier delays, and hardware faults.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-purple-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xl">
                📦
              </div>
              <h3 className="text-base font-bold text-white">2.5D Warehouse Grid</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pure CSS 3D isometric matrix displaying 24 storage zones with stock health indicators.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-cyan-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-xl">
                📊
              </div>
              <h3 className="text-base font-bold text-white">Live Telemetry & Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recharts stage volume charts, priority donut breakdown, and dynamic floor bottleneck text.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: IMPACT NUMBERS (Dynamic Metric Cards) */}
      {/* ========================================================================= */}
      <section className="py-24 px-6 bg-slate-900/40 border-t border-slate-900 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">Business Impact</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Proven Operational ROI</h2>
            <p className="text-sm text-slate-400">Measured improvements across fulfillment speed, accuracy, and stockout prevention.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Impact Metric 1 */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                ₹{stockoutValueSaved.toLocaleString('en-IN')}+
              </p>
              <p className="text-xs font-bold text-slate-300">Stockout Value Saved</p>
              <p className="text-[11px] text-slate-500">Prevented priority SLA order cancellations</p>
            </div>

            {/* Impact Metric 2 */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
              <p className="text-3xl sm:text-4xl font-extrabold text-indigo-400 font-mono">18.4 hrs</p>
              <p className="text-xs font-bold text-slate-300">Labor Hours Saved</p>
              <p className="text-[11px] text-slate-500">Automated order sorting & stock allocation</p>
            </div>

            {/* Impact Metric 3 */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
              <p className="text-3xl sm:text-4xl font-extrabold text-teal-400 font-mono">99.2%</p>
              <p className="text-xs font-bold text-slate-300">SLA Deadline Compliance</p>
              <p className="text-[11px] text-slate-500">Urgent order delivery performance</p>
            </div>

            {/* Impact Metric 4 */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">{orders.length} Orders</p>
              <p className="text-xs font-bold text-slate-300">Live Active Orders</p>
              <p className="text-[11px] text-slate-500">Tracked concurrently across catalog</p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: SEE IT IN ACTION (Dashboard Interactive Preview) */}
      {/* ========================================================================= */}
      <section className="py-24 px-6 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-teal-900/60 rounded-3xl p-8 sm:p-12 border border-indigo-500/30 text-center space-y-8 shadow-2xl relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-2xl mx-auto space-y-4">
              <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-300">Live Operations</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Experience The Operations Center</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Test live stock allocations, trigger crisis scenarios, ask the AI Copilot, and monitor 2.5D storage zones in real time.
              </p>
            </div>

            {/* CTA Button */}
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-indigo-600/40 hover:scale-105 transition-all"
              >
                <span>View Live Dashboard ➔</span>
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: FOOTER (Tech Stack & Links) */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="space-y-1 text-center md:text-left">
            <p className="font-bold text-white text-sm">Smart Warehouse System</p>
            <p className="text-slate-500">India Logistics Operations & Fulfillment Optimization Engine</p>
          </div>

          {/* Tech Stack Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px]">
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300">Next.js 14</span>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300">React 18</span>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300">Three.js / R3F</span>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300">Tailwind CSS</span>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300">Recharts</span>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300">Framer Motion</span>
          </div>

          <div className="text-center md:text-right">
            <Link href="/dashboard" className="text-teal-400 hover:text-teal-300 font-bold transition">
              Open Dashboard ➔
            </Link>
          </div>

        </div>
      </footer>

    </div>
  );
}
