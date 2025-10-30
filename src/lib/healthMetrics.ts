import { supabase } from './supabase';
import { HealthMetric, HealthMetricInput, HealthMetricsSummary, HealthMetricValidation } from '../types';

export const healthMetricsService = {
  // Validate health metric input
  validateMetric: (input: HealthMetricInput): HealthMetricValidation => {
    const { metric_type, systolic, diastolic, value, unit } = input;

    // Check if value is a valid number
    if (isNaN(value) || value <= 0) {
      return { isValid: false, error: 'Value must be a positive number' };
    }

    switch (metric_type) {
      case 'blood_pressure':
        if (!systolic || !diastolic) {
          return { isValid: false, error: 'Both systolic and diastolic values are required for blood pressure' };
        }
        if (systolic < 70 || systolic > 250) {
          return { isValid: false, error: 'Systolic pressure should be between 70-250 mmHg' };
        }
        if (diastolic < 40 || diastolic > 150) {
          return { isValid: false, error: 'Diastolic pressure should be between 40-150 mmHg' };
        }
        if (systolic <= diastolic) {
          return { isValid: false, error: 'Systolic pressure must be higher than diastolic pressure' };
        }
        break;

      case 'heart_rate':
        if (value < 30 || value > 220) {
          return { isValid: false, error: 'Heart rate should be between 30-220 bpm' };
        }
        break;

      case 'body_temperature':
        if (unit === '°F' && (value < 90 || value > 110)) {
          return { isValid: false, error: 'Temperature should be between 90-110°F' };
        }
        if (unit === '°C' && (value < 32 || value > 43)) {
          return { isValid: false, error: 'Temperature should be between 32-43°C' };
        }
        break;

      case 'weight':
        if (unit === 'lbs' && (value < 50 || value > 1000)) {
          return { isValid: false, error: 'Weight should be between 50-1000 lbs' };
        }
        if (unit === 'kg' && (value < 20 || value > 450)) {
          return { isValid: false, error: 'Weight should be between 20-450 kg' };
        }
        break;

      case 'blood_sugar':
        if (value < 20 || value > 600) {
          return { isValid: false, error: 'Blood sugar should be between 20-600 mg/dL' };
        }
        break;

      case 'oxygen_level':
        if (value < 70 || value > 100) {
          return { isValid: false, error: 'Oxygen level should be between 70-100%' };
        }
        break;

      default:
        return { isValid: false, error: 'Invalid metric type' };
    }

    return { isValid: true };
  },

  // Save health metric to database
  saveMetric: async (userId: string, input: HealthMetricInput): Promise<{ data: HealthMetric | null; error: any }> => {
    try {
      const validation = healthMetricsService.validateMetric(input);
      if (!validation.isValid) {
        return { data: null, error: { message: validation.error } };
      }

      const metricData = {
        user_id: userId,
        metric_type: input.metric_type,
        systolic: input.systolic,
        diastolic: input.diastolic,
        value: input.value,
        unit: input.unit,
        notes: input.notes,
        recorded_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('health_metrics')
        .insert([metricData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get latest metrics for a user
  getLatestMetrics: async (userId: string): Promise<{ data: HealthMetricsSummary | null; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      // Group metrics by type and get the latest for each
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

  // Get metric history for a specific type
  getMetricHistory: async (
    userId: string, 
    metricType: string, 
    limit: number = 30
  ): Promise<{ data: HealthMetric[] | null; error: any }> => {
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

  // Delete a metric
  deleteMetric: async (metricId: string): Promise<{ error: any }> => {
    try {
      const { error } = await supabase
        .from('health_metrics')
        .delete()
        .eq('id', metricId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};
