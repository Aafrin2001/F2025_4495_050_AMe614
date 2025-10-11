import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface WalkingTrackerScreenProps {
  onBack: () => void;
  onComplete: (data: WalkingData) => void;
}

interface WalkingData {
  duration: number; // in minutes
  steps: number;
  distance: number; // in miles
  calories: number;
  completed: boolean;
}

const WalkingTrackerScreen: React.FC<WalkingTrackerScreenProps> = ({ onBack, onComplete }) => {
  const [isWalking, setIsWalking] = useState(false);
  const [walkingDuration, setWalkingDuration] = useState(0);
  const [steps, setSteps] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isWalking) {
      // Start pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Update timer and steps
      interval = setInterval(() => {
        setWalkingDuration((prev) => prev + 1);
        setSteps((prev) => prev + Math.floor(Math.random() * 3) + 1); // Simulate steps
      }, 1000);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWalking]);

  const startWalking = () => {
    setIsWalking(true);
    setStartTime(new Date());
    setWalkingDuration(0);
    setSteps(0);
  };

  const stopWalking = () => {
    setIsWalking(false);
    const distance = steps * 0.0005; // Approximate miles per step
    const calories = Math.round(steps * 0.04); // Approximate calories per step

    const walkingData: WalkingData = {
      duration: walkingDuration,
      steps: steps,
      distance: parseFloat(distance.toFixed(2)),
      calories: calories,
      completed: true,
    };

    Alert.alert(
      'Walk Complete!',
      `Great job! You walked for ${Math.floor(walkingDuration / 60)}:${(walkingDuration % 60).toString().padStart(2, '0')} minutes.\n\nSteps: ${steps}\nDistance: ${distance.toFixed(2)} miles\nCalories: ${calories}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setIsWalking(false);
            setWalkingDuration(0);
            setSteps(0);
          }
