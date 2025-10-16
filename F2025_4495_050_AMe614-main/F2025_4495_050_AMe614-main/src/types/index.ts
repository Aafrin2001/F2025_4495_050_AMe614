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
