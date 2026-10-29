import React from 'react';
import {
  ArrowRight,
  Clock,
  Zap,
  QrCode,
  ShieldCheck,
  Star,
  Users,
  Timer,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HomePage: React.FC = () => {
  const { setActiveTab, menuItems, addToCart, pickupSlots, orders, canteenSettings } = useApp();

  // Featured specials
  const featuredItems = menuItems.filter((i) => i.isChefSpecial || i.price <= 50).slice(0, 4);

  // Active orders in kitchen currently
  const liveKitchenOrders = orders.filter(
    (o) => o.status === 'confirmed' || o.status === 'preparing'
  ).length;

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Express Pickup Counter #2 is Open · Zero Queue Guarantee</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.15] text-balance">
                Your Campus Canteen, <br />
                <span className="text-amber-600">Just a Click Away.</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed">
                Order ahead, skip the queue, and enjoy your break. Reserve your 15-minute pickup slot, pay digitally via UPI or card, and collect fresh hot meals with your personal pickup token.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setActiveTab('menu')}
                  className="px-6 py-3.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>Order Now & Skip Queue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTab('slots')}
                  className="px-5 py-3.5 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-2 border border-stone-200"
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>View Today's Pickup Slots</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-stone-100 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-2xl font-bold text-stone-900 tabular-nums">0 min</div>
                  <div className="text-xs text-stone-500 mt-0.5">Counter Wait Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-stone-900 tabular-nums">1,400+</div>
                  <div className="text-xs text-stone-500 mt-0.5">Students Served Daily</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600 tabular-nums">4.9 ★</div>
                  <div className="text-xs text-stone-500 mt-0.5">Campus Food Rating</div>
                </div>
              </div>
            </div>

            {/* Right Media Focal Anchor */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-stone-200 aspect-[4/3] group">
                <img
                  src="/src/assets/images/hero_canteen_ambience_1793265995393.jpg"
                  alt="Modern vibrant college canteen dining hall"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Floating Live Queue Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-white/40 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-semibold text-stone-900">Live Kitchen Status: Active</span>
                    </div>
                    <span className="text-stone-500 tabular-nums">{liveKitchenOrders} Orders in Prep</span>
                  </div>
                  <div className="mt-1 text-[11px] text-stone-600">
                    Average food preparation pacing: <strong className="text-stone-900">8–12 mins</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Queue Reduction Highlight: Smart Pickup Slot Engine */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                Queue Reduction Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                How We Solved the 1:15 PM Lunch Rush
              </h2>
              <p className="text-sm text-stone-300 leading-relaxed">
                Conventional canteens suffer 20-30 minute lines because everybody places orders simultaneously at the counter. {canteenSettings.name} introduces <strong>controlled slot capacity</strong>. We pace order intake to kitchen output so your meal is ready the exact moment you step up.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700">
                  <div className="text-xs text-stone-400 line-through">Old Offline Way</div>
                  <div className="text-base font-bold text-red-400 mt-1">25+ Mins in Queue</div>
                  <div className="text-xs text-stone-400 mt-1">Stand in line, order, wait at counter, miss half of lunch break.</div>
                </div>
                <div className="bg-amber-950/40 p-4 rounded-xl border border-amber-600/50">
                  <div className="text-xs text-amber-400 font-semibold">{canteenSettings.name} Way</div>
                  <div className="text-base font-bold text-amber-400 mt-1">Walk In, Scan & Grab</div>
                  <div className="text-xs text-stone-300 mt-1">Reserve 12:30 PM slot, order from lecture hall, pick up in 30 seconds.</div>
                </div>
              </div>
            </div>

            {/* Slot Capacity Preview */}
            <div className="lg:col-span-5 bg-stone-800 rounded-2xl p-5 border border-stone-700 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-700">
                <span className="text-xs font-semibold text-stone-200">Lunch Rush Slots Live</span>
                <span className="text-[11px] text-amber-400">Paced for Kitchen Capacity</span>
              </div>

              <div className="space-y-3">
                {pickupSlots.slice(3, 7).map((slot) => {
                  const percent = Math.min(100, Math.round((slot.reservedCount / slot.capacity) * 100));
                  const isFull = slot.reservedCount >= slot.capacity;
                  return (
                    <div key={slot.id} className="bg-stone-900/80 p-3 rounded-xl border border-stone-700/60 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-white">{slot.startTime} – {slot.endTime}</span>
                        {isFull ? (
                          <span className="text-red-400 font-bold uppercase text-[10px] bg-red-950/60 px-2 py-0.5 rounded">
                            Full (Overcrowd Protected)
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-semibold">
                            {slot.capacity - slot.reservedCount} spots open
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-stone-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? 'bg-red-500' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setActiveTab('slots')}
                className="w-full py-2.5 text-xs font-semibold text-center text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 rounded-xl transition-colors border border-amber-600/30"
              >
                View All Morning, Lunch & Evening Slots &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Dishes & Today's Campus Specials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-amber-600">
              Campus Favorites
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Today's Specials & Student Staples
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('menu')}
            className="text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 group"
          >
            <span>Explore Full 12+ Item Menu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                {item.isVeg && (
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-sm">
                    <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
                  <Timer className="w-3 h-3 text-amber-400" />
                  <span>{item.prepTimeMinutes}m</span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span className="uppercase font-semibold tracking-wider">{item.category}</span>
                    <div className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <div className="text-lg font-extrabold text-stone-900 tabular-nums">
                    ₹{item.price}
                  </div>
                  <button
                    onClick={() => addToCart(item, 1)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-lg transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section className="bg-stone-100/70 py-16 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-600">
              Effortless Canteen Experience
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              How {canteenSettings.name} Works
            </h2>
            <p className="text-sm text-stone-600">
              Skip lines forever in 4 simple steps before your lecture break rings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="font-bold text-stone-900 text-base">Select Your Meals</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Browse today's hot menu, check preparation time, customize options, and add dishes to your cart.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="font-bold text-stone-900 text-base">Choose Pickup Window</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Pick a designated 15-minute slot that aligns with your class schedule before capacity runs out.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="font-bold text-stone-900 text-base">Instant Online Pay</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Pay securely via Razorpay test mode or UPI (GPay, PhonePe, Paytm) with zero cash hassle.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center text-sm">
                04
              </div>
              <h3 className="font-bold text-stone-900 text-base">Collect with Token / QR</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Walk straight to Express Counter #2, show your QR code or 4-digit token, grab your meal, and eat!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Benefits & Student Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-amber-600">
              Campus Voices
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Loved by Students and Faculty
            </h2>
          </div>
          <div className="text-xs text-stone-500">
            Real feedback collected directly from completed orders
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              "During midterms, our lunch break is only 25 minutes. Before {canteenSettings.name}, standing in the token queue took up almost the whole time. Now I order during lecture and collect my Maggi and Cold Coffee within 30 seconds."
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                AS
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900">Aarav Sharma</div>
                <div className="text-[11px] text-stone-400">B.Tech CS, 3rd Year</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              "The Executive Veg Thali is always piping hot. The slot booking ensures the kitchen doesn't burn out and students get fresh chapattis. Best tech upgrade on campus this semester."
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                DP
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900">Diya Patel</div>
                <div className="text-[11px] text-stone-400">MBA Student</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              "From a faculty perspective, it prevents overcrowding in corridors and students return to lab sessions right on time. Digital receipts make club budget reimbursements painless."
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                RK
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900">Prof. R. Krishnan</div>
                <div className="text-[11px] text-stone-400">Dept. of Electronics</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold max-w-xl mx-auto">
            Ready to Skip the Canteen Line Today?
          </h2>
          <p className="text-sm sm:text-base text-amber-100 max-w-lg mx-auto">
            Use promo code <span className="font-mono bg-amber-800/80 px-2 py-0.5 rounded text-white font-bold">CAMPUS50</span> on your next order for up to ₹50 off.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('menu')}
              className="px-8 py-3.5 text-sm font-bold text-amber-900 bg-white hover:bg-stone-50 active:scale-98 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span>Explore Menu & Order</span>
              <ArrowRight className="w-4 h-4 text-amber-700" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
