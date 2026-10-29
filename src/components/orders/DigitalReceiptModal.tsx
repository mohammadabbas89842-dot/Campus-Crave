import React from 'react';
import { X, Printer, Download, UtensilsCrossed, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';

interface DigitalReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ order, onClose }) => {
  const { canteenSettings } = useApp();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-stone-900">{canteenSettings.name} Digital Tax Invoice</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Printable Canvas */}
        <div className="p-6 space-y-6 text-stone-800 font-sans print:p-0">
          {/* Canteen Header */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-stone-300">
            <div className="text-xl font-extrabold text-stone-900">{canteenSettings.name} Canteen</div>
            <div className="text-xs text-stone-500">{canteenSettings.collegeName}</div>
            <div className="text-[11px] text-stone-400 font-mono">FSSAI Lic. #{canteenSettings.fssaiNumber} · GSTIN: 07AAACG1234F1Z8</div>
            <div className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
              PAID DIGITALLY · VERIFIED
            </div>
          </div>

          {/* Meta Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-stone-400 block text-[10px]">ORDER TOKEN #</span>
              <span className="font-extrabold text-base text-stone-900 font-mono">{order.orderNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-stone-400 block text-[10px]">DATE & TIME</span>
              <span className="font-medium text-stone-700">
                {new Date(order.placedAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px]">STUDENT NAME</span>
              <span className="font-bold text-stone-800">{order.studentName}</span>
              <div className="text-[10px] text-stone-500 truncate">{order.studentEmail}</div>
            </div>
            <div className="text-right">
              <span className="text-stone-400 block text-[10px]">SCHEDULED PICKUP</span>
              <span className="font-bold text-amber-700">{order.pickupSlot.startTime} – {order.pickupSlot.endTime}</span>
              <div className="text-[10px] text-stone-500">Express Counter #2</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-stone-200 py-3 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-stone-400 uppercase text-[10px] tracking-wider pb-1 border-b border-stone-100">
              <span>Item Description</span>
              <span className="w-12 text-center">Qty</span>
              <span className="w-16 text-right">Amount</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs py-1">
                <div className="flex-1 pr-2">
                  <div className="font-semibold text-stone-800">{item.name}</div>
                  {item.specialNote && (
                    <div className="text-[10px] text-stone-400 italic">Note: {item.specialNote}</div>
                  )}
                </div>
                <div className="w-12 text-center tabular-nums">{item.quantity}</div>
                <div className="w-16 text-right font-medium tabular-nums">₹{item.subtotal.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span className="tabular-nums">₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Packaging & Maintenance</span>
              <span className="tabular-nums">
                {order.packagingFee === 0 ? 'FREE' : `₹${order.packagingFee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>CGST + SGST (5%)</span>
              <span className="tabular-nums">₹{order.taxAmount.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon Discount ({order.couponCode || 'PROMO'})</span>
                <span className="tabular-nums">- ₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-300 flex justify-between items-baseline text-sm font-extrabold text-stone-900">
              <span>Net Paid Amount</span>
              <span className="text-base text-amber-700 tabular-nums">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Payment Gateway:</span>
              <span className="text-stone-800 capitalize font-sans">{order.payment.gateway} ({order.payment.method.toUpperCase()})</span>
            </div>
            <div className="flex justify-between truncate">
              <span>Payment Ref ID:</span>
              <span className="text-stone-800 truncate">{order.payment.razorpayPaymentId || order.payment.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Status:</span>
              <span className="text-emerald-700 font-bold uppercase">{order.payment.status}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-stone-400">
            Thank you for dining with {canteenSettings.name}! Save paper by keeping this digital receipt.
          </div>
        </div>
      </div>
    </div>
  );
};
