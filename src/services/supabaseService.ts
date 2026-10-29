import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { FoodItem, PickupSlot, Coupon, Order, Review, User, CanteenSettings } from '../types';

export const supabaseService = {
  // Is Supabase active
  isAvailable: () => isSupabaseConfigured(),

  // Menu items
  getMenu: async (): Promise<FoodItem[] | null> => {
    const sb = getSupabase();
    if (!sb) return null;

    const { data, error } = await sb
      .from('food_items')
      .select('*')
      .order('is_chef_special', { ascending: false });

    if (error) {
      console.warn('[Supabase] Failed to fetch menu:', error.message);
      return null;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: row.category,
      price: Number(row.price),
      imageUrl: row.image_url || '/src/assets/images/dish_masala_maggi_1793265995300.jpg',
      isVeg: Boolean(row.is_veg),
      isAvailable: Boolean(row.is_available),
      prepTimeMinutes: Number(row.prep_time_minutes) || 8,
      rating: Number(row.rating) || 5.0,
      reviewCount: Number(row.review_count) || 1,
      isChefSpecial: Boolean(row.is_chef_special),
      calories: row.calories ? Number(row.calories) : 250,
      ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    }));
  },

  createMenuItem: async (item: Partial<FoodItem>): Promise<FoodItem | null> => {
    const sb = getSupabase();
    if (!sb) return null;

    const row = {
      id: item.id || `food_${Date.now()}`,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      image_url: item.imageUrl,
      is_veg: item.isVeg,
      is_available: true,
      prep_time_minutes: item.prepTimeMinutes || 8,
      rating: 5.0,
      review_count: 1,
      is_chef_special: item.isChefSpecial || false,
      calories: item.calories || 250,
      ingredients: item.ingredients || [],
    };

    const { data, error } = await sb.from('food_items').insert(row).select().single();
    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      price: Number(data.price),
      imageUrl: data.image_url,
      isVeg: data.is_veg,
      isAvailable: data.is_available,
      prepTimeMinutes: data.prep_time_minutes,
      rating: Number(data.rating),
      reviewCount: data.review_count,
      isChefSpecial: data.is_chef_special,
      calories: data.calories,
      ingredients: data.ingredients,
    };
  },

  toggleItemAvailability: async (id: string, isAvailable: boolean): Promise<boolean> => {
    const sb = getSupabase();
    if (!sb) return false;

    const { error } = await sb
      .from('food_items')
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq('id', id);

    return !error;
  },

  deleteMenuItem: async (id: string): Promise<boolean> => {
    const sb = getSupabase();
    if (!sb) return false;

    const { error } = await sb.from('food_items').delete().eq('id', id);
    return !error;
  },

  // Pickup Slots
  getSlots: async (): Promise<PickupSlot[] | null> => {
    const sb = getSupabase();
    if (!sb) return null;

    const { data, error } = await sb.from('pickup_slots').select('*');
    if (error) {
      console.warn('[Supabase] Failed to fetch slots:', error.message);
      return null;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      period: row.period,
      capacity: Number(row.capacity),
      reservedCount: Number(row.reserved_count),
      isActive: Boolean(row.is_active),
    }));
  },

  updateSlotCapacity: async (id: string, capacity: number, isActive = true): Promise<boolean> => {
    const sb = getSupabase();
    if (!sb) return false;

    const { error } = await sb
      .from('pickup_slots')
      .update({ capacity, is_active: isActive })
      .eq('id', id);

    return !error;
  },

  // Orders
  getOrders: async (studentId?: string): Promise<Order[] | null> => {
    const sb = getSupabase();
    if (!sb) return null;

    let query = sb.from('orders').select('*').order('placed_at', { ascending: false });
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase] Failed to fetch orders:', error.message);
      return null;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,
      studentPhone: row.student_phone,
      items: row.items,
      subtotal: Number(row.subtotal),
      packagingFee: Number(row.packaging_fee),
      taxAmount: Number(row.tax_amount),
      discountAmount: Number(row.discount_amount),
      couponCode: row.coupon_code,
      totalAmount: Number(row.total_amount),
      pickupSlot: row.pickup_slot,
      specialInstructions: row.special_instructions,
      status: row.status,
      estimatedPrepTimeMinutes: Number(row.estimated_prep_time_minutes),
      placedAt: row.placed_at,
      readyAt: row.ready_at,
      completedAt: row.completed_at,
      cancelledAt: row.cancelled_at,
      cancellationReason: row.cancellation_reason,
      payment: row.payment,
      isRated: Boolean(row.is_rated),
    }));
  },

  createOrder: async (order: Order): Promise<Order | null> => {
    const sb = getSupabase();
    if (!sb) return null;

    const row = {
      id: order.id,
      order_number: order.orderNumber,
      student_id: order.studentId,
      student_name: order.studentName,
      student_email: order.studentEmail,
      student_phone: order.studentPhone,
      items: order.items,
      subtotal: order.subtotal,
      packaging_fee: order.packagingFee,
      tax_amount: order.taxAmount,
      discount_amount: order.discountAmount,
      coupon_code: order.couponCode,
      total_amount: order.totalAmount,
      slot_id: order.pickupSlot.id,
      pickup_slot: order.pickupSlot,
      special_instructions: order.specialInstructions,
      status: order.status,
      estimated_prep_time_minutes: order.estimatedPrepTimeMinutes,
      payment: order.payment,
      placed_at: order.placedAt,
    };

    const { error } = await sb.from('orders').insert(row);
    if (error) throw new Error(error.message);

    // Increment slot reservation
    try {
      await sb.rpc('increment_slot_reservation', { slot_id: order.pickupSlot.id });
    } catch {
      // Direct update fallback
      const { data: slot } = await sb.from('pickup_slots').select('reserved_count').eq('id', order.pickupSlot.id).single();
      if (slot) {
        await sb.from('pickup_slots').update({ reserved_count: slot.reserved_count + 1 }).eq('id', order.pickupSlot.id);
      }
    }

    return order;
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<boolean> => {
    const sb = getSupabase();
    if (!sb) return false;

    const updates: any = { status };
    if (status === 'ready') updates.ready_at = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    const { error } = await sb.from('orders').update(updates).eq('id', orderId);
    return !error;
  },

  cancelOrder: async (orderId: string, reason?: string): Promise<boolean> => {
    const sb = getSupabase();
    if (!sb) return false;

    const { error } = await sb.from('orders').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || 'Cancelled by student',
    }).eq('id', orderId);

    return !error;
  },

  // Real-Time Subscriptions
  subscribeToOrders: (onInsert?: (order: any) => void, onUpdate?: (order: any) => void) => {
    const sb = getSupabase();
    if (!sb) return () => {};

    const channel = sb
      .channel('realtime_orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (onInsert) onInsert(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (onUpdate) onUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  },

  // Canteen settings
  getCanteenSettings: async (): Promise<CanteenSettings | null> => {
    const sb = getSupabase();
    if (!sb) return null;

    const { data, error } = await sb.from('canteen_settings').select('*').eq('id', 'primary').single();
    if (error || !data) return null;

    return {
      name: data.name,
      tagline: data.tagline,
      collegeName: data.college_name,
      counterName: data.counter_name,
      fssaiNumber: data.fssai_number,
    };
  },

  saveCanteenSettings: async (settings: Partial<CanteenSettings>): Promise<boolean> => {
    const sb = getSupabase();
    if (!sb) return false;

    const row: Record<string, any> = { id: 'primary', updated_at: new Date().toISOString() };
    if (settings.name !== undefined) row.name = settings.name;
    if (settings.tagline !== undefined) row.tagline = settings.tagline;
    if (settings.collegeName !== undefined) row.college_name = settings.collegeName;
    if (settings.counterName !== undefined) row.counter_name = settings.counterName;
    if (settings.fssaiNumber !== undefined) row.fssai_number = settings.fssaiNumber;

    const { error } = await sb.from('canteen_settings').upsert(row);
    return !error;
  },

  updateCanteenSettings: async (settings: Partial<CanteenSettings>): Promise<boolean> => {
    return supabaseService.saveCanteenSettings(settings);
  },

  // Supabase Authentication
  signUpStudent: async (email: string, password: string, metadata: { name: string; rollNumber?: string; department?: string; phone?: string }) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase is not configured.');

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata.name,
          roll_number: metadata.rollNumber,
          department: metadata.department,
          phone: metadata.phone,
          role: 'student',
        },
      },
    });

    if (error) throw new Error(error.message);

    // Create profile row if user created
    if (data.user) {
      await sb.from('profiles').upsert({
        id: data.user.id,
        name: metadata.name,
        email,
        role: 'student',
        roll_number: metadata.rollNumber,
        department: metadata.department,
        phone: metadata.phone,
      });
    }

    return data;
  },

  signInWithPassword: async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase is not configured.');

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  signOut: async () => {
    const sb = getSupabase();
    if (sb) {
      await sb.auth.signOut();
    }
  },
};
