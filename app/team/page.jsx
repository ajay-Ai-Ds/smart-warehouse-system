'use client';

/**
 * TeamPage — Portfolio and team presentation page.
 * Embeds Team Aurora's official website in a full-height container.
 *
 * @module TeamPage
 */

import { useState } from 'react';
import Link from 'next/link';

export default function TeamPage() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans -m-6 p-6 pt-4 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header section with badge, title and subtitle */}
        <section aria-label="Team Aurora Header" className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="h-3 w-3 rounded-full bg-teal-400 animate-pulse" aria-hidden="true"></span>
              <span className="text-xs uppercase tracking-widest font-bold text-teal-400">Creators & Innovators</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>👨‍💻</span> Meet Team Aurora
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              The minds behind Smart Warehouse Operations System
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.teamaurora.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>Visit Official Site</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </section>

        {/* Full-width Responsive Embedded Portfolio Frame */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 z-10 space-y-3 backdrop-blur-sm">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-slate-400">Loading Team Aurora Portfolio...</p>
            </div>
          )}
          <iframe
            src="https://www.teamaurora.online/"
            title="Team Aurora Portfolio"
            className="w-full h-[calc(100vh-250px)] min-h-[650px] border-0"
            onLoad={() => setIsLoading(false)}
            loading="lazy"
            allow="fullscreen; clipboard-read; clipboard-write"
          />
        </div>

      </div>
    </div>
  );
}
