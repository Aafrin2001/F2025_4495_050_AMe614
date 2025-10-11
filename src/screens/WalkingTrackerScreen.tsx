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
