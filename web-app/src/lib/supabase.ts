import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that environment variables are set
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// Create Supabase client only if configured, otherwise create a minimal client
// that will fail gracefully
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

// Export configuration status
export const isConfigured = isSupabaseConfigured;

// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, userData?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    userType?: 'hire' | 'offer';
  }) => {
    if (!isSupabaseConfigured) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file' } 
      };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      // Handle network errors
      if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
        return { 
          data: null, 
          error: { 
            message: 'Network error: Could not connect to Supabase. Please check your internet connection and Supabase URL.' 
          } 
        };
      }
      return { data: null, error };
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file' } 
      };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      // Handle network errors
      if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
        return { 
          data: null, 
          error: { 
            message: 'Network error: Could not connect to Supabase. Please check your internet connection and Supabase URL.' 
          } 
        };
      }
      return { data: null, error };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    if (!isSupabaseConfigured) {
      return { user: null, error: { message: 'Supabase not configured' } };
    }
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error: any) {
      // Handle network errors
      if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
        return { 
          user: null, 
          error: { 
            message: 'Network error: Could not connect to Supabase' 
          } 
        };
      }
      return { user: null, error };
    }
  },

  // Get current session
  getSession: async () => {
    if (!isSupabaseConfigured) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      // Handle network errors gracefully - don't block app initialization
      if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
        console.warn('Network error checking session:', error);
        // Return no session instead of error to allow app to continue
        return { data: null, error: null };
      }
      return { data: null, error };
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!isSupabaseConfigured) {
      // Return a mock subscription that does nothing
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
    return supabase.auth.onAuthStateChange(callback);
  }
};

