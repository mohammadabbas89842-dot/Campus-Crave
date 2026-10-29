import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  INITIAL_FOOD_ITEMS,
  INITIAL_PICKUP_SLOTS,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
  INITIAL_USERS,
} from './src/data/initialData.ts';
import { FoodItem, PickupSlot, Coupon, Order, Review, User } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-Memory Database Store (Initialized from initialData)
let foodItems: FoodItem[] = [...INITIAL_FOOD_ITEMS];
let pickupSlots: PickupSlot[] = [...INITIAL_PICKUP_SLOTS];
let coupons: Coupon[] = [...INITIAL_COUPONS];
let orders: Order[] = [...INITIAL_ORDERS];
let reviews: Review[] = [...INITIAL_REVIEWS];
let users: User[] = [...INITIAL_USERS];

// Helper: Calculate order financials securely on the server
function calculateOrderTotals(
  items: { foodItemId: string; quantity: number; specialNote?: string }[],
  couponCode?: string
) {
  let subtotal = 0;
  const verifiedItems = items.map((cartItem) => {
    const item = foodItems.find((f) => f.id === cartItem.foodItemId);
    if (!item) {
      throw new Error(`Food item with ID ${cartItem.foodItemId} not found.`);
    }
    if (!item.isAvailable) {
      throw new Error(`"${item.name}" is currently sold out.`);
    }
    const itemSubtotal = item.price * cartItem.quantity;
    subtotal += itemSubtotal;
    return {
      foodItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: cartItem.quantity,
      subtotal: itemSubtotal,
      isVeg: item.isVeg,
      specialNote: cartItem.specialNote,
    };
  });

  const packagingFee = subtotal >= 100 ? 0 : 5;
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST

  let discountAmount = 0;
  if (couponCode) {
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive
    );
    if (coupon) {
      if (subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'percentage') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
        discountAmount = Math.min(discountAmount, subtotal);
      }
    }
  }

  const totalAmount = Math.round((subtotal + packagingFee + taxAmount - discountAmount) * 100) / 100;

  return {
    verifiedItems,
    subtotal,
    packagingFee,
    taxAmount,
    discountAmount,
    totalAmount,
  };
}

// ----------------- API ENDPOINTS -----------------

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusBite API',
    timestamp: new Date().toISOString(),
    razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  });
});

// Users
app.get('/api/users', (_req, res) => {
  res.json(users);
});

// Menu
app.get('/api/menu', (_req, res) => {
  res.json(foodItems);
});

app.post('/api/menu', (req, res) => {
  const { name, description, category, price, imageUrl, isVeg, prepTimeMinutes, isChefSpecial, calories, ingredients } = req.body;
  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: 'Name, category, and price are required.' });
  }

  const newItem: FoodItem = {
    id: `food_${Date.now()}`,
    name: name.trim(),
    description: description ? description.trim() : 'Freshly made canteen special.',
    category,
    price: Number(price),
    imageUrl: imageUrl || '/src/assets/images/dish_masala_maggi_1793265995300.jpg',
    isVeg: Boolean(isVeg),
    isAvailable: true,
    prepTimeMinutes: Number(prepTimeMinutes) || 8,
    rating: 5.0,
    reviewCount: 1,
    isChefSpecial: Boolean(isChefSpecial),
    calories: calories ? Number(calories) : 250,
    ingredients: Array.isArray(ingredients) ? ingredients : ['Fresh Ingredients'],
  };

  foodItems.unshift(newItem);
  res.status(201).json(newItem);
});

app.put('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  const index = foodItems.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Food item not found' });
  }

  foodItems[index] = {
    ...foodItems[index],
    ...req.body,
    id, // protect ID
  };

  res.json(foodItems[index]);
});

app.patch('/api/menu/:id/availability', (req, res) => {
  const { id } = req.params;
  const item = foodItems.find((f) => f.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Food item not found' });
  }
  item.isAvailable = req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : !item.isAvailable;
  res.json(item);
});

app.delete('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = foodItems.length;
  foodItems = foodItems.filter((item) => item.id !== id);
  if (foodItems.length === initialLength) {
    return res.status(404).json({ error: 'Food item not found' });
  }
  res.json({ message: 'Item deleted successfully', id });
});

// Pickup Slots (Queue Management)
app.get('/api/slots', (_req, res) => {
  res.json(pickupSlots);
});

