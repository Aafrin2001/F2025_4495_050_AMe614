import { supabase } from './supabase';

export interface AdminDashboardStats {
  walkDistance: number;
  sleepDuration: number;
  medicationAdherence: number;
  gamesPlayed: number;
  totalUsers: number;
  activeUsers: number;
  criticalAlerts: number;
}

export interface HealthTrend {
  date: string;
  bloodPressure: string;
  heartRate: number;
  weight: number;
  temperature: number;
  oxygenLevel: number;
  bloodSugar: number;
}

export interface MedicationAlert {
  id: string;
  medicationName: string;
  userId: string;
  userName: string;
  refillDate: string;
  daysUntilRefill: number;
  isCritical: boolean;
  isUpcoming: boolean;
  lastRefill: string;
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  userName: string;
  type: 'Health' | 'Medication' | 'Activity' | 'Safety';
  message: string;
  timestamp: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  isResolved: boolean;
  details: any;
}

export interface DailyActivity {
  id: string;
  userId: string;
  userName: string;
  date: string;
  walkingMinutes: number;
  stretchingCompleted: boolean;
  breathingSessions: number;
  sleepHours: number;
  brainGamesPlayed: number;
  medicationsTaken: number;
  totalMedications: number;
  healthReadings: number;
  activityScore: number;
}

export interface InactivityAlert {
  id: string;
  userId: string;
  userName: string;
  daysInactive: number;
  lastActivityDate: string;
  alertLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  isResolved: boolean;
}

export class AdminDashboardService {
  /**
   * Get dashboard statistics for a specific timeframe
   * @param timeframe - Time period for stats (7d, 30d, 90d)
   * @param userId - Optional: user ID to fetch stats for (for caregivers viewing senior's data)
   */
  static async getDashboardStats(timeframe: '7d' | '30d' | '90d', userId?: string): Promise<{ success: boolean; data?: AdminDashboardStats; error?: string }> {
    try {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user ID - use provided userId or get from auth
      let targetUserId: string;
      if (userId) {
        targetUserId = userId;
        console.log('getDashboardStats - Using provided userId:', targetUserId);
      } else {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error fetching current user:', userError);
          return { success: false, error: 'User not authenticated' };
        }
        targetUserId = user.id;
        console.log('getDashboardStats - Using authenticated user id:', targetUserId);
      }

      // Check if user is active (has any data in the timeframe)
      const { data: activities } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', targetUserId)
        .gte('created_at', startDate.toISOString())
        .limit(1);

      const isActive = activities && activities.length > 0;

      // Get walk distance
      const { data: walkActivities } = await supabase
        .from('activities')
        .select('distance')
        .eq('user_id', targetUserId)
        .eq('type', 'walk')
        .gte('created_at', startDate.toISOString());

      const totalWalkDistance = walkActivities ? 
        walkActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0) : 0;

      // Get sleep duration from sleep activities
      const { data: sleepActivities } = await supabase
        .from('activities')
        .select('duration')
        .eq('user_id', targetUserId)
        .eq('type', 'sleep')
        .gte('created_at', startDate.toISOString());

      const totalSleepDuration = sleepActivities ? 
        sleepActivities.reduce((sum, activity) => sum + (activity.duration || 0), 0) / 3600 : 7.5; // Convert to hours

      // Get medication adherence
      const { data: medications } = await supabase
        .from('medications')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('is_active', true);

      const medicationAdherence = medications && medications.length > 0 ? 85 : 0; // Mock adherence

      // Get games played (mock data - would need games tracking table)
      const gamesPlayed = 3; // Average games

      // Check for critical medication alerts
      const { data: criticalMeds } = await supabase
        .from('medications')
        .select('refill_date')
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .not('refill_date', 'is', null);

      let criticalAlerts = 0;
      if (criticalMeds) {
        criticalMeds.forEach(med => {
          if (med.refill_date) {
            const refillDate = new Date(med.refill_date);
            const today = new Date();
            const daysUntilRefill = Math.ceil((refillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilRefill <= 3) {
              criticalAlerts++;
            }
          }
        });
      }

      const stats: AdminDashboardStats = {
        walkDistance: totalWalkDistance,
        sleepDuration: totalSleepDuration,
        medicationAdherence: medicationAdherence,
        gamesPlayed: gamesPlayed,
        totalUsers: 1, // Current user only
        activeUsers: isActive ? 1 : 0,
        criticalAlerts,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { success: false, error: 'Failed to fetch dashboard statistics' };
    }
  }

