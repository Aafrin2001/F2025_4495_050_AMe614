export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  userType: 'HIRE' | 'OFFER' | 'BOTH';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userType: 'HIRE' | 'OFFER' | 'BOTH';
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  type: string;
  value: string;
  unit?: string;
  notes?: string;
  recordedAt: Date;
  createdAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: string;
  duration: number;
  completed: boolean;
  points: number;
  completedAt?: Date;
  createdAt: Date;
}

export interface GameScore {
  id: string;
  userId: string;
  gameType: string;
  score: number;
  level?: number;
  duration?: number;
  playedAt: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: Date;
  location?: string;
  doctorName?: string;
  notes?: string;
  createdAt: Date;
}