app.put('/api/slots/:id', (req, res) => {
  const { id } = req.params;
  const slot = pickupSlots.find((s) => s.id === id);
  if (!slot) {
    return res.status(404).json({ error: 'Pickup slot not found' });
  }

  if (req.body.capacity !== undefined) {
    slot.capacity = Math.max(1, Number(req.body.capacity));
  }
  if (req.body.isActive !== undefined) {
    slot.isActive = Boolean(req.body.isActive);
  }

  res.json(slot);
});

// Coupons
app.get('/api/coupons', (_req, res) => {
  res.json(coupons);
});

app.post('/api/coupons', (req, res) => {
  const { code, discountType, discountValue, minOrderValue, maxDiscount, description } = req.body;
  if (!code || !discountType || discountValue === undefined) {
    return res.status(400).json({ error: 'Code, discount type, and discount value are required.' });
  }

  const newCoupon: Coupon = {
    id: `c_${Date.now()}`,
    code: code.trim().toUpperCase(),
    discountType,
    discountValue: Number(discountValue),
    minOrderValue: Number(minOrderValue) || 0,
    maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
    expiryDate: '2026-12-31',
    isActive: true,
    description: description || `Special discount voucher`,
    usageCount: 0,
  };

  coupons.push(newCoupon);
  res.status(201).json(newCoupon);
});

app.post('/api/coupons/validate', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ valid: false, message: 'Coupon code required.' });
  }

  const coupon = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
  if (!coupon) {
    return res.json({ valid: false, message: 'Invalid or expired coupon code.' });
  }

  const sub = Number(subtotal) || 0;
  if (sub < coupon.minOrderValue) {
    return res.json({
      valid: false,
      message: `Minimum order value for ${coupon.code} is ₹${coupon.minOrderValue}.`,
    });
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (sub * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }
  discount = Math.min(discount, sub);

  res.json({
    valid: true,
    code: coupon.code,
    discount: Math.round(discount * 100) / 100,
    description: coupon.description,
  });
});

// Orders
app.get('/api/orders', (req, res) => {
  let filtered = [...orders];
  if (req.query.studentId) {
    filtered = filtered.filter((o) => o.studentId === req.query.studentId);
  }
  if (req.query.status) {
    filtered = filtered.filter((o) => o.status === req.query.status);
  }
  // Sort latest first
  filtered.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  res.json(filtered);
});

app.post('/api/orders', (req, res) => {
  try {
    const {
      studentId,
      studentName,
      studentEmail,
      studentPhone,
      items,
      slotId,
      specialInstructions,
      couponCode,
      paymentMethod = 'upi',
      upiVpa,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    // 1. Verify and reserve pickup slot capacity (Queue reduction engine)
    const slot = pickupSlots.find((s) => s.id === slotId);
    if (!slot) {
      return res.status(400).json({ error: 'Selected pickup time slot not found.' });
    }
    if (!slot.isActive) {
      return res.status(400).json({ error: 'Selected pickup slot is currently inactive.' });
    }
    if (slot.reservedCount >= slot.capacity) {
      // Slot is full! Find alternative slot suggestions
      const availableAlternatives = pickupSlots
        .filter((s) => s.isActive && s.reservedCount < s.capacity && s.id !== slot.id)
        .slice(0, 2);
      return res.status(400).json({
        error: `Slot "${slot.startTime} - ${slot.endTime}" is completely full to prevent canteen overcrowding.`,
        suggestedSlots: availableAlternatives,
      });
    }

    // 2. Server-side price calculation & item validation
    const { verifiedItems, subtotal, packagingFee, taxAmount, discountAmount, totalAmount } =
      calculateOrderTotals(items, couponCode);

    // Increment slot reservation
    slot.reservedCount += 1;

    // Calculate dynamic estimated prep time based on item prep times & current kitchen workload
    const activeOrdersInKitchen = orders.filter(
      (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing'
    ).length;
    const maxItemPrepTime = Math.max(
      ...verifiedItems.map((vi) => {
        const item = foodItems.find((f) => f.id === vi.foodItemId);
        return item ? item.prepTimeMinutes : 8;
      })
    );
    // Workload modifier: add 2 min per 4 active kitchen orders
    const workloadModifier = Math.min(10, Math.floor(activeOrdersInKitchen / 4) * 2);
    const estimatedPrepTimeMinutes = maxItemPrepTime + workloadModifier;

    const orderNumber = `CB-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `order_${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      studentId: studentId || 'user_student_1',
      studentName: studentName || 'Aarav Sharma',
      studentEmail: studentEmail || 'aarav.sharma@campus.edu',
      studentPhone: studentPhone || '+91 98765 43210',
      items: verifiedItems,
      subtotal,
      packagingFee,
      taxAmount,
      discountAmount,
      couponCode,
      totalAmount,
      pickupSlot: { ...slot },
      specialInstructions: specialInstructions ? specialInstructions.trim() : undefined,
      status: 'confirmed',
      estimatedPrepTimeMinutes,
      placedAt: new Date().toISOString(),
      payment: {
        id: `pay_${Date.now()}`,
        orderId,
        gateway: 'razorpay',
        razorpayOrderId: `order_rcptid_${Date.now()}`,
        razorpayPaymentId: `pay_rzp_${Date.now()}`,
        method: paymentMethod,
        amount: totalAmount,
        status: 'completed',
        timestamp: new Date().toISOString(),
        isTestMode: true,
        upiVpa: upiVpa || 'student@upi',
      },
      isRated: false,
    };

    orders.unshift(newOrder);

    // Update coupon usage count if used
    if (couponCode) {
      const usedCoupon = coupons.find((c) => c.code.toUpperCase() === couponCode.trim().toUpperCase());
      if (usedCoupon) {
        usedCoupon.usageCount += 1;
      }
    }

    res.status(201).json(newOrder);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create order';
    res.status(400).json({ error: message });
  }
});

// Update Order Status (Staff and Admin)
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  order.status = status;
  if (status === 'ready' && !order.readyAt) {
    order.readyAt = new Date().toISOString();
  }
  if (status === 'completed' && !order.completedAt) {
    order.completedAt = new Date().toISOString();
  }

  res.json(order);
});

