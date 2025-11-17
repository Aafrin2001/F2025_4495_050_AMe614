import { supabase } from './supabase';
import { Medication, MedicationInput, MedicationScheduleItem, MedicationStats } from '../types';

export class MedicationService {
  static async saveMedication(medicationData: MedicationInput, userId?: string): Promise<{ success: boolean; data?: Medication; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('medications')
        .insert({
          user_id: targetUserId,
          ...medicationData,
          is_active: medicationData.is_active ?? true,
          is_daily: medicationData.is_daily ?? true,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to save medication' };
    }
  }

  static async updateMedication(medicationId: string, updates: Partial<MedicationInput>): Promise<{ success: boolean; data?: Medication; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medications')
        .update(updates)
        .eq('id', medicationId)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update medication' };
    }
  }

  static async getUserMedications(userId?: string): Promise<{ success: boolean; data?: Medication[]; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) return { success: false, error: error.message };
      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch medications' };
    }
  }

  static async getTodaySchedule(userId?: string): Promise<{ success: boolean; data?: MedicationScheduleItem[]; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      const { data: medications, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_active', true);

      if (error) return { success: false, error: error.message };
      if (!medications || medications.length === 0) return { success: true, data: [] };

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data: prnUsage } = await supabase
        .from('medication_usage')
        .select('medication_id, taken_at')
        .eq('user_id', targetUserId)
        .gte('taken_at', startOfDay.toISOString())
        .lt('taken_at', endOfDay.toISOString());

      const scheduleItems: MedicationScheduleItem[] = [];
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      medications.forEach(medication => {
        if (medication.is_daily) {
          medication.time.forEach(timeStr => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const medicationTime = hours * 60 + minutes;
            const timeDiff = medicationTime - currentTime;
            
            let status: 'overdue' | 'due_now' | 'upcoming' = 'upcoming';
            if (timeDiff < -30) status = 'overdue';
            else if (timeDiff >= -30 && timeDiff <= 30) status = 'due_now';

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

      scheduleItems.sort((a, b) => {
        const [aHours, aMinutes] = a.scheduled_time.split(':').map(Number);
        const [bHours, bMinutes] = b.scheduled_time.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
      });

      return { success: true, data: scheduleItems };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to calculate schedule' };
    }
  }

  static async getMedicationStats(userId?: string): Promise<{ success: boolean; data?: MedicationStats; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      const { data: medications, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', targetUserId);

      if (error) return { success: false, error: error.message };
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

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data: prnUsage } = await supabase
        .from('medication_usage')
        .select('medication_id')
        .eq('user_id', targetUserId)
        .gte('taken_at', startOfDay.toISOString())
        .lt('taken_at', endOfDay.toISOString());

      const scheduleResult = await this.getTodaySchedule(targetUserId);
      const scheduleItems = scheduleResult.data || [];

      return {
        success: true,
        data: {
          totalMedications: medications.length,
          activeDailyMedications: medications.filter(m => m.is_active && m.is_daily).length,
          activePrnMedications: medications.filter(m => m.is_active && !m.is_daily).length,
          totalReminders: medications.filter(m => m.is_active && m.is_daily).reduce((sum, m) => sum + m.time.length, 0),
          overdueMedications: scheduleItems.filter(item => item.status === 'overdue').length,
          medicationsDueNow: scheduleItems.filter(item => item.status === 'due_now').length,
          prnUsedToday: prnUsage?.length || 0,
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to calculate stats' };
    }
  }

  static async deleteMedication(medicationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('medications').delete().eq('id', medicationId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to delete medication' };
    }
  }

  static async logPrnUsage(medicationId: string, notes?: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'User not authenticated' };
        targetUserId = user.id;
      }

      const { error } = await supabase.from('medication_usage').insert({
        medication_id: medicationId,
        user_id: targetUserId,
        notes: notes?.trim() || null,
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to log usage' };
    }
  }

  static validateMedicationInput(input: Partial<MedicationInput>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!input.name?.trim()) errors.push('Medication name is required');
    if (!input.dosage?.trim()) errors.push('Dosage is required');
    if (!input.type) errors.push('Medication type is required');
    if (!input.frequency?.trim()) errors.push('Frequency is required');
    if (!input.time || input.time.length === 0) errors.push('At least one time is required');
    
    if (input.time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (const time of input.time) {
        if (!timeRegex.test(time)) {
          errors.push(`Invalid time format: ${time}. Use HH:MM format`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

