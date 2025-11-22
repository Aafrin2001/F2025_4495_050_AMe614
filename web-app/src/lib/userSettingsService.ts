import { supabase } from './supabase';

export interface UserSettings {
  // Accessibility Settings
  highContrast?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'extraLarge';
  
  // Notification Settings
  medicationReminders?: boolean;
  healthCheckReminders?: boolean;
  activityReminders?: boolean;
  emergencyAlerts?: boolean;
  quietHours?: boolean;
  quietStartTime?: string;
  quietEndTime?: string;
  
  // Privacy Settings
  shareWithFamily?: boolean;
  shareWithDoctor?: boolean;
  locationTracking?: boolean;
  dataBackup?: boolean;
  
  // App Settings
  darkMode?: boolean;
  autoLock?: boolean;
  autoLockTime?: number;
  language?: string;
  timeFormat?: '12h' | '24h';
  theme?: 'light' | 'dark' | 'auto';
}

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  user_type?: 'hire' | 'offer';
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserSettingsService {
  /**
   * Get user settings from Supabase
   */
  static async getUserSettings(userId?: string): Promise<{ success: boolean; data?: UserSettings; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      // Try to get from user_settings table first
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', targetUserId)
        .single();

      if (settingsError) {
        // PGRST116 = no rows returned (table exists but no data)
        // 42P01 = relation does not exist (table missing)
        if (settingsError.code === '42P01' || settingsError.message?.includes('does not exist')) {
          console.warn('user_settings table does not exist. Please run the SQL schema in Supabase SQL Editor.');
          // Return default settings if table doesn't exist
        } else if (settingsError.code !== 'PGRST116') {
          console.warn('Error fetching user settings:', settingsError);
        }
      }

      if (settingsData?.settings) {
        return { success: true, data: settingsData.settings as UserSettings };
      }

      // Return default settings if none found
      return {
        success: true,
        data: {
          highContrast: false,
          fontSize: 'medium',
          medicationReminders: true,
          healthCheckReminders: true,
          activityReminders: true,
          emergencyAlerts: true,
          quietHours: false,
          quietStartTime: '22:00',
          quietEndTime: '08:00',
          shareWithFamily: true,
          shareWithDoctor: false,
          locationTracking: false,
          dataBackup: true,
          darkMode: false,
          autoLock: true,
          autoLockTime: 5,
          language: 'English',
          timeFormat: '12h',
          theme: 'light',
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch user settings' };
    }
  }

  /**
   * Update user settings in Supabase
   */
  static async updateUserSettings(
    settings: Partial<UserSettings>,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      // Get existing settings
      const { data: existing, error: fetchError } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', targetUserId)
        .single();

      // Check if table exists
      if (fetchError && (fetchError.code === '42P01' || fetchError.message?.includes('does not exist'))) {
        return {
          success: false,
          error: 'user_settings table does not exist. Please run the SQL schema in Supabase SQL Editor. See user_settings_schema.sql file.'
        };
      }

      const currentSettings = existing?.settings || {};
      const updatedSettings = { ...currentSettings, ...settings };

      // Upsert settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: targetUserId,
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return {
            success: false,
            error: 'user_settings table does not exist. Please run the SQL schema in Supabase SQL Editor. See user_settings_schema.sql file.'
          };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update user settings' };
    }
  }

  /**
   * Get user profile from Supabase
   */
  static async getUserProfile(userId?: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      // Get from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: error.message };
      }

      // If no profile, get from auth.users metadata
      if (!data) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return {
            success: true,
            data: {
              id: user.id,
              first_name: user.user_metadata?.firstName || '',
              last_name: user.user_metadata?.lastName || '',
              phone_number: user.user_metadata?.phoneNumber,
              user_type: user.user_metadata?.userType || 'hire',
              email: user.email,
            }
          };
        }
      }

      // Get email from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (data && user) {
        data.email = user.email;
      }

      return { success: true, data: data || undefined };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch user profile' };
    }
  }

  /**
   * Update user profile in Supabase
   */
  static async updateUserProfile(
    profile: Partial<UserProfile>,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      // Update profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: targetUserId,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
          user_type: profile.user_type,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) return { success: false, error: error.message };

      // Also update auth metadata if needed
      if (profile.first_name || profile.last_name || profile.phone_number) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            firstName: profile.first_name,
            lastName: profile.last_name,
            phoneNumber: profile.phone_number,
          }
        });

        if (authError) {
          console.warn('Failed to update auth metadata:', authError);
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update user profile' };
    }
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettings(userId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      const defaultSettings: UserSettings = {
        highContrast: false,
        fontSize: 'medium',
        medicationReminders: true,
        healthCheckReminders: true,
        activityReminders: true,
        emergencyAlerts: true,
        quietHours: false,
        quietStartTime: '22:00',
        quietEndTime: '08:00',
        shareWithFamily: true,
        shareWithDoctor: false,
        locationTracking: false,
        dataBackup: true,
        darkMode: false,
        autoLock: true,
        autoLockTime: 5,
        language: 'English',
        timeFormat: '12h',
        theme: 'light',
      };

      const result = await this.updateUserSettings(defaultSettings, targetUserId);
      
      // If table doesn't exist, provide helpful error message
      if (!result.success && result.error?.includes('does not exist')) {
        return {
          success: false,
          error: 'user_settings table does not exist. Please run the SQL schema in Supabase SQL Editor. See user_settings_schema.sql file.'
        };
      }
      
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to reset settings' };
    }
  }
}

