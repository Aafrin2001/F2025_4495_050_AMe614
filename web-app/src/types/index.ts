export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  userType: 'hire' | 'offer' | 'both';
  seniorEmail?: string; // For caregivers: email of the senior they're monitoring
  seniorUserId?: string; // For caregivers: ID of the senior they're monitoring
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
  systolic?: number; // For blood pressure
  diastolic?: number; // For blood pressure
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
  duration: number; // Duration in seconds
  calories_burned: number;
  distance: number; // Distance in kilometers
  notes?: string;
  sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent'; // For sleep activities
  created_at: string;
  updated_at: string;
}

export interface ActivityInput {
  type: 'walk' | 'exercise' | 'stairs_climbing' | 'sleep';
  notes?: string;
  sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent'; // For sleep activities
}

export interface ActivityStats {
  totalActivities: number;
  totalDuration: number; // Total duration in seconds
  totalCaloriesBurned: number;
  totalDistance: number; // Total distance in kilometers
  averageDuration: number; // Average duration in seconds
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
  time: string[]; // Array of times in HH:MM format
  instruction?: string;
  doctor?: string;
  pharmacy?: string;
  refill_date?: string;
  side_effects?: string;
  is_active: boolean;
  is_daily: boolean; // true for daily medications, false for as-needed (PRN)
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

