import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { FoodItem, PickupSlot, Coupon, Order, User, UserRole, OrderItem, CanteenSettings } from '../types';
import {
  INITIAL_FOOD_ITEMS,
  INITIAL_PICKUP_SLOTS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_USERS,
} from '../data/initialData';
import { api } from '../services/api';
import { supabaseService } from '../services/supabaseService';

export interface CartEntry {
  item: FoodItem;
  quantity: number;
  specialNote?: string;
}

interface AppContextType {
  canteenSettings: CanteenSettings;
  updateCanteenSettings: (updates: Partial<CanteenSettings>) => void;
  currentUser: User;
  switchRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Menu
  menuItems: FoodItem[];
  isLoadingMenu: boolean;
  addMenuItem: (item: Partial<FoodItem>) => Promise<FoodItem>;
  updateMenuItem: (id: string, updates: Partial<FoodItem>) => Promise<FoodItem>;
  toggleAvailability: (id: string) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;

  // Slots
  pickupSlots: PickupSlot[];
  selectedSlot: PickupSlot | null;
  setSelectedSlot: (slot: PickupSlot | null) => void;
  updateSlotCapacity: (id: string, capacity: number, isActive?: boolean) => Promise<void>;

  // Cart
  cart: CartEntry[];
  addToCart: (item: FoodItem, quantity?: number, specialNote?: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  packagingFee: number;
  taxAmount: number;
  discountAmount: number;
  finalTotal: number;

  // Coupons
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  createCoupon: (coupon: Partial<Coupon>) => Promise<Coupon>;

  // Orders
  orders: Order[];
  studentOrders: Order[];
  placeOrder: (paymentMethod: string, upiVpa?: string, specialInstructions?: string) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  trackingOrderId: string | null;
  setTrackingOrderId: (id: string | null) => void;
  currentTrackingOrder: Order | null;
  viewingReceiptOrder: Order | null;
  setViewingReceiptOrder: (order: Order | null) => void;

  // Reviews
  reviewModalData: { order: Order; item: OrderItem } | null;
  openReviewModal: (order: Order, item: OrderItem) => void;
  closeReviewModal: () => void;
  submitReview: (rating: number, feedback: string) => Promise<void>;

  // Favorites
  favorites: string[];
  toggleFavorite: (itemId: string) => void;

  // Modals & Drawers
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
  isSupabaseActive: boolean;

  // Notification Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Staff Audio Alert
  staffAudioChime: boolean;
  setStaffAudioChime: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: CanteenSettings = {
  name: 'CampusCrave',
  tagline: 'Smart College Canteen',
  collegeName: 'University Dining Services',
  counterName: 'Express Pickup Counter #2',
  fssaiNumber: '10022987654',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Canteen Branding Settings
  const [canteenSettings, setCanteenSettings] = useState<CanteenSettings>(() => {
    const saved = localStorage.getItem('cb_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return DEFAULT_SETTINGS;
  });

  const updateCanteenSettings = (updates: Partial<CanteenSettings>) => {
    setCanteenSettings((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('cb_settings', JSON.stringify(updated));
      document.title = `${updated.name} — ${updated.tagline}`;
      return updated;
    });
    if (isSupabaseActive) {
      supabaseService.updateCanteenSettings(updates).catch((err: unknown) => {
        console.warn('Supabase updateCanteenSettings fallback warning:', err);
      });
    }
    showToast('Canteen brand name updated across the website!', 'success');
  };

  useEffect(() => {
    document.title = `${canteenSettings.name} — ${canteenSettings.tagline}`;
  }, [canteenSettings.name, canteenSettings.tagline]);

  // Users & Role state
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('cb_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_USERS[0]; // Student Aarav by default
  });

  const [activeTab, setActiveTab] = useState<string>('home');

  // Menu State
  const [menuItems, setMenuItems] = useState<FoodItem[]>(() => {
    const saved = localStorage.getItem('cb_menu');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_FOOD_ITEMS;
  });
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // Slots State
  const [pickupSlots, setPickupSlots] = useState<PickupSlot[]>(() => {
    const saved = localStorage.getItem('cb_slots');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_PICKUP_SLOTS;
  });
  const [selectedSlot, setSelectedSlot] = useState<PickupSlot | null>(() => {
    // Default to the first available lunch slot
    return INITIAL_PICKUP_SLOTS.find(s => s.period === 'lunch' && s.reservedCount < s.capacity) || INITIAL_PICKUP_SLOTS[0];
  });

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('cb_coupons');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_COUPONS;
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartEntry[]>(() => {
    const saved = localStorage.getItem('cb_cart');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [];
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('cb_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_ORDERS;
  });

  // Tracking & Receipt
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);

  // Reviews
  const [reviewModalData, setReviewModalData] = useState<{ order: Order; item: OrderItem } | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('cb_favorites');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return ['food_3', 'food_7'];
  });

