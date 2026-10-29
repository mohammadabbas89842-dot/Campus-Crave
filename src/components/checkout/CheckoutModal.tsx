import React, { useState } from 'react';
import {
  X,
  Clock,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Wallet,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Check,
  Building2,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PickupSlot, PaymentMethod } from '../../types';

interface CheckoutModalProps {
  onOpenRazorpayModal: (paymentMethod: PaymentMethod, upiVpa?: string, specialInstructions?: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onOpenRazorpayModal }) => {
  const {
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    cart,
    cartCount,
    cartSubtotal,
    packagingFee,
    taxAmount,
    discountAmount,
    finalTotal,
    pickupSlots,
    selectedSlot,
    setSelectedSlot,
    appliedCoupon,
    showToast,
  } = useApp();

  const [slotPeriodFilter, setSlotPeriodFilter] = useState<'lunch' | 'breakfast' | 'evening'>('lunch');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiVpa, setUpiVpa] = useState('student@okaxis');
  const [suggestedSlotAlt, setSuggestedSlotAlt] = useState<PickupSlot | null>(null);

  if (!isCheckoutModalOpen) return null;

  const currentPeriodSlots = pickupSlots.filter((s) => s.period === slotPeriodFilter);

  const handleSelectSlot = (slot: PickupSlot) => {
    if (slot.reservedCount >= slot.capacity) {
      // Find alternate available slot in the same period or nearby
      const alt = pickupSlots.find((s) => s.isActive && s.reservedCount < s.capacity && s.id !== slot.id);
      setSuggestedSlotAlt(alt || null);
      showToast(
        `Slot "${slot.startTime} – ${slot.endTime}" is full to avoid crowds. Try ${alt ? `${alt.startTime} – ${alt.endTime}` : 'another slot'}.`,
        'error'
      );
      return;
    }
    setSelectedSlot(slot);
    setSuggestedSlotAlt(null);
  };

  const handleProceedToPayment = () => {
    if (!selectedSlot) {
      showToast('Please select a pickup time slot.', 'error');
      return;
    }
    if (selectedSlot.reservedCount >= selectedSlot.capacity) {
      showToast('Selected slot has reached capacity. Please choose another slot.', 'error');
      return;
    }
    if (paymentMethod === 'upi' && !upiVpa.trim()) {
      showToast('Please enter a valid UPI ID (VPA).', 'error');
      return;
    }

    onOpenRazorpayModal(paymentMethod, upiVpa, specialInstructions);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 my-4 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Smart Pickup & Checkout
            </h2>
            <div className="text-xs text-stone-500">
              {cartCount} items · Express Counter #2 Pickup
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Queue Reduction Slot Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Step 1: Choose Your 15-Minute Pickup Slot</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Controlled capacity guarantees your hot food is ready with zero line waiting.
                </p>
              </div>
            </div>

            {/* Period Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSlotPeriodFilter('breakfast')}
                className={`flex-1 py-1.5 text-center rounded-lg transition-all ${
                  slotPeriodFilter === 'breakfast'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Breakfast (08:30 - 10:00)
              </button>
              <button
                onClick={() => setSlotPeriodFilter('lunch')}
                className={`flex-1 py-1.5 text-center rounded-lg transition-all ${
                  slotPeriodFilter === 'lunch'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Lunch Rush (12:00 - 02:00)
              </button>
              <button
                onClick={() => setSlotPeriodFilter('evening')}
                className={`flex-1 py-1.5 text-center rounded-lg transition-all ${
                  slotPeriodFilter === 'evening'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Snacks (03:30 - 05:00)
              </button>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentPeriodSlots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                const isFull = slot.reservedCount >= slot.capacity;
                const spotsLeft = slot.capacity - slot.reservedCount;
                const percentBooked = Math.round((slot.reservedCount / slot.capacity) * 100);

                return (
                  <button
                    key={slot.id}
                    disabled={isFull}
                    onClick={() => handleSelectSlot(slot)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isFull
                        ? 'border-red-200 bg-red-50/40 opacity-70 cursor-not-allowed'
                        : isSelected
                        ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-900">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      {isFull ? (
                        <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                          Full (Queue Cap)
                        </span>
                      ) : isSelected ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-200/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      ) : spotsLeft <= 5 ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                          {spotsLeft} left
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-600">
                          {spotsLeft} spots open
                        </span>
                      )}
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full ${
                          isFull ? 'bg-red-500' : percentBooked > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentBooked}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Smart Suggested Alternate Slot if clicked a full slot */}
            {suggestedSlotAlt && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-900">Recommended Alternative: </span>
                    <span className="text-amber-800">
                      {suggestedSlotAlt.startTime} – {suggestedSlotAlt.endTime} ({suggestedSlotAlt.capacity - suggestedSlotAlt.reservedCount} spots open)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSlot(suggestedSlotAlt);
                    setSuggestedSlotAlt(null);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shrink-0"
                >
                  Select This Slot
                </button>
              </div>
            )}
          </div>

          {/* 2. Special Preparation Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
              <span>Step 2: Special Instructions for Canteen Kitchen</span>
              <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, pack in paper bag, extra ketchup sachet"
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* 3. Payment Method Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Step 3: Online Payment Method</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <Smartphone className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <div className="text-xs font-bold text-stone-900">UPI Apps</div>
                <div className="text-[10px] text-stone-400">GPay, PhonePe, Paytm</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'card'
                    ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <div className="text-xs font-bold text-stone-900">Cards</div>
                <div className="text-[10px] text-stone-400">Debit / Credit / RuPay</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('netbanking')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'netbanking'
                    ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <div className="text-xs font-bold text-stone-900">NetBanking</div>
                <div className="text-[10px] text-stone-400">All Indian Banks</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('canteen_cash')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'canteen_cash'
                    ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <Wallet className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <div className="text-xs font-bold text-stone-900">Campus Wallet</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Bal: ₹250.00</div>
              </button>
            </div>

            {/* UPI ID input when UPI selected */}
            {paymentMethod === 'upi' && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1.5 animate-in fade-in">
                <label className="text-xs font-semibold text-stone-700">
                  Enter UPI ID (Virtual Payment Address):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="student@okaxis or mobile@upi"
                    className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="flex items-center gap-1 text-[11px] text-stone-500 font-medium px-2">
                    Verified ID
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Final Bill Review Card */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
            <div className="font-bold text-stone-900 pb-1 border-b border-stone-200">
              Order Summary & Verification
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Items Total ({cartCount} dishes)</span>
              <span className="font-semibold tabular-nums">₹{cartSubtotal}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Packaging & Hygiene Maintenance</span>
              <span className="font-semibold tabular-nums">
                {packagingFee === 0 ? <span className="text-emerald-600">FREE</span> : `₹${packagingFee}`}
              </span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Canteen GST (5%)</span>
              <span className="font-semibold tabular-nums">₹{taxAmount}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Coupon ({appliedCoupon?.code})</span>
                <span className="tabular-nums">- ₹{discountAmount}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-sm font-extrabold text-stone-900">
              <span>Final Amount</span>
              <span className="text-base text-amber-700 tabular-nums">₹{finalTotal}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between gap-4">
          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-200/60 rounded-xl transition-colors"
          >
            Back to Tray
          </button>

          <button
            onClick={handleProceedToPayment}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <span>Proceed to Razorpay · Pay ₹{finalTotal}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
