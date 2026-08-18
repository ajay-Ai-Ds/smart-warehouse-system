# Smart Warehouse Operations System

> *"Most warehouse systems just show you data. Ours makes decisions — and explains why."*

An AI-inspired, decision-driven warehouse management and fulfillment optimization system built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Three.js (React Three Fiber)**, **Framer Motion**, and **Recharts**.

---

## 🌟 Key Features

### 1. Operations Dashboard & 2.5D Isometric Grid
- **Real-Time Telemetry**: Live metrics tracking pending orders, dispatched shipments, active picking tasks, and stock threshold alerts in INR (₹).
- **2.5D Isometric Warehouse Grid (`/components/WarehouseGrid.jsx`)**: Built with pure CSS 3D transforms (`rotateX(55deg) rotateZ(-45deg)`). Maps 24 storage zones with color-coded stock health indicators (Green = Healthy, Yellow = Low, Red = Below Reorder Point) and full keyboard accessibility.
- **Interactive Tooltips & Pulse Animations**: Hover or focus on bins to inspect SKU stock levels. Allocation events trigger Framer Motion brightness/scale pulse animations across active zones.

### 2. Orders Queue & Priority Scoring Engine (`/app/orders/page.jsx`)
- **Automated Priority Scoring (`calculatePriorityScore`)**: Evaluates order tier weight (`Urgent` = +100, `Standard` = +50, `Low` = +10), deadline proximity (`<= 2h` = +40, `<= 6h` = +20), and queue age (`hoursOld * 10`, capped at 50 to prevent starvation).
- **1-Click Auto-Allocation (`⚡ Auto-Allocate All`)**: Automatically allocates inventory across all created orders in priority sequence.
- **Manual Order Creation**: Interactive dialog modal enabling operators to inject custom orders directly into the queue.
- **Data Export**: Export orders queue as formatted JSON for external audit.

### 3. Allocation Engine & Plain-English Decision Log (`/lib/allocationEngine.js`)
- **`allocateStock(orders, products)`**: Subtracts inventory, handles full allocations, partial stock assignments, and backorder waiting lists.
- **`compareSmartVsFIFO(orders, products)`**: Provides side-by-side algorithmic benchmarks showing percentage SLA improvement over First-Come-First-Served.
- **`generateDecisionLog(...)`**: Produces transparent, plain-English logs explaining *why* allocations succeeded, failed, or triggered reorder recommendations with one-click JSON export.

### 4. Order Fulfillment Kanban Board (`/app/fulfillment/page.jsx`)
- **5-Stage Lifecycle**: `Allocated` ➔ `Picking` ➔ `Packing` ➔ `QC` ➔ `Dispatched`.
- **Automated Exception Handling**: Moving an order to *Picking* simulates real-world damaged/missing stock conditions, routing the card to an exception queue with resolution controls (`✓ Resolve & Move` / `✖ Cancel`).
- **Live Shared State**: Synchronizes with Orders and Dashboard stat counts in real time via `WarehouseProvider`.

### 5. Inventory Catalog & Automated Reordering (`/app/inventory/page.jsx`)
- **Stock Health Rows**: Color-coded rows (`Red` for reorder point triggered, `Yellow` for close, `Green` for healthy).
- **Suggested Reorder Qty Column**: Automatically calculates `(reorderPoint * 2 - quantityOnHand)` for low-stock items.
- **Instant Search & Velocity Filters**: Filter by SKU, product name, or velocity rating (`Fast`, `Medium`, `Slow`).

### 6. Telemetry & Analytics (`/app/analytics/page.jsx`)
- **Recharts Integration**: Stage volume bar chart, priority breakdown donut chart, and vertical SKU stock level chart with reorder threshold indicators.
- **Dynamically Generated Bottleneck Insight**: Evaluates active stage volumes and outputs plain-English labor re-allocation recommendations.
- **Analytics Export**: Export full operational telemetry summaries with a single click.

### 7. AI Copilot & Crisis Simulator (`/components/WarehouseCopilot.jsx`, `/components/DisruptionSimulator.jsx`)
- **Live AI Copilot**: Dynamic operational query engine capable of diagnosing specific order delays, detecting bottleneck queues, evaluating SLA breach risks, and recommending emergency SKU restocks.
- **Supply Chain Crisis Simulator**: Stress-test suite simulating Black Friday surges, supplier port delays, and warehouse zone hardware outages.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16.3.1 (App Router)
- **UI Runtime**: React 19.2.8 / React DOM 19.2.8
- **Styling**: Tailwind CSS v4
- **3D Visualization**: Three.js & React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **State Management**: React Context (`WarehouseProvider`) & React Error Boundaries
- **Cloud Database / PubSub**: Upstash Redis (Serverless REST API)

---

## 🧪 Testing & Code Quality

Run automated unit tests covering allocation algorithms, boundary conditions, edge cases, utilities, and constants:

```bash
npm test
```

Build production bundle:

```bash
npm run build
```

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ajay-Ai-Ds/smart-warehouse-system.git
cd smart-warehouse-system

# Install dependencies
npm install

# Run automated tests
npm test

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
