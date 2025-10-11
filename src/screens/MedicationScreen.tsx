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

const MedicationScreen: React.FC<MedicationScreenProps> = ({ onBack }) => {
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      time: '08:00 AM',
      type: 'Pill',
      color: 'White',
      shape: 'Round',
      instructions: 'Take with food',
      doctor: 'Dr. Smith',
      pharmacy: 'CVS Pharmacy',
      refillDate: '2024-02-15',
      sideEffects: ['Dry cough', 'Dizziness'],
      isActive: true,
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      time: '08:00 AM, 08:00 PM',
      type: 'Pill',
      color: 'White',
      shape: 'Oval',
      instructions: 'Take with meals',
      doctor: 'Dr. Johnson',
      pharmacy: 'Walgreens',
      refillDate: '2024-02-20',
      sideEffects: ['Nausea', 'Stomach upset'],
      isActive: true,
    },
    {
      id: '3',
      name: 'Albuterol',
      dosage: '90mcg',
      frequency: 'As needed',
      time: 'When needed',
      type: 'Inhaler',
      color: 'Blue',
      shape: 'Inhaler',
      instructions: 'Shake before use',
      doctor: 'Dr. Brown',
      pharmacy: 'Rite Aid',
      refillDate: '2024-03-01',
      sideEffects: ['Rapid heartbeat', 'Tremors'],
      isActive: true,
    },
  ]);
