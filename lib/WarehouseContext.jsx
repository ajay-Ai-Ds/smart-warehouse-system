'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import initialOrdersData from '@/data/orders.json';
import initialProductsData from '@/data/products.json';
import { allocateStock, generateDecisionLog } from '@/lib/allocationEngine';

const WarehouseContext = createContext();

const STAGE_FLOW = ['Created', 'Allocated', 'Picking', 'Packing', 'QC', 'Dispatched'];

const SAMPLE_CUSTOMERS = [
  'Delhivery Express Logistics',
  'Flipkart Fulfillment Hub',
  'Amazon India Direct',
  'Tata Logistics Network',
  'Reliance Retail Supply',
  'Blue Dart Express',
  'Shadowfax Parcel Post',
  'Ecom Express Cargo',
  'Mahindra Logistics Center',
  'Xpressbees Freight'
];

export function WarehouseProvider({ children }) {
  const [orders, setOrders] = useState(initialOrdersData);
  const [products, setProducts] = useState(initialProductsData);
  const [recentlyAllocatedIds, setRecentlyAllocatedIds] = useState(new Set());
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [isEcommerceSyncActive, setIsEcommerceSyncActive] = useState(true); // Live e-commerce sync ON by default
  const generatedCountRef = useRef(0);
  const lastSyncTimestampRef = useRef(new Date().toISOString());
  const knownEcomOrderIdsRef = useRef(new Set());

  const [decisionLogs, setDecisionLogs] = useState([
    {
      id: 'init-1',
      timestamp: '13:05:12',
      text: 'Order #ORD-1001 (Urgent, Score: 190) — allocated 5/5 units of Industrial Barcode Scanner. Reason: sufficient stock available.',
      type: 'success'
    },
    {
      id: 'init-2',
      timestamp: '13:02:40',
      text: 'Order #ORD-1004 (Urgent, Score: 180) — allocated 3/3 units of RFID Label Printer. Reason: sufficient stock available.',
      type: 'success'
    },
    {
      id: 'init-3',
      timestamp: '12:48:15',
      text: 'Order #ORD-1019 (Urgent, Score: 160) — 0/40 units allocated for Corrugated Boxes. Reason: insufficient stock after higher-priority orders fulfilled.',
      type: 'alert'
    },
    {
      id: 'init-4',
      timestamp: '12:15:00',
      text: 'SKU-SKU-1009 (High-Reach Electric Stacker Lift) stock below reorder point (1 remaining, reorder point 2) — reorder recommended.',
      type: 'alert'
    }
  ]);

  // ═══════════════════════════════════════════════════════════
  // 🔴 LIVE E-COMMERCE SYNC — polls Upstash Redis every 3 seconds
  // This is the magic that connects Quality Enterprises → Dashboard
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isEcommerceSyncActive) return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders?since=${encodeURIComponent(lastSyncTimestampRef.current)}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.orders && data.orders.length > 0) {
          const newOrders = data.orders.filter(
            (order) => !knownEcomOrderIdsRef.current.has(order.id)
          );

          if (newOrders.length === 0) return;

          // Mark these order IDs as known so we don't re-add them
          newOrders.forEach((o) => knownEcomOrderIdsRef.current.add(o.id));

          // Update last sync timestamp
          lastSyncTimestampRef.current = data.timestamp || new Date().toISOString();

          // Inject new orders into the live orders list
          setOrders((prevOrders) => [...newOrders, ...prevOrders]);

          // Generate decision logs for each new e-commerce order
          const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          const newLogs = newOrders.map((order) => ({
            id: `ecom-${order.id}-${Date.now()}`,
            timestamp,
            text: `🛒 E-COMMERCE ORDER: #${order.id} (${order.priority}) received from ${order.customerName}. Scored ${order.priorityScore || '—'} and queued for allocation.`,
            type: order.priority === 'Urgent' ? 'alert' : 'success',
          }));

          setDecisionLogs((prev) => [...newLogs, ...prev]);

          // Flash highlight the new orders
          const newIds = new Set(newOrders.map((o) => o.id));
          setRecentlyAllocatedIds(newIds);
          setTimeout(() => setRecentlyAllocatedIds(new Set()), 3000);
        }
      } catch (err) {
        // Silently fail — network hiccups are normal
        console.warn('E-commerce sync poll failed:', err.message);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(syncInterval);
  }, [isEcommerceSyncActive]);

  const toggleEcommerceSync = () => {
    setIsEcommerceSyncActive((prev) => !prev);
  };

  // Live Simulation Mode Interval Engine
  useEffect(() => {
    if (!isSimulationActive) return;

    const simulationInterval = setInterval(() => {
      if (generatedCountRef.current >= 15) {
        setIsSimulationActive(false);
        return;
      }

      generatedCountRef.current += 1;
      const nextIdNum = 1040 + generatedCountRef.current;
      const newOrderId = `ORD-${nextIdNum}`;
      const customer = SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
      const priority = Math.random() < 0.35 ? 'Urgent' : Math.random() < 0.70 ? 'Standard' : 'Low';
      
      const randomProd1 = products[Math.floor(Math.random() * products.length)];
      const randomProd2 = products[Math.floor(Math.random() * products.length)];

      const deadlineHours = priority === 'Urgent' ? 2 : priority === 'Standard' ? 6 : 24;
      const deadlineDate = new Date(Date.now() + deadlineHours * 3600 * 1000).toISOString();

      const newOrder = {
        id: newOrderId,
        customerName: customer,
        items: [
          { productId: randomProd1.id, qty: Math.floor(Math.random() * 5) + 1 },
          { productId: randomProd2.id, qty: Math.floor(Math.random() * 10) + 1 }
        ],
        priority,
        deadline: deadlineDate,
        status: 'Created',
        createdAt: new Date().toISOString()
      };

      // Add order and trigger auto-allocation
      setOrders(prevOrders => [newOrder, ...prevOrders]);

      // Execute stock allocation
      const currentOrders = [newOrder, ...orders];
      const allocationResults = allocateStock(currentOrders, products);

      if (allocationResults.length > 0) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setDecisionLogs(prev => [
          {
            id: `sim-log-${Date.now()}`,
            timestamp,
            text: `LIVE SIMULATION: New Order #${newOrderId} (${priority}) received from ${customer} & evaluated by Allocation Engine.`,
            type: priority === 'Urgent' ? 'alert' : 'info'
          },
          ...prev
        ]);
      }

      setRecentlyAllocatedIds(new Set([newOrderId]));
      setTimeout(() => setRecentlyAllocatedIds(new Set()), 2000);

    }, 15000); // 15s interval

    return () => clearInterval(simulationInterval);
  }, [isSimulationActive, orders, products]);

  const toggleSimulation = () => {
    setIsSimulationActive(prev => !prev);
  };

  // Allocate a single order manually
  const allocateSingleOrder = (orderId) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: 'Allocated' } : order
      )
    );
    setRecentlyAllocatedIds(prev => new Set([...prev, orderId]));
    setTimeout(() => {
      setRecentlyAllocatedIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }, 2000);
  };

  // Run full Auto-Allocation on all "Created" status orders
  const runAutoAllocateAll = () => {
    const allocationResults = allocateStock(orders, products);

    if (allocationResults.length === 0) {
      return;
    }

    const orderResultsMap = new Map();
    allocationResults.forEach(res => {
      if (!orderResultsMap.has(res.orderId)) {
        orderResultsMap.set(res.orderId, []);
      }
      orderResultsMap.get(res.orderId).push(res);
    });

    const updatedProducts = products.map(product => {
      const totalDeduction = allocationResults
        .filter(r => r.productId === product.id)
        .reduce((sum, r) => sum + r.allocatedQty, 0);
      
      return {
        ...product,
        quantityOnHand: Math.max(0, product.quantityOnHand - totalDeduction)
      };
    });

    const affectedIds = new Set();

    const updatedOrders = orders.map(order => {
      if (order.status !== 'Created' && order.status !== 'Pending') return order;

      const itemsResult = orderResultsMap.get(order.id) || [];
      if (itemsResult.length === 0) return order;

      affectedIds.add(order.id);

      const allAllocated = itemsResult.every(r => r.status === 'Allocated');
      const allWaiting = itemsResult.every(r => r.status === 'Waiting');

      let newStatus = 'Partial';
      if (allAllocated) newStatus = 'Allocated';
      else if (allWaiting) newStatus = 'Waiting';

      return {
        ...order,
        status: newStatus
      };
    });

    const newLogs = generateDecisionLog(allocationResults, updatedOrders, updatedProducts);

    setOrders(updatedOrders);
    setProducts(updatedProducts);
    setDecisionLogs(prevLogs => [...newLogs, ...prevLogs]);

    setRecentlyAllocatedIds(affectedIds);
    setTimeout(() => {
      setRecentlyAllocatedIds(new Set());
    }, 2500);
  };

  // Move order to the next stage in Kanban fulfillment pipeline
  const moveOrderStage = (orderId, currentStatus) => {
    const currentIndex = STAGE_FLOW.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= STAGE_FLOW.length - 1) return;

    const nextStatus = STAGE_FLOW[currentIndex + 1];

    let triggerException = false;
    if (nextStatus === 'Picking') {
      triggerException = Math.random() < 0.10;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id !== orderId) return order;

        if (triggerException) {
          return {
            ...order,
            status: 'Picking',
            hasException: true,
            exceptionReason: 'Missing/damaged item during picking'
          };
        }

        return {
          ...order,
          status: nextStatus,
          hasException: false
        };
      })
    );

    if (triggerException) {
      setDecisionLogs(prev => [
        {
          id: `log-exc-${Date.now()}`,
          timestamp,
          text: `Order #${orderId} flagged — missing item during picking. Routed to exception queue.`,
          type: 'alert'
        },
        ...prev
      ]);
    } else {
      setDecisionLogs(prev => [
        {
          id: `log-mv-${Date.now()}`,
          timestamp,
          text: `Order #${orderId} moved to ${nextStatus} stage.`,
          type: 'info'
        },
        ...prev
      ]);
    }
  };

  // Resolve exception on an order
  const resolveException = (orderId, action = 'resolve') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id !== orderId) return order;

        if (action === 'cancel') {
          return {
            ...order,
            status: 'Cancelled',
            hasException: false
          };
        }

        return {
          ...order,
          status: 'Packing',
          hasException: false
        };
      })
    );

    setDecisionLogs(prev => [
      {
        id: `log-res-${Date.now()}`,
        timestamp,
        text: action === 'cancel'
          ? `Order #${orderId} exception resolved by cancelling order.`
          : `Order #${orderId} exception resolved. Inventory re-verified and moved to Packing.`,
        type: action === 'cancel' ? 'warning' : 'success'
      },
      ...prev
    ]);
  };

  return (
    <WarehouseContext.Provider
      value={{
        orders,
        products,
        decisionLogs,
        recentlyAllocatedIds,
        isSimulationActive,
        isEcommerceSyncActive,
        toggleSimulation,
        toggleEcommerceSync,
        allocateSingleOrder,
        runAutoAllocateAll,
        moveOrderStage,
        resolveException
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
}
