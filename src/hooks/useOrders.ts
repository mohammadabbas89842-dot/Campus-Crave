import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { orderService, CreateOrderPayload } from '../services/orderService';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export const useOrders = (userId?: string, isStaffOrAdmin: boolean = false) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrders(userId, isStaffOrAdmin);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isStaffOrAdmin]);

  useEffect(() => {
    fetchOrders();

    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (sb) {
        const channel = sb
          .channel('public:orders_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              // Automatically refresh when kitchen or student updates an order
              fetchOrders();
            }
          )
          .subscribe();

        return () => {
          sb.removeChannel(channel);
        };
      }
    }
  }, [fetchOrders]);

  const placeOrder = async (payload: CreateOrderPayload) => {
    const res = await orderService.createOrderAtomic(payload);
    if (!res.error) {
      await fetchOrders();
    }
    return res;
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    await orderService.updateOrderStatus(orderId, status);
  };

  const cancelOrder = async (orderId: string, reason?: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o))
    );
    await orderService.cancelOrder(orderId, reason);
  };

  return {
    orders,
    isLoading,
    error,
    refreshOrders: fetchOrders,
    placeOrder,
    updateStatus,
    cancelOrder,
  };
};
