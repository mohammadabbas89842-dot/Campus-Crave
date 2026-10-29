import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import { api } from '../../services/api';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: PaymentMethod;
  upiVpa?: string;
  specialInstructions?: string;
  onSuccess: (order: any) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  paymentMethod,
  upiVpa,
  specialInstructions,
  onSuccess,
}) => {
  const { finalTotal, placeOrder, showToast, canteenSettings } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecutePayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create order on backend (returns mock/real Razorpay orderId)
      const paymentOrder = await api.createPaymentOrder(finalTotal, `rcpt_${Date.now()}`);

      // Small realistic processing pause (800ms)
      await new Promise((res) => setTimeout(res, 800));

      // 2. Verify payment on server
      const verifyRes = await api.verifyPayment({
        razorpay_order_id: paymentOrder.id,
        razorpay_payment_id: `pay_rzp_mock_${Date.now()}`,
        razorpay_signature: 'sig_mock_hash_verified',
        simulateFailure,
      });

      if (!verifyRes.success) {
        throw new Error(verifyRes.error || 'Payment was declined by bank gateway.');
      }

      // 3. Place order in system
      const placedOrder = await placeOrder(paymentMethod, upiVpa, specialInstructions);
      onSuccess(placedOrder);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment transaction failed.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
        {/* Razorpay Test Mode Header */}
        <div className="bg-stone-900 text-white p-5 border-b border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-xs tracking-wider">
                R
              </div>
              <div>
                <div className="text-sm font-extrabold tracking-wide">Razorpay Gateway</div>
                <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Test Sandbox Mode
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1 text-stone-400 hover:text-white rounded transition-colors disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800 flex justify-between items-baseline">
            <span className="text-xs text-stone-400">{canteenSettings.name} Merchant</span>
            <span className="text-lg font-bold text-white tabular-nums">
              ₹{finalTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Transparent Mode Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Realistic Sandbox Verification:</strong> Live bank simulation adhering to Razorpay API specs. No real bank charges will occur.
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
            <div className="text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
              Selected Payment Route
            </div>
            {paymentMethod === 'upi' && (
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-bold text-stone-900">UPI Instant Transfer</div>
                  <div className="text-stone-500 font-mono text-[11px]">{upiVpa || 'student@okaxis'}</div>
                </div>
              </div>
            )}
            {paymentMethod === 'card' && (
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-bold text-stone-900">Credit / Debit Card</div>
                  <div className="text-stone-500 font-mono text-[11px]">•••• •••• •••• 4022 (Test Visa)</div>
                </div>
              </div>
            )}
            {paymentMethod === 'netbanking' && (
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-bold text-stone-900">NetBanking Portal</div>
                  <div className="text-stone-500 text-[11px]">State Bank of India (SBI Campus Branch)</div>
                </div>
              </div>
            )}
            {paymentMethod === 'canteen_cash' && (
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-stone-900">Campus Wallet Balance</div>
                  <div className="text-stone-500 text-[11px]">Direct student account deduction</div>
                </div>
              </div>
            )}
          </div>

          {/* Test Scenario Toggle: Simulate Payment Failure */}
          <div className="p-3 bg-stone-100 rounded-xl border border-stone-200/80 space-y-1">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="text-xs font-semibold text-stone-700">
                Simulate Payment Failure & Retry
              </div>
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="rounded border-stone-300 text-red-600 focus:ring-red-500 w-4 h-4"
              />
            </label>
            <p className="text-[10px] text-stone-500">
              Check to verify error recovery, slot protection, and student retry flows.
            </p>
          </div>

          {/* Error Message if failed */}
          {errorMessage && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Transaction Failed</div>
                <div>{errorMessage}</div>
                <div className="text-[11px] mt-1 text-red-600">
                  You can uncheck simulation above and click "Retry Payment".
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleExecutePayment}
              disabled={isProcessing}
              className={`w-full py-3.5 px-4 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                simulateFailure
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700 active:scale-[0.99]'
              } disabled:opacity-50`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying with Bank Server...</span>
                </>
              ) : errorMessage ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Payment · ₹{finalTotal}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Pay ₹{finalTotal}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
              <Lock className="w-3 h-3 text-stone-400" />
              <span>256-bit TLS Encrypted · No PIN or CVV credentials stored</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
