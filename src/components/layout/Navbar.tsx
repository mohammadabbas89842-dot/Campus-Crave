import React, { useState } from 'react';
import { ShoppingBag, User as UserIcon, Clock, ChevronDown, CheckCircle2, ShieldCheck, ChefHat, GraduationCap, UtensilsCrossed, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    switchRole,
    activeTab,
    setActiveTab,
    cartCount,
    setIsCartDrawerOpen,
    setIsAuthModalOpen,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
    isSupabaseActive,
    orders,
    canteenSettings,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const activeStudentOrdersCount = orders.filter(
    (o) => o.studentId === currentUser.id && (o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready')
  ).length;

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setIsRoleDropdownOpen(false);
  };

  // Split name for visual accent (e.g. Campus + Crave)
  const nameParts = canteenSettings.name.includes(' ')
    ? canteenSettings.name.split(' ')
    : [
        canteenSettings.name.slice(0, Math.max(1, Math.floor(canteenSettings.name.length / 2))),
        canteenSettings.name.slice(Math.max(1, Math.floor(canteenSettings.name.length / 2))),
      ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm group-hover:bg-amber-700 transition-colors">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-stone-900 whitespace-nowrap shrink-0">
              {nameParts.length > 1 ? (
                <>
                  {nameParts[0]}
                  {canteenSettings.name.includes(' ') ? ' ' : ''}
                  <span className="text-amber-600">{nameParts.slice(1).join(' ')}</span>
                </>
              ) : (
                canteenSettings.name
              )}
            </span>
          </button>

          {/* Zone 2: 4-5 Concise Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button
              onClick={() => setActiveTab('home')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'home' ? 'text-amber-600 font-semibold border-b-2 border-amber-600' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'menu' ? 'text-amber-600 font-semibold border-b-2 border-amber-600' : ''
              }`}
            >
              Canteen Menu
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                activeTab === 'slots' ? 'text-amber-600 font-semibold border-b-2 border-amber-600' : ''
              }`}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              Pickup Slots
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 py-1 relative ${
                activeTab === 'tracking' ? 'text-amber-600 font-semibold border-b-2 border-amber-600' : ''
              }`}
            >
              Track Orders
              {activeStudentOrdersCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-500 text-white text-[11px] font-bold rounded-full">
                  {activeStudentOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                if (currentUser.role === 'staff') setActiveTab('staff');
                else if (currentUser.role === 'admin') setActiveTab('admin');
                else setActiveTab('student');
              }}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'student' || activeTab === 'staff' || activeTab === 'admin'
                  ? 'text-amber-600 font-semibold border-b-2 border-amber-600'
                  : ''
              }`}
            >
              {currentUser.role === 'staff'
                ? 'Kitchen (KDS)'
                : currentUser.role === 'admin'
                ? 'Admin Dashboard'
                : 'My Student Portal'}
            </button>
          </nav>

          {/* Zone 3: Actions (Cart & Role Switcher) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Supabase PostgreSQL Database Status / Config Modal Trigger */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isSupabaseActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
              title={isSupabaseActive ? 'Supabase PostgreSQL connected & live' : 'Connect to Supabase PostgreSQL Database'}
            >
              <Database className={`w-3.5 h-3.5 ${isSupabaseActive ? 'text-emerald-600' : 'text-stone-500'}`} />
              <span className="hidden lg:inline">{isSupabaseActive ? 'Supabase Live' : 'Supabase'}</span>
              <span className={`w-2 h-2 rounded-full ${isSupabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
                title="Switch role to test Student, Staff, and Admin experiences"
              >
                {currentUser.role === 'student' && <GraduationCap className="w-3.5 h-3.5 text-amber-600" />}
                {currentUser.role === 'staff' && <ChefHat className="w-3.5 h-3.5 text-orange-600" />}
                {currentUser.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                <span className="hidden sm:inline capitalize font-semibold">{currentUser.role}:</span>
                <span className="truncate max-w-[90px]">{currentUser.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-stone-100 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    Switch Active Persona
                  </div>
                  <button
                    onClick={() => handleRoleSelect('student')}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-stone-50 transition-colors ${
                      currentUser.role === 'student' ? 'text-amber-700 font-semibold bg-amber-50/50' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-medium">Student View</div>
                        <div className="text-[10px] text-stone-400">Order, pay & schedule pickup</div>
                      </div>
                    </div>
                    {currentUser.role === 'student' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  </button>
                  <button
                    onClick={() => handleRoleSelect('staff')}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-stone-50 transition-colors ${
                      currentUser.role === 'staff' ? 'text-orange-700 font-semibold bg-orange-50/50' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-orange-600" />
                      <div>
                        <div className="font-medium">Canteen Staff (KDS)</div>
                        <div className="text-[10px] text-stone-400">Live kitchen queue & pickup scan</div>
                      </div>
                    </div>
                    {currentUser.role === 'staff' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                  </button>
                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-stone-50 transition-colors ${
                      currentUser.role === 'admin' ? 'text-purple-700 font-semibold bg-purple-50/50' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-medium">Canteen Administrator</div>
                        <div className="text-[10px] text-stone-400">Menu, capacity, sales & reports</div>
                      </div>
                    </div>
                    {currentUser.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label={`Shopping bag with ${cartCount} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Profile */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              title="Account Settings & Authentication"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
