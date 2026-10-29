import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  GraduationCap,
  ChefHat,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, currentUser, switchRole, showToast, canteenSettings, setIsSupabaseModalOpen } = useApp();
  const { signIn, signUp, resetPassword, switchDemoRole, isSupabaseConnected } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMsg(error.message);
        } else {
          showToast(`Password reset link sent to ${email}`, 'success');
          setMode('login');
        }
        return;
      }

      if (mode === 'register') {
        const { error } = await signUp(email, password, name || 'Student');
        if (error) {
          setErrorMsg(error.message);
        } else {
          showToast(`Welcome to ${canteenSettings.name}, ${name || 'Student'}! Account registered.`, 'success');
          setIsAuthModalOpen(false);
        }
        return;
      }

      // Login mode
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMsg(error.message);
      } else {
        showToast(`Signed in successfully!`, 'success');
        setIsAuthModalOpen(false);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRole = (r: UserRole) => {
    switchRole(r);
    switchDemoRole(r);
    setIsAuthModalOpen(false);
    showToast(`Switched persona to ${r.toUpperCase()} mode`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              <Database className="w-3.5 h-3.5" />
              <span>Campus Identity & Supabase Auth</span>
            </div>
            <h3 className="text-base font-bold text-stone-900">
              {mode === 'login' ? 'Student Sign In' : mode === 'register' ? 'Register New Student' : 'Reset Password'}
            </h3>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Supabase status badge */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-stone-600 font-medium">
                {isSupabaseConnected ? 'Connected to Supabase Auth' : 'Demo Mode (Offline / Sandbox)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAuthModalOpen(false);
                setIsSupabaseModalOpen(true);
              }}
              className="text-amber-800 hover:underline text-[11px] font-semibold"
            >
              Config
            </button>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Persona Switcher */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Instant 1-Click Persona Switch
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSelectRole('student')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  currentUser.role === 'student'
                    ? 'border-amber-600 bg-amber-50 font-bold text-amber-800'
                    : 'border-stone-200 hover:bg-white text-stone-700'
                }`}
              >
                <GraduationCap className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <div className="text-[10px]">Student</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole('staff')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  currentUser.role === 'staff'
                    ? 'border-orange-600 bg-orange-50 font-bold text-orange-800'
                    : 'border-stone-200 hover:bg-white text-stone-700'
                }`}
              >
                <ChefHat className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                <div className="text-[10px]">Canteen Staff</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole('admin')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  currentUser.role === 'admin'
                    ? 'border-purple-600 bg-purple-50 font-bold text-purple-800'
                    : 'border-stone-200 hover:bg-white text-stone-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                <div className="text-[10px]">Admin</div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700">Student Roll No</label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="CS2024-042"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Campus Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campus.edu"
                  className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="font-semibold text-stone-700">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-amber-700 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {mode === 'login' ? 'Sign In & Continue' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
              </span>
            </button>
          </form>

          {/* Toggle register / login */}
          <div className="pt-2 text-center text-xs text-stone-500">
            {mode === 'login' ? (
              <div>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                  }}
                  className="text-amber-700 font-bold hover:underline"
                >
                  Register here
                </button>
              </div>
            ) : (
              <div>
                Already have a campus account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-amber-700 font-bold hover:underline"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
