import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { profileService, ProfileRecord } from '../services/profileService';
import { UserRole } from '../types';

export interface AuthContextType {
  user: SupabaseUser | null;
  profile: ProfileRecord | null;
  role: UserRole;
  session: Session | null;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  switchDemoRole: (role: UserRole) => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo fallback accounts for instant testing
const DEMO_PROFILES: Record<UserRole, ProfileRecord> = {
  student: {
    id: 'demo-student-uuid',
    full_name: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    role: 'student',
    roll_number: 'CS-2024-042',
    department: 'Computer Science & Engineering',
    phone: '+91 98765 43210',
  },
  staff: {
    id: 'demo-staff-uuid',
    full_name: 'Ramesh Chef & Counter Crew',
    email: 'kitchen.counter@campuscanteen.edu',
    role: 'staff',
    department: 'Central Dining Operations',
    phone: '+91 98765 43211',
  },
  admin: {
    id: 'demo-admin-uuid',
    full_name: 'Dr. Anita Roy',
    email: 'canteen.admin@campuscanteen.edu',
    role: 'admin',
    department: 'Dean of Student Services',
    phone: '+91 98765 43212',
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(DEMO_PROFILES.student);
  const [role, setRole] = useState<UserRole>('student');
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // Load profile for authenticated user
  const loadUserProfile = useCallback(async (userId: string, userEmail?: string, metaName?: string) => {
    try {
      const dbProfile = await profileService.getProfile(userId);
      if (dbProfile) {
        setProfile(dbProfile);
        setRole(dbProfile.role);
      } else {
        // Fallback profile if trigger hasn't fired yet
        const temp: ProfileRecord = {
          id: userId,
          full_name: metaName || userEmail?.split('@')[0] || 'Campus Student',
          email: userEmail || '',
          role: 'student',
        };
        setProfile(temp);
        setRole('student');
      }
    } catch (err) {
      console.warn('[AuthContext] Could not load profile:', err);
    }
  }, []);

  // Initialize Supabase Auth listener
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsSupabaseConnected(configured);

    if (!configured) {
      // Demo mode
      setIsLoading(false);
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setIsLoading(false);
      return;
    }

    // Check existing active session
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name || session.user.user_metadata?.name
        );
      }
      setIsLoading(false);
    });

    // Listen for auth state changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED)
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name || session.user.user_metadata?.name
        );
      } else {
        // Revert to current role demo profile on logout
        setProfile((prev) => prev || DEMO_PROFILES.student);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | Error | null }> => {
    const sb = getSupabase();
    if (!sb || !isSupabaseConfigured()) {
      // Offline / Demo mode simulation
      const matchedRole: UserRole = email.includes('admin')
        ? 'admin'
        : email.includes('staff') || email.includes('kitchen')
        ? 'staff'
        : 'student';
      setRole(matchedRole);
      setProfile(DEMO_PROFILES[matchedRole]);
      return { error: null };
    }

    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return { error };

      if (data.user) {
        await loadUserProfile(
          data.user.id,
          data.user.email,
          data.user.user_metadata?.full_name || data.user.user_metadata?.name
        );
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign in failed') };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: AuthError | Error | null }> => {
    const sb = getSupabase();
    if (!sb || !isSupabaseConfigured()) {
      // Demo mode sign up
      const newStudent: ProfileRecord = {
        id: `student_${Date.now()}`,
        full_name: fullName,
        email,
        role: 'student',
      };
      setProfile(newStudent);
      setRole('student');
      return { error: null };
    }

    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) return { error };

      if (data.user) {
        await loadUserProfile(data.user.id, data.user.email, fullName);
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Registration failed') };
    }
  };

  const signOut = async (): Promise<void> => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        await sb.auth.signOut();
      } catch (err) {
        console.warn('[AuthContext] Sign out error:', err);
      }
    }
    setUser(null);
    setRole('student');
    setProfile(DEMO_PROFILES.student);
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | Error | null }> => {
    const sb = getSupabase();
    if (!sb || !isSupabaseConfigured()) {
      return { error: null };
    }

    try {
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Reset failed') };
    }
  };

  const switchDemoRole = (newRole: UserRole) => {
    setRole(newRole);
    setProfile(DEMO_PROFILES[newRole]);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        session,
        isLoading,
        isSupabaseConnected,
        signIn,
        signUp,
        signOut,
        resetPassword,
        switchDemoRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
