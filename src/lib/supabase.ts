import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or custom local config
export const getSupabaseConfig = () => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('cb_sb_url')?.trim() : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('cb_sb_key')?.trim() : null;

  const url = localUrl || envUrl || '';
  const key = localKey || envKey || '';

  const isValid = Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    key.length > 20 &&
    !url.includes('your-project-id') &&
    !key.includes('your-anon-public-key')
  );

  return { url, key, isConfigured: isValid };
};

let clientInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export const getSupabase = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    clientInstance = null;
    return null;
  }

  if (!clientInstance || url !== lastUsedUrl || key !== lastUsedKey) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      lastUsedUrl = url;
      lastUsedKey = key;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      clientInstance = null;
    }
  }

  return clientInstance;
};

// Direct instance export for standard Supabase SDK imports
// If not configured with live credentials, a dummy proxy is used to avoid null-pointer errors before connection
const dummyClient = createClient('https://placeholder-project.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_unconfigured_state_398124801248');

export const supabase = new Proxy(dummyClient, {
  get(target, prop, receiver) {
    const live = getSupabase();
    if (live) {
      const value = Reflect.get(live, prop);
      return typeof value === 'function' ? value.bind(live) : value;
    }
    const val = Reflect.get(target, prop, receiver);
    return typeof val === 'function' ? val.bind(target) : val;
  },
});

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

export const setLocalSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('cb_sb_url', url.trim());
      localStorage.setItem('cb_sb_key', key.trim());
    } else {
      localStorage.removeItem('cb_sb_url');
      localStorage.removeItem('cb_sb_key');
    }
    clientInstance = null;
    lastUsedUrl = '';
    lastUsedKey = '';
  }
};

export const testSupabaseConnection = async (testUrl?: string, testKey?: string) => {
  const url = (testUrl || getSupabaseConfig().url || '').trim();
  const key = (testKey || getSupabaseConfig().key || '').trim();

  if (!url || !key) {
    return { success: false, message: 'Supabase URL and Anon API Key are required.' };
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    return { success: false, message: 'URL must start with https:// and end with .supabase.co' };
  }

  try {
    const tempClient = createClient(url, key);
    // Ping food_items or categories table
    const { error } = await tempClient.from('food_items').select('id').limit(1);

    if (error) {
      if (error.message?.includes('relation "food_items" does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Database schema not yet applied — run 001_initial_schema.sql in SQL Editor)',
          needsSchema: true,
        };
      }
      return { success: false, message: error.message || 'Supabase query error' };
    }

    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to Supabase';
    return { success: false, message: msg };
  }
};
