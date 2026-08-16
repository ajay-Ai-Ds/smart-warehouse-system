import Navbar from "@/components/Navbar";
import { WarehouseProvider } from "@/lib/WarehouseContext";
import "./globals.css";

export const metadata = {
  title: "Smart Warehouse — Order Fulfillment System",
  description: "AI-Powered Warehouse Inventory & Order Fulfillment Optimization System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        <WarehouseProvider>
          <Navbar />
          <main className="flex-1 p-6">{children}</main>
        </WarehouseProvider>
      </body>
    </html>
  );
}
