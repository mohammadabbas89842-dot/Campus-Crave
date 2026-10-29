import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Clock,
  Tag,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartSubtotal,
    packagingFee,
    taxAmount,
    discountAmount,
    finalTotal,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    selectedSlot,
    setIsCheckoutModalOpen,
    setActiveTab,
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isCartDrawerOpen) return null;

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = codeToApply || couponInput;
    if (!code.trim()) return;
    setIsApplyingCoupon(true);
    await applyCouponCode(code);
    setIsApplyingCoupon(false);
    setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-stone-200 animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Your Canteen Tray</h2>
                <div className="text-xs text-stone-500">{cartCount} items selected</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-stone-400 hover:text-red-600 transition-colors px-2 py-1"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body: Item list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-800">Your tray is empty</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    Browse today's menu to add hot snacks, lunch thalis, or refreshing cold coffee.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    setActiveTab('menu');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm"
                >
                  Browse Canteen Menu
                </button>
              </div>
            ) : (
              <>
                {/* Active Pickup Slot Reminder */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-amber-900">
                        Pickup Slot: {selectedSlot ? `${selectedSlot.startTime} – ${selectedSlot.endTime}` : 'Not selected yet'}
                      </div>
                      <div className="text-[11px] text-amber-700">Walk straight to Counter #2</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      setIsCheckoutModalOpen(true);
                    }}
                    className="text-xs font-bold text-amber-800 underline hover:text-amber-900 shrink-0"
                  >
                    Change Slot
                  </button>
                </div>

                {/* Cart Items */}
                <div className="space-y-3">
                  {cart.map((entry) => (
                    <div
                      key={entry.item.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex gap-3 items-center justify-between"
                    >
                      <img
                        src={entry.item.imageUrl}
                        alt={entry.item.name}
                        className="w-14 h-14 rounded-lg object-cover bg-stone-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />

                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          {entry.item.isVeg && (
                            <div className="w-2.5 h-2.5 border border-emerald-600 flex items-center justify-center p-0.5 shrink-0">
                              <div className="w-1 h-1 rounded-full bg-emerald-600" />
                            </div>
                          )}
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {entry.item.name}
                          </h4>
                        </div>
                        <div className="text-xs font-semibold text-stone-600 mt-0.5 tabular-nums">
                          ₹{entry.item.price} each
                        </div>
                        {entry.specialNote && (
                          <div className="text-[10px] text-stone-500 italic truncate mt-0.5">
                            Note: "{entry.specialNote}"
                          </div>
                        )}
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5">
                          <button
                            onClick={() => updateCartQuantity(entry.item.id, entry.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-stone-900 tabular-nums">
                            {entry.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(entry.item.id, entry.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(entry.item.id)}
                          className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Coupon Module */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>Apply Campus Coupon</span>
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-emerald-800">{appliedCoupon.code}</span>
                        <span className="text-emerald-700 ml-1.5">applied!</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Enter CAMPUS50, WELCOME20"
                        className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        onClick={() => handleApplyCoupon()}
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="px-3 py-1.5 text-xs font-bold text-stone-800 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {/* Quick coupon chips */}
                  {!appliedCoupon && (
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[11px]">
                      <button
                        onClick={() => handleApplyCoupon('CAMPUS50')}
                        className="text-stone-600 bg-white hover:bg-amber-50 border border-stone-200 px-2 py-0.5 rounded transition-colors whitespace-nowrap"
                      >
                        CAMPUS50 (20% off)
                      </button>
                      <button
                        onClick={() => handleApplyCoupon('WELCOME20')}
                        className="text-stone-600 bg-white hover:bg-amber-50 border border-stone-200 px-2 py-0.5 rounded transition-colors whitespace-nowrap"
                      >
                        WELCOME20 (₹20 off)
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer: Bill Breakdown & Action */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/50 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-stone-800 tabular-nums">₹{cartSubtotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>Packaging & Maintenance</span>
                  <span className="font-semibold text-stone-800 tabular-nums">
                    {packagingFee === 0 ? (
                      <span className="text-emerald-600">FREE (Orders &gt; ₹100)</span>
                    ) : (
                      `₹${packagingFee}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Canteen GST (5%)</span>
                  <span className="font-semibold text-stone-800 tabular-nums">₹{taxAmount}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span className="tabular-nums">- ₹{discountAmount}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-sm">
                  <span className="font-extrabold text-stone-900">Total Payable</span>
                  <span className="text-lg font-extrabold text-amber-700 tabular-nums">
                    ₹{finalTotal}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  setIsCheckoutModalOpen(true);
                }}
                className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-between"
              >
                <span>Proceed to Pickup & Pay</span>
                <div className="flex items-center gap-1 font-mono">
                  <span>₹{finalTotal}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Secure Campus Order · Express Queue Pickup</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
