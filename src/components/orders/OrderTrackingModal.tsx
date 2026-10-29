import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Star,
  QrCode as QrCodeIcon,
  ChefHat,
  BellRing,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';

interface OrderTrackingModalProps {
  order: Order | null;
  onClose: () => void;
  onViewReceipt: (order: Order) => void;
  onRateItem: (order: Order) => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'confirmed', label: 'Order Confirmed', desc: 'Slot reserved, order queued' },
  { key: 'preparing', label: 'Cooking in Kitchen', desc: 'Freshly prepared at station' },
  { key: 'ready', label: 'Ready at Counter #2', desc: 'Ready for instant grab' },
  { key: 'completed', label: 'Picked Up', desc: 'Meal collected by student' },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  onClose,
  onViewReceipt,
  onRateItem,
}) => {
  const { cancelOrder, showToast } = useApp();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!order) return;
    // Generate QR Code containing verification payload for staff scanner
    const payload = JSON.stringify({
      orderId: order.id,
      orderNumber: order.orderNumber,
      studentId: order.studentId,
      itemsCount: order.items.length,
      token: order.orderNumber.replace('CB-', ''),
    });

    QRCode.toDataURL(payload, { width: 220, margin: 1, color: { dark: '#1c1917', light: '#ffffff' } })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('QR code generation error', err));
  }, [order]);

  if (!order) return null;

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'cancelled';
  const isReady = order.status === 'ready';
  const isCompleted = order.status === 'completed';
  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      await cancelOrder(order.id, 'Student cancelled from tracking view');
      setShowCancelConfirm(false);
    } catch {
      // Error handled in AppContext
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Real-Time Order Tracking
            </div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-mono">
              Token #{order.orderNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Status Alert Banner */}
          {isReady ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 flex items-start gap-3 animate-pulse">
              <BellRing className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-emerald-900 text-sm">
                  Your Food is Ready at Counter #2!
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Walk up to the counter and show your QR code or Token <strong>{order.orderNumber}</strong> to collect your meal.
                </p>
              </div>
            </div>
          ) : isCancelled ? (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-900 text-sm">Order Cancelled</h4>
                <p className="text-xs text-red-700 mt-0.5">
                  Refund of ₹{order.totalAmount} has been processed back to your original payment route.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">
                  Kitchen Estimated Preparation: ~{order.estimatedPrepTimeMinutes} Mins
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Reserved Pickup Slot: <strong>{order.pickupSlot.startTime} – {order.pickupSlot.endTime}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Stepper Progress Bar */}
          {!isCancelled && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Preparation Progress
              </h3>

              <div className="grid grid-cols-4 gap-2 relative">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="text-center space-y-2">
                      <div
                        className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-colors ${
                          isDone
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-100 text-stone-400 border border-stone-200'
                        } ${isCurrent ? 'ring-4 ring-amber-500/20' : ''}`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold leading-tight ${
                            isDone ? 'text-stone-900' : 'text-stone-400'
                          }`}
                        >
                          {step.label}
                        </div>
                        <div className="text-[10px] text-stone-400 hidden sm:block mt-0.5">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pickup QR Code & Token Box */}
          {!isCancelled && (
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row items-center gap-6 justify-center">
              {qrCodeUrl ? (
                <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-sm shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="Pickup Verification QR Code"
                    className="w-32 h-32 object-contain"
                  />
                  <div className="text-[10px] text-center text-stone-400 mt-1 font-mono">
                    Scan at Counter
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl bg-stone-200 animate-pulse" />
              )}

              <div className="text-center sm:text-left space-y-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Pickup Token ID
                </span>
                <div className="text-3xl font-extrabold text-stone-900 font-mono tracking-wider">
                  {order.orderNumber}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed max-w-xs">
                  Show this token code or display the QR code at Counter #2. Staff will scan to verify meal collection.
                </p>
                <div className="text-xs text-amber-700 font-semibold">
                  Scheduled Slot: {order.pickupSlot.startTime} – {order.pickupSlot.endTime}
                </div>
              </div>
            </div>
          )}

          {/* Items In This Order */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Ordered Dishes ({order.items.length})
            </h4>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {item.isVeg && (
                      <div className="w-3 h-3 border border-emerald-600 flex items-center justify-center p-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-stone-900">{item.name}</div>
                      {item.specialNote && (
                        <div className="text-[10px] text-stone-400 italic">
                          "{item.specialNote}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-semibold text-stone-800 tabular-nums">
                      {item.quantity}x
                    </span>
                    <span className="ml-2 font-bold text-stone-900 tabular-nums">
                      ₹{item.subtotal}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs px-1 text-stone-600">
              <span>Paid via {order.payment.method.toUpperCase()}</span>
              <span className="font-bold text-stone-900 tabular-nums text-sm">
                Total: ₹{order.totalAmount}
              </span>
            </div>
          </div>

          {/* Cancellation Policy / Action */}
          {canCancel && !showCancelConfirm && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-stone-700">Need to cancel? </span>
                <span className="text-stone-500">Free cancellation while order is not cooking.</span>
              </div>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
              >
                Cancel Order
              </button>
            </div>
          )}

          {/* Confirmation Prompt */}
          {showCancelConfirm && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-3 text-xs animate-in fade-in">
              <div className="font-bold text-red-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Confirm Order Cancellation</span>
              </div>
              <p className="text-stone-600">
                Are you sure you want to cancel Order <strong>{order.orderNumber}</strong>? Your slot reservation will be released to other students and 100% of ₹{order.totalAmount} will be refunded.
              </p>
              <div className="flex gap-2">
                <button
                  disabled={isCancelling}
                  onClick={handleCancelOrder}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  {isCancelling ? 'Processing Refund...' : 'Yes, Cancel Order'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium rounded-lg transition-colors"
                >
                  Keep Order
                </button>
              </div>
            </div>
          )}

          {/* If already cooking, display cancellation lockout note */}
          {(order.status === 'preparing' || order.status === 'ready') && (
            <div className="p-2.5 bg-stone-100 rounded-xl text-[11px] text-stone-500 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-stone-400 shrink-0" />
              <span>
                Canteen kitchen has started cooking this meal. Order can no longer be cancelled to prevent food waste.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onViewReceipt(order)}
            className="px-4 py-2.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>View Digital Receipt</span>
          </button>

          {isCompleted && (
            <button
              onClick={() => onRateItem(order)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>Rate & Review Food</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
