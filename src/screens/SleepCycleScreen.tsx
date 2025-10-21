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
  const [showLogSleep, setShowLogSleep] = useState(false);
  const [newSleep, setNewSleep] = useState({
    bedTime: '',
    wakeTime: '',
    quality: 'Good' as 'Excellent' | 'Good' | 'Fair' | 'Poor',
  });

  const calculateSleepHours = (bedTime: string, wakeTime: string): number => {
    if (!bedTime || !wakeTime) return 0;
    
    const [bedHour, bedMin] = bedTime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    
    let bedMinutes = bedHour * 60 + bedMin;
    let wakeMinutes = wakeHour * 60 + wakeMin;
    
    // Handle overnight sleep (wake time is next day)
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60; // Add 24 hours
    }
    
    const totalMinutes = wakeMinutes - bedMinutes;
    return Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal place
  };
const handleLogSleep = () => {
    if (!newSleep.bedTime || !newSleep.wakeTime) {
      Alert.alert('Error', 'Please fill in both bed time and wake time');
      return;
    }

    const totalHours = calculateSleepHours(newSleep.bedTime, newSleep.wakeTime);
    
    if (totalHours <= 0) {
      Alert.alert('Error', 'Wake time must be after bed time');
      return;
    }

    if (totalHours > 16) {
      Alert.alert('Error', 'Sleep duration seems too long. Please check your times.');
      return;
    }

    const sleepData: SleepData = {
      bedTime: newSleep.bedTime,
      wakeTime: newSleep.wakeTime,
      totalHours: totalHours,
      quality: newSleep.quality,
      completed: true,
    };
  const newRecord: SleepRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      bedTime: newSleep.bedTime,
      wakeTime: newSleep.wakeTime,
      totalHours: totalHours,
      quality: newSleep.quality,
    };

    setSleepRecords([newRecord, ...sleepRecords]);
    setNewSleep({ bedTime: '', wakeTime: '', quality: 'Good' });
    setShowLogSleep(false);

    Alert.alert(
      'Sleep Logged!',
      `You slept ${totalHours} hours with ${newSleep.quality.toLowerCase()} quality.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Activity',
          onPress: () => {
            onComplete(sleepData);
            onBack();
          }
        }
      ]
    );
  };
    const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent': return '#4CAF50';
      case 'Good': return '#2196F3';
      case 'Fair': return '#FF9800';
      case 'Poor': return '#F44336';
      default: return '#FFFFFF';
    }
  };

  const getSleepScore = () => {
    if (sleepRecords.length === 0) return 0;
    
    const avgHours = sleepRecords.reduce((sum, record) => sum + record.totalHours, 0) / sleepRecords.length;
    const qualityScore = sleepRecords.reduce((sum, record) => {
      switch (record.quality) {
        case 'Excellent': return sum + 4;
        case 'Good': return sum + 3;
        case 'Fair': return sum + 2;
        case 'Poor': return sum + 1;
        default: return sum;
      }
    }, 0) / sleepRecords.length;

    return Math.round((avgHours / 8) * qualityScore * 25); // Max score 100
  };

  const getSleepAdvice = () => {
    const avgHours = sleepRecords.length > 0 
      ? sleepRecords.reduce((sum, record) => sum + record.totalHours, 0) / sleepRecords.length 
      : 0;
    
    if (avgHours < 6) return "Try to get more sleep - aim for 7-9 hours";
    if (avgHours > 9) return "Consider if you might be oversleeping";
    if (avgHours >= 7 && avgHours <= 9) return "Great sleep duration! Keep it up";
    return "Log your sleep to get personalized advice";
  };
