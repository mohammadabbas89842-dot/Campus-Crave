import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  Check,
  AlertTriangle,
  ArrowRight,
  Zap,
  Users,
  Timer,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PickupSlot } from '../../types';

export const PickupSlotsPage: React.FC = () => {
  const { pickupSlots, selectedSlot, setSelectedSlot, setActiveTab, setIsCartDrawerOpen, cartCount, showToast } = useApp();

  const [periodFilter, setPeriodFilter] = useState<'all' | 'breakfast' | 'lunch' | 'evening'>('all');

  const filteredSlots = periodFilter === 'all'
    ? pickupSlots
    : pickupSlots.filter((s) => s.period === periodFilter);

  const handleSelectSlot = (slot: PickupSlot) => {
    if (slot.reservedCount >= slot.capacity) {
      showToast(`Slot "${slot.startTime} – ${slot.endTime}" is currently full to avoid crowds.`, 'error');
      return;
    }
    setSelectedSlot(slot);
    showToast(`Selected pickup window: ${slot.startTime} – ${slot.endTime}`, 'success');

    if (cartCount > 0) {
      setIsCartDrawerOpen(true);
    } else {
      setActiveTab('menu');
      showToast('Pickup slot reserved! Now add your favorite dishes to your tray.', 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>Queue Reduction Engine · Capacity-Capped Dining</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Campus Pickup Slots Schedule
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
          Select a 15-to-30 minute window to collect your meal without standing in queue. Orders are capped per slot to match the kitchen's exact cooking output.
        </p>
      </div>

      {/* Queue Reduction Explanation Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-amber-950 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <span>Why We Cap Orders Per Slot</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-700">
          <div className="bg-white/80 p-4 rounded-xl border border-amber-200/60 space-y-1">
            <div className="font-bold text-stone-900">1. Fresh Food, Never Cold</div>
            <p className="text-stone-500">
              Meals are timed to come straight off the grill or stove 3 minutes before your slot begins.
            </p>
          </div>
          <div className="bg-white/80 p-4 rounded-xl border border-amber-200/60 space-y-1">
            <div className="font-bold text-stone-900">2. 30-Second Express Handover</div>
            <p className="text-stone-500">
              At Express Counter #2, staff simply scans your QR token. Grab your tray and go eat.
            </p>
          </div>
          <div className="bg-white/80 p-4 rounded-xl border border-amber-200/60 space-y-1">
            <div className="font-bold text-stone-900">3. Crowd Prevention</div>
            <p className="text-stone-500">
              When a slot reaches maximum capacity, the platform automatically suggests adjacent times.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-semibold">
        {(['all', 'breakfast', 'lunch', 'evening'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setPeriodFilter(period)}
            className={`px-4 py-2 rounded-xl capitalize transition-all ${
              periodFilter === period
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            {period === 'all' ? 'All Slots (Today)' : `${period} Slots`}
          </button>
        ))}
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSlots.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id;
          const isFull = slot.reservedCount >= slot.capacity;
          const spotsLeft = slot.capacity - slot.reservedCount;
          const percent = Math.min(100, Math.round((slot.reservedCount / slot.capacity) * 100));

          return (
            <div
              key={slot.id}
              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                isFull
                  ? 'border-red-200 bg-red-50/20 opacity-80'
                  : isSelected
                  ? 'border-amber-600 ring-2 ring-amber-500/20 shadow-md'
                  : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {slot.period} Window
                  </span>
                  {isFull ? (
                    <span className="font-bold uppercase text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      Capacity Reached
                    </span>
                  ) : spotsLeft <= 5 ? (
                    <span className="font-bold text-[10px] text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                      Only {spotsLeft} spots left
                    </span>
                  ) : (
                    <span className="font-medium text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {spotsLeft} available
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-extrabold text-stone-900">
                  {slot.startTime} – {slot.endTime}
                </h3>
                <div className="text-xs text-stone-500 mt-1">
                  Collection Point: <strong>Express Counter #2</strong>
                </div>

                {/* Capacity Meter */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Slot Capacity ({percent}% reserved)</span>
                    <span className="font-semibold tabular-nums">
                      {slot.reservedCount} / {slot.capacity} orders
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-red-500' : percent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100">
                {isFull ? (
                  <div className="text-center text-xs text-red-600 font-semibold py-2 bg-red-50 rounded-xl">
                    Full to prevent queue · Choose adjacent slot
                  </div>
                ) : isSelected ? (
                  <div className="text-center text-xs font-bold text-amber-800 py-2 bg-amber-100 rounded-xl flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-amber-700" />
                    <span>Selected for Next Order</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectSlot(slot)}
                    className="w-full py-2.5 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-amber-600 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Reserve This Window</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
