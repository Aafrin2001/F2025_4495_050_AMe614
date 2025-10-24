export interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  image: string; // Icon name for Ionicons
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
