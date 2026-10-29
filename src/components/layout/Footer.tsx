import React from 'react';
import { UtensilsCrossed, Clock, MapPin, Phone, ShieldCheck, Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { setActiveTab, canteenSettings } = useApp();

  const nameParts = canteenSettings.name.includes(' ')
    ? canteenSettings.name.split(' ')
    : [
        canteenSettings.name.slice(0, Math.max(1, Math.floor(canteenSettings.name.length / 2))),
        canteenSettings.name.slice(Math.max(1, Math.floor(canteenSettings.name.length / 2))),
      ];

  return (
    <footer className="bg-stone-900 text-stone-300 mt-20 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Purpose */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold text-white">
                {nameParts.length > 1 ? (
                  <>
                    {nameParts[0]}
                    {canteenSettings.name.includes(' ') ? ' ' : ''}
                    <span className="text-amber-500">{nameParts.slice(1).join(' ')}</span>
                  </>
                ) : (
                  canteenSettings.name
                )}
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Smart digital college canteen platform built to eliminate lunch break queues. Order ahead, schedule instant pickup, and enjoy fresh hygienic campus food without waiting.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>FSSAI Certified Campus Kitchen #10022987654</span>
            </div>
          </div>

          {/* Timings & Capacity */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase">Canteen Hours</h4>
            <div className="text-xs space-y-2 text-stone-400">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-medium">Breakfast & Chai</div>
                  <div>08:00 AM – 11:00 AM</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-medium">Lunch Rush Hours</div>
                  <div>12:00 PM – 02:30 PM (Scheduled Slots)</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-medium">Evening Snacks & Beverage</div>
                  <div>03:30 PM – 07:30 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase">Quick Navigation</h4>
            <ul className="text-xs space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="hover:text-white transition-colors"
                >
                  Browse Full Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('slots')}
                  className="hover:text-white transition-colors"
                >
                  Live Pickup Slot Capacity
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('tracking')}
                  className="hover:text-white transition-colors"
                >
                  Live Order Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('student')}
                  className="hover:text-white transition-colors"
                >
                  Student Profile & Receipts
                </button>
              </li>
            </ul>
          </div>

          {/* Campus Location */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase">Counter & Pickup</h4>
            <div className="text-xs space-y-2 text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  Central Dining Hall, Ground Floor, Academic Block C, Campus Quad.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Canteen Desk: Ext 4088 / +91 98765 00000</span>
              </div>
              <div className="pt-2 text-[11px] text-stone-500">
                {canteenSettings.counterName} dedicated to online {canteenSettings.name} orders.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} {canteenSettings.name} Dining Services. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            Crafted with <Heart className="w-3 h-3 text-red-500 fill-red-500 mx-0.5" /> for smooth, queue-free campus breaks
          </div>
        </div>
      </div>
    </footer>
  );
};
