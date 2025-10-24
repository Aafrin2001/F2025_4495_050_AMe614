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

interface ScheduleCheckScreenProps {
  onBack: () => void;
}

interface ScheduledCheck {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'doctor' | 'medication' | 'vitals' | 'exercise';
  notes: string;
  completed: boolean;
}

const ScheduleCheckScreen: React.FC<ScheduleCheckScreenProps> = ({ onBack }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [scheduledChecks, setScheduledChecks] = useState<ScheduledCheck[]>([
    {
      id: '1',
      title: 'Blood Pressure Check',
      date: '2024-01-15',
      time: '09:00',
      type: 'vitals',
      notes: 'Morning reading',
      completed: false,
    },
    {
      id: '2',
      title: 'Dr. Smith Appointment',
      date: '2024-01-20',
      time: '14:30',
      type: 'doctor',
      notes: 'Annual checkup',
      completed: false,
    },
    {
      id: '3',
      title: 'Medication Review',
      date: '2024-01-18',
      time: '10:00',
      type: 'medication',
      notes: 'Review with pharmacist',
      completed: true,
    },
  ]);

  const [newCheck, setNewCheck] = useState({
    title: '',
    date: '',
    time: '',
    type: 'vitals' as 'doctor' | 'medication' | 'vitals' | 'exercise',
    notes: ''
  });

  const handleAddCheck = () => {
    if (!newCheck.title || !newCheck.date || !newCheck.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const check: ScheduledCheck = {
      id: Date.now().toString(),
      title: newCheck.title,
      date: newCheck.date,
      time: newCheck.time,
      type: newCheck.type,
      notes: newCheck.notes,
      completed: false,
    };

    setScheduledChecks([...scheduledChecks, check]);
    setNewCheck({
      title: '',
      date: '',
      time: '',
      type: 'vitals',
      notes: ''
    });
    setShowAddForm(false);
    Alert.alert('Success', 'Check scheduled successfully!');
  };

  const toggleCompleted = (id: string) => {
    setScheduledChecks(scheduledChecks.map(check =>
      check.id === id ? { ...check, completed: !check.completed } : check
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'doctor': return 'medical-outline';
      case 'medication': return 'medical-outline';
      case 'vitals': return 'heart-outline';
      case 'exercise': return 'fitness-outline';
      default: return 'calendar-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'doctor': return '#FF6B6B';
      case 'medication': return '#4ECDC4';
      case 'vitals': return '#45B7D1';
      case 'exercise': return '#96CEB4';
      default: return '#DDA0DD';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderScheduledCheck = (check: ScheduledCheck) => (
    <TouchableOpacity
      key={check.id}
      style={[
        styles.checkCard,
        { borderLeftColor: getTypeColor(check.type) },
        check.completed && styles.completedCard
      ]}
      onPress={() => toggleCompleted(check.id)}
    >
      <View style={styles.checkHeader}>
        <View style={styles.checkIconContainer}>
          <Ionicons 
            name={getTypeIcon(check.type) as any} 
            size={24} 
            color={getTypeColor(check.type)} 
          />
        </View>
        <View style={styles.checkInfo}>
          <Text style={[styles.checkTitle, check.completed && styles.completedText]}>
            {check.title}
          </Text>
          <Text style={styles.checkDateTime}>
            {formatDate(check.date)} at {check.time}
          </Text>
          {check.notes && (
            <Text style={styles.checkNotes}>{check.notes}</Text>
          )}
        </View>
        <View style={styles.checkStatus}>
          {check.completed ? (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color="rgba(255, 255, 255, 0.5)" />
          )}
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
        <Text style={styles.headerTitle}>Schedule Check</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Upcoming Checks</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{scheduledChecks.filter(c => !c.completed).length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{scheduledChecks.filter(c => c.completed).length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{scheduledChecks.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Scheduled Checks</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.checksList}>
            {scheduledChecks.map(renderScheduledCheck)}
          </View>
        </View>
      </ScrollView>

      {/* Add Check Modal */}
      {showAddForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule New Check</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                value={newCheck.title}
                onChangeText={(text) => setNewCheck({...newCheck, title: text})}
                placeholder="e.g., Blood Pressure Check"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type</Text>
              <View style={styles.typeButtons}>
                {['vitals', 'doctor', 'medication', 'exercise'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      newCheck.type === type && styles.typeButtonSelected
                    ]}
                    onPress={() => setNewCheck({...newCheck, type: type as any})}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      newCheck.type === type && styles.typeButtonTextSelected
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newCheck.date}
                  onChangeText={(text) => setNewCheck({...newCheck, date: text})}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newCheck.time}
                  onChangeText={(text) => setNewCheck({...newCheck, time: text})}
                  placeholder="HH:MM"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                value={newCheck.notes}
                onChangeText={(text) => setNewCheck({...newCheck, notes: text})}
                placeholder="Add any notes..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddCheck}
              >
                <Text style={styles.saveButtonText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  checksList: {
    gap: 15,
  },
  checkCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
  },
  completedCard: {
    opacity: 0.6,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIconContainer: {
    marginRight: 15,
  },
  checkInfo: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  checkDateTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  checkNotes: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  checkStatus: {
    marginLeft: 10,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  typeButtonSelected: {
    backgroundColor: '#FFFFFF',
  },
  typeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: '#667eea',
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScheduleCheckScreen;
