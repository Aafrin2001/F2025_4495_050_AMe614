import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { ActivityService } from '../lib/activityService';

export type ActivityType = 'walk' | 'exercise' | 'stairs_climbing' | 'sleep' | 'walking_tracker';

export interface ActiveActivity {
  id: string;
  type: ActivityType;
  startTime: Date;
  duration: number; // in seconds
  caloriesBurned: number;
  distance: number;
  steps?: number; // For walking tracker
  notes?: string;
}

interface ActivityTrackingContextType {
  activeActivity: ActiveActivity | null;
  startActivity: (
    type: ActivityType,
    notes?: string,
    initialSteps?: number
  ) => void;
  stopActivity: () => Promise<void>;
  updateActivity: (updates: Partial<ActiveActivity>) => void;
}

const ActivityTrackingContext = createContext<ActivityTrackingContextType | undefined>(undefined);

export const useActivityTracking = () => {
  const context = useContext(ActivityTrackingContext);
  if (!context) {
    throw new Error('useActivityTracking must be used within ActivityTrackingProvider');
  }
  return context;
};

interface ActivityTrackingProviderProps {
  children: ReactNode;
}

export const ActivityTrackingProvider: React.FC<ActivityTrackingProviderProps> = ({ children }) => {
  const [activeActivity, setActiveActivity] = useState<ActiveActivity | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Timer effect that runs continuously while activity is active
  useEffect(() => {
    if (activeActivity && startTimeRef.current) {
      // Start timer that updates every second
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = new Date();
          const durationSeconds = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
          const durationMinutes = durationSeconds / 60;

          // Calculate metrics based on activity type
          let calories = 0;
          let distance = 0;

          switch (activeActivity.type) {
            case 'walk':
            case 'walking_tracker':
              calories = ActivityService.calculateCalories('walk', durationMinutes);
              distance = ActivityService.calculateDistance('walk', durationMinutes);
              break;
            case 'exercise':
              calories = ActivityService.calculateCalories('exercise', durationMinutes);
              distance = ActivityService.calculateDistance('exercise', durationMinutes);
              break;
            case 'stairs_climbing':
              calories = ActivityService.calculateCalories('stairs_climbing', durationMinutes);
              distance = ActivityService.calculateDistance('stairs_climbing', durationMinutes);
              break;
            case 'sleep':
              // Sleep doesn't have calories or distance
              calories = 0;
              distance = 0;
              break;
          }

          setActiveActivity((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              duration: durationSeconds,
              caloriesBurned: calories,
              distance: distance,
            };
          });
        }
      }, 1000);
    } else {
      // Clear timer when activity stops
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeActivity]);

  const startActivity = (
    type: ActivityType,
    notes?: string,
    initialSteps?: number
  ) => {
    const startTime = new Date();
    startTimeRef.current = startTime;

    const newActivity: ActiveActivity = {
      id: `activity_${Date.now()}`,
      type,
      startTime,
      duration: 0,
      caloriesBurned: 0,
      distance: 0,
      steps: initialSteps || 0,
      notes: notes?.trim(),
    };

    setActiveActivity(newActivity);
  };

  const stopActivity = async () => {
    if (!activeActivity || !timerRef.current) return;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const endTime = new Date();
    const durationMinutes = activeActivity.duration / 60;

    try {
      // Save to database if it's a trackable activity (not walking_tracker which uses different flow)
      if (activeActivity.type !== 'walking_tracker' && activeActivity.type !== 'sleep') {
        const activityType = activeActivity.type === 'walking_tracker' ? 'walk' : activeActivity.type;
        
        await ActivityService.createActivity({
          type: activityType as 'walk' | 'exercise' | 'stairs_climbing',
          start_time: activeActivity.startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration: activeActivity.duration,
          calories_burned: activeActivity.caloriesBurned,
          distance: activeActivity.distance,
          notes: activeActivity.notes,
        });
      } else if (activeActivity.type === 'sleep') {
        // Sleep activities need sleep quality, handled separately
        // Just stop tracking here, saving happens in ActivityScreen
      }
    } catch (error) {
      console.error('Error stopping activity:', error);
    } finally {
      // Reset activity state
      setActiveActivity(null);
      startTimeRef.current = null;
    }
  };

  const updateActivity = (updates: Partial<ActiveActivity>) => {
    setActiveActivity((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates,
      };
    });
  };

  return (
    <ActivityTrackingContext.Provider
      value={{
        activeActivity,
        startActivity,
        stopActivity,
        updateActivity,
      }}
    >
      {children}
    </ActivityTrackingContext.Provider>
  );
};

