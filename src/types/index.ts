export type UserRole = 'student' | 'staff' | 'admin';

export interface CanteenSettings {
  name: string;
  tagline: string;
  collegeName: string;
  counterName: string;
  fssaiNumber: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rollNumber?: string;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  accountStatus: 'active' | 'suspended';
}

export type FoodCategory = 'Breakfast' | 'Snacks' | 'Meals' | 'Beverages' | 'Desserts';

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  category: FoodCategory;
  price: number; // in INR (₹)
  imageUrl: string;
  isVeg: boolean;
  isAvailable: boolean;
  prepTimeMinutes: number;
  rating: number;
  reviewCount: number;
  isChefSpecial?: boolean;
  calories?: number;
  ingredients?: string[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  foodItemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  isVeg: boolean;
  specialNote?: string;
}

export interface PickupSlot {
  id: string;
  startTime: string; // e.g. "12:30 PM"
  endTime: string;   // e.g. "01:00 PM"
  period: 'breakfast' | 'lunch' | 'evening';
  capacity: number;
  reservedCount: number;
  isActive: boolean;
}

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'canteen_cash';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentRecord {
  id: string;
  orderId: string;
  gateway: 'razorpay' | 'test_gateway';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  timestamp: string;
  isTestMode: boolean;
  upiVpa?: string;
  failureReason?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "CB-1048"
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  items: OrderItem[];
  subtotal: number;
  packagingFee: number;
  taxAmount: number; // 5% GST
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  pickupSlot: PickupSlot;
  specialInstructions?: string;
  status: OrderStatus;
  estimatedPrepTimeMinutes: number;
  placedAt: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  payment: PaymentRecord;
  qrCodeDataUrl?: string;
  isRated?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number; // e.g. 20 for 20% or 30 for ₹30 off
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
  description: string;
  usageCount: number;
}

export interface Review {
  id: string;
  orderId: string;
  foodItemId: string;
  foodItemName: string;
  studentId: string;
  studentName: string;
  rating: number; // 1 to 5
  feedback: string;
  createdAt: string;
}

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  averagePrepTimeMinutes: number;
  hourlyVolume: { hour: string; count: number; revenue: number }[];
  categoryBreakdown: { category: FoodCategory; sales: number; count: number }[];
  topDishes: { name: string; quantity: number; revenue: number }[];
}
