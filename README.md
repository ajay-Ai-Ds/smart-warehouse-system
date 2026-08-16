# Smart Warehouse Operations System

> *"Most warehouse systems just show you data. Ours makes decisions — and explains why."*

An AI-inspired, decision-driven warehouse management and fulfillment optimization system built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Framer Motion**, and **Recharts**.

---

## 🌟 Key Features

### 1. Operations Dashboard & 2.5D Isometric Grid
- **Real-Time Telemetry**: Live metrics tracking pending orders, dispatched shipments, active picking tasks, and stock threshold alerts.
- **2.5D Isometric Warehouse Grid (`/components/WarehouseGrid.jsx`)**: Built with pure CSS 3D transforms (`rotateX(55deg) rotateZ(-45deg)`). Maps 24 storage zones with color-coded stock health indicators (Green = Healthy, Yellow = Low, Red = Below Reorder Point).
- **Interactive Tooltips & Pulse Animations**: Hover over bins to inspect SKU stock levels. Allocation events trigger Framer Motion brightness/scale pulse animations across active zones.

### 2. Orders Queue & Priority Scoring Engine (`/app/orders/page.jsx`)
- **Automated Priority Scoring (`calculatePriorityScore`)**: Evaluates order tier weight (`Urgent` = +100, `Standard` = +50, `Low` = +10), deadline proximity (`<= 2h` = +40, `<= 6h` = +20), and queue age (`hoursOld * 10`, capped at 50).
- **1-Click Auto-Allocation (`⚡ Auto-Allocate All`)**: Automatically allocates inventory across all created orders in priority sequence.
- **Framer Motion Layout Animations**: Order cards re-sort dynamically and highlight smoothly upon state changes.

### 3. Allocation Engine & Plain-English Decision Log (`/lib/allocationEngine.js`)
- **`allocateStock(orders, products)`**: Subtracts inventory, handles full allocations, partial stock assignments, and backorder waiting lists.
- **`generateDecisionLog(...)`**: Produces transparent, plain-English logs explaining *why* allocations succeeded, failed, or triggered reorder recommendations:
  > *"Order #ORD-1002 (Urgent, Score: 190) — allocated 20/20 units of Corrugated Boxes. Reason: sufficient stock available."*

### 4. Order Fulfillment Kanban Board (`/app/fulfillment/page.jsx`)
- **5-Stage Lifecycle**: `Allocated` ➔ `Picking` ➔ `Packing` ➔ `QC` ➔ `Dispatched`.
- **Automated Exception Handling**: Moving an order to *Picking* has a 10% simulated probability of flagging damaged/missing stock, routing the card to an exception queue with resolution controls (`✓ Resolve & Move` / `✖ Cancel`).
- **Live Shared State**: Synchronizes with Orders and Dashboard stat counts in real time via `WarehouseProvider`.

### 5. Inventory Catalog & Automated Reordering (`/app/inventory/page.jsx`)
- **Stock Health Rows**: Color-coded rows (`Red` for reorder point triggered, `Yellow` for close, `Green` for healthy).
- **Suggested Reorder Qty Column**: Automatically calculates `(reorderPoint * 2 - quantityOnHand)` for low-stock items.
- **Instant Search & Velocity Filters**: Filter by SKU, product name, or velocity rating (`Fast`, `Medium`, `Slow`).

### 6. Telemetry & Analytics (`/app/analytics/page.jsx`)
- **Recharts Integration**: Stage volume bar chart, priority breakdown donut chart, and vertical SKU stock level chart with reorder threshold indicators.
- **Dynamically Generated Bottleneck Insight**: Evaluates active stage volumes and outputs plain-English labor re-allocation recommendations.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router, JavaScript)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **State Management**: React Context (`WarehouseProvider`)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ajay-Ai-Ds/smart-warehouse-system.git
cd smart-warehouse-system

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
