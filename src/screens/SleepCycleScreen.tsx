import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface SleepCycleScreenProps {
  onBack: () => void;
  onComplete: (data: SleepData) => void;
}

interface SleepData {
  bedTime: string;
  wakeTime: string;
  totalHours: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  completed: boolean;
}

interface SleepRecord {
  id: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  totalHours: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

const SleepCycleScreen: React.FC<SleepCycleScreenProps> = ({ onBack, onComplete }) => {
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([
    {
      id: '1',
      date: '2024-01-14',
      bedTime: '22:00',
      wakeTime: '07:00',
      totalHours: 9,
      quality: 'Good',
    },
    {
      id: '2',
      date: '2024-01-13',
      bedTime: '23:30',
      wakeTime: '06:30',
      totalHours: 7,
      quality: 'Fair',
    },
    {
      id: '3',
      date: '2024-01-12',
      bedTime: '21:45',
      wakeTime: '06:45',
      totalHours: 9,
      quality: 'Excellent',
    },
  ]);
