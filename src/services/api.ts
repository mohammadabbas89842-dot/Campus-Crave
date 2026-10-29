import { FoodItem, PickupSlot, Coupon, Order, Review, User } from '../types';

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users');
    return res.json();
  },

  // Menu
  getMenu: async (): Promise<FoodItem[]> => {
    const res = await fetch('/api/menu');
    if (!res.ok) throw new Error('Failed to fetch menu');
    return res.json();
  },

  createMenuItem: async (item: Partial<FoodItem>): Promise<FoodItem> => {
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create food item');
    }
    return res.json();
  },

  updateMenuItem: async (id: string, updates: Partial<FoodItem>): Promise<FoodItem> => {
    const res = await fetch(`/api/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update food item');
    return res.json();
  },

  toggleItemAvailability: async (id: string, isAvailable?: boolean): Promise<FoodItem> => {
    const res = await fetch(`/api/menu/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable }),
    });
    if (!res.ok) throw new Error('Failed to toggle availability');
    return res.json();
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete item');
  },

  // Slots
  getSlots: async (): Promise<PickupSlot[]> => {
    const res = await fetch('/api/slots');
    if (!res.ok) throw new Error('Failed to fetch pickup slots');
    return res.json();
  },

  updateSlotCapacity: async (id: string, capacity: number, isActive?: boolean): Promise<PickupSlot> => {
    const res = await fetch(`/api/slots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity, isActive }),
    });
    if (!res.ok) throw new Error('Failed to update slot');
    return res.json();
  },

  // Coupons
  getCoupons: async (): Promise<Coupon[]> => {
    const res = await fetch('/api/coupons');
    return res.json();
  },

  createCoupon: async (coupon: Partial<Coupon>): Promise<Coupon> => {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coupon),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create coupon');
    }
    return res.json();
  },

  validateCoupon: async (code: string, subtotal: number) => {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    });
    return res.json();
  },

  // Orders
  getOrders: async (studentId?: string): Promise<Order[]> => {
    const url = studentId ? `/api/orders?studentId=${encodeURIComponent(studentId)}` : '/api/orders';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  createOrder: async (orderPayload: {
    studentId: string;
    studentName: string;
    studentEmail: string;
    studentPhone?: string;
    items: { foodItemId: string; quantity: number; specialNote?: string }[];
    slotId: string;
    specialInstructions?: string;
    couponCode?: string;
    paymentMethod: string;
    upiVpa?: string;
  }): Promise<Order> => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    if (!res.ok) {
      const err = await res.json();
      const errorObj = new Error(err.error || 'Failed to place order');
      (errorObj as unknown as { suggestedSlots: PickupSlot[] }).suggestedSlots = err.suggestedSlots;
      throw errorObj;
    }
    return res.json();
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  cancelOrder: async (id: string, reason?: string): Promise<{ message: string; order: Order }> => {
    const res = await fetch(`/api/orders/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to cancel order');
    }
    return res.json();
  },

  // Payment
  createPaymentOrder: async (amount: number, receipt?: string) => {
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, receipt }),
    });
    return res.json();
  },

  verifyPayment: async (verificationPayload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    simulateFailure?: boolean;
  }) => {
    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationPayload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Payment verification failed');
    }
    return res.json();
  },

  // Reviews
  getReviews: async (foodItemId?: string): Promise<Review[]> => {
    const url = foodItemId ? `/api/reviews?foodItemId=${encodeURIComponent(foodItemId)}` : '/api/reviews';
    const res = await fetch(url);
    return res.json();
  },

  submitReview: async (reviewPayload: {
    orderId: string;
    foodItemId: string;
    rating: number;
    feedback: string;
    studentId: string;
    studentName: string;
  }): Promise<Review> => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return res.json();
  },

  // Analytics
  getAnalytics: async () => {
    const res = await fetch('/api/analytics');
    return res.json();
  },
};
