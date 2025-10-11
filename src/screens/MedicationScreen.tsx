import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface MedicationScreenProps {
  onBack: () => void;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  type: 'Pill' | 'Liquid' | 'Injection' | 'Cream' | 'Inhaler';
  color: string;
  shape: string;
  instructions: string;
  doctor: string;
  pharmacy: string;
  refillDate: string;
  sideEffects: string[];
  isActive: boolean;
}

interface MedicationReminder {
  id: string;
  medicationId: string;
  time: string;
  days: string[];
  isEnabled: boolean;
  lastTaken: string | null;
}