// Cancel Order (Cancellation Policy enforcement)
app.post('/api/orders/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Student cancellation policy: can only cancel if still pending or confirmed.
  // Once the kitchen starts preparing, meals cannot be cancelled to prevent food wastage.
  if (order.status === 'preparing') {
    return res.status(400).json({
      error: 'Cannot cancel order: Canteen kitchen has already started preparing your meal.',
    });
  }
  if (order.status === 'ready' || order.status === 'completed') {
    return res.status(400).json({
      error: 'Cannot cancel order: Meal is already prepared or collected.',
    });
  }
  if (order.status === 'cancelled') {
    return res.status(400).json({ error: 'Order is already cancelled.' });
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date().toISOString();
  order.cancellationReason = reason || 'Cancelled by student';
  order.payment.status = 'refunded';

  // Release slot capacity reservation
  const slot = pickupSlots.find((s) => s.id === order.pickupSlot.id);
  if (slot && slot.reservedCount > 0) {
    slot.reservedCount -= 1;
  }

  res.json({ message: 'Order cancelled and refund processed to original payment method.', order });
});

// Payment Gateway Integration (Razorpay Test Mode & Simulation)
app.post('/api/payment/create-order', (req, res) => {
  const { amount, receipt } = req.body;
  const amountInPaise = Math.round(Number(amount) * 100);

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const isConfigured = Boolean(razorpayKeyId && process.env.RAZORPAY_KEY_SECRET);

  const mockRazorpayOrderId = `order_rcptid_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  res.json({
    id: mockRazorpayOrderId,
    amount: amountInPaise,
    currency: 'INR',
    receipt: receipt || `rcpt_${Date.now()}`,
    isTestMode: true,
    keyId: razorpayKeyId || 'rzp_test_CampusBiteDemoKey123',
    isLiveConfigured: isConfigured,
  });
});

app.post('/api/payment/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, simulateFailure } = req.body;

  if (simulateFailure) {
    return res.status(400).json({
      success: false,
      error: 'Payment transaction failed or timed out by user bank.',
    });
  }

  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (razorpayKeySecret && razorpay_signature) {
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Razorpay signature verification failed.' });
    }
  }

  res.json({
    success: true,
    transactionId: razorpay_payment_id || `pay_sim_${Date.now()}`,
    status: 'captured',
  });
});

// Reviews & Ratings
app.get('/api/reviews', (req, res) => {
  let filtered = [...reviews];
  if (req.query.foodItemId) {
    filtered = filtered.filter((r) => r.foodItemId === req.query.foodItemId);
  }
  res.json(filtered);
});

app.post('/api/reviews', (req, res) => {
  const { orderId, foodItemId, rating, feedback, studentId, studentName } = req.body;
  if (!foodItemId || !rating) {
    return res.status(400).json({ error: 'Food item and rating are required.' });
  }

  const item = foodItems.find((f) => f.id === foodItemId);
  const newReview: Review = {
    id: `rev_${Date.now()}`,
    orderId: orderId || `order_${Date.now()}`,
    foodItemId,
    foodItemName: item ? item.name : 'Canteen Dish',
    studentId: studentId || 'user_student_1',
    studentName: studentName || 'Aarav Sharma',
    rating: Number(rating),
    feedback: feedback ? feedback.trim() : 'Delicious!',
    createdAt: new Date().toISOString(),
  };

  reviews.unshift(newReview);

  // Update item average rating
  if (item) {
    const itemReviews = reviews.filter((r) => r.foodItemId === foodItemId);
    const avg = itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length;
    item.rating = Math.round(avg * 10) / 10;
    item.reviewCount = itemReviews.length;
  }

  // Mark order as rated
  if (orderId) {
    const ord = orders.find((o) => o.id === orderId);
    if (ord) ord.isRated = true;
  }

  res.status(201).json(newReview);
});

// Analytics (Admin Dashboard)
app.get('/api/analytics', (_req, res) => {
  const completed = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completed.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const completedOrders = completed.length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;
  const averageOrderValue = completedOrders > 0 ? Math.round((totalRevenue / completedOrders) * 100) / 100 : 0;

  // Peak ordering hours analysis
  const hourMap: Record<string, { count: number; revenue: number }> = {
    '08 AM - 10 AM (Breakfast)': { count: 34, revenue: 1680 },
    '10 AM - 12 PM (Morning Break)': { count: 48, revenue: 2420 },
    '12 PM - 02 PM (Lunch Rush)': { count: 126, revenue: 9850 },
    '02 PM - 04 PM (Afternoon)': { count: 28, revenue: 1450 },
    '04 PM - 06 PM (Evening Snacks)': { count: 82, revenue: 4200 },
  };

  // Add live orders into peak hours
  orders.forEach((o) => {
    if (o.status !== 'cancelled') {
      const hour = new Date(o.placedAt).getHours();
      if (hour >= 8 && hour < 10) hourMap['08 AM - 10 AM (Breakfast)'].count++;
      else if (hour >= 10 && hour < 12) hourMap['10 AM - 12 PM (Morning Break)'].count++;
      else if (hour >= 12 && hour < 14) hourMap['12 PM - 02 PM (Lunch Rush)'].count++;
      else if (hour >= 14 && hour < 16) hourMap['02 PM - 04 PM (Afternoon)'].count++;
      else if (hour >= 16 && hour < 18) hourMap['04 PM - 06 PM (Evening Snacks)'].count++;
    }
  });

  const hourlyVolume = Object.entries(hourMap).map(([hour, data]) => ({
    hour,
    count: data.count,
    revenue: data.revenue,
  }));

  // Top selling dishes
  const dishCountMap: Record<string, { quantity: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (o.status !== 'cancelled') {
      o.items.forEach((item) => {
        if (!dishCountMap[item.name]) {
          dishCountMap[item.name] = { quantity: 0, revenue: 0 };
        }
        dishCountMap[item.name].quantity += item.quantity;
        dishCountMap[item.name].revenue += item.subtotal;
      });
    }
  });

  const topDishes = Object.entries(dishCountMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const categoryBreakdown = [
    { category: 'Meals' as const, sales: 8400, count: 95 },
    { category: 'Snacks' as const, sales: 6200, count: 145 },
    { category: 'Breakfast' as const, sales: 3400, count: 78 },
    { category: 'Beverages' as const, sales: 2850, count: 120 },
    { category: 'Desserts' as const, sales: 1250, count: 42 },
  ];

  res.json({
    totalRevenue: Math.round((totalRevenue + 22100) * 100) / 100, // includes past day baseline
    totalOrders: totalOrders + 180,
    completedOrders: completedOrders + 165,
    cancelledOrders: cancelledOrders + 4,
    averageOrderValue: averageOrderValue || 88.5,
    averagePrepTimeMinutes: 9.4,
    hourlyVolume,
    categoryBreakdown,
    topDishes: topDishes.length > 0 ? topDishes : [
      { name: 'Masala Maggi', quantity: 98, revenue: 3920 },
      { name: 'Executive Veg Thali', quantity: 74, revenue: 6660 },
      { name: 'Chole Kulche', quantity: 68, revenue: 4080 },
      { name: 'Chilled Cold Coffee', quantity: 62, revenue: 3100 },
      { name: 'Samosa (2 pcs)', quantity: 58, revenue: 870 },
    ],
  });
});

// ----------------- VITE INTEGRATION -----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampusBite Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