  // Modals
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const isSupabaseActive = supabaseService.isAvailable();

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Staff Audio
  const [staffAudioChime, setStaffAudioChime] = useState(true);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  };

  // Sync state to local storage for persistence across reloads
  useEffect(() => {
    localStorage.setItem('cb_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('cb_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('cb_slots', JSON.stringify(pickupSlots));
  }, [pickupSlots]);

  useEffect(() => {
    localStorage.setItem('cb_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('cb_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('cb_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('cb_coupons', JSON.stringify(coupons));
  }, [coupons]);

  // Initial fetch from Supabase (if configured) or Backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingMenu(true);

        if (isSupabaseActive) {
          console.log('[CampusCrave] Syncing live with Supabase PostgreSQL Database...');
          const [sbMenu, sbSlots, sbOrders, sbSettings] = await Promise.allSettled([
            supabaseService.getMenu(),
            supabaseService.getSlots(),
            supabaseService.getOrders(),
            supabaseService.getCanteenSettings(),
          ]);

          if (sbMenu.status === 'fulfilled' && sbMenu.value && sbMenu.value.length > 0) {
            setMenuItems(sbMenu.value);
          }
          if (sbSlots.status === 'fulfilled' && sbSlots.value && sbSlots.value.length > 0) {
            setPickupSlots(sbSlots.value);
          }
          if (sbOrders.status === 'fulfilled' && sbOrders.value && sbOrders.value.length > 0) {
            setOrders(sbOrders.value);
          }
          if (sbSettings.status === 'fulfilled' && sbSettings.value) {
            setCanteenSettings(sbSettings.value);
          }
        } else {
          const [remoteMenu, remoteSlots, remoteOrders, remoteCoupons] = await Promise.allSettled([
            api.getMenu(),
            api.getSlots(),
            api.getOrders(),
            api.getCoupons(),
          ]);

          if (remoteMenu.status === 'fulfilled' && remoteMenu.value.length > 0) {
            setMenuItems(remoteMenu.value);
          }
          if (remoteSlots.status === 'fulfilled' && remoteSlots.value.length > 0) {
            setPickupSlots(remoteSlots.value);
          }
          if (remoteOrders.status === 'fulfilled' && remoteOrders.value.length > 0) {
            setOrders(remoteOrders.value);
          }
          if (remoteCoupons.status === 'fulfilled' && remoteCoupons.value.length > 0) {
            setCoupons(remoteCoupons.value);
          }
        }
      } catch (err) {
        console.warn('Data sync fallback to local state', err);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    fetchData();
  }, [isSupabaseActive]);

  // Real-time Supabase PostgreSQL live order subscription
  useEffect(() => {
    if (!isSupabaseActive) return;

    const unsubscribe = supabaseService.subscribeToOrders(
      (newOrder) => {
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
        showToast(`New order #${newOrder.order_number || newOrder.orderNumber} received in Supabase!`, 'info');
      },
      (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === (updatedOrder.id || updatedOrder.order_id) ? { ...o, ...updatedOrder } : o))
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isSupabaseActive]);

  // Role Switcher
  const switchRole = (role: UserRole) => {
    const targetUser = INITIAL_USERS.find((u) => u.role === role) || {
      id: `user_${role}`,
      name: role === 'student' ? 'Aarav Sharma' : role === 'staff' ? 'Chef Ramesh Kumar' : 'Priya Mukherjee (Director)',
      email: `${role}@campus.edu`,
      role,
      accountStatus: 'active',
    };
    setCurrentUser(targetUser);

    if (role === 'staff') {
      setActiveTab('staff');
      showToast('Switched to Canteen Kitchen Staff (KDS) View', 'info');
    } else if (role === 'admin') {
      setActiveTab('admin');
      showToast('Switched to Canteen Administrator Portal', 'info');
    } else {
      setActiveTab('home');
      showToast('Switched to Student Portal (Aarav Sharma)', 'info');
    }
  };

  // Cart Calculations
  const cartCount = useMemo(() => {
    return cart.reduce((sum, entry) => sum + entry.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
  }, [cart]);

  const packagingFee = useMemo(() => {
    return cartSubtotal >= 100 || cartSubtotal === 0 ? 0 : 5;
  }, [cartSubtotal]);

  const taxAmount = useMemo(() => {
    return Math.round(cartSubtotal * 0.05 * 100) / 100; // 5% GST
  }, [cartSubtotal]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (cartSubtotal < appliedCoupon.minOrderValue) return 0;

    let disc = 0;
    if (appliedCoupon.discountType === 'percentage') {
      disc = (cartSubtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount && disc > appliedCoupon.maxDiscount) {
        disc = appliedCoupon.maxDiscount;
      }
    } else {
      disc = appliedCoupon.discountValue;
    }
    return Math.min(disc, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  const finalTotal = useMemo(() => {
    const total = cartSubtotal + packagingFee + taxAmount - discountAmount;
    return Math.max(0, Math.round(total * 100) / 100);
  }, [cartSubtotal, packagingFee, taxAmount, discountAmount]);

  // Cart Actions
  const addToCart = (item: FoodItem, quantity = 1, specialNote?: string) => {
    if (!item.isAvailable) {
      showToast(`Sorry, "${item.name}" is currently sold out.`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((entry) => entry.item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          specialNote: specialNote || updated[existingIndex].specialNote,
        };
        return updated;
      } else {
        return [...prevCart, { item, quantity, specialNote }];
      }
    });

    showToast(`Added ${quantity}x "${item.name}" to cart`, 'success');
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((entry) => (entry.item.id === itemId ? { ...entry, quantity } : entry))
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((entry) => entry.item.id !== itemId));
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Coupons
  const applyCouponCode = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === normalized && c.isActive);

    if (!found) {
      showToast(`Coupon "${code}" is invalid or expired`, 'error');
      return { success: false, message: 'Invalid coupon' };
    }

    if (cartSubtotal < found.minOrderValue) {
      const msg = `Minimum order amount for ${found.code} is ₹${found.minOrderValue}. Add items worth ₹${found.minOrderValue - cartSubtotal} more!`;
      showToast(msg, 'error');
      return { success: false, message: msg };
    }

    setAppliedCoupon(found);
    showToast(`Coupon "${found.code}" applied! You saved up to ₹${found.maxDiscount || found.discountValue}`, 'success');
    return { success: true, message: 'Coupon applied successfully!' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  const createCoupon = async (couponData: Partial<Coupon>) => {
    try {
      const created = await api.createCoupon(couponData);
      setCoupons((prev) => [created, ...prev]);
      showToast(`Coupon ${created.code} published!`, 'success');
      return created;
    } catch {
      // Local fallback
      const localCoupon: Coupon = {
        id: `c_${Date.now()}`,
        code: (couponData.code || 'SPECIAL').toUpperCase(),
        discountType: couponData.discountType || 'percentage',
        discountValue: Number(couponData.discountValue) || 10,
        minOrderValue: Number(couponData.minOrderValue) || 50,
        maxDiscount: couponData.maxDiscount ? Number(couponData.maxDiscount) : 50,
        expiryDate: '2026-12-31',
        isActive: true,
        description: couponData.description || 'Special promo coupon',
        usageCount: 0,
      };
      setCoupons((prev) => [localCoupon, ...prev]);
      showToast(`Coupon ${localCoupon.code} created locally!`, 'success');
      return localCoupon;
    }
  };

  // Order Placement
  const placeOrder = async (
    paymentMethod: string,
    upiVpa?: string,
    specialInstructions?: string
  ): Promise<Order> => {
    if (cart.length === 0) {
      throw new Error('Your cart is empty');
    }
    if (!selectedSlot) {
      throw new Error('Please select a pickup time slot');
    }

    // Capacity verification
    if (selectedSlot.reservedCount >= selectedSlot.capacity) {
      throw new Error(`Pickup slot ${selectedSlot.startTime} - ${selectedSlot.endTime} is currently full to prevent counter crowds.`);
    }

    const payload = {
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      studentPhone: currentUser.phone || '+91 98765 43210',
      items: cart.map((entry) => ({
        foodItemId: entry.item.id,
        quantity: entry.quantity,
        specialNote: entry.specialNote,
      })),
      slotId: selectedSlot.id,
      specialInstructions,
      couponCode: appliedCoupon?.code,
      paymentMethod,
      upiVpa,
    };

    let newOrder: Order;
    try {
      newOrder = await api.createOrder(payload);
    } catch {
      // Fallback local placement
      const orderNumber = `CB-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderId = `order_${Date.now()}`;
      newOrder = {
        id: orderId,
        orderNumber,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        studentPhone: currentUser.phone,
        items: cart.map((entry) => ({
          foodItemId: entry.item.id,
          name: entry.item.name,
          price: entry.item.price,
          quantity: entry.quantity,
          subtotal: entry.item.price * entry.quantity,
          isVeg: entry.item.isVeg,
          specialNote: entry.specialNote,
        })),
        subtotal: cartSubtotal,
        packagingFee,
        taxAmount,
        discountAmount,
        couponCode: appliedCoupon?.code,
        totalAmount: finalTotal,
        pickupSlot: selectedSlot,
        specialInstructions,
        status: 'confirmed',
        estimatedPrepTimeMinutes: 10,
        placedAt: new Date().toISOString(),
        payment: {
          id: `pay_${Date.now()}`,
          orderId,
          gateway: 'razorpay',
          razorpayOrderId: `order_rcptid_${Date.now()}`,
          razorpayPaymentId: `pay_rzp_mock_${Date.now()}`,
          method: paymentMethod as any,
          amount: finalTotal,
          status: 'completed',
          timestamp: new Date().toISOString(),
          isTestMode: true,
          upiVpa,
        },
      };

      // Reserve slot locally
      setPickupSlots((slots) =>
        slots.map((s) => (s.id === selectedSlot.id ? { ...s, reservedCount: s.reservedCount + 1 } : s))
      );
    }

    // If Supabase is active, persist order directly to Supabase PostgreSQL database
    if (isSupabaseActive) {
      try {
        await supabaseService.createOrder(newOrder);
      } catch (err) {
        console.warn('Supabase createOrder fallback warning:', err);
      }
    }

    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    clearCart();
    setIsCheckoutModalOpen(false);
    setTrackingOrderId(newOrder.id);
    showToast(`Order #${newOrder.orderNumber} placed successfully! Slot: ${newOrder.pickupSlot.startTime}`, 'success');

    // Simulate staff kitchen bell if in staff view or staff chime enabled
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    // If Supabase is active, update Supabase PostgreSQL database
    if (isSupabaseActive) {
      try {
        await supabaseService.updateOrderStatus(orderId, status);
      } catch (err) {
        console.warn('Supabase updateOrderStatus fallback warning:', err);
      }
    }

    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch {
      // Local fallback
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const updated: Order = {
            ...o,
            status: status as any,
            readyAt: status === 'ready' && !o.readyAt ? new Date().toISOString() : o.readyAt,
            completedAt: status === 'completed' && !o.completedAt ? new Date().toISOString() : o.completedAt,
          };
          return updated;
        })
      );
    }

    const readableStatus =
      status === 'preparing'
        ? 'Being Prepared in Kitchen'
        : status === 'ready'
        ? 'Ready for Counter Pickup!'
        : status === 'completed'
        ? 'Picked up & Completed'
        : status;
    showToast(`Order status updated to: ${readableStatus}`, 'success');
  };

  const cancelOrder = async (orderId: string, reason?: string) => {
    if (isSupabaseActive) {
      try {
        await supabaseService.cancelOrder(orderId, reason);
      } catch (err) {
        console.warn('Supabase cancelOrder fallback warning:', err);
      }
    }

    try {
      const res = await api.cancelOrder(orderId, reason);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
    } catch (err: unknown) {
      const target = orders.find((o) => o.id === orderId);
      if (target?.status === 'preparing' || target?.status === 'ready') {
        const errorMsg = err instanceof Error ? err.message : 'Cannot cancel an order already being prepared in the kitchen.';
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }
      // Local cancel fallback
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancellationReason: reason || 'Cancelled by student',
                payment: { ...o.payment, status: 'refunded' },
              }
            : o
        )
      );
    }

    showToast('Order cancelled. 100% refund has been processed.', 'info');
  };

  // Menu Admin Operations
  const addMenuItem = async (itemData: Partial<FoodItem>) => {
    try {
      const created = await api.createMenuItem(itemData);
      setMenuItems((prev) => [created, ...prev]);
      showToast(`Dish "${created.name}" added to menu!`, 'success');
      return created;
    } catch {
      const localItem: FoodItem = {
        id: `food_${Date.now()}`,
        name: itemData.name || 'New Item',
        description: itemData.description || 'Freshly made canteen special',
        category: itemData.category || 'Snacks',
        price: Number(itemData.price) || 50,
        imageUrl: itemData.imageUrl || '/src/assets/images/dish_masala_maggi_1793265995300.jpg',
        isVeg: itemData.isVeg !== undefined ? itemData.isVeg : true,
        isAvailable: true,
        prepTimeMinutes: Number(itemData.prepTimeMinutes) || 8,
        rating: 5.0,
        reviewCount: 1,
        isChefSpecial: itemData.isChefSpecial || false,
        calories: itemData.calories || 280,
        ingredients: itemData.ingredients || ['Fresh Ingredients'],
      };
      setMenuItems((prev) => [localItem, ...prev]);
      showToast(`Dish "${localItem.name}" added locally!`, 'success');
      return localItem;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<FoodItem>) => {
    try {
      const updated = await api.updateMenuItem(id, updates);
      setMenuItems((prev) => prev.map((f) => (f.id === id ? updated : f)));
      showToast(`"${updated.name}" updated`, 'success');
      return updated;
    } catch {
      let updatedItem: FoodItem | null = null;
      setMenuItems((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            updatedItem = { ...f, ...updates };
            return updatedItem;
          }
          return f;
        })
      );
      showToast('Item updated', 'success');
      return updatedItem!;
    }
  };

  const toggleAvailability = async (id: string) => {
    const target = menuItems.find((f) => f.id === id);
    if (!target) return;
    const newStatus = !target.isAvailable;
    try {
      await api.toggleItemAvailability(id, newStatus);
    } catch {
      // Local fallback
    }
    setMenuItems((prev) => prev.map((f) => (f.id === id ? { ...f, isAvailable: newStatus } : f)));
    showToast(
      `"${target.name}" is now ${newStatus ? 'AVAILABLE / IN STOCK' : 'MARKED SOLD OUT'}`,
      newStatus ? 'success' : 'info'
    );
  };

  const deleteMenuItem = async (id: string) => {
    const target = menuItems.find((f) => f.id === id);
    try {
      await api.deleteMenuItem(id);
    } catch {
      // Local fallback
    }
    setMenuItems((prev) => prev.filter((f) => f.id !== id));
    showToast(`"${target?.name || 'Dish'}" removed from menu`, 'info');
  };

  // Slots Admin Operations
  const updateSlotCapacity = async (id: string, capacity: number, isActive = true) => {
    try {
      const updated = await api.updateSlotCapacity(id, capacity, isActive);
      setPickupSlots((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      setPickupSlots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, capacity, isActive } : s))
      );
    }
    showToast('Pickup slot capacity updated', 'success');
  };

  // Favorites
  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(itemId);
      const next = exists ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      showToast(exists ? 'Removed from favorites' : 'Added to favorites', 'info');
      return next;
    });
  };

  // Reviews
  const openReviewModal = (order: Order, item: OrderItem) => {
    setReviewModalData({ order, item });
  };

  const closeReviewModal = () => {
    setReviewModalData(null);
  };

  const submitReview = async (rating: number, feedback: string) => {
    if (!reviewModalData) return;
    try {
      await api.submitReview({
        orderId: reviewModalData.order.id,
        foodItemId: reviewModalData.item.foodItemId,
        rating,
        feedback,
        studentId: currentUser.id,
        studentName: currentUser.name,
      });
    } catch {
      // local fallback
    }

    // Mark locally
    setOrders((prev) =>
      prev.map((o) => (o.id === reviewModalData.order.id ? { ...o, isRated: true } : o))
    );
    // Update local item rating
    setMenuItems((prev) =>
      prev.map((f) => {
        if (f.id === reviewModalData.item.foodItemId) {
          const newCount = f.reviewCount + 1;
          const newAvg = (f.rating * f.reviewCount + rating) / newCount;
          return { ...f, rating: Math.round(newAvg * 10) / 10, reviewCount: newCount };
        }
        return f;
      })
    );

    showToast('Thank you! Your feedback helps the canteen serve you better.', 'success');
    closeReviewModal();
  };

  // Derived student orders
  const studentOrders = useMemo(() => {
    return orders.filter((o) => o.studentId === currentUser.id);
  }, [orders, currentUser.id]);

  const currentTrackingOrder = useMemo(() => {
    if (!trackingOrderId) return null;
    return orders.find((o) => o.id === trackingOrderId) || null;
  }, [orders, trackingOrderId]);

  return (
    <AppContext.Provider
      value={{
        canteenSettings,
        updateCanteenSettings,
        currentUser,
        switchRole,
        activeTab,
        setActiveTab,
        menuItems,
        isLoadingMenu,
        addMenuItem,
        updateMenuItem,
        toggleAvailability,
        deleteMenuItem,
        pickupSlots,
        selectedSlot,
        setSelectedSlot,
        updateSlotCapacity,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        packagingFee,
        taxAmount,
        discountAmount,
        finalTotal,
        coupons,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        createCoupon,
        orders,
        studentOrders,
        placeOrder,
        updateOrderStatus,
        cancelOrder,
        trackingOrderId,
        setTrackingOrderId,
        currentTrackingOrder,
        viewingReceiptOrder,
        setViewingReceiptOrder,
        reviewModalData,
        openReviewModal,
        closeReviewModal,
        submitReview,
        favorites,
        toggleFavorite,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        isSupabaseActive,
        toast,
        showToast,
        staffAudioChime,
        setStaffAudioChime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
