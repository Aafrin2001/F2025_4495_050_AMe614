import { supabase } from './supabase';
import { HealthMetric, HealthMetricInput, HealthMetricsSummary } from '../types';

export const healthMetricsService = {
  validateMetric: (input: HealthMetricInput): { isValid: boolean; error?: string } => {
    const { metric_type, systolic, diastolic, value, unit } = input;

    switch (metric_type) {
      case 'blood_pressure':
        if (!systolic || !diastolic || systolic <= 0 || diastolic <= 0) {
          return { isValid: false, error: 'Both systolic and diastolic values are required' };
        }
        if (systolic < 70 || systolic > 250) {
          return { isValid: false, error: 'Systolic pressure should be between 70-250 mmHg' };
        }
        if (diastolic < 40 || diastolic > 150) {
          return { isValid: false, error: 'Diastolic pressure should be between 40-150 mmHg' };
        }
        if (systolic <= diastolic) {
          return { isValid: false, error: 'Systolic pressure must be higher than diastolic' };
        }
        return { isValid: true };

      case 'heart_rate':
        if (isNaN(value) || value <= 0 || value < 30 || value > 220) {
          return { isValid: false, error: 'Heart rate should be between 30-220 bpm' };
        }
        return { isValid: true };

      case 'body_temperature':
        if (isNaN(value) || value <= 0) {
          return { isValid: false, error: 'Value must be a positive number' };
        }
        if (unit === '°F' && (value < 90 || value > 110)) {
          return { isValid: false, error: 'Temperature should be between 90-110°F' };
        }
        if (unit === '°C' && (value < 32 || value > 43)) {
          return { isValid: false, error: 'Temperature should be between 32-43°C' };
        }
        return { isValid: true };

      case 'weight':
        if (isNaN(value) || value <= 0) {
          return { isValid: false, error: 'Value must be a positive number' };
        }
        if (unit === 'lbs' && (value < 50 || value > 1000)) {
          return { isValid: false, error: 'Weight should be between 50-1000 lbs' };
        }
        if (unit === 'kg' && (value < 20 || value > 450)) {
          return { isValid: false, error: 'Weight should be between 20-450 kg' };
        }
        return { isValid: true };

      case 'blood_sugar':
        if (isNaN(value) || value <= 0 || value < 20 || value > 600) {
          return { isValid: false, error: 'Blood sugar should be between 20-600 mg/dL' };
        }
        return { isValid: true };

      case 'oxygen_level':
        if (isNaN(value) || value <= 0 || value < 70 || value > 100) {
          return { isValid: false, error: 'Oxygen level should be between 70-100%' };
        }
        return { isValid: true };

      default:
        return { isValid: false, error: 'Invalid metric type' };
    }
  },

  saveMetric: async (userId: string, input: HealthMetricInput): Promise<{ data: HealthMetric | null; error: any }> => {
    try {
      const validation = healthMetricsService.validateMetric(input);
      if (!validation.isValid) {
        return { data: null, error: { message: validation.error } };
      }

      const metricValue = input.metric_type === 'blood_pressure' ? (input.systolic || 0) : input.value;

      const { data, error } = await supabase
        .from('health_metrics')
        .insert([{
          user_id: userId,
          metric_type: input.metric_type,
          systolic: input.systolic,
          diastolic: input.diastolic,
          value: metricValue,
          unit: input.unit,
          notes: input.notes,
          recorded_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  getLatestMetrics: async (userId: string): Promise<{ data: HealthMetricsSummary | null; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      const summary: HealthMetricsSummary = {
        blood_pressure: null,
        heart_rate: null,
        body_temperature: null,
        weight: null,
        blood_sugar: null,
        oxygen_level: null,
      };

      data?.forEach((metric: HealthMetric) => {
        if (!summary[metric.metric_type]) {
          summary[metric.metric_type] = metric;
        }
      });

      return { data: summary, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  getMetricHistory: async (userId: string, metricType: string, limit: number = 30): Promise<{ data: HealthMetric[] | null; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('metric_type', metricType)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  deleteMetric: async (metricId: string): Promise<{ error: any }> => {
    try {
      const { error } = await supabase.from('health_metrics').delete().eq('id', metricId);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};

