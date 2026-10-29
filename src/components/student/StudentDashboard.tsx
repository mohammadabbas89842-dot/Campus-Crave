import React, { useState } from 'react';
import {
  User,
  Clock,
  FileText,
  Heart,
  Star,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Wallet,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    studentOrders,
    menuItems,
    addToCart,
    favorites,
    toggleFavorite,
    setTrackingOrderId,
    setViewingReceiptOrder,
    openReviewModal,
    setActiveTab,
    setIsCartDrawerOpen,
  } = useApp();

  const [activeTab, setActiveSubTab] = useState<'orders' | 'favorites' | 'profile'>('orders');

  const activeOrders = studentOrders.filter(
    (o) => o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready'
  );

  const pastOrders = studentOrders.filter(
    (o) => o.status === 'completed' || o.status === 'cancelled'
  );

  const favoriteFoodItems = menuItems.filter((item) => favorites.includes(item.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Profile Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900">
                {currentUser.name}
              </h1>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Student
              </span>
            </div>
            <div className="text-xs text-stone-500 mt-1 flex flex-wrap gap-y-1 gap-x-3">
              <span>Roll: <strong className="text-stone-700 font-mono">{currentUser.rollNumber || 'CS2024-042'}</strong></span>
              <span>·</span>
              <span>Dept: <strong className="text-stone-700">{currentUser.department || 'Computer Science'}</strong></span>
              <span>·</span>
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Campus Balance & Quick Metric */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
          <div className="bg-stone-50 px-4 py-2.5 rounded-2xl border border-stone-200/80 text-left">
            <div className="text-[10px] text-stone-400 font-semibold uppercase flex items-center gap-1">
              <Wallet className="w-3 h-3 text-amber-600" />
              Campus Wallet
            </div>
            <div className="text-lg font-extrabold text-stone-900 tabular-nums">
              ₹250.00
            </div>
          </div>

          <div className="bg-stone-50 px-4 py-2.5 rounded-2xl border border-stone-200/80 text-left">
            <div className="text-[10px] text-stone-400 font-semibold uppercase">
              Total Meals
            </div>
            <div className="text-lg font-extrabold text-amber-700 tabular-nums">
              {studentOrders.length} Orders
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'orders'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          My Orders ({studentOrders.length})
        </button>
        <button
          onClick={() => setActiveSubTab('favorites')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'favorites'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Saved Favorites ({favoriteFoodItems.length})
        </button>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Account Preferences
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-8">
          {/* Active Orders Section */}
          {activeOrders.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Orders in Progress ({activeOrders.length})
                </h2>
                <span className="text-xs text-stone-500">Pick up at Counter #2</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-sm space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-amber-700">Token Number</div>
                        <div className="text-2xl font-black text-stone-900 font-mono">
                          {order.orderNumber}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                            order.status === 'ready'
                              ? 'bg-emerald-100 text-emerald-800 animate-bounce'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status === 'ready' ? 'Ready for Pickup!' : order.status}
                        </span>
                        <div className="text-[11px] text-stone-400 mt-1">
                          Slot: {order.pickupSlot.startTime}
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-stone-50 rounded-xl p-3 text-xs space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-stone-700 font-medium">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="tabular-nums font-semibold text-stone-900">
                            ₹{item.subtotal}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900">
                        <span>Total Paid</span>
                        <span className="tabular-nums">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setTrackingOrderId(order.id)}
                        className="flex-1 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Track Status & QR Code</span>
                      </button>
                      <button
                        onClick={() => setViewingReceiptOrder(order)}
                        className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors"
                        title="View Receipt"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Orders Section */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-stone-900">
              Order History & Receipts
            </h2>

            {pastOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center text-xs text-stone-500">
                No past orders found. Your completed receipts will appear here.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm divide-y divide-stone-100">
                {pastOrders.map((order) => (
                  <div key={order.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-900 font-mono text-sm">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            order.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.status}
                        </span>
                        <span className="text-stone-300">·</span>
                        <span className="text-xs text-stone-500">
                          {new Date(order.placedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-xs text-stone-600">
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>

                      <div className="text-xs text-stone-400">
                        Slot: {order.pickupSlot.startTime} – {order.pickupSlot.endTime} · Paid ₹{order.totalAmount} via {order.payment.method.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setViewingReceiptOrder(order)}
                        className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>

                      {order.status === 'completed' && (
                        <button
                          onClick={() => openReviewModal(order, order.items[0])}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 border border-amber-200"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>Rate Dish</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          order.items.forEach((item) => {
                            const found = menuItems.find((m) => m.id === item.foodItemId);
                            if (found && found.isAvailable) {
                              addToCart(found, item.quantity);
                            }
                          });
                          setIsCartDrawerOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reorder</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-stone-900">
              Your Favorite Canteen Dishes
            </h2>
            <button
              onClick={() => setActiveTab('menu')}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              Browse Full Menu &rarr;
            </button>
          </div>

          {favoriteFoodItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center space-y-3">
              <Heart className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-stone-700">No favorite dishes saved yet</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Tap the heart icon on any food card in the menu to bookmark dishes for instant 1-click ordering!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteFoodItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 flex gap-4 items-center justify-between shadow-xs hover:shadow-md transition-shadow"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-stone-900 truncate">{item.name}</h3>
                    <div className="text-xs font-bold text-stone-700 tabular-nums mt-0.5">₹{item.price}</div>
                    <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-500" /> {item.rating} ({item.reviewCount})
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => addToCart(item, 1)}
                      className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors shadow-xs"
                      title="Add to cart"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="p-1.5 text-red-500 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Remove from favorites"
                    >
                      <Heart className="w-3.5 h-3.5 fill-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Profile & Preferences */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-6 max-w-2xl">
          <h2 className="text-base font-extrabold text-stone-900">
            Student Dining Profile Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-stone-500">Full Name</label>
              <input
                type="text"
                disabled
                value={currentUser.name}
                className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl font-medium text-stone-800"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-stone-500">Campus Email ID</label>
              <input
                type="text"
                disabled
                value={currentUser.email}
                className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl font-medium text-stone-800"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-stone-500">Roll / Registration Number</label>
              <input
                type="text"
                disabled
                value={currentUser.rollNumber || 'CS2024-042'}
                className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl font-medium text-stone-800 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-stone-500">Department / Batch</label>
              <input
                type="text"
                disabled
                value={currentUser.department || 'Computer Science & Engineering'}
                className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl font-medium text-stone-800"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-stone-500">Contact Number (SMS Notifications)</label>
              <input
                type="text"
                disabled
                value={currentUser.phone || '+91 98765 43210'}
                className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl font-medium text-stone-800"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-stone-500">Account Standing</label>
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Active & Verified Campus Student</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
            <div className="font-bold text-stone-900">Queue Reduction Notification Settings:</div>
            <div>• Real-time desktop alerts when meal is ready for pickup: <strong>Enabled</strong></div>
            <div>• Auto-suggest alternative slots during peak hours: <strong>Enabled</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};
