import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  Star,
  Users,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  Utensils,
  ChevronDown,
  AlertTriangle,
  X,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FoodCategory, FoodItem, PickupSlot, Coupon } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    menuItems,
    addMenuItem,
    updateMenuItem,
    toggleAvailability,
    deleteMenuItem,
    pickupSlots,
    updateSlotCapacity,
    coupons,
    createCoupon,
    orders,
    updateOrderStatus,
    cancelOrder,
    showToast,
    canteenSettings,
    updateCanteenSettings,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
    isSupabaseActive,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'analytics' | 'menu' | 'slots' | 'orders' | 'coupons' | 'branding'>('analytics');
  const [brandForm, setBrandForm] = useState({
    name: canteenSettings.name,
    tagline: canteenSettings.tagline,
    collegeName: canteenSettings.collegeName,
    counterName: canteenSettings.counterName,
    fssaiNumber: canteenSettings.fssaiNumber,
  });

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Snacks' as FoodCategory,
    price: 40,
    prepTimeMinutes: 8,
    isVeg: true,
    isAvailable: true,
    isChefSpecial: false,
    calories: 250,
    description: '',
    imageUrl: '/src/assets/images/dish_masala_maggi_1793265995300.jpg',
  });

  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponFormData, setCouponFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: 20,
    minOrderValue: 80,
    maxDiscount: 50,
    description: '',
  });

  // Financial aggregates
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const liveRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0) + 18540; // baseline + live
  const totalOrdersCount = orders.length + 142;
  const activeOrdersCount = orders.filter((o) => o.status === 'confirmed' || o.status === 'preparing').length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Snacks',
      price: 40,
      prepTimeMinutes: 8,
      isVeg: true,
      isAvailable: true,
      isChefSpecial: false,
      calories: 250,
      description: '',
      imageUrl: '/src/assets/images/dish_masala_maggi_1793265995300.jpg',
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEdit = (item: FoodItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      prepTimeMinutes: item.prepTimeMinutes,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      isChefSpecial: !!item.isChefSpecial,
      calories: item.calories || 250,
      description: item.description,
      imageUrl: item.imageUrl,
    });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please enter a dish name', 'error');
      return;
    }

    if (editingItem) {
      await updateMenuItem(editingItem.id, formData);
    } else {
      await addMenuItem(formData);
    }
    setIsMenuModalOpen(false);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponFormData.code.trim()) {
      showToast('Please enter a coupon code', 'error');
      return;
    }

    await createCoupon(couponFormData);
    setIsCouponModalOpen(false);
    setCouponFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 20,
      minOrderValue: 80,
      maxDiscount: 50,
      description: '',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Canteen Administration Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Campus Dining Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage menus, slot capacities, real-time incoming orders, discount vouchers, and sales analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              isSupabaseActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                : 'bg-stone-900 text-white border-stone-800 hover:bg-stone-800 shadow-xs'
            }`}
          >
            <Database className={`w-3.5 h-3.5 ${isSupabaseActive ? 'text-emerald-600' : 'text-stone-300'}`} />
            <span>{isSupabaseActive ? 'Supabase DB: Active' : 'Connect Supabase DB'}</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('branding')}
            className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all border border-stone-200 flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Customize Website Name</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Supabase Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
          isSupabaseActive
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-stone-100 border-stone-200 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isSupabaseActive ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-white'
            }`}
          >
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>
                {isSupabaseActive
                  ? 'Connected to Supabase PostgreSQL Database'
                  : 'Supabase Database Not Connected (Running on Express & Local State)'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  isSupabaseActive ? 'bg-emerald-200 text-emerald-800' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {isSupabaseActive ? 'Active & Synced' : 'Ready to Connect'}
              </span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {isSupabaseActive
                ? 'Incoming orders, menu updates, and pickup slot capacities are persisting live to PostgreSQL tables with real-time websocket subscriptions.'
                : 'Want your orders and canteen menu saved to cloud PostgreSQL? Click the button to link your Supabase URL & Key with 1-click SQL schema.'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsSupabaseModalOpen(true)}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 self-start sm:self-auto ${
            isSupabaseActive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-stone-900 hover:bg-stone-800 text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isSupabaseActive ? 'Supabase Settings & SQL' : 'Connect Supabase'}</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
            <span>Today's Total Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 tabular-nums font-mono">
            ₹{liveRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            +18.4% vs last week · Digital payments verified
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
            <span>Orders Received</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 tabular-nums font-mono">
            {totalOrdersCount}
          </div>
          <div className="text-[11px] text-stone-500">
            Average order value: <strong className="text-stone-800">₹88.50</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
            <span>Active Kitchen Queue</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 tabular-nums font-mono">
            {activeOrdersCount} Orders
          </div>
          <div className="text-[11px] text-stone-500">
            Average prep pacing: <strong className="text-stone-800">9.2 mins</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
            <span>Queue Prevention Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 tabular-nums font-mono">
            96.8%
          </div>
          <div className="text-[11px] text-stone-500">
            Slot capacity caps prevent corridor crowding
          </div>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('analytics')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeAdminTab === 'analytics'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Sales & Peak-Hour Analytics
        </button>
        <button
          onClick={() => setActiveAdminTab('menu')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeAdminTab === 'menu'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Menu Management ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('slots')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeAdminTab === 'slots'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Pickup Slots & Capacity
        </button>
        <button
          onClick={() => setActiveAdminTab('orders')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeAdminTab === 'orders'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          All Orders Audit ({orders.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('coupons')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeAdminTab === 'coupons'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Coupons & Discounts
        </button>
        <button
          onClick={() => setActiveAdminTab('branding')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeAdminTab === 'branding'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Website Name & Branding
        </button>
      </div>

      {/* Tab: Analytics */}
      {activeAdminTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Peak Hours Volume Bar Chart */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    Peak Ordering Hours Analysis
                  </h3>
                  <p className="text-xs text-stone-500">
                    Distribution of campus meal volume across daily break intervals.
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  Peak: 12 PM - 02 PM
                </span>
              </div>

              {/* Chart Visualizer */}
              <div className="space-y-3 pt-3">
                {[
                  { label: '08:00 - 10:00 (Breakfast)', count: 42, max: 135, percent: 31, rev: '₹1,950' },
                  { label: '10:00 - 12:00 (Morning Break)', count: 68, max: 135, percent: 50, rev: '₹3,420' },
                  { label: '12:00 - 14:00 (Lunch Rush)', count: 132, max: 135, percent: 98, rev: '₹10,560' },
                  { label: '14:00 - 16:00 (Afternoon)', count: 32, max: 135, percent: 24, rev: '₹1,620' },
                  { label: '16:00 - 18:00 (Snacks & Tea)', count: 94, max: 135, percent: 70, rev: '₹4,890' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-stone-800">{item.label}</span>
                      <span className="text-stone-500 tabular-nums">
                        <strong>{item.count} orders</strong> ({item.rev})
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.percent > 85
                            ? 'bg-red-500'
                            : item.percent > 55
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Heavy demand bottleneck mitigated by slot caps</span>
              </div>
            </div>

            {/* Top Selling Dishes */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-stone-900">
                Top 5 Most Popular Dishes
              </h3>

              <div className="divide-y divide-stone-100">
                {[
                  { name: 'Masala Maggi', category: 'Snacks', qty: 98, revenue: 3920, rating: 4.9 },
                  { name: 'Executive Veg Thali', category: 'Meals', qty: 74, revenue: 6660, rating: 4.9 },
                  { name: 'Chole Kulche', category: 'Meals', qty: 68, revenue: 4080, rating: 4.9 },
                  { name: 'Chilled Cold Coffee', category: 'Beverages', qty: 62, revenue: 3100, rating: 4.8 },
                  { name: 'Samosa (2 pcs)', category: 'Snacks', qty: 58, revenue: 870, rating: 4.8 },
                ].map((dish, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-stone-900">{i + 1}. {dish.name}</div>
                      <div className="text-[11px] text-stone-400">{dish.category} · {dish.qty} orders today</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-stone-900 tabular-nums">₹{dish.revenue}</div>
                      <div className="text-[10px] text-amber-600 font-bold">★ {dish.rating}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Menu Management */}
      {activeAdminTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-stone-900">
              Canteen Menu Items ({menuItems.length})
            </h2>
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dish</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Dish</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Prep Time</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-stone-900">{item.name}</div>
                            <div className="text-[10px] text-stone-400 line-clamp-1 max-w-xs">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-600">{item.category}</td>
                      <td className="py-3 px-4 font-bold text-stone-900 tabular-nums">₹{item.price}</td>
                      <td className="py-3 px-4 text-stone-600 tabular-nums">{item.prepTimeMinutes} mins</td>
                      <td className="py-3 px-4 font-semibold text-amber-600">★ {item.rating}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleAvailability(item.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                            item.isAvailable
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {item.isAvailable ? 'In Stock' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit Dish"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMenuItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Pickup Slots & Capacity */}
      {activeAdminTab === 'slots' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-stone-900">
              Pickup Slot Capacity Management
            </h2>
            <p className="text-xs text-stone-500">
              Adjust maximum orders per 15-minute slot to control kitchen workload and queue length.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pickupSlots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-stone-900 text-sm">
                    {slot.startTime} – {slot.endTime}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {slot.period}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Reserved Orders:</span>
                    <span className="font-bold tabular-nums">{slot.reservedCount}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Maximum Slot Capacity:</span>
                    <span className="font-bold tabular-nums">{slot.capacity}</span>
                  </div>
                </div>

                {/* Capacity stepper */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-500">Edit Max Capacity:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateSlotCapacity(slot.id, Math.max(1, slot.capacity - 5), slot.isActive)}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs font-bold"
                    >
                      -5
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold">
                      {slot.capacity}
                    </span>
                    <button
                      onClick={() => updateSlotCapacity(slot.id, slot.capacity + 5, slot.isActive)}
                      className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs font-bold"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Orders Audit */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-stone-900">
              Live Incoming & Past Orders ({orders.length})
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Dishes</th>
                    <th className="py-3 px-4">Slot</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{o.orderNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-800">{o.studentName}</div>
                        <div className="text-[10px] text-stone-400">{o.studentEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-stone-700 font-medium">
                        {o.pickupSlot.startTime}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900 tabular-nums">
                        ₹{o.totalAmount}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            o.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'ready'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : o.status === 'preparing'
                              ? 'bg-orange-100 text-orange-800'
                              : o.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {o.status !== 'completed' && o.status !== 'cancelled' && (
                          <button
                            onClick={() => updateOrderStatus(o.id, 'completed')}
                            className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-[11px] font-semibold"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Coupons */}
      {activeAdminTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                Discounts & Promotion Vouchers
              </h2>
              <p className="text-xs text-stone-500">
                Create codes to drive student adoption and balance off-peak dining hours.
              </p>
            </div>
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    {coupon.code}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Used {coupon.usageCount} times
                  </span>
                </div>

                <div className="text-xs text-stone-600 leading-relaxed">
                  {coupon.description}
                </div>

                <div className="pt-2 border-t border-stone-100 text-xs flex justify-between text-stone-500">
                  <span>Min order: ₹{coupon.minOrderValue}</span>
                  <span>
                    Discount: {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Branding & Website Name */}
      {activeAdminTab === 'branding' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Identity & Localization
              </div>
              <h2 className="text-xl font-extrabold text-stone-900 mt-1">
                Website Name & Canteen Branding
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Customize the platform name for your campus. Changes instantly update the top navigation bar, invoice receipts, order tokens, and student notifications.
              </p>
            </div>

            {/* Quick 1-Click Name Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700">Popular 1-Click Name Suggestions:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'CampusCrave', tag: 'Smart College Canteen' },
                  { name: 'QuickBite Campus', tag: 'Skip The Queue Dining' },
                  { name: 'UniCanteen Hub', tag: 'Campus Food Just A Click Away' },
                  { name: 'BitePass Express', tag: 'Express Canteen Ordering' },
                  { name: 'Central Campus Cafeteria', tag: 'Fresh Food & Smart Pickup' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setBrandForm({
                        ...brandForm,
                        name: preset.name,
                        tagline: preset.tag,
                      });
                      updateCanteenSettings({
                        name: preset.name,
                        tagline: preset.tag,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      brandForm.name === preset.name
                        ? 'bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-500/20'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Edit Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCanteenSettings(brandForm);
              }}
              className="space-y-4 pt-2 border-t border-stone-100 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">Website & Platform Name</label>
                  <input
                    type="text"
                    required
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    placeholder="e.g. CampusCrave, QuickBite, St. Xavier's Canteen"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-stone-900"
                  />
                  <span className="text-[10px] text-stone-400">Displayed in top bar, receipts, and order tickets.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">Tagline / Motto</label>
                  <input
                    type="text"
                    required
                    value={brandForm.tagline}
                    onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })}
                    placeholder="e.g. Smart College Canteen"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                  />
                  <span className="text-[10px] text-stone-400">Displayed in hero section and document meta title.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">College / Institution Name</label>
                  <input
                    type="text"
                    value={brandForm.collegeName}
                    onChange={(e) => setBrandForm({ ...brandForm, collegeName: e.target.value })}
                    placeholder="e.g. University Central Dining, IIT Delhi, BITS Pilani"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">Express Counter Location</label>
                  <input
                    type="text"
                    value={brandForm.counterName}
                    onChange={(e) => setBrandForm({ ...brandForm, counterName: e.target.value })}
                    placeholder="e.g. Express Pickup Counter #2"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 mt-4">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Live Brand Preview
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-stone-900 text-sm">
                        {brandForm.name || 'Your Canteen'}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {brandForm.tagline || 'Smart College Canteen'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-stone-500">
                    <div>{brandForm.collegeName}</div>
                    <div className="text-amber-700 font-medium">{brandForm.counterName}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold transition-all shadow-md text-xs"
                >
                  Save & Apply Website Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 text-base">
                {editingItem ? 'Edit Food Item' : 'Add New Canteen Dish'}
              </h3>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Dish Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Masala Dosa, Paneer Wrap"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Meals">Meals</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Price (INR ₹)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Prep Time (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.prepTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, prepTimeMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Calories (kcal)</label>
                  <input
                    type="number"
                    min={10}
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients and serving details"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isChefSpecial}
                    onChange={(e) => setFormData({ ...formData, isChefSpecial: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>Chef's Special</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>In Stock</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 text-base">
                Create Promotion Coupon
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={couponFormData.code}
                  onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. EXAMBOOST, FRIDAY20"
                  className="w-full px-3 py-2 font-mono uppercase border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Discount Type</label>
                  <select
                    value={couponFormData.discountType}
                    onChange={(e) => setCouponFormData({ ...couponFormData, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Rupees (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Value</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={couponFormData.discountValue}
                    onChange={(e) => setCouponFormData({ ...couponFormData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={couponFormData.minOrderValue}
                    onChange={(e) => setCouponFormData({ ...couponFormData, minOrderValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Max Cap (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={couponFormData.maxDiscount}
                    onChange={(e) => setCouponFormData({ ...couponFormData, maxDiscount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Description</label>
                <input
                  type="text"
                  value={couponFormData.description}
                  onChange={(e) => setCouponFormData({ ...couponFormData, description: e.target.value })}
                  placeholder="e.g. 20% off for exam week"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