  /**
   * Get health trends for current user
   */
  static async getHealthTrends(timeframe: '7d' | '30d' | '90d'): Promise<{ success: boolean; data?: HealthTrend[]; error?: string }> {
    try {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching current user:', userError);
        return { success: false, error: 'User not authenticated' };
      }

      const { data: healthMetrics, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching health trends:', error);
        return { success: false, error: 'Failed to fetch health trends' };
      }

      // Group metrics by date and calculate averages
      const trendsMap = new Map<string, HealthTrend>();
      
      healthMetrics?.forEach(metric => {
        const date = new Date(metric.created_at).toISOString().split('T')[0];
        
        if (!trendsMap.has(date)) {
          trendsMap.set(date, {
            date,
            bloodPressure: '0/0',
            heartRate: 0,
            weight: 0,
            temperature: 0,
            oxygenLevel: 0,
            bloodSugar: 0,
          });
        }

        const trend = trendsMap.get(date)!;
        
        switch (metric.metric_type) {
          case 'blood_pressure':
            if (metric.systolic && metric.diastolic) {
              trend.bloodPressure = `${metric.systolic}/${metric.diastolic}`;
            }
            break;
          case 'heart_rate':
            if (metric.value) {
              trend.heartRate = metric.value;
            }
            break;
          case 'weight':
            if (metric.value) {
              trend.weight = metric.value;
            }
            break;
          case 'body_temperature':
            if (metric.value) {
              trend.temperature = metric.value;
            }
            break;
          case 'oxygen_level':
            if (metric.value) {
              trend.oxygenLevel = metric.value;
            }
            break;
          case 'blood_sugar':
            if (metric.value) {
              trend.bloodSugar = metric.value;
            }
            break;
        }
      });

      const trends = Array.from(trendsMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      return { success: true, data: trends };
    } catch (error) {
      console.error('Error fetching health trends:', error);
      return { success: false, error: 'Failed to fetch health trends' };
    }
  }

  /**
   * Get medication alerts
   * @param userId - Optional: user ID to fetch alerts for (for caregivers viewing senior's data)
   */
  static async getMedicationAlerts(userId?: string): Promise<{ success: boolean; data?: MedicationAlert[]; error?: string }> {
    try {
      // Get user ID - use provided userId or get from auth
      let targetUserId: string;
      let userName: string = 'User';
      if (userId) {
        targetUserId = userId;
        // Try to get user name from profiles or user_metadata if needed
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userName = `${user.user_metadata?.firstName || 'User'} ${user.user_metadata?.lastName || ''}`;
        }
      } else {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error fetching current user:', userError);
          return { success: false, error: 'User not authenticated' };
        }
        targetUserId = user.id;
        userName = `${user.user_metadata?.firstName || 'User'} ${user.user_metadata?.lastName || ''}`;
      }

      const { data: medications, error } = await supabase
        .from('medications')
        .select(`
          id,
          name,
          user_id,
          refill_date,
          created_at
        `)
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .not('refill_date', 'is', null);

      if (error) {
        console.error('Error fetching medication alerts:', error);
        return { success: false, error: 'Failed to fetch medication alerts' };
      }

      const alerts: MedicationAlert[] = [];
      const today = new Date();

