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

interface HealthMonitoringScreenProps {
  onBack: () => void;
  onScheduleCheck: () => void;
}

interface VitalSign {
  id: string;
  name: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
}

const HealthMonitoringScreen: React.FC<HealthMonitoringScreenProps> = ({ onBack, onScheduleCheck }) => {
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([
    { id: '1', name: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: 'heart-outline', color: '#FF6B6B' },
    { id: '2', name: 'Heart Rate', value: '72', unit: 'bpm', icon: 'pulse-outline', color: '#4ECDC4' },
    { id: '3', name: 'Temperature', value: '98.6', unit: '°F', icon: 'thermometer-outline', color: '#45B7D1' },
    { id: '4', name: 'Weight', value: '165', unit: 'lbs', icon: 'scale-outline', color: '#96CEB4' },
    { id: '5', name: 'Blood Sugar', value: '95', unit: 'mg/dL', icon: 'water-outline', color: '#FFEAA7' },
    { id: '6', name: 'Oxygen Level', value: '98', unit: '%', icon: 'airplane-outline', color: '#DDA0DD' },
  ]);

  const [selectedVital, setSelectedVital] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showAddReading, setShowAddReading] = useState(false);
  const [newReading, setNewReading] = useState({
    vitalType: '',
    value: '',
    unit: '',
    notes: ''
  });

  const handleVitalPress = (vital: VitalSign) => {
    setSelectedVital(vital.id);
    setInputValue(vital.value);
  };

  const handleSaveVital = () => {
    if (!selectedVital || !inputValue) return;

    const updatedVitals = vitalSigns.map(vital =>
      vital.id === selectedVital ? { ...vital, value: inputValue } : vital
    );
    setVitalSigns(updatedVitals);
    setSelectedVital(null);
    setInputValue('');
    Alert.alert('Success', 'Vital sign updated successfully!');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add':
        setShowAddReading(true);
        break;
      case 'schedule':
        onScheduleCheck();
        break;
      case 'share':
        Alert.alert('Share Report', 'This will generate and share your health report with family or doctors.');
        break;
      case 'trends':
        Alert.alert('View Trends', 'This will show your health trends and progress over time.');
        break;
      default:
        break;
    }
  };

  const handleAddReading = () => {
    if (!newReading.vitalType || !newReading.value) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Find the vital type and update it
    const vitalToUpdate = vitalSigns.find(vital => vital.name === newReading.vitalType);
    if (vitalToUpdate) {
      const updatedVitals = vitalSigns.map(vital =>
        vital.id === vitalToUpdate.id ? { ...vital, value: newReading.value } : vital
      );
      setVitalSigns(updatedVitals);
    }

    // Reset form
    setNewReading({
      vitalType: '',
      value: '',
      unit: '',
      notes: ''
    });
    setShowAddReading(false);
    Alert.alert('Success', 'New reading added successfully!');
  };

  const getVitalUnits = (vitalName: string) => {
    const vital = vitalSigns.find(v => v.name === vitalName);
    return vital ? vital.unit : '';
  };

  const renderVitalCard = (vital: VitalSign) => (
    <TouchableOpacity
      key={vital.id}
      style={[
        styles.vitalCard, 
        { borderLeftColor: vital.color },
        selectedVital === vital.id && styles.vitalCardSelected
      ]}
      onPress={() => handleVitalPress(vital)}
    >
      <View style={styles.vitalHeader}>
        <Ionicons name={vital.icon as any} size={24} color={vital.color} />
        <Text style={styles.vitalName}>{vital.name}</Text>
      </View>
      <View style={styles.vitalValue}>
        <Text style={styles.vitalNumber}>{vital.value}</Text>
        <Text style={styles.vitalUnit}>{vital.unit}</Text>
      </View>
      <Text style={styles.lastUpdated}>Last updated: Today</Text>
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
        <Text style={styles.headerTitle}>Health Monitoring</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Health Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>6</Text>
              <Text style={styles.statLabel}>Vitals Tracked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Good</Text>
              <Text style={styles.statLabel}>Overall Status</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Reminders</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vital Signs</Text>
          <Text style={styles.sectionSubtitle}>Tap any vital to update</Text>
          
          <View style={styles.vitalsGrid}>
            {vitalSigns.map(renderVitalCard)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('add')}
            >
              <Ionicons name="add-circle-outline" size={32} color="#FFFFFF" />
              <Text style={styles.actionText}>Add Reading</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('schedule')}
            >
              <Ionicons name="calendar-outline" size={32} color="#FFFFFF" />
              <Text style={styles.actionText}>Schedule Check</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('share')}
            >
              <Ionicons name="share-outline" size={32} color="#FFFFFF" />
              <Text style={styles.actionText}>Share Report</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('trends')}
            >
              <Ionicons name="trending-up-outline" size={32} color="#FFFFFF" />
              <Text style={styles.actionText}>View Trends</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Input Modal */}
      {selectedVital && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Update {vitalSigns.find(v => v.id === selectedVital)?.name}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter new value"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setSelectedVital(null)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveVital}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Add Reading Modal */}
      {showAddReading && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Reading</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Vital Type</Text>
              <View style={styles.dropdown}>
                <Text style={styles.dropdownText}>
                  {newReading.vitalType || 'Select vital type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
              </View>
              <ScrollView style={styles.dropdownOptions}>
                {vitalSigns.map((vital) => (
                  <TouchableOpacity
                    key={vital.id}
                    style={styles.dropdownOption}
                    onPress={() => setNewReading({...newReading, vitalType: vital.name, unit: vital.unit})}
                  >
                    <Text style={styles.dropdownOptionText}>{vital.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Value</Text>
              <TextInput
                style={styles.modalInput}
                value={newReading.value}
                onChangeText={(text) => setNewReading({...newReading, value: text})}
                placeholder="Enter value"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                value={newReading.notes}
                onChangeText={(text) => setNewReading({...newReading, notes: text})}
                placeholder="Add any notes..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddReading(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddReading}
              >
                <Text style={styles.saveButtonText}>Add Reading</Text>
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
    marginRight: 40, // Compensate for back button
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  vitalsGrid: {
    gap: 15,
  },
  vitalCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
  },
  vitalCardSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  vitalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  vitalValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  vitalNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  vitalUnit: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
  },
  actionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
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
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  dropdownOptions: {
    maxHeight: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    marginTop: 5,
  },
  dropdownOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default HealthMonitoringScreen;
