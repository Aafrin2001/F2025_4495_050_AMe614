import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  nextDose: string;
  remainingPills: number;
  refillDate: string;
  isTaken: boolean;
}

interface MedicationTrackerProps {
  onNavigate: (screen: 'healthcare' | 'medications' | 'walk' | 'family') => void;
}

export default function MedicationTracker({ onNavigate }: MedicationTrackerProps) {
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      nextDose: '8:00 AM',
      remainingPills: 15,
      refillDate: '2024-01-15',
      isTaken: false,
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      nextDose: '12:00 PM',
      remainingPills: 28,
      refillDate: '2024-01-20',
      isTaken: false,
    },
    {
      id: '3',
      name: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily',
      nextDose: '6:00 PM',
      remainingPills: 5,
      refillDate: '2024-01-10',
      isTaken: false,
    },
  ]);

  const [lowStockMedications, setLowStockMedications] = useState<Medication[]>([]);

  useEffect(() => {
    // Check for low stock medications
    const lowStock = medications.filter(med => med.remainingPills <= 7);
    setLowStockMedications(lowStock);

    // Notify family if any medication is low on stock
    if (lowStock.length > 0) {
      const lowStockNames = lowStock.map(med => med.name).join(', ');
      Speech.speak(
        `Alert: You're running low on ${lowStockNames}. I'll notify your family to arrange refills.`,
        { rate: 0.8 }
      );
    }
  }, [medications]);

  const markMedicationTaken = (id: string) => {
    setMedications(prev =>
      prev.map(med =>
        med.id === id ? { ...med, isTaken: true } : med
      )
    );
    Speech.speak('Medication marked as taken. Great job!', { rate: 0.8 });
  };

  const getMedicationStatus = (medication: Medication) => {
    if (medication.isTaken) {
      return { status: 'Taken', color: '#22c55e', icon: '✅' };
    }
    if (medication.remainingPills <= 7) {
      return { status: 'Low Stock', color: '#ef4444', icon: '⚠️' };
    }
    return { status: 'Pending', color: '#f59e0b', icon: '⏰' };
  };

  const requestRefill = (medication: Medication) => {
    Alert.alert(
      'Request Refill',
      `Request refill for ${medication.name}? This will notify your family.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: () => {
            Speech.speak(
              `Refill requested for ${medication.name}. Your family has been notified.`,
              { rate: 0.8 }
            );
            // In a real app, this would send a notification to family
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('healthcare')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Medication Tracker 💊</Text>
          <Text style={styles.subtitle}>Stay on top of your medications</Text>
        </View>

        {/* Low Stock Alert */}
        {lowStockMedications.length > 0 && (
          <View style={styles.alertContainer}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Low Stock Alert</Text>
              <Text style={styles.alertText}>
                {lowStockMedications.map(med => med.name).join(', ')} running low
              </Text>
            </View>
          </View>
        )}

        {/* Medications List */}
        <View style={styles.medicationsList}>
          {medications.map((medication) => {
            const status = getMedicationStatus(medication);
            return (
              <View key={medication.id} style={styles.medicationCard}>
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                    <Text style={styles.medicationFrequency}>{medication.frequency}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                    <Text style={styles.statusIcon}>{status.icon}</Text>
                    <Text style={styles.statusText}>{status.status}</Text>
                  </View>
                </View>

                <View style={styles.medicationDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Next Dose:</Text>
                    <Text style={styles.detailValue}>{medication.nextDose}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Remaining:</Text>
                    <Text style={styles.detailValue}>{medication.remainingPills} pills</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Refill Date:</Text>
                    <Text style={styles.detailValue}>{medication.refillDate}</Text>
                  </View>
                </View>

                <View style={styles.medicationActions}>
                  {!medication.isTaken && (
                    <TouchableOpacity
                      style={styles.takeButton}
                      onPress={() => markMedicationTaken(medication.id)}
                    >
                      <Text style={styles.takeButtonText}>Mark as Taken</Text>
                    </TouchableOpacity>
                  )}
                  
                  {medication.remainingPills <= 7 && (
                    <TouchableOpacity
                      style={styles.refillButton}
                      onPress={() => requestRefill(medication)}
                    >
                      <Text style={styles.refillButtonText}>Request Refill</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Voice Commands */}
        <View style={styles.voiceCommands}>
          <Text style={styles.voiceTitle}>Voice Commands</Text>
          <View style={styles.commandList}>
            <Text style={styles.commandItem}>• "Take my morning medication"</Text>
            <Text style={styles.commandItem}>• "Check medication stock"</Text>
            <Text style={styles.commandItem}>• "Request refill for [medication name]"</Text>
            <Text style={styles.commandItem}>• "What medications do I have?"</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  alertContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#991b1b',
  },
  medicationsList: {
    marginBottom: 30,
  },
  medicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 2,
  },
  medicationFrequency: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  medicationDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  medicationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  takeButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  takeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  refillButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  refillButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  voiceCommands: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  commandList: {
    gap: 8,
  },
  commandItem: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
