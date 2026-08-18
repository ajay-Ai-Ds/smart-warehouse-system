import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { WarehouseProvider } from "@/lib/WarehouseContext";
import "./globals.css";

export const metadata = {
  title: "Smart Warehouse — Order Fulfillment System",
  description:
    "AI-Powered Warehouse Inventory & Order Fulfillment Optimization System with real-time priority scoring, 2.5D warehouse grid, and Kanban fulfillment pipeline.",
};

/**
 * RootLayout — Top-level layout wrapping the entire application.
 * Provides the WarehouseProvider context, navigation bar, error boundary,
 * skip-to-content accessibility link, and base styling.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        <WarehouseProvider>
          {/* Skip-to-content link for keyboard/screen-reader accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold"
          >
            Skip to main content
          </a>
          <Navbar />
          <ErrorBoundary>
            <main id="main-content" className="flex-1 p-6" role="main">
              {children}
            </main>
          </ErrorBoundary>
        </WarehouseProvider>
      </body>
    </html>
  );
}