      medications?.forEach(med => {
        if (med.refill_date) {
          const refillDate = new Date(med.refill_date);
          const daysUntilRefill = Math.ceil((refillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilRefill <= 7) { // Only show alerts for medications due within 7 days
            alerts.push({
              id: med.id,
              medicationName: med.name,
              userId: med.user_id,
              userName: trimmedUserName,
              refillDate: med.refill_date,
              daysUntilRefill,
              isCritical: daysUntilRefill <= 3,
              isUpcoming: daysUntilRefill > 3 && daysUntilRefill <= 7,
              lastRefill: med.created_at,
            });
          }
        }
      });

      // Sort by urgency (critical first, then upcoming)
      alerts.sort((a, b) => {
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        return a.daysUntilRefill - b.daysUntilRefill;
      });

      return { success: true, data: alerts };
    } catch (error) {
      console.error('Error fetching medication alerts:', error);
      return { success: false, error: 'Failed to fetch medication alerts' };
    }
  }

  /**
   * Get emergency alerts based on health metrics and activity patterns
   * @param userId - Optional: user ID to fetch alerts for (for caregivers viewing senior's data)
   */
  static async getEmergencyAlerts(userId?: string): Promise<{ success: boolean; data?: EmergencyAlert[]; error?: string }> {
    try {
      const alerts: EmergencyAlert[] = [];
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get user ID - use provided userId or get from auth
      let targetUserId: string;
      let userName: string = 'User';
      if (userId) {
        targetUserId = userId;
        // Try to get user name from profiles table
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();
          if (profile) {
            userName = `${profile.first_name || 'User'} ${profile.last_name || ''}`;
          }
        } catch (error) {
          // Fallback to 'User' if profile not found
          console.log('Could not fetch profile for userId:', userId);
        }
      } else {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error fetching current user:', userError);
          return { success: false, error: 'User not authenticated' };
        }
        targetUserId = user.id;
        userName = `${user.user_metadata?.firstName || 'User'} ${user.user_metadata?.lastName || ''}`;
      }

      console.log('getEmergencyAlerts - Using userId:', targetUserId, 'userName:', userName);

      // Check for critical health metrics
      const { data: recentHealthMetrics, error: healthMetricsError } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (healthMetricsError) {
        console.error('Error fetching health metrics:', healthMetricsError);
        // Continue with other checks even if health metrics fail
      }

      recentHealthMetrics?.forEach(metric => {
        let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
        let message = '';

        switch (metric.metric_type) {
          case 'blood_pressure':
            if (metric.systolic && metric.diastolic) {
              if (metric.systolic > 180 || metric.diastolic > 110) {
                severity = 'Critical';
                message = `Critical blood pressure reading: ${metric.systolic}/${metric.diastolic}`;
              } else if (metric.systolic > 160 || metric.diastolic > 100) {
                severity = 'High';
                message = `High blood pressure reading: ${metric.systolic}/${metric.diastolic}`;
              }
            }
            break;
          case 'heart_rate':
            if (metric.value) {
              if (metric.value > 120 || metric.value < 40) {
                severity = 'Critical';
                message = `Critical heart rate: ${metric.value} bpm`;
              } else if (metric.value > 100 || metric.value < 50) {
                severity = 'High';
                message = `Abnormal heart rate: ${metric.value} bpm`;
              }
            }
            break;
          case 'body_temperature':
            if (metric.value) {
              if (metric.value > 103 || metric.value < 95) {
                severity = 'Critical';
                message = `Critical body temperature: ${metric.value}°F`;
              } else if (metric.value > 101 || metric.value < 97) {
                severity = 'High';
                message = `Abnormal body temperature: ${metric.value}°F`;
              }
            }
            break;
          case 'oxygen_level':
            if (metric.value && metric.value < 90) {
              severity = 'Critical';
              message = `Low oxygen level: ${metric.value}%`;
            }
            break;
        }

        if (message) {
          alerts.push({
            id: `${targetUserId}_${metric.id}_${metric.metric_type}`,
            userId: targetUserId,
            userName: userName.trim(),
            type: 'Health',
            message,
            timestamp: metric.created_at,
            severity,
            isResolved: false,
            details: metric,
          });
        }
      });

      // Check for inactivity (no activities in last 2 days)
      const { data: recentActivities, error: activitiesError } = await supabase
        .from('activities')
        .select('created_at')
        .eq('user_id', targetUserId)
        .gte('created_at', yesterday.toISOString())
        .limit(1);

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        // Continue even if activities query fails
      }

      if (!recentActivities || recentActivities.length === 0) {
        alerts.push({
          id: `${targetUserId}_inactivity_${today.toISOString().split('T')[0]}`,
          userId: targetUserId,
          userName: userName.trim(),
          type: 'Activity',
          message: 'No physical activity recorded for 2+ days',
          timestamp: today.toISOString(),
          severity: 'Medium',
          isResolved: false,
          details: { lastActivityCheck: yesterday.toISOString() },
        });
      }

      // Sort by severity and timestamp
      alerts.sort((a, b) => {
        const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      return { success: true, data: alerts };
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
      return { success: false, error: 'Failed to fetch emergency alerts' };
    }
  }

  /**
   * Get daily activities for current user
   */
  static async getDailyActivities(timeframe: '7d' | '30d' | '90d'): Promise<{ success: boolean; data?: DailyActivity[]; error?: string }> {
    try {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching current user:', userError);
        return { success: false, error: 'User not authenticated' };
      }

      const userId = user.id;
      const userName = `${user.user_metadata?.firstName || 'User'} ${user.user_metadata?.lastName || ''}`;

      // Get activities for this user
      const { data: userActivities } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Get medications for this user
      const { data: medications } = await supabase
        .from('medications')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('is_active', true);

      // Get health metrics for this user
      const { data: healthMetrics } = await supabase
        .from('health_metrics')
        .select('created_at')
        .eq('user_id', targetUserId)
        .gte('created_at', startDate.toISOString());

      const activities: DailyActivity[] = [];

      // Group activities by date
      const activitiesByDate = new Map<string, any[]>();
      userActivities?.forEach(activity => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        if (!activitiesByDate.has(date)) {
          activitiesByDate.set(date, []);
        }
        activitiesByDate.get(date)!.push(activity);
      });

      // Create daily activity records
      activitiesByDate.forEach((dayActivities, date) => {
        const walkingMinutes = dayActivities
          .filter(a => a.type === 'walk')
          .reduce((sum, a) => sum + (a.duration || 0) / 60, 0);

        const stretchingCompleted = dayActivities.some(a => a.type === 'exercise');
        const breathingSessions = dayActivities.filter(a => a.type === 'breathing').length;
        const brainGamesPlayed = dayActivities.filter(a => a.type === 'game').length;
        const sleepHours = dayActivities
          .filter(a => a.type === 'sleep')
          .reduce((sum, a) => sum + (a.duration || 0) / 3600, 0); // Convert to hours

        // Mock medication adherence (would need medication_usage table)
        const medicationsTaken = Math.floor((medications?.length || 0) * 0.85);
        const totalMedications = medications?.length || 0;

        // Count health readings for this date
        const healthReadings = healthMetrics?.filter(metric => 
          new Date(metric.created_at).toISOString().split('T')[0] === date
        ).length || 0;

        // Calculate activity score
        const activityScore = Math.round(
          ((walkingMinutes > 0 ? 1 : 0) +
           (stretchingCompleted ? 1 : 0) +
           (breathingSessions > 0 ? 1 : 0) +
           (brainGamesPlayed > 0 ? 1 : 0) +
           (totalMedications > 0 ? medicationsTaken / totalMedications : 0)) * 20
        );

        activities.push({
          id: `${targetUserId}_${date}`,
          userId: targetUserId,
          userName: userName.trim(),
          date,
          walkingMinutes: Math.round(walkingMinutes),
          stretchingCompleted,
          breathingSessions,
          sleepHours: Math.round(sleepHours * 10) / 10,
          brainGamesPlayed,
          medicationsTaken,
          totalMedications,
          healthReadings,
          activityScore,
        });
      });

      // Sort by date (most recent first)
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return { success: true, data: activities };
    } catch (error) {
      console.error('Error fetching daily activities:', error);
      return { success: false, error: 'Failed to fetch daily activities' };
    }
  }

  /**
   * Get inactivity alerts for current user
   */
  static async getInactivityAlerts(): Promise<{ success: boolean; data?: InactivityAlert[]; error?: string }> {
    try {
      const alerts: InactivityAlert[] = [];
      const today = new Date();
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching current user:', userError);
        return { success: false, error: 'User not authenticated' };
      }

      // Get last activity for this user
      const { data: lastActivity } = await supabase
        .from('activities')
        .select('created_at')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastActivity && lastActivity.length > 0) {
        const lastActivityDate = new Date(lastActivity[0].created_at);
        const daysInactive = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysInactive >= 2) {
          let alertLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
          
          if (daysInactive >= 7) {
            alertLevel = 'Critical';
          } else if (daysInactive >= 5) {
            alertLevel = 'High';
          } else if (daysInactive >= 3) {
            alertLevel = 'Medium';
          }

          alerts.push({
            id: `${targetUserId}_inactivity_${daysInactive}`,
            userId: targetUserId,
            userName: userName.trim(),
            daysInactive,
            lastActivityDate: lastActivityDate.toISOString(),
            alertLevel,
            isResolved: false,
          });
        }
      } else {
        // No activities ever recorded
        alerts.push({
          id: `${targetUserId}_no_activity`,
          userId: targetUserId,
          userName: userName.trim(),
          daysInactive: 999, // Very high number
          lastActivityDate: new Date().toISOString(), // Fallback if no activities
          alertLevel: 'Critical',
          isResolved: false,
        });
      }

      // Sort by alert level and days inactive
      alerts.sort((a, b) => {
        const levelOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        if (levelOrder[a.alertLevel] !== levelOrder[b.alertLevel]) {
          return levelOrder[b.alertLevel] - levelOrder[a.alertLevel];
        }
        return b.daysInactive - a.daysInactive;
      });

      return { success: true, data: alerts };
    } catch (error) {
      console.error('Error fetching inactivity alerts:', error);
      return { success: false, error: 'Failed to fetch inactivity alerts' };
    }
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(alertId: string, alertType: 'emergency' | 'inactivity'): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, you would store resolved alerts in a database
      // For now, we'll just return success
      console.log(`Resolving ${alertType} alert: ${alertId}`);
      return { success: true };
    } catch (error) {
      console.error('Error resolving alert:', error);
      return { success: false, error: 'Failed to resolve alert' };
    }
  }
}
