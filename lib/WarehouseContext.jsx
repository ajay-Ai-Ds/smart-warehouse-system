'use client';

import { createContext, useContext, useState } from 'react';
import initialOrdersData from '@/data/orders.json';
import initialProductsData from '@/data/products.json';
import { allocateStock, generateDecisionLog } from '@/lib/allocationEngine';

const WarehouseContext = createContext();

const STAGE_FLOW = ['Created', 'Allocated', 'Picking', 'Packing', 'QC', 'Dispatched'];

export function WarehouseProvider({ children }) {
  const [orders, setOrders] = useState(initialOrdersData);
  const [products, setProducts] = useState(initialProductsData);
  const [recentlyAllocatedIds, setRecentlyAllocatedIds] = useState(new Set());
  
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
      if (order.status !== 'Created') return order;

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

    // Check for 10% chance of exception when moving to "Picking"
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

        // Action: Resolve & advance to Packing
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
