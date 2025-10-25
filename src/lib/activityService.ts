import { supabase } from './supabase';
import { Activity, ActivityInput, ActivitySession, ActivityStats } from '../types';

// Calorie calculation constants (calories per minute for average 70kg person)
const CALORIE_RATES = {
  walk: 4.0, // Walking at moderate pace
  exercise: 8.0, // General exercise
  stairs_climbing: 12.0, // Stairs climbing
};

// Distance estimation constants (km per minute for average person)
const DISTANCE_RATES = {
  walk: 0.08, // ~5 km/h walking speed
  exercise: 0.12, // ~7 km/h exercise pace
  stairs_climbing: 0.02, // Minimal distance for stairs
};

export class ActivityService {
  /**
   * Calculate calories burned based on activity type and duration
   */
  static calculateCalories(activityType: string, durationMinutes: number): number {
    const rate = CALORIE_RATES[activityType as keyof typeof CALORIE_RATES] || 4.0;
    return Math.round(rate * durationMinutes * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate distance covered based on activity type and duration
   */
  static calculateDistance(activityType: string, durationMinutes: number): number {
    const rate = DISTANCE_RATES[activityType as keyof typeof DISTANCE_RATES] || 0.08;
    return Math.round(rate * durationMinutes * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Format duration from seconds to readable string
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Save activity to Supabase
   */
  static async saveActivity(activityData: {
    type: string;
    start_time: string;
    end_time?: string;
    duration: number;
    calories_burned: number;
    distance: number;
    notes?: string;
  }): Promise<{ success: boolean; data?: Activity; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          ...activityData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error saving activity:', error);
      return { success: false, error: 'Failed to save activity' };
    }
  }

  /**
   * Update activity in Supabase
   */
  static async updateActivity(
    activityId: string,
    updates: Partial<{
      end_time: string;
      duration: number;
      calories_burned: number;
      distance: number;
      notes: string;
    }>
  ): Promise<{ success: boolean; data?: Activity; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', activityId)
        .select()
        .single();

      if (error) {
        console.error('Error updating activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating activity:', error);
      return { success: false, error: 'Failed to update activity' };
    }
  }

  /**
   * Get user's activities from Supabase
   */
  static async getUserActivities(limit: number = 50): Promise<{ success: boolean; data?: Activity[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching activities:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { success: false, error: 'Failed to fetch activities' };
    }
  }

  /**
   * Get user's activity statistics
   */
  static async getUserActivityStats(): Promise<{ success: boolean; data?: ActivityStats; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get all activities
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching activity stats:', error);
        return { success: false, error: error.message };
      }

      if (!activities || activities.length === 0) {
        return {
          success: true,
          data: {
            totalActivities: 0,
            totalDuration: 0,
            totalCaloriesBurned: 0,
            totalDistance: 0,
            averageDuration: 0,
            activitiesThisWeek: 0,
            activitiesThisMonth: 0,
          }
        };
      }

      // Calculate statistics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalDuration = activities.reduce((sum, activity) => sum + activity.duration, 0);
      const totalCaloriesBurned = activities.reduce((sum, activity) => sum + activity.calories_burned, 0);
      const totalDistance = activities.reduce((sum, activity) => sum + activity.distance, 0);
      
      const activitiesThisWeek = activities.filter(activity => 
        new Date(activity.created_at) >= oneWeekAgo
      ).length;
      
      const activitiesThisMonth = activities.filter(activity => 
        new Date(activity.created_at) >= oneMonthAgo
      ).length;

      const stats: ActivityStats = {
        totalActivities: activities.length,
        totalDuration,
        totalCaloriesBurned: Math.round(totalCaloriesBurned * 100) / 100,
        totalDistance: Math.round(totalDistance * 100) / 100,
        averageDuration: activities.length > 0 ? Math.round(totalDuration / activities.length) : 0,
        activitiesThisWeek,
        activitiesThisMonth,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error calculating activity stats:', error);
      return { success: false, error: 'Failed to calculate activity stats' };
    }
  }

  /**
   * Delete activity from Supabase
   */
  static async deleteActivity(activityId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) {
        console.error('Error deleting activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting activity:', error);
      return { success: false, error: 'Failed to delete activity' };
    }
  }
}
