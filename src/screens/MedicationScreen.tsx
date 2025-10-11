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

  const [reminders, setReminders] = useState<MedicationReminder[]>([
    {
      id: '1',
      medicationId: '1',
      time: '08:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      isEnabled: true,
      lastTaken: '2024-01-15',
    },
    {
      id: '2',
      medicationId: '2',
      time: '08:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      isEnabled: true,
      lastTaken: '2024-01-15',
    },
  ]);

  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showMedicationDetails, setShowMedicationDetails] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    time: '',
    type: 'Pill' as Medication['type'],
    color: '',
    shape: '',
    instructions: '',
    doctor: '',
    pharmacy: '',
    refillDate: '',
    sideEffects: '',
  });

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Dosage, Frequency)');
      return;
    }

    const medication: Medication = {
      id: Date.now().toString(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency,
      time: newMedication.time,
      type: newMedication.type,
      color: newMedication.color,
      shape: newMedication.shape,
      instructions: newMedication.instructions,
      doctor: newMedication.doctor,
      pharmacy: newMedication.pharmacy,
      refillDate: newMedication.refillDate,
      sideEffects: newMedication.sideEffects.split(',').map(s => s.trim()).filter(s => s),
      isActive: true,
    };

    setMedications([...medications, medication]);
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      time: '',
      type: 'Pill',
      color: '',
      shape: '',
      instructions: '',
      doctor: '',
      pharmacy: '',
      refillDate: '',
      sideEffects: '',
    });
    setShowAddMedication(false);
    Alert.alert('Success', 'Medication added successfully!');
  };

  const handleMedicationPress = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowMedicationDetails(true);
  };

  const handleTakeMedication = (medicationId: string) => {
    const now = new Date().toISOString().split('T')[0];
    setReminders(reminders.map(reminder =>
      reminder.medicationId === medicationId
        ? { ...reminder, lastTaken: now }
        : reminder
    ));
    Alert.alert('Medication Taken', 'Great job! Your medication has been recorded.');
  };

  const getMedicationTypeColor = (type: Medication['type']) => {
    switch (type) {
      case 'Pill': return '#4CAF50';
      case 'Liquid': return '#2196F3';
      case 'Injection': return '#FF9800';
      case 'Cream': return '#9C27B0';
      case 'Inhaler': return '#F44336';
      default: return '#FFFFFF';
    }
  };

  const getMedicationTypeIcon = (type: Medication['type']) => {
    switch (type) {
      case 'Pill': return 'medical';
      case 'Liquid': return 'water';
      case 'Injection': return 'medical-outline';
      case 'Cream': return 'bandage';
      case 'Inhaler': return 'airplane';
      default: return 'medical';
    }
  };

  const renderMedication = (medication: Medication) => (
    <TouchableOpacity
      key={medication.id}
      style={[styles.medicationCard, { borderLeftColor: getMedicationTypeColor(medication.type) }]}
      onPress={() => handleMedicationPress(medication)}
    >
      <View style={styles.medicationHeader}>
        <View style={styles.medicationIconContainer}>
          <Ionicons 
            name={getMedicationTypeIcon(medication.type) as any} 
            size={24} 
            color={getMedicationTypeColor(medication.type)} 
          />
        </View>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.medicationDosage}>{medication.dosage} • {medication.frequency}</Text>
          <Text style={styles.medicationTime}>{medication.time}</Text>
        </View>
        <View style={styles.medicationActions}>
          <TouchableOpacity
            style={styles.takeButton}
            onPress={() => handleTakeMedication(medication.id)}
          >
            <Ionicons name="checkmark" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medication</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Medication Overview</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{medications.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{medications.filter(m => m.isActive).length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reminders.length}</Text>
              <Text style={styles.statLabel}>Reminders</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Medications</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddMedication(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.medicationsList}>
            {medications.map(renderMedication)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <View style={styles.scheduleList}>
            {reminders.map(reminder => {
              const medication = medications.find(m => m.id === reminder.medicationId);
              if (!medication) return null;
              
              return (
                <View key={reminder.id} style={styles.scheduleItem}>
                  <View style={styles.scheduleTime}>
                    <Text style={styles.scheduleTimeText}>{reminder.time}</Text>
                  </View>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleMedicationName}>{medication.name}</Text>
                    <Text style={styles.scheduleDosage}>{medication.dosage}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.scheduleButton, reminder.lastTaken === new Date().toISOString().split('T')[0] && styles.scheduleButtonTaken]}
                    onPress={() => handleTakeMedication(medication.id)}
                  >
                    <Ionicons 
                      name={reminder.lastTaken === new Date().toISOString().split('T')[0] ? "checkmark-circle" : "ellipse-outline"} 
                      size={24} 
                      color={reminder.lastTaken === new Date().toISOString().split('T')[0] ? "#4CAF50" : "#FFFFFF"} 
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

     