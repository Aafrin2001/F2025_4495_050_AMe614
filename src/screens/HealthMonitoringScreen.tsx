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
  Modal,
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

interface VitalGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  vitals: VitalSign[];
  description: string;
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
  const [selectedGroup, setSelectedGroup] = useState<VitalGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddReading, setShowAddReading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [currentHealthSummary, setCurrentHealthSummary] = useState<HealthMetricsSummary | null>(null);
  const [groupReadings, setGroupReadings] = useState<Record<string, HealthMetricInput>>({});
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

  // Define vital groups
  const getVitalGroups = (): VitalGroup[] => {
    const bpVital = vitalSigns.find(v => v.metric_type === 'blood_pressure')!;
    const hrVital = vitalSigns.find(v => v.metric_type === 'heart_rate')!;
    const tempVital = vitalSigns.find(v => v.metric_type === 'body_temperature')!;
    const weightVital = vitalSigns.find(v => v.metric_type === 'weight')!;
    const bsVital = vitalSigns.find(v => v.metric_type === 'blood_sugar')!;
    const oxyVital = vitalSigns.find(v => v.metric_type === 'oxygen_level')!;

    return [
      {
        id: 'cardiovascular',
        name: 'Cardiovascular',
        icon: 'heart',
        color: '#FF6B6B',
        description: 'Heart and circulation metrics',
        vitals: [bpVital, hrVital],
      },
      {
        id: 'metabolic',
        name: 'Metabolic',
        icon: 'flame',
        color: '#FFEAA7',
        description: 'Weight and blood sugar',
        vitals: [weightVital, bsVital],
      },
      {
        id: 'general',
        name: 'General',
        icon: 'thermometer',
        color: '#45B7D1',
        description: 'Body temperature and oxygen level',
        vitals: [tempVital, oxyVital],
      },
    ];
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

  const handleGroupPress = (group: VitalGroup) => {
    setSelectedGroup(group);
    // Initialize readings for all vitals in the group
    const initialReadings: Record<string, HealthMetricInput> = {};
    group.vitals.forEach(vital => {
      if (vital.metric_type === 'blood_pressure') {
        initialReadings[vital.metric_type] = {
          metric_type: 'blood_pressure',
          systolic: 0,
          diastolic: 0,
          unit: vital.unit,
          notes: ''
        };
      } else {
        initialReadings[vital.metric_type] = {
          metric_type: vital.metric_type,
          value: 0,
          unit: vital.unit,
          notes: ''
        };
      }
    });
    setGroupReadings(initialReadings);
  };

  const handleCancelGroup = () => {
    dismissKeyboard();
    setSelectedGroup(null);
    setGroupReadings({});
  };

  const handleSaveGroup = async () => {
    if (!selectedGroup || !user?.id) return;

    dismissKeyboard();
    setIsLoading(true);
    
    try {
      const savePromises = Object.entries(groupReadings).map(([metricType, reading]) => {
        return healthMetricsService.saveMetric(user.id, reading);
      });

      const results = await Promise.all(savePromises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        Alert.alert('Error', `Failed to save some readings: ${errors[0].error?.message || 'Unknown error'}`);
      } else {
        Alert.alert('Success', `${selectedGroup.name} readings saved successfully!`);
        handleCancelGroup();
        loadLatestMetrics();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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

  const renderVitalGroupCard = (group: VitalGroup) => (
    <TouchableOpacity
      key={group.id}
      style={[
        styles.groupCard, 
        { borderLeftColor: group.color },
        selectedGroup?.id === group.id && styles.groupCardSelected
      ]}
      onPress={() => handleGroupPress(group)}
    >
      <View style={styles.groupHeader}>
        <Ionicons name={group.icon as any} size={28} color={group.color} />
        <View style={styles.groupTitleContainer}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupDescription}>{group.description}</Text>
        </View>
      </View>
      <View style={styles.groupVitalsContainer}>
        {group.vitals.map((vital, index) => (
          <View key={vital.id} style={styles.groupVitalItem}>
            <View style={styles.groupVitalHeader}>
              <Ionicons name={vital.icon as any} size={16} color={vital.color} />
              <Text style={styles.groupVitalName}>{vital.name}</Text>
            </View>
            <View style={styles.groupVitalValue}>
              <Text style={styles.groupVitalNumber}>{vital.value}</Text>
              <Text style={styles.groupVitalUnit}>{vital.unit}</Text>
            </View>
            {vital.lastUpdated && (
              <Text style={styles.groupVitalLastUpdated}>
                Updated: {vital.lastUpdated}
              </Text>
            )}
            {!vital.lastUpdated && vital.value !== '--' && vital.value !== '--/--' && (
              <Text style={styles.groupVitalLastUpdated}>
                No date recorded
              </Text>
            )}
            {index < group.vitals.length - 1 && <View style={styles.groupVitalDivider} />}
          </View>
        ))}
      </View>
      <Text style={styles.groupTapHint}>Tap to record all {group.name.toLowerCase()} readings</Text>
    </TouchableOpacity>
  );

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
            <Text style={styles.sectionSubtitle}>Tap a group to record all readings together</Text>
            
            <View style={styles.groupsContainer}>
              {getVitalGroups().map(renderVitalGroupCard)}
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
          <Modal
            visible={!!selectedVital}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCancel}
          >
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={styles.modalContainer}
                >
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={[
                      styles.modalContent,
                      isKeyboardVisible && styles.modalContentKeyboardVisible
                    ]}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                          Record {selectedVital.name}
                        </Text>
                        <TouchableOpacity onPress={handleCancel}>
                          <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.modalFormContent}>
                
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
                  </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {/* Group Input Modal */}
        {selectedGroup && (
          <Modal
            visible={!!selectedGroup}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCancelGroup}
          >
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={styles.modalContainer}
                >
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={[
                      styles.modalContent,
                      isKeyboardVisible && styles.modalContentKeyboardVisible
                    ]}>
                      <View style={styles.modalHeader}>
                        <View style={styles.modalTitleContainer}>
                          <Text style={styles.modalTitle}>
                            Record {selectedGroup.name} Readings
                          </Text>
                          <Text style={styles.modalSubtitle}>
                            Fill in all {selectedGroup.vitals.length} reading{selectedGroup.vitals.length > 1 ? 's' : ''}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={handleCancelGroup}>
                          <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                      <ScrollView 
                        style={styles.modalFormContent} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 10 }}
                      >
                        {selectedGroup.vitals.map((vital, index) => {
                          const reading = groupReadings[vital.metric_type];
                          return (
                            <View key={vital.id} style={styles.groupInputSection}>
                              <View style={styles.groupInputHeader}>
                                <Ionicons name={vital.icon as any} size={20} color={vital.color} />
                                <Text style={styles.groupInputTitle}>{vital.name}</Text>
                              </View>
                              
                              {vital.metric_type === 'blood_pressure' ? (
                                <View>
                                  <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Systolic (Top Number)</Text>
                                    <TextInput
                                      style={styles.modalInput}
                                      value={reading?.systolic?.toString() || ''}
                                      onChangeText={(text) => setGroupReadings({
                                        ...groupReadings,
                                        [vital.metric_type]: {
                                          ...reading,
                                          metric_type: 'blood_pressure',
                                          systolic: parseInt(text) || 0,
                                          diastolic: reading?.diastolic || 0,
                                          unit: vital.unit,
                                          notes: reading?.notes || ''
                                        }
                                      })}
                                      placeholder="120"
                                      placeholderTextColor="rgba(255, 255, 255, 0.7)"
                                      keyboardType="numeric"
                                    />
                                  </View>
                                  <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Diastolic (Bottom Number)</Text>
                                    <TextInput
                                      style={styles.modalInput}
                                      value={reading?.diastolic?.toString() || ''}
                                      onChangeText={(text) => setGroupReadings({
                                        ...groupReadings,
                                        [vital.metric_type]: {
                                          ...reading,
                                          metric_type: 'blood_pressure',
                                          systolic: reading?.systolic || 0,
                                          diastolic: parseInt(text) || 0,
                                          unit: vital.unit,
                                          notes: reading?.notes || ''
                                        }
                                      })}
                                      placeholder="80"
                                      placeholderTextColor="rgba(255, 255, 255, 0.7)"
                                      keyboardType="numeric"
                                    />
                                  </View>
                                </View>
                              ) : (
                                <View style={styles.formGroup}>
                                  <Text style={styles.formLabel}>{vital.name} ({vital.unit})</Text>
                                  <TextInput
                                    style={styles.modalInput}
                                    value={reading?.value?.toString() || ''}
                                    onChangeText={(text) => setGroupReadings({
                                      ...groupReadings,
                                      [vital.metric_type]: {
                                        ...reading,
                                        metric_type: vital.metric_type,
                                        value: parseFloat(text) || 0,
                                        unit: vital.unit,
                                        notes: reading?.notes || ''
                                      }
                                    })}
                                    placeholder={`Enter ${vital.name.toLowerCase()}`}
                                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                                    keyboardType="decimal-pad"
                                  />
                                </View>
                              )}
                              
                              {index < selectedGroup.vitals.length - 1 && (
                                <View style={styles.groupInputDivider} />
                              )}
                            </View>
                          );
                        })}

                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>Notes (Optional)</Text>
                          <TextInput
                            style={[styles.modalInput, styles.notesInput]}
                            value={groupReadings[selectedGroup.vitals[0]?.metric_type]?.notes || ''}
                            onChangeText={(text) => {
                              // Update notes for all readings in the group
                              const updatedReadings = { ...groupReadings };
                              Object.keys(updatedReadings).forEach(key => {
                                updatedReadings[key] = {
                                  ...updatedReadings[key],
                                  notes: text
                                };
                              });
                              setGroupReadings(updatedReadings);
                            }}
                            placeholder="Add any notes for all readings..."
                            placeholderTextColor="rgba(255, 255, 255, 0.7)"
                            multiline
                            numberOfLines={3}
                          />
                        </View>
                      </ScrollView>

                      <View style={[
                        styles.modalButtons,
                        isKeyboardVisible && styles.modalButtonsKeyboardVisible
                      ]}>
                        <TouchableOpacity
                          style={styles.modalButton}
                          onPress={handleCancelGroup}
                          disabled={isLoading}
                        >
                          <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.saveButton]}
                          onPress={handleSaveGroup}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color="#667eea" />
                          ) : (
                            <Text style={styles.saveButtonText}>Save All</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {/* Add Reading Modal */}
        {showAddReading && (
          <Modal
            visible={showAddReading}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowAddReading(false)}
          >
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={styles.modalContainer}
                >
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={[
                      styles.modalContent,
                      isKeyboardVisible && styles.modalContentKeyboardVisible
                    ]}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Reading</Text>
                        <TouchableOpacity onPress={() => setShowAddReading(false)}>
                          <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.modalFormContent}>
                
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
                          onPress={() => setShowAddReading(false)}
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
                  </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
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
  groupsContainer: {
    gap: 15,
  },
  groupCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    marginBottom: 15,
  },
  groupCardSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  groupTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  groupDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  groupVitalsContainer: {
    marginTop: 10,
  },
  groupVitalItem: {
    marginVertical: 4,
  },
  groupVitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupVitalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  groupVitalValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 24,
  },
  groupVitalNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  groupVitalUnit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  groupVitalLastUpdated: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 24,
    marginTop: 4,
  },
  groupVitalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 6,
    marginLeft: 24,
  },
  groupTapHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
  },
  modalContentKeyboardVisible: {
    maxHeight: '90%',
    marginBottom: 10,
    paddingBottom: 20,
  },
  modalFormContent: {
    marginBottom: 15,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  groupInputSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupInputTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  groupInputDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 12,
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
    marginBottom: 12,
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