import { supabase } from './supabase';
import { Medication, MedicationInput, MedicationUsage, MedicationScheduleItem, MedicationStats } from '../types';

export class MedicationService {
  /**
   * Save medication to Supabase
   */
  static async saveMedication(medicationData: MedicationInput): Promise<{ success: boolean; data?: Medication; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('medications')
        .insert({
          user_id: user.id,
          ...medicationData,
          is_active: medicationData.is_active ?? true,
          is_daily: medicationData.is_daily ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving medication:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error saving medication:', error);
      return { success: false, error: 'Failed to save medication' };
    }
  }

  /**
   * Update medication in Supabase
   */
  static async updateMedication(
    medicationId: string,
    updates: Partial<MedicationInput>
  ): Promise<{ success: boolean; data?: Medication; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medications')
        .update(updates)
        .eq('id', medicationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating medication:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating medication:', error);
      return { success: false, error: 'Failed to update medication' };
    }
  }

  /**
   * Get user's medications from Supabase
   * @param userId - Optional: user ID to fetch medications for (for caregivers viewing senior's data)
   */
  static async getUserMedications(userId?: string): Promise<{ success: boolean; data?: Medication[]; error?: string }> {
    try {
      // Get user ID - use provided userId or get from auth
      let targetUserId: string;
      if (userId) {
        targetUserId = userId;
        console.log('getUserMedications - Using provided userId:', targetUserId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return { success: false, error: 'User not authenticated' };
        }
        targetUserId = user.id;
        console.log('getUserMedications - Using authenticated user id:', targetUserId);
      }

      console.log('getUserMedications - Querying medications for user_id:', targetUserId);
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });
      
      console.log('getUserMedications - Query result:', { dataCount: data?.length, error });

      if (error) {
        console.error('Error fetching medications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching medications:', error);
      return { success: false, error: 'Failed to fetch medications' };
    }
  }

  /**
   * Get today's medication schedule
   */
  static async getTodaySchedule(): Promise<{ success: boolean; data?: MedicationScheduleItem[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get all active medications for the user
      const { data: medications, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching today schedule:', error);
        return { success: false, error: error.message };
      }

      if (!medications || medications.length === 0) {
        return { success: true, data: [] };
      }

      // Get today's PRN usage
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data: prnUsage, error: usageError } = await supabase
        .from('medication_usage')
        .select('medication_id, taken_at')
        .eq('user_id', user.id)
        .gte('taken_at', startOfDay.toISOString())
        .lt('taken_at', endOfDay.toISOString());

      if (usageError) {
        console.error('Error fetching PRN usage:', usageError);
      }

      // Process medications to create schedule items
      const scheduleItems: MedicationScheduleItem[] = [];
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      medications.forEach(medication => {
        // For daily medications, show all scheduled times
        if (medication.is_daily) {
          medication.time.forEach(timeStr => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const medicationTime = hours * 60 + minutes;
            
            let status: 'overdue' | 'due_now' | 'upcoming' = 'upcoming';
            const timeDiff = medicationTime - currentTime;
            
            if (timeDiff < -30) {
              status = 'overdue';
            } else if (timeDiff >= -30 && timeDiff <= 30) {
              status = 'due_now';
            }

            scheduleItems.push({
              id: `${medication.id}_${timeStr}`,
              medication_id: medication.id,
              name: medication.name,
              dosage: medication.dosage,
              type: medication.type,
              scheduled_time: timeStr,
              status,
              instruction: medication.instruction,
              is_daily: true,
            });
          });
        } else {
          // For PRN medications, only show if used today
          const usedToday = prnUsage?.some(usage => usage.medication_id === medication.id);
          if (usedToday) {
            const lastUsage = prnUsage?.find(usage => usage.medication_id === medication.id);
            if (lastUsage) {
              const usageTime = new Date(lastUsage.taken_at);
              const timeStr = `${usageTime.getHours().toString().padStart(2, '0')}:${usageTime.getMinutes().toString().padStart(2, '0')}`;
              
              scheduleItems.push({
                id: `${medication.id}_prn_${lastUsage.taken_at}`,
                medication_id: medication.id,
                name: `${medication.name} (PRN)`,
                dosage: medication.dosage,
                type: medication.type,
                scheduled_time: timeStr,
                status: 'upcoming',
                instruction: medication.instruction,
                is_daily: false,
              });
            }
          }
        }
      });

      // Sort by time
      scheduleItems.sort((a, b) => {
        const [aHours, aMinutes] = a.scheduled_time.split(':').map(Number);
        const [bHours, bMinutes] = b.scheduled_time.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
      });

