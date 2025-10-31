export interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  image: string; // Icon name
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  userType: 'hire' | 'offer' | 'both';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    userType?: 'hire' | 'offer';
  };
  created_at: string;
  updated_at: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

// Health Metrics Types
export interface HealthMetric {
  id: string;
  user_id: string;
  metric_type: 'blood_pressure' | 'heart_rate' | 'body_temperature' | 'weight' | 'blood_sugar' | 'oxygen_level';
  systolic?: number;
  diastolic?: number;
  value: number;
  unit: string;
  notes?: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface HealthMetricInput {
  metric_type: 'blood_pressure' | 'heart_rate' | 'body_temperature' | 'weight' | 'blood_sugar' | 'oxygen_level';
  systolic?: number;
  diastolic?: number;
  value: number;
  unit: string;
  notes?: string;
}

export interface HealthMetricValidation {
  isValid: boolean;
  error?: string;
}

export interface HealthMetricsSummary {
  blood_pressure: HealthMetric | null;
  heart_rate: HealthMetric | null;
  body_temperature: HealthMetric | null;
  weight: HealthMetric | null;
  blood_sugar: HealthMetric | null;
  oxygen_level: HealthMetric | null;
}

// Activity Types
export interface Activity {
  id: string;
  user_id: string;
  type: 'walk' | 'exercise' | 'stairs_climbing' | 'sleep';
  start_time: string;
  end_time?: string;
  duration: number;
  calories_burned: number;
  distance: number;
  notes?: string;
  sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent';
  created_at: string;
  updated_at: string;
}

export interface ActivityInput {
  type: 'walk' | 'exercise' | 'stairs_climbing' | 'sleep';
  notes?: string;
  sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface ActivitySession {
  id: string;
  type: 'walk' | 'exercise' | 'stairs_climbing' | 'sleep';
  startTime: Date;
  endTime?: Date;
  duration: number;
  caloriesBurned: number;
  distance: number;
  notes?: string;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  isActive: boolean;
}

export interface ActivityStats {
  totalActivities: number;
  totalDuration: number;
  totalCaloriesBurned: number;
  totalDistance: number;
  averageDuration: number;
  activitiesThisWeek: number;
  activitiesThisMonth: number;
}

// Medication Types
export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  type: 'pill' | 'liquid' | 'injection' | 'cream' | 'inhaler';
  frequency: string;
  time: string[];
  instruction?: string;
  doctor?: string;
  pharmacy?: string;
  refill_date?: string;
  side_effects?: string;
  is_active: boolean;
  is_daily: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationInput {
  name: string;
  dosage: string;
  type: 'pill' | 'liquid' | 'injection' | 'cream' | 'inhaler';
  frequency: string;
  time: string[];
  instruction?: string;
  doctor?: string;
  pharmacy?: string;
  refill_date?: string;
  side_effects?: string;
  is_active?: boolean;
  is_daily?: boolean;
}

export interface MedicationUsage {
  id: string;
  medication_id: string;
  user_id: string;
  taken_at: string;
  notes?: string;
  created_at: string;
}

export interface MedicationScheduleItem {
  id: string;
  name: string;
  dosage: string;
  type: 'pill' | 'liquid' | 'injection' | 'cream' | 'inhaler';
  scheduled_time: string;
  status: 'overdue' | 'due_now' | 'upcoming';
  instruction?: string;
  is_daily: boolean;
  medication_id: string;
}

export interface MedicationStats {
  totalMedications: number;
  activeDailyMedications: number;
  activePrnMedications: number;
  totalReminders: number;
  overdueMedications: number;
  medicationsDueNow: number;
  prnUsedToday: number;
}

