import { supabase } from './supabase';
import { Activity, ActivityStats } from '../types';

const CALORIE_RATES = { walk: 4.0, exercise: 8.0, stairs_climbing: 12.0, sleep: 0.5 };
const DISTANCE_RATES = { walk: 0.08, exercise: 0.12, stairs_climbing: 0.02, sleep: 0.0 };

export class ActivityService {
  static calculateCalories(activityType: string, durationMinutes: number): number {
    const rate = CALORIE_RATES[activityType as keyof typeof CALORIE_RATES] || 4.0;
    return Math.round(rate * durationMinutes * 100) / 100;
  }

  static calculateDistance(activityType: string, durationMinutes: number): number {
    const rate = DISTANCE_RATES[activityType as keyof typeof DISTANCE_RATES] || 0.08;
    return Math.round(rate * durationMinutes * 100) / 100;
  }

  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  static async saveActivity(activityData: { type: string; start_time: string; end_time?: string; duration: number; calories_burned: number; distance: number; notes?: string; sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent' }): Promise<{ success: boolean; data?: Activity; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };
      const insertData: any = { user_id: user.id, type: activityData.type, start_time: activityData.start_time, end_time: activityData.end_time, duration: activityData.duration, calories_burned: activityData.calories_burned, distance: activityData.distance, notes: activityData.notes };
      if (activityData.type === 'sleep' && activityData.sleep_quality) insertData.sleep_quality = activityData.sleep_quality;
      const { data, error } = await supabase.from('activities').insert(insertData).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error) { return { success: false, error: 'Failed to save activity' }; }
  }

  static async updateActivity(activityId: string, updates: Partial<{ end_time: string; duration: number; calories_burned: number; distance: number; notes: string }>): Promise<{ success: boolean; data?: Activity; error?: string }> {
    try {
      const { data, error } = await supabase.from('activities').update(updates).eq('id', activityId).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error) { return { success: false, error: 'Failed to update activity' }; }
  }

  static async getUserActivities(limit: number = 50): Promise<{ success: boolean; data?: Activity[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };
      const { data, error } = await supabase.from('activities').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit);
      if (error) return { success: false, error: error.message };
      return { success: true, data: data || [] };
    } catch (error) { return { success: false, error: 'Failed to fetch activities' }; }
  }

  static async getUserActivityStats(): Promise<{ success: boolean; data?: ActivityStats; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };
      const { data: activities, error } = await supabase.from('activities').select('*').eq('user_id', user.id);
      if (error) return { success: false, error: error.message };
      if (!activities || activities.length === 0) return { success: true, data: { totalActivities: 0, totalDuration: 0, totalCaloriesBurned: 0, totalDistance: 0, averageDuration: 0, activitiesThisWeek: 0, activitiesThisMonth: 0 } };
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const totalDuration = activities.reduce((sum, activity) => sum + activity.duration, 0);
      const totalCaloriesBurned = activities.reduce((sum, activity) => sum + activity.calories_burned, 0);
      const totalDistance = activities.reduce((sum, activity) => sum + activity.distance, 0);
      const activitiesThisWeek = activities.filter(activity => new Date(activity.created_at) >= oneWeekAgo).length;
      const activitiesThisMonth = activities.filter(activity => new Date(activity.created_at) >= oneMonthAgo).length;
      const stats: ActivityStats = { totalActivities: activities.length, totalDuration, totalCaloriesBurned: Math.round(totalCaloriesBurned * 100) / 100, totalDistance: Math.round(totalDistance * 100) / 100, averageDuration: activities.length > 0 ? Math.round(totalDuration / activities.length) : 0, activitiesThisWeek, activitiesThisMonth };
      return { success: true, data: stats };
    } catch (error) { return { success: false, error: 'Failed to calculate activity stats' }; }
  }

  static async deleteActivity(activityId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('activities').delete().eq('id', activityId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) { return { success: false, error: 'Failed to delete activity' }; }
  }
}

