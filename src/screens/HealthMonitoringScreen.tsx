import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { healthMetricsService } from '../lib/healthMetrics';
import { HealthMetric, HealthMetricInput, HealthMetricsSummary, User } from '../types';

interface HealthMonitoringScreenProps {
  onBack: () => void;
  onScheduleCheck: () => void;
  user: User | null;
}

interface VitalSign {
  id: string;
  name: string;
  metric_type: 'blood_pressure' | 'heart_rate' | 'body_temperature' | 'weight' | 'blood_sugar' | 'oxygen_level';
  value: string;
  unit: string;
  icon: string;
  color: string;
  lastUpdated?: string;
}

const HealthMonitoringScreen: React.FC<HealthMonitoringScreenProps> = ({ 
  onBack, 
  onScheduleCheck, 
  user 
}) => {
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([
    { 
      id: '1', 
      name: 'Blood Pressure', 
      metric_type: 'blood_pressure',
      value: '--/--', 
      unit: 'mmHg', 
      icon: 'heart-outline', 
      color: '#FF6B6B' 
    },
    { 
      id: '2', 
      name: 'Heart Rate', 
      metric_type: 'heart_rate',
      value: '--', 
      unit: 'bpm', 
      icon: 'pulse-outline', 
      color: '#4ECDC4' 
    },
    { 
      id: '3', 
      name: 'Body Temperature', 
      metric_type: 'body_temperature',
      value: '--', 
      unit: '°F', 
      icon: 'thermometer-outline', 
      color: '#45B7D1' 
    },
    { 
      id: '4', 
      name: 'Weight', 
      metric_type: 'weight',
      value: '--', 
      unit: 'lbs', 
      icon: 'scale-outline', 
      color: '#96CEB4' 
    },
    { 
      id: '5', 
      name: 'Blood Sugar', 
      metric_type: 'blood_sugar',
      value: '--', 
      unit: 'mg/dL', 
      icon: 'water-outline', 
      color: '#FFEAA7' 
    },
    { 
      id: '6', 
      name: 'Oxygen Level', 
      metric_type: 'oxygen_level',
      value: '--', 
      unit: '%', 
      icon: 'airplane-outline', 
      color: '#DDA0DD' 
    },
  ]);

  const [selectedVital, setSelectedVital] = useState<VitalSign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddReading, setShowAddReading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [currentHealthSummary, setCurrentHealthSummary] = useState<HealthMetricsSummary | null>(null);
  const [newReading, setNewReading] = useState<HealthMetricInput>({
    metric_type: 'heart_rate',
    value: 0,
    unit: 'bpm',
    notes: ''
  });

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Load latest metrics on component mount
  useEffect(() => {
    if (user?.id) {
      loadLatestMetrics();
    }
  }, [user?.id]);

  const loadLatestMetrics = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data: summary, error } = await healthMetricsService.getLatestMetrics(user.id);
      
      if (error) {
        console.error('Error loading metrics:', error);
        return;
      }

      if (summary) {
        setCurrentHealthSummary(summary);
        updateVitalSignsWithData(summary);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateVitalSignsWithData = (summary: HealthMetricsSummary) => {
    setVitalSigns(prevVitals => 
      prevVitals.map(vital => {
        const metric = summary[vital.metric_type];
        if (metric) {
          let displayValue = '';
          if (vital.metric_type === 'blood_pressure' && metric.systolic && metric.diastolic) {
            displayValue = `${metric.systolic}/${metric.diastolic}`;
          } else {
            displayValue = metric.value.toString();
          }
          
          return {
            ...vital,
            value: displayValue,
            lastUpdated: new Date(metric.recorded_at).toLocaleDateString()
          };
        }
        return vital;
      })
    );
  };

  // Health status evaluation functions
  const evaluateBloodPressure = (systolic: number, diastolic: number): 'Perfect' | 'Good' | 'Warning' => {
    if (systolic < 120 && diastolic < 80) return 'Perfect';
    if (systolic < 140 && diastolic < 90) return 'Good';
    return 'Warning';
  };

  const evaluateHeartRate = (rate: number): 'Perfect' | 'Good' | 'Warning' => {
    if (rate >= 60 && rate <= 100) return 'Perfect';
    if (rate >= 50 && rate <= 110) return 'Good';
    return 'Warning';
  };

  const evaluateTemperature = (temp: number, unit: string): 'Perfect' | 'Good' | 'Warning' => {
    const tempF = unit === '°C' ? (temp * 9/5) + 32 : temp;
    if (tempF >= 97.8 && tempF <= 99.1) return 'Perfect';
    if (tempF >= 97.0 && tempF <= 100.4) return 'Good';
    return 'Warning';
  };

  const evaluateWeight = (weight: number, unit: string): 'Perfect' | 'Good' | 'Warning' => {
    // This is a simplified evaluation - in real app, you'd compare to user's baseline
    if (unit === 'kg') {
      if (weight >= 50 && weight <= 100) return 'Perfect';
      if (weight >= 40 && weight <= 120) return 'Good';
    } else {
      if (weight >= 110 && weight <= 220) return 'Perfect';
      if (weight >= 90 && weight <= 260) return 'Good';
    }
    return 'Warning';
  };

  const evaluateBloodSugar = (sugar: number): 'Perfect' | 'Good' | 'Warning' => {
    if (sugar >= 70 && sugar <= 100) return 'Perfect';
    if (sugar >= 60 && sugar <= 140) return 'Good';
    return 'Warning';
  };

  const evaluateOxygenLevel = (oxygen: number): 'Perfect' | 'Good' | 'Warning' => {
    if (oxygen >= 95) return 'Perfect';
    if (oxygen >= 90) return 'Good';
    return 'Warning';
  };

  // Calculate overall health status
  const calculateOverallHealthStatus = (summary: HealthMetricsSummary): 'Perfect' | 'Good' | 'Warning' => {
    const statuses: ('Perfect' | 'Good' | 'Warning')[] = [];
    
    if (summary.blood_pressure && summary.blood_pressure.systolic && summary.blood_pressure.diastolic) {
      statuses.push(evaluateBloodPressure(summary.blood_pressure.systolic, summary.blood_pressure.diastolic));
    }
    
    if (summary.heart_rate) {
      statuses.push(evaluateHeartRate(summary.heart_rate.value));
    }
    
    if (summary.body_temperature) {
      statuses.push(evaluateTemperature(summary.body_temperature.value, summary.body_temperature.unit));
    }
    
    if (summary.weight) {
      statuses.push(evaluateWeight(summary.weight.value, summary.weight.unit));
    }
    
    if (summary.blood_sugar) {
      statuses.push(evaluateBloodSugar(summary.blood_sugar.value));
    }
    
    if (summary.oxygen_level) {
      statuses.push(evaluateOxygenLevel(summary.oxygen_level.value));
    }

    if (statuses.length === 0) return 'Good'; // Default if no data
    
    // If any status is Warning, overall is Warning
    if (statuses.includes('Warning')) return 'Warning';
    
    // If all statuses are Perfect, overall is Perfect
    if (statuses.every(status => status === 'Perfect')) return 'Perfect';
    
    // Otherwise, it's Good
    return 'Good';
  };

  const getHealthStatusColor = (status: 'Perfect' | 'Good' | 'Warning'): string => {
    switch (status) {
      case 'Perfect': return '#4CAF50'; // Green
      case 'Good': return '#2196F3'; // Blue
      case 'Warning': return '#FF9800'; // Orange
      default: return '#2196F3';
    }
  };

  const getHealthStatusIcon = (status: 'Perfect' | 'Good' | 'Warning'): string => {
    switch (status) {
      case 'Perfect': return 'checkmark-circle';
      case 'Good': return 'thumbs-up';
      case 'Warning': return 'warning';
      default: return 'thumbs-up';
    }
  };

  const handleVitalPress = (vital: VitalSign) => {
    setSelectedVital(vital);
    setNewReading({
      metric_type: vital.metric_type,
      value: 0,
      unit: vital.unit,
      notes: ''
    });
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    dismissKeyboard();
    setSelectedVital(null);
    setShowAddReading(false);
    setNewReading({
      metric_type: 'heart_rate',
      value: 0,
      unit: 'bpm',
      notes: ''
    });
  };

  const handleSaveMetric = async () => {
    if (!selectedVital || !user?.id) return;

    dismissKeyboard();
    setIsLoading(true);
    try {
      const { data, error } = await healthMetricsService.saveMetric(user.id, newReading);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to save metric');
        return;
      }

      if (data) {
        Alert.alert('Success', 'Health metric saved successfully!');
        setSelectedVital(null);
        loadLatestMetrics(); // Reload data
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReading = async () => {
    if (!user?.id) return;

    dismissKeyboard();
    setIsLoading(true);
    try {
      const { data, error } = await healthMetricsService.saveMetric(user.id, newReading);
      
      if (error) {
        Alert.alert('Error', error.message || 'Failed to save reading');
        return;
      }

      if (data) {
        Alert.alert('Success', 'New reading added successfully!');
        setShowAddReading(false);
        setNewReading({
          metric_type: 'heart_rate',
          value: 0,
          unit: 'bpm',
          notes: ''
        });
        loadLatestMetrics(); // Reload data
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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

  const renderVitalCard = (vital: VitalSign) => (
    <TouchableOpacity
      key={vital.id}
      style={[
        styles.vitalCard, 
        { borderLeftColor: vital.color },
        selectedVital?.id === vital.id && styles.vitalCardSelected
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
      <Text style={styles.lastUpdated}>
        {vital.lastUpdated ? `Updated: ${vital.lastUpdated}` : 'No data recorded'}
      </Text>
    </TouchableOpacity>
  );

  const renderBloodPressureInput = () => (
    <View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Systolic (Top Number)</Text>
        <TextInput
          style={styles.modalInput}
          value={newReading.systolic?.toString() || ''}
          onChangeText={(text) => setNewReading({...newReading, systolic: parseInt(text) || 0})}
          placeholder="120"
          placeholderTextColor="rgba(255, 255, 255, 0.7)"
          keyboardType="numeric"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Diastolic (Bottom Number)</Text>
        <TextInput
          style={styles.modalInput}
          value={newReading.diastolic?.toString() || ''}
          onChangeText={(text) => setNewReading({...newReading, diastolic: parseInt(text) || 0})}
          placeholder="80"
          placeholderTextColor="rgba(255, 255, 255, 0.7)"
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  const renderRegularInput = () => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>Value</Text>
      <TextInput
        style={styles.modalInput}
        value={newReading.value.toString()}
        onChangeText={(text) => setNewReading({...newReading, value: parseFloat(text) || 0})}
        placeholder="Enter value"
        placeholderTextColor="rgba(255, 255, 255, 0.7)"
        keyboardType="numeric"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
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
              <Text style={styles.statNumber}>
                {currentHealthSummary ? 
                  Object.values(currentHealthSummary).filter(metric => metric !== null).length 
                  : 0}
              </Text>
              <Text style={styles.statLabel}>Metrics Tracked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[
                styles.statNumber,
                { color: getHealthStatusColor(currentHealthSummary ? 
                  calculateOverallHealthStatus(currentHealthSummary) : 'Good') }
              ]}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  currentHealthSummary ? 
                    calculateOverallHealthStatus(currentHealthSummary) : 
                    'Good'
                )}
              </Text>
              <Text style={styles.statLabel}>Overall Status</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons 
                name={getHealthStatusIcon(currentHealthSummary ? 
                  calculateOverallHealthStatus(currentHealthSummary) : 'Good') as any} 
                size={32} 
                color={getHealthStatusColor(currentHealthSummary ? 
                  calculateOverallHealthStatus(currentHealthSummary) : 'Good')} 
              />
              <Text style={styles.statLabel}>Health Icon</Text>
            </View>
          </View>
        </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vital Signs</Text>
            <Text style={styles.sectionSubtitle}>Tap any vital to record new reading</Text>
            
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

        {/* Vital Input Modal */}
        {selectedVital && (
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={[
              styles.modalContent,
              isKeyboardVisible && styles.modalContentKeyboardVisible
            ]}>
              <View style={styles.modalFormContent}>
                <Text style={styles.modalTitle}>
                  Record {selectedVital.name}
                </Text>
                
                {selectedVital.metric_type === 'blood_pressure' 
                  ? renderBloodPressureInput() 
                  : renderRegularInput()
                }

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
              </View>

              <View style={[
                styles.modalButtons,
                isKeyboardVisible && styles.modalButtonsKeyboardVisible
              ]}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCancel}
                  disabled={isLoading}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveMetric}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#667eea" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Add Reading Modal */}
        {showAddReading && (
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={[
              styles.modalContent,
              isKeyboardVisible && styles.modalContentKeyboardVisible
            ]}>
              <View style={styles.modalFormContent}>
                <Text style={styles.modalTitle}>Add New Reading</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Metric Type</Text>
                  <View style={styles.dropdown}>
                    <Text style={styles.dropdownText}>
                      {vitalSigns.find(v => v.metric_type === newReading.metric_type)?.name || 'Select metric type'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                  </View>
                  <ScrollView style={styles.dropdownOptions}>
                    {vitalSigns.map((vital) => (
                      <TouchableOpacity
                        key={vital.id}
                        style={styles.dropdownOption}
                        onPress={() => setNewReading({
                          ...newReading, 
                          metric_type: vital.metric_type, 
                          unit: vital.unit
                        })}
                      >
                        <Text style={styles.dropdownOptionText}>{vital.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {newReading.metric_type === 'blood_pressure' 
                  ? renderBloodPressureInput() 
                  : renderRegularInput()
                }

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
              </View>

              <View style={[
                styles.modalButtons,
                isKeyboardVisible && styles.modalButtonsKeyboardVisible
              ]}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCancel}
                  disabled={isLoading}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddReading}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#667eea" />
                  ) : (
                    <Text style={styles.saveButtonText}>Add Reading</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
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
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 300,
    maxHeight: '80%',
  },
  modalContentKeyboardVisible: {
    maxHeight: '75%',
    marginBottom: 10,
    paddingBottom: 20,
  },
  modalFormContent: {
    marginBottom: 20,
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
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  modalButtonsKeyboardVisible: {
    marginTop: 15,
    paddingTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    marginHorizontal: 5,
    minHeight: 50,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowOpacity: 0.3,
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