      return { success: true, data: scheduleItems };
    } catch (error) {
      console.error('Error calculating today schedule:', error);
      return { success: false, error: 'Failed to calculate today schedule' };
    }
  }

  /**
   * Get user's medication statistics
   */
  static async getMedicationStats(): Promise<{ success: boolean; data?: MedicationStats; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get all medications
      const { data: medications, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching medication stats:', error);
        return { success: false, error: error.message };
      }

      if (!medications || medications.length === 0) {
        return {
          success: true,
          data: {
            totalMedications: 0,
            activeDailyMedications: 0,
            activePrnMedications: 0,
            totalReminders: 0,
            overdueMedications: 0,
            medicationsDueNow: 0,
            prnUsedToday: 0,
          }
        };
      }

      // Calculate statistics
      const totalMedications = medications.length;
      const activeDailyMedications = medications.filter(m => m.is_active && m.is_daily).length;
      const activePrnMedications = medications.filter(m => m.is_active && !m.is_daily).length;
      
      // Calculate total reminders (sum of all time slots for active daily medications only)
      const totalReminders = medications
        .filter(m => m.is_active && m.is_daily)
        .reduce((sum, medication) => sum + medication.time.length, 0);

      // Get today's PRN usage count
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data: prnUsage, error: usageError } = await supabase
        .from('medication_usage')
        .select('medication_id')
        .eq('user_id', user.id)
        .gte('taken_at', startOfDay.toISOString())
        .lt('taken_at', endOfDay.toISOString());

      if (usageError) {
        console.error('Error fetching PRN usage for stats:', usageError);
      }

      const prnUsedToday = prnUsage?.length || 0;

      // Get today's schedule to calculate overdue and due now
      const scheduleResult = await this.getTodaySchedule();
      const scheduleItems = scheduleResult.data || [];
      
      const overdueMedications = scheduleItems.filter(item => item.status === 'overdue').length;
      const medicationsDueNow = scheduleItems.filter(item => item.status === 'due_now').length;

      const stats: MedicationStats = {
        totalMedications,
        activeDailyMedications,
        activePrnMedications,
        totalReminders,
        overdueMedications,
        medicationsDueNow,
        prnUsedToday,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error calculating medication stats:', error);
      return { success: false, error: 'Failed to calculate medication stats' };
    }
  }

  /**
   * Delete medication from Supabase
   */
  static async deleteMedication(medicationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medicationId);

      if (error) {
        console.error('Error deleting medication:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting medication:', error);
      return { success: false, error: 'Failed to delete medication' };
    }
  }

  /**
   * Toggle medication active status
   */
  static async toggleMedicationStatus(
    medicationId: string,
    isActive: boolean
  ): Promise<{ success: boolean; data?: Medication; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medications')
        .update({ is_active: isActive })
        .eq('id', medicationId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling medication status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error toggling medication status:', error);
      return { success: false, error: 'Failed to toggle medication status' };
    }
  }

  /**
   * Format time for display
   */
  static formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Get medication type icon
   */
  static getMedicationTypeIcon(type: string): string {
    switch (type) {
      case 'pill': return 'medical-outline';
      case 'liquid': return 'water-outline';
      case 'injection': return 'medical-outline';
      case 'cream': return 'hand-left-outline';
      case 'inhaler': return 'airplane-outline';
      default: return 'medical-outline';
    }
  }

  /**
   * Get medication type color
   */
  static getMedicationTypeColor(type: string): string {
    switch (type) {
      case 'pill': return '#4CAF50';
      case 'liquid': return '#2196F3';
      case 'injection': return '#FF9800';
      case 'cream': return '#9C27B0';
      case 'inhaler': return '#00BCD4';
      default: return '#666666';
    }
  }

  /**
   * Get status color
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'overdue': return '#F44336';
      case 'due_now': return '#FF9800';
      case 'upcoming': return '#4CAF50';
      default: return '#666666';
    }
  }

  /**
   * Log PRN medication usage
   */
  static async logPrnUsage(
    medicationId: string,
    notes?: string
  ): Promise<{ success: boolean; data?: MedicationUsage; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('medication_usage')
        .insert({
          medication_id: medicationId,
          user_id: user.id,
          notes: notes?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging PRN usage:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error logging PRN usage:', error);
      return { success: false, error: 'Failed to log PRN usage' };
    }
  }

  /**
   * Get PRN medication usage history
   */
  static async getPrnUsageHistory(
    medicationId?: string,
    limit: number = 50
  ): Promise<{ success: boolean; data?: MedicationUsage[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('medication_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false })
        .limit(limit);

      if (medicationId) {
        query = query.eq('medication_id', medicationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching PRN usage history:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching PRN usage history:', error);
      return { success: false, error: 'Failed to fetch PRN usage history' };
    }
  }

  /**
   * Validate refill date
   */
  static validateRefillDate(refillDate: string): { isValid: boolean; error?: string } {
    if (!refillDate) {
      return { isValid: true }; // Optional field
    }

    const date = new Date(refillDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
    }

    if (date < today) {
      return { isValid: false, error: 'Refill date cannot be in the past' };
    }

    return { isValid: true };
  }

  /**
   * Validate medication input
   */
  static validateMedicationInput(input: Partial<MedicationInput>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.name || input.name.trim().length === 0) {
      errors.push('Medication name is required');
    }

    if (!input.dosage || input.dosage.trim().length === 0) {
      errors.push('Dosage is required');
    }

    if (!input.type) {
      errors.push('Medication type is required');
    }

    if (!input.frequency || input.frequency.trim().length === 0) {
      errors.push('Frequency is required');
    }

    if (!input.time || input.time.length === 0) {
      errors.push('At least one time is required');
    }

    // Validate time format
    if (input.time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (const time of input.time) {
        if (!timeRegex.test(time)) {
          errors.push(`Invalid time format: ${time}. Use HH:MM format`);
        }
      }
    }

    // Validate refill date
    if (input.refill_date) {
      const refillValidation = this.validateRefillDate(input.refill_date);
      if (!refillValidation.isValid) {
        errors.push(refillValidation.error || 'Invalid refill date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
