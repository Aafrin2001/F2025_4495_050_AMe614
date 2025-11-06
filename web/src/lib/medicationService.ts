import { supabase } from './supabase';
import { Medication, MedicationInput, MedicationUsage, MedicationScheduleItem, MedicationStats } from '../types';

export class MedicationService {
  static async saveMedication(medicationData: MedicationInput): Promise<{ success: boolean; data?: Medication; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };
      const { data, error } = await supabase.from('medications').insert({ user_id: user.id, ...medicationData, is_active: medicationData.is_active ?? true, is_daily: medicationData.is_daily ?? true }).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error) { return { success: false, error: 'Failed to save medication' }; }
  }

  static async updateMedication(medicationId: string, updates: Partial<MedicationInput>): Promise<{ success: boolean; data?: Medication; error?: string }> {
    try {
      const { data, error } = await supabase.from('medications').update(updates).eq('id', medicationId).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error) { return { success: false, error: 'Failed to update medication' }; }
  }

  static async getUserMedications(): Promise<{ success: boolean; data?: Medication[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };
      const { data, error } = await supabase.from('medications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      return { success: true, data: data || [] };
    } catch (error) { return { success: false, error: 'Failed to fetch medications' }; }
  }

  static async getTodaySchedule(): Promise<{ success: boolean; data?: MedicationScheduleItem[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };
      const { data: medications, error } = await supabase.from('medications').select('*').eq('user_id', user.id).eq('is_active', true);
      if (error) return { success: false, error: error.message };
      if (!medications || medications.length === 0) return { success: true, data: [] };
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const { data: prnUsage } = await supabase.from('medication_usage').select('medication_id, taken_at').eq('user_id', user.id).gte('taken_at', startOfDay.toISOString()).lt('taken_at', endOfDay.toISOString());
      const scheduleItems: MedicationScheduleItem[] = [];
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      medications.forEach(medication => {
        if (medication.is_daily) {
          medication.time.forEach(timeStr => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const medicationTime = hours * 60 + minutes;
            let status: 'overdue' | 'due_now' | 'upcoming' = 'upcoming';
            const timeDiff = medicationTime - currentTime;
            if (timeDiff < -30) status = 'overdue';
            else if (timeDiff >= -30 && timeDiff <= 30) status = 'due_now';
            scheduleItems.push({ id: `${medication.id}_${timeStr}`, medication_id: medication.id, name: medication.name, dosage: medication.dosage, type: medication.type, scheduled_time: timeStr, status, instruction: medication.instruction, is_daily: true });
          });
        } else {
          const usedToday = prnUsage?.some(usage => usage.medication_id === medication.id);
          if (usedToday) {
            const lastUsage = prnUsage?.find(usage => usage.medication_id === medication.id);
            if (lastUsage) {
              const usageTime = new Date(lastUsage.taken_at);
              const timeStr = `${usageTime.getHours().toString().padStart(2, '0')}:${usageTime.getMinutes().toString().padStart(2, '0')}`;
              scheduleItems.push({ id: `${medication.id}_prn_${lastUsage.taken_at}`, medication_id: medication.id, name: `${medication.name} (PRN)`, dosage: medication.dosage, type: medication.type, scheduled_time: timeStr, status: 'upcoming', instruction: medication.instruction, is_daily: false });
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
    } catch (error) { return { success: false, error: 'Failed to calculate today schedule' }; }
  }

  static async getMedicationStats(): Promise<{ success: boolean; data?: MedicationStats; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };
      const { data: medications, error } = await supabase.from('medications').select('*').eq('user_id', user.id);
      if (error) return { success: false, error: error.message };
      if (!medications || medications.length === 0) return { success: true, data: { totalMedications: 0, activeDailyMedications: 0, activePrnMedications: 0, totalReminders: 0, overdueMedications: 0, medicationsDueNow: 0, prnUsedToday: 0 } };
      const totalMedications = medications.length;
      const activeDailyMedications = medications.filter(m => m.is_active && m.is_daily).length;
      const activePrnMedications = medications.filter(m => m.is_active && !m.is_daily).length;
      const totalReminders = medications.filter(m => m.is_active && m.is_daily).reduce((sum, medication) => sum + medication.time.length, 0);
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const { data: prnUsage } = await supabase.from('medication_usage').select('medication_id').eq('user_id', user.id).gte('taken_at', startOfDay.toISOString()).lt('taken_at', endOfDay.toISOString());
      const prnUsedToday = prnUsage?.length || 0;
      const scheduleResult = await this.getTodaySchedule();
      const scheduleItems = scheduleResult.data || [];
      const overdueMedications = scheduleItems.filter(item => item.status === 'overdue').length;
      const medicationsDueNow = scheduleItems.filter(item => item.status === 'due_now').length;
      const stats: MedicationStats = { totalMedications, activeDailyMedications, activePrnMedications, totalReminders, overdueMedications, medicationsDueNow, prnUsedToday };
      return { success: true, data: stats };
    } catch (error) { return { success: false, error: 'Failed to calculate medication stats' }; }
  }

  static async deleteMedication(medicationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('medications').delete().eq('id', medicationId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) { return { success: false, error: 'Failed to delete medication' }; }
  }

  static async toggleMedicationStatus(medicationId: string, isActive: boolean): Promise<{ success: boolean; data?: Medication; error?: string }> {
    try {
      const { data, error } = await supabase.from('medications').update({ is_active: isActive }).eq('id', medicationId).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error) { return { success: false, error: 'Failed to toggle medication status' }; }
  }

  static formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

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

  static getStatusColor(status: string): string {
    switch (status) {
      case 'overdue': return '#F44336';
      case 'due_now': return '#FF9800';
      case 'upcoming': return '#4CAF50';
      default: return '#666666';
    }
  }

  static async logPrnUsage(medicationId: string, notes?: string): Promise<{ success: boolean; data?: MedicationUsage; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };
      const { data, error } = await supabase.from('medication_usage').insert({ medication_id: medicationId, user_id: user.id, notes: notes?.trim() || null }).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error) { return { success: false, error: 'Failed to log PRN usage' }; }
  }

  static async getPrnUsageHistory(medicationId?: string, limit: number = 50): Promise<{ success: boolean; data?: MedicationUsage[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };
      let query = supabase.from('medication_usage').select('*').eq('user_id', user.id).order('taken_at', { ascending: false }).limit(limit);
      if (medicationId) query = query.eq('medication_id', medicationId);
      const { data, error } = await query;
      if (error) return { success: false, error: error.message };
      return { success: true, data: data || [] };
    } catch (error) { return { success: false, error: 'Failed to fetch PRN usage history' }; }
  }

  static validateRefillDate(refillDate: string): { isValid: boolean; error?: string } {
    if (!refillDate) return { isValid: true };
    const date = new Date(refillDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(date.getTime())) return { isValid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
    if (date < today) return { isValid: false, error: 'Refill date cannot be in the past' };
    return { isValid: true };
  }

  static validateMedicationInput(input: Partial<MedicationInput>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!input.name || input.name.trim().length === 0) errors.push('Medication name is required');
    if (!input.dosage || input.dosage.trim().length === 0) errors.push('Dosage is required');
    if (!input.type) errors.push('Medication type is required');
    if (!input.frequency || input.frequency.trim().length === 0) errors.push('Frequency is required');
    if (!input.time || input.time.length === 0) errors.push('At least one time is required');
    if (input.time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (const time of input.time) {
        if (!timeRegex.test(time)) errors.push(`Invalid time format: ${time}. Use HH:MM format`);
      }
    }
    if (input.refill_date) {
      const refillValidation = this.validateRefillDate(input.refill_date);
      if (!refillValidation.isValid) errors.push(refillValidation.error || 'Invalid refill date');
    }
    return { isValid: errors.length === 0, errors };
  }
}

