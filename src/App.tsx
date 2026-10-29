import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/home/HomePage';
import { MenuPage } from './components/menu/MenuPage';
import { PickupSlotsPage } from './components/slots/PickupSlotsPage';
import { OrderTrackingPage } from './components/orders/OrderTrackingPage';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StaffKDSView } from './components/staff/StaffKDSView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { RazorpayModal } from './components/payment/RazorpayModal';
import { OrderTrackingModal } from './components/orders/OrderTrackingModal';
import { DigitalReceiptModal } from './components/orders/DigitalReceiptModal';
import { ReviewModal } from './components/reviews/ReviewModal';
import { AuthModal } from './components/auth/AuthModal';
import { SupabaseSetupModal } from './components/supabase/SupabaseSetupModal';
import { PaymentMethod, Order } from './types';
import { ShoppingBag, ArrowRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    cartCount,
    finalTotal,
    setIsCartDrawerOpen,
    currentTrackingOrder,
    setTrackingOrderId,
    viewingReceiptOrder,
    setViewingReceiptOrder,
    openReviewModal,
    toast,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
  } = useApp();

  // Razorpay state
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentMethod>('upi');
  const [checkoutUpiVpa, setCheckoutUpiVpa] = useState<string | undefined>('student@okaxis');
  const [checkoutSpecialInstructions, setCheckoutSpecialInstructions] = useState<string | undefined>(undefined);

  const handleOpenRazorpay = (
    method: PaymentMethod,
    upiVpa?: string,
    specialInstructions?: string
  ) => {
    setCheckoutPaymentMethod(method);
    setCheckoutUpiVpa(upiVpa);
    setCheckoutSpecialInstructions(specialInstructions);
    setIsRazorpayOpen(true);
  };

  const handlePaymentSuccess = (placedOrder: Order) => {
    setTrackingOrderId(placedOrder.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Top Bar Contract */}
      <Navbar />

      {/* Main Routed Page Content */}
      <main className="flex-1">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'menu' && <MenuPage />}
        {activeTab === 'slots' && <PickupSlotsPage />}
        {activeTab === 'tracking' && <OrderTrackingPage />}
        {activeTab === 'student' && <StudentDashboard />}
        {activeTab === 'staff' && <StaffKDSView />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Floating Bottom Cart Bar (visible on mobile / when tray has items and user isn't in staff/admin) */}
      {cartCount > 0 && activeTab !== 'staff' && activeTab !== 'admin' && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-30 animate-in slide-in-from-bottom duration-200">
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="w-full bg-stone-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-stone-800 hover:bg-stone-800 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold text-xs">
                {cartCount}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Your Canteen Tray</div>
                <div className="text-[11px] text-stone-400 font-mono">Total: ₹{finalTotal}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span>View Tray & Pickup Slot</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : 'bg-stone-900 text-white border-stone-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Global Drawers & Modals */}
      <CartDrawer />

      <CheckoutModal onOpenRazorpayModal={handleOpenRazorpay} />

      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        paymentMethod={checkoutPaymentMethod}
        upiVpa={checkoutUpiVpa}
        specialInstructions={checkoutSpecialInstructions}
        onSuccess={handlePaymentSuccess}
      />

      <OrderTrackingModal
        order={currentTrackingOrder}
        onClose={() => setTrackingOrderId(null)}
        onViewReceipt={(ord) => setViewingReceiptOrder(ord)}
        onRateItem={(ord) => openReviewModal(ord, ord.items[0])}
      />

      <DigitalReceiptModal
        order={viewingReceiptOrder}
        onClose={() => setViewingReceiptOrder(null)}
      />

      <ReviewModal />

      <AuthModal />

      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Campus Footer */}
      <Footer />
    </div>
  );
};

import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
