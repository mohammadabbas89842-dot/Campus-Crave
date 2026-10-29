import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { Order, OrderStatus, PickupSlot, PaymentRecord, OrderItem } from '../types';
import { INITIAL_ORDERS } from '../data/initialData';

export interface CreateOrderPayload {
  pickupSlotId: string;
  items: { food_item_id: string; quantity: number }[];
  specialInstructions?: string;
  discountAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
}

export const orderService = {
  /**
   * Place an order atomically via Supabase RPC function `create_order_atomic`
   */
  async createOrderAtomic(payload: CreateOrderPayload): Promise<{ order: any | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { order: null, error: new Error('Supabase is not configured') };
    }

    const sb = getSupabase();
    if (!sb) {
      return { order: null, error: new Error('Supabase client unavailable') };
    }

    try {
      const { data, error } = await sb.rpc('create_order_atomic', {
        p_pickup_slot_id: payload.pickupSlotId,
        p_items: payload.items,
        p_special_instructions: payload.specialInstructions || null,
        p_discount_amount: payload.discountAmount || 0,
        p_payment_method: payload.paymentMethod || 'upi',
        p_transaction_id: payload.transactionId || null,
      });

      if (error) {
        return { order: null, error: new Error(error.message) };
      }

      return { order: data, error: null };
    } catch (err) {
      return { order: null, error: err instanceof Error ? err : new Error('Order creation failed') };
    }
  },

  /**
   * Fetch orders for current user or all orders for staff/admin
   */
  async getOrders(userId?: string, isStaffOrAdmin: boolean = false): Promise<Order[]> {
    if (!isSupabaseConfigured()) {
      return isStaffOrAdmin
        ? INITIAL_ORDERS
        : INITIAL_ORDERS.filter((o) => !userId || o.studentId === userId || o.studentEmail.includes('student'));
    }

    const sb = getSupabase();
    if (!sb) return INITIAL_ORDERS;

    try {
      let query = sb
        .from('orders')
        .select(`
          id,
          order_number,
          student_id,
          pickup_slot_id,
          status,
          payment_status,
          subtotal,
          discount_amount,
          total_amount,
          special_instructions,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            email,
            phone
          ),
          pickup_slots (
            id,
            start_time,
            end_time,
            capacity
          ),
          order_items (
            id,
            quantity,
            unit_price,
            subtotal,
            food_items (
              id,
              name,
              price,
              is_vegetarian,
              image_url
            )
          ),
          payments (
            id,
            payment_method,
            payment_status,
            transaction_id,
            amount,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (!isStaffOrAdmin && userId) {
        query = query.eq('student_id', userId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        if (error) console.warn('[orderService] Fetch error:', error.message);
        return isStaffOrAdmin
          ? INITIAL_ORDERS
          : INITIAL_ORDERS.filter((o) => !userId || o.studentId === userId || o.studentEmail.includes('student'));
      }

      return data.map((row: any): Order => {
        const studentProfile = row.profiles || {};
        const slot = row.pickup_slots || {};
        const paymentRow = (row.payments && row.payments[0]) || {};

        const mappedItems: OrderItem[] = (row.order_items || []).map((oi: any) => ({
          foodItemId: oi.food_items?.id || oi.food_item_id,
          name: oi.food_items?.name || 'Canteen Dish',
          price: Number(oi.unit_price),
          quantity: Number(oi.quantity),
          subtotal: Number(oi.subtotal),
          isVeg: oi.food_items?.is_vegetarian ?? true,
        }));

        const pickupSlotObj: PickupSlot = {
          id: slot.id || row.pickup_slot_id,
          startTime: slot.start_time ? new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:30 PM',
          endTime: slot.end_time ? new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '01:00 PM',
          period: 'lunch',
          capacity: slot.capacity || 30,
          reservedCount: 15,
          isActive: true,
        };

        const paymentRec: PaymentRecord = {
          id: paymentRow.id || `pay_${row.id}`,
          orderId: row.id,
          gateway: 'razorpay',
          method: (paymentRow.payment_method as any) || 'upi',
          amount: Number(row.total_amount),
          status: (paymentRow.payment_status === 'paid' ? 'completed' : paymentRow.payment_status) || 'completed',
          timestamp: paymentRow.created_at || row.created_at,
          isTestMode: false,
        };

        return {
          id: row.id,
          orderNumber: row.order_number,
          studentId: row.student_id,
          studentName: studentProfile.full_name || 'Student',
          studentEmail: studentProfile.email || 'student@campus.edu',
          studentPhone: studentProfile.phone || '+91 98765 43210',
          items: mappedItems,
          subtotal: Number(row.subtotal),
          packagingFee: 5,
          taxAmount: Number((Number(row.subtotal) * 0.05).toFixed(2)),
          discountAmount: Number(row.discount_amount) || 0,
          totalAmount: Number(row.total_amount),
          pickupSlot: pickupSlotObj,
          specialInstructions: row.special_instructions || '',
          status: (row.status as OrderStatus) || 'confirmed',
          estimatedPrepTimeMinutes: 10,
          placedAt: row.created_at,
          payment: paymentRec,
        };
      });
    } catch (err) {
      console.warn('[orderService] Exception during order fetch:', err);
      return INITIAL_ORDERS;
    }
  },

  /**
   * Update order status in Supabase
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    const sb = getSupabase();
    if (!sb) return true;

    try {
      const { error } = await sb
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('[orderService] Status update failed:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Cancel an order if eligible
   */
  async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    const sb = getSupabase();
    if (!sb) return true;

    try {
      const { error } = await sb
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .in('status', ['pending', 'confirmed']);

      if (error) {
        console.error('[orderService] Cancellation failed:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },
};
