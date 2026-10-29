import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileText,
  Star,
  Search,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';

export const OrderTrackingPage: React.FC = () => {
  const {
    studentOrders,
    setTrackingOrderId,
    setViewingReceiptOrder,
    openReviewModal,
    setActiveTab,
  } = useApp();

  const [searchToken, setSearchToken] = useState('');

  const activeOrders = studentOrders.filter(
    (o) => o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready'
  );

  const pastOrders = studentOrders.filter(
    (o) => o.status === 'completed' || o.status === 'cancelled'
  );

  const filteredOrders = searchToken.trim()
    ? studentOrders.filter((o) =>
        o.orderNumber.toLowerCase().includes(searchToken.toLowerCase().trim())
      )
    : studentOrders;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Order Status & Pickup Verification
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track live kitchen progress, view your estimated preparation timer, and present your QR code at Counter #2.
          </p>
        </div>

        {/* Search by Token */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            placeholder="Search Token (e.g. 1048)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
          />
        </div>
      </div>

      {/* Active Orders Highlight */}
      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-base font-extrabold text-stone-900">
              Live Cooking & Ready Orders ({activeOrders.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOrders.map((order) => {
              const isReady = order.status === 'ready';

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl p-6 border-2 transition-all shadow-md space-y-4 ${
                    isReady
                      ? 'border-emerald-500 ring-4 ring-emerald-500/10'
                      : 'border-amber-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-700">Token Number</span>
                      <div className="text-3xl font-black font-mono text-stone-900 tracking-wide">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Pickup Window: <strong className="text-stone-800">{order.pickupSlot.startTime} – {order.pickupSlot.endTime}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                          isReady
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isReady ? 'Ready for Pickup!' : order.status}
                      </span>
                      <div className="text-[11px] text-stone-400 mt-1">
                        Counter #2
                      </div>
                    </div>
                  </div>

                  {/* Summary of items */}
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/70 text-xs space-y-1">
                    {order.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="font-semibold text-stone-800">
                          {i.quantity}x {i.name}
                        </span>
                        <span className="tabular-nums font-bold text-stone-900">
                          ₹{i.subtotal}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900 text-sm">
                      <span>Total Paid</span>
                      <span className="tabular-nums">₹{order.totalAmount}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => setTrackingOrderId(order.id)}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Pickup QR Code & Live Tracker</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Orders List */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-stone-900">
          All Order Records ({filteredOrders.length})
        </h2>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-3">
            <Clock className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="font-bold text-stone-800 text-base">No orders found</h3>
            <p className="text-xs text-stone-500">
              When you place an order, its live preparation status and digital receipt will appear here.
            </p>
            <button
              onClick={() => setActiveTab('menu')}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold"
            >
              Order Meal Now
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm divide-y divide-stone-100">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900 font-mono text-base">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md ${
                        order.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'ready'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.status === 'preparing'
                          ? 'bg-orange-100 text-orange-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-xs text-stone-500">
                      Slot: {order.pickupSlot.startTime} – {order.pickupSlot.endTime}
                    </span>
                  </div>

                  <div className="text-xs text-stone-700 font-medium">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>

                  <div className="text-[11px] text-stone-400">
                    Paid ₹{order.totalAmount} via {order.payment.method.toUpperCase()} on{' '}
                    {new Date(order.placedAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setTrackingOrderId(order.id)}
                    className="px-3.5 py-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-600" />
                    <span>View QR & Status</span>
                  </button>

                  <button
                    onClick={() => setViewingReceiptOrder(order)}
                    className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
                    title="Digital Receipt"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  {order.status === 'completed' && (
                    <button
                      onClick={() => openReviewModal(order, order.items[0])}
                      className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors"
                      title="Rate Dish"
                    >
                      <Star className="w-4 h-4 fill-amber-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
