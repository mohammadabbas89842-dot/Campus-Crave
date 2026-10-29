import React, { useState } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Volume2,
  VolumeX,
  Search,
  Filter,
  Flame,
  ArrowRight,
  ShieldCheck,
  Check,
  Utensils,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';

export const StaffKDSView: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    menuItems,
    toggleAvailability,
    staffAudioChime,
    setStaffAudioChime,
    showToast,
    isSupabaseActive,
  } = useApp();

  const [verifyTokenInput, setVerifyTokenInput] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  // Filter orders by active kitchen status
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const completedToday = orders.filter((o) => o.status === 'completed');

  // Quick verification handler
  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = verifyTokenInput.trim().toUpperCase();
    if (!token) return;

    // Support both "CB-1048" or just "1048"
    const targetOrder = orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === token ||
        o.orderNumber.replace('CB-', '') === token ||
        o.id.includes(token)
    );

    if (!targetOrder) {
      showToast(`No order found matching token "${token}".`, 'error');
      return;
    }

    if (targetOrder.status === 'completed') {
      showToast(`Order #${targetOrder.orderNumber} was already collected.`, 'info');
      setVerifyTokenInput('');
      return;
    }

    if (targetOrder.status === 'cancelled') {
      showToast(`Warning: Order #${targetOrder.orderNumber} was cancelled and refunded.`, 'error');
      return;
    }

    await updateOrderStatus(targetOrder.id, 'completed');
    showToast(`Order #${targetOrder.orderNumber} verified and released to student!`, 'success');
    setVerifyTokenInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* KDS Header & Controls */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Kitchen Display System (KDS) · Counter #2 Station
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Live Food Preparation Queue
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl">
            Orders are prioritized by scheduled pickup window to eliminate student lines and prevent food from going cold.
          </p>
        </div>

        {/* Audio chime & Quick Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setStaffAudioChime(!staffAudioChime);
              showToast(staffAudioChime ? 'Staff audio chime muted' : 'Staff audio chime unmuted', 'info');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              staffAudioChime ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-400'
            }`}
            title="Toggle new incoming order sound"
          >
            {staffAudioChime ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{staffAudioChime ? 'Chime ON' : 'Chime Muted'}</span>
          </button>

          {isSupabaseActive && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Supabase Real-Time</span>
            </div>
          )}

          <div className="bg-stone-800 px-4 py-2 rounded-xl border border-stone-700 text-center">
            <div className="text-[10px] text-stone-400 uppercase font-bold">Active in Kitchen</div>
            <div className="text-xl font-bold text-amber-400 tabular-nums">
              {confirmedOrders.length + preparingOrders.length}
            </div>
          </div>

          <div className="bg-stone-800 px-4 py-2 rounded-xl border border-stone-700 text-center">
            <div className="text-[10px] text-stone-400 uppercase font-bold">Ready at Counter</div>
            <div className="text-xl font-bold text-emerald-400 tabular-nums">
              {readyOrders.length}
            </div>
          </div>
        </div>
      </div>

      {/* Counter Express Verification Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-stone-900">
              Counter Pickup Verification Scanner
            </h3>
            <p className="text-xs text-stone-500">
              Type the 4-digit token or scan student's QR code to mark meal collected.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyPickup} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <input
              type="text"
              value={verifyTokenInput}
              onChange={(e) => setVerifyTokenInput(e.target.value)}
              placeholder="e.g. 1048 or CB-1048"
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            Verify Pickup
          </button>
        </form>
      </div>

      {/* 3-Column Kitchen Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: New / Confirmed Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-amber-500">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-stone-900 text-sm">New Confirmed</h3>
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                {confirmedOrders.length}
              </span>
            </div>
            <span className="text-[11px] text-stone-400">Needs Cooking</span>
          </div>

          <div className="space-y-3">
            {confirmedOrders.length === 0 ? (
              <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200/80 text-center text-xs text-stone-400">
                No new confirmed orders right now.
              </div>
            ) : (
              confirmedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-700">Token</span>
                      <div className="text-xl font-extrabold font-mono text-stone-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-stone-600 font-medium">{order.studentName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Slot: {order.pickupSlot.startTime}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        Est: {order.estimatedPrepTimeMinutes}m prep
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-stone-50 rounded-xl p-2.5 text-xs space-y-1.5 divide-y divide-stone-200/50">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between pt-1 first:pt-0">
                        <span className="font-bold text-stone-800">
                          {item.quantity}x {item.name}
                        </span>
                        {item.specialNote && (
                          <span className="text-[10px] text-amber-700 font-medium italic">
                            "{item.specialNote}"
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="text-[11px] text-stone-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      <strong>Note:</strong> {order.specialInstructions}
                    </div>
                  )}

                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Start Cooking</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Currently Preparing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-orange-500">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-stone-900 text-sm">On The Stove / Oven</h3>
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center">
                {preparingOrders.length}
              </span>
            </div>
            <span className="text-[11px] text-stone-400">Cooking Now</span>
          </div>

          <div className="space-y-3">
            {preparingOrders.length === 0 ? (
              <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200/80 text-center text-xs text-stone-400">
                Kitchen stations idle.
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border-2 border-orange-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-orange-700">Token</span>
                      <div className="text-xl font-extrabold font-mono text-stone-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-stone-600 font-medium">{order.studentName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Slot: {order.pickupSlot.startTime}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        Placed: {new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-stone-50 rounded-xl p-2.5 text-xs space-y-1.5 divide-y divide-stone-200/50">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between pt-1 first:pt-0">
                        <span className="font-bold text-stone-800">
                          {item.quantity}x {item.name}
                        </span>
                        {item.specialNote && (
                          <span className="text-[10px] text-amber-700 font-medium italic">
                            "{item.specialNote}"
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="text-[11px] text-stone-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      <strong>Note:</strong> {order.specialInstructions}
                    </div>
                  )}

                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Ready for Pickup</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Ready for Counter Pickup */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-stone-900 text-sm">Ready at Counter #2</h3>
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                {readyOrders.length}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Awaiting Student</span>
          </div>

          <div className="space-y-3">
            {readyOrders.length === 0 ? (
              <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200/80 text-center text-xs text-stone-400">
                No orders waiting at counter.
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border-2 border-emerald-300 shadow-sm space-y-3 bg-emerald-50/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700">Token</span>
                      <div className="text-xl font-extrabold font-mono text-stone-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-stone-700 font-bold">{order.studentName}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        HOT & PACKED
                      </span>
                      <div className="text-[10px] text-stone-500 mt-1">
                        Slot: {order.pickupSlot.startTime}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-stone-600">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>

                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Handover & Complete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Kitchen Inventory Availability Toggles */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-stone-900 text-base">
              Quick Kitchen Stock & Availability Control
            </h3>
            <p className="text-xs text-stone-500">
              Ran out of ingredients during peak rush? Toggle dishes sold-out here to instantly prevent students from ordering them.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleAvailability(item.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                item.isAvailable
                  ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60'
                  : 'border-red-200 bg-red-50/60 hover:bg-red-100/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-stone-900 truncate">{item.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-stone-500">₹{item.price}</span>
                <span
                  className={`font-bold uppercase text-[10px] ${
                    item.isAvailable ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {item.isAvailable ? 'In Stock' : 'Sold Out'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
