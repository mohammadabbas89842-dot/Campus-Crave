import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { User, UserRole } from '../types';

export interface ProfileRecord {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at?: string;
  phone?: string;
  roll_number?: string;
  department?: string;
}

export const profileService = {
  /**
   * Fetch user profile from Supabase `profiles` table
   */
  async getProfile(userId: string): Promise<ProfileRecord | null> {
    if (!isSupabaseConfigured()) return null;
    const sb = getSupabase();
    if (!sb) return null;

    try {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[profileService] Error fetching profile:', error.message);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        full_name: data.full_name || data.name || '',
        email: data.email,
        role: (data.role as UserRole) || 'student',
        created_at: data.created_at,
        phone: data.phone,
        roll_number: data.roll_number,
        department: data.department,
      };
    } catch (err) {
      console.error('[profileService] Unexpected error:', err);
      return null;
    }
  },

  /**
   * Update current user's profile details
   */
  async updateProfile(
    userId: string,
    updates: { full_name?: string; phone?: string; roll_number?: string; department?: string }
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const sb = getSupabase();
    if (!sb) return false;

    try {
      const { error } = await sb
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('[profileService] Error updating profile:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[profileService] Unexpected update error:', err);
      return false;
    }
  },
};
