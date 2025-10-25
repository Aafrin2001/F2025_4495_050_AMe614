import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { MedicationService } from '../lib/medicationService';
import { Medication, MedicationInput, MedicationScheduleItem, MedicationStats } from '../types';

interface MedicationScreenProps {
  onBack: () => void;
  user: any;
}

const MedicationScreen: React.FC<MedicationScreenProps> = ({ onBack, user }) => {
  // State management
  const [medications, setMedications] = useState<Medication[]>([]);
  const [stats, setStats] = useState<MedicationStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<MedicationScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<MedicationInput>({
    name: '',
    dosage: '',
    type: 'pill',
    frequency: '',
    time: ['09:00'],
    instruction: '',
    doctor: '',
    pharmacy: '',
    refill_date: '',
    side_effects: '',
    is_active: true,
    is_daily: true,
  });
  
  // Picker states
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Loading timeout')), 10000)
        );
        
        await Promise.race([
          Promise.all([
            loadMedications(),
            loadTodaySchedule(),
            loadStats()
          ]),
          timeoutPromise
        ]);
      } catch (error) {
        console.error('Error loading medication data:', error);
        // Set default values on error
        setMedications([]);
        setStats(null);
        setTodaySchedule([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const loadMedications = async () => {
    try {
      const { success, data, error } = await MedicationService.getUserMedications();
      if (success && data) {
        setMedications(data);
      } else {
        console.error('Failed to load medications:', error);
        setMedications([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error loading medications:', error);
      setMedications([]);
    }
  };

  const loadStats = async () => {
    try {
      const { success, data, error } = await MedicationService.getMedicationStats();
      if (success && data) {
        setStats(data);
      } else {
        console.error('Failed to load stats:', error);
        setStats(null); // Set null on error
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(null);
    }
  };

  const loadTodaySchedule = async () => {
    try {
      const { success, data, error } = await MedicationService.getTodaySchedule();
      if (success && data) {
        setTodaySchedule(data);
      } else {
        console.error('Failed to load today\'s schedule:', error);
        setTodaySchedule([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error loading today\'s schedule:', error);
      setTodaySchedule([]);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      type: 'pill',
      frequency: '',
      time: ['09:00'],
      instruction: '',
      doctor: '',
      pharmacy: '',
      refill_date: '',
      side_effects: '',
      is_active: true,
      is_daily: true,
    });
  };

  const handleAddMedication = async () => {
    const validation = MedicationService.validateMedicationInput(formData);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    try {
      const result = await MedicationService.saveMedication(formData);
      if (result.success) {
    Alert.alert('Success', 'Medication added successfully!');
        setShowAddForm(false);
        resetForm();
        loadMedications();
        loadStats();
        loadTodaySchedule();
      } else {
        Alert.alert('Error', result.error || 'Failed to add medication');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleEditMedication = (medication: Medication) => {
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      type: medication.type,
      frequency: medication.frequency,
      time: medication.time,
      instruction: medication.instruction || '',
      doctor: medication.doctor || '',
      pharmacy: medication.pharmacy || '',
      refill_date: medication.refill_date || '',
      side_effects: medication.side_effects || '',
      is_active: medication.is_active,
      is_daily: medication.is_daily,
    });
    setShowAddForm(true);
  };

  const handleDeleteMedication = async (medicationId: string) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await MedicationService.deleteMedication(medicationId);
            if (result.success) {
              Alert.alert('Success', 'Medication deleted successfully!');
              loadMedications();
              loadStats();
              loadTodaySchedule();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  const handleLogPrnUsage = async (medicationId: string) => {
    Alert.prompt(
      'Log PRN Usage',
      'Add notes about taking this medication (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Usage',
          onPress: async (notes: string | undefined) => {
            const result = await MedicationService.logPrnUsage(medicationId, notes);
            if (result.success) {
              Alert.alert('Success', 'PRN usage logged successfully!');
              loadTodaySchedule();
              loadStats();
            } else {
              Alert.alert('Error', result.error || 'Failed to log PRN usage');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const updateTimeSlot = (index: number, time: string) => {
    const newTimes = [...formData.time];
    newTimes[index] = time;
    setFormData({
      ...formData,
      time: newTimes,
    });
  };

  const removeTimeSlot = (index: number) => {
    if (formData.time.length > 1) {
      setFormData({
        ...formData,
        time: formData.time.filter((_, i) => i !== index),
      });
    }
  };

  const clearRefillDate = () => {
    setFormData({ ...formData, refill_date: '' });
  };

  // Time Picker Component
  const renderTimePicker = () => {
    if (!showTimePicker) return null;
    
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowTimePicker(false);
          setEditingTimeIndex(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowTimePicker(false);
          setEditingTimeIndex(null);
        }}>
          <View style={styles.pickerOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>
                    {editingTimeIndex !== null ? 'Edit Time' : 'Add New Time'}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setShowTimePicker(false);
                    setEditingTimeIndex(null);
                  }}>
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.pickerContent}>
                  {Array.from({ length: 24 }, (_, hour) => {
                    return Array.from({ length: 4 }, (_, minuteIndex) => {
                      const minute = minuteIndex * 15; // 0, 15, 30, 45
                      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      const isSelected = editingTimeIndex !== null && formData.time[editingTimeIndex] === timeString;
                      
                      return (
    <TouchableOpacity
                          key={timeString}
                          style={[
                            styles.pickerOption,
                            isSelected && styles.pickerOptionSelected
                          ]}
                          onPress={() => {
                            if (editingTimeIndex !== null) {
                              // Editing existing time
                              updateTimeSlot(editingTimeIndex, timeString);
                            } else {
                              // Adding new time
                              setFormData({
                                ...formData,
                                time: [...formData.time, timeString]
                              });
                            }
                            setShowTimePicker(false);
                            setEditingTimeIndex(null);
                          }}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            isSelected && styles.pickerOptionTextSelected
                          ]}>
                            {MedicationService.formatTime(timeString)}
                          </Text>
                        </TouchableOpacity>
                      );
                    });
                  })}
                </ScrollView>
        </View>
            </TouchableWithoutFeedback>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Date Picker Component
  const renderDatePicker = () => {
    if (!showDatePicker) return null;
    
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={styles.pickerOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Refill Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.pickerContent}>
                  {Array.from({ length: 365 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dateString = date.toISOString().split('T')[0];
                    const isSelected = formData.refill_date === dateString;
                    
                    return (
          <TouchableOpacity
                        key={dateString}
                        style={[
                          styles.pickerOption,
                          isSelected && styles.pickerOptionSelected
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, refill_date: dateString });
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          isSelected && styles.pickerOptionTextSelected
                        ]}>
                          {date.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Text>
          </TouchableOpacity>
                    );
                  })}
                </ScrollView>
        </View>
            </TouchableWithoutFeedback>
      </View>
        </TouchableWithoutFeedback>
      </Modal>
  );
  };

  if (loading) {
  return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>Medications</Text>
        <View style={styles.headerSpacer} />
      </View>

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {/* Statistics Overview */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Medication Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.totalMedications || 0}</Text>
                <Text style={styles.statLabel}>Total Medications</Text>
            </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.activeDailyMedications || 0}</Text>
                <Text style={styles.statLabel}>Daily Medications</Text>
            </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.activePrnMedications || 0}</Text>
                <Text style={styles.statLabel}>PRN Medications</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.totalReminders || 0}</Text>
                <Text style={styles.statLabel}>Total Reminders</Text>
            </View>
          </View>
        </View>

          {/* Today's Schedule */}
          <View style={styles.scheduleContainer}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            {todaySchedule.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#FFFFFF" />
                <Text style={styles.emptyText}>No medications scheduled for today</Text>
              </View>
            ) : (
              todaySchedule.map((item) => (
                <View key={item.id} style={styles.scheduleItem}>
                  <View style={styles.scheduleHeader}>
                    <Ionicons 
                      name={MedicationService.getMedicationTypeIcon(item.type) as any} 
                      size={20} 
                      color={MedicationService.getMedicationTypeColor(item.type)} 
                    />
                    <Text style={styles.scheduleName}>{item.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: MedicationService.getStatusColor(item.status) }
                    ]}>
                      <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.scheduleDetails}>
                    {item.dosage} • {item.scheduled_time} • {item.type}
                  </Text>
                  {item.instruction && (
                    <Text style={styles.scheduleInstruction}>{item.instruction}</Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Add Medication Button */}
            <TouchableOpacity
              style={styles.addButton}
            onPress={() => setShowAddForm(true)}
            >
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Medication</Text>
            </TouchableOpacity>

          {/* Medications List */}
          <View style={styles.medicationsContainer}>
            <Text style={styles.sectionTitle}>All Medications</Text>
            {medications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="medical-outline" size={48} color="#FFFFFF" />
                <Text style={styles.emptyText}>No medications added yet</Text>
                <Text style={styles.emptySubtext}>Add your first medication to get started</Text>
          </View>
            ) : (
              medications.map((medication) => (
                <View key={medication.id} style={styles.medicationCard}>
                  <View style={styles.medicationHeader}>
                    <View style={styles.medicationInfo}>
                      <View style={styles.medicationTypeContainer}>
                        <Ionicons 
                          name={MedicationService.getMedicationTypeIcon(medication.type) as any} 
                          size={20} 
                          color={MedicationService.getMedicationTypeColor(medication.type)} 
                        />
                        <Text style={styles.medicationName}>{medication.name}</Text>
                        {!medication.is_daily && (
                          <View style={styles.prnBadge}>
                            <Text style={styles.prnBadgeText}>PRN</Text>
        </View>
                        )}
                  </View>
                      <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                      <Text style={styles.medicationFrequency}>{medication.frequency}</Text>
                  </View>
                    <View style={styles.medicationActions}>
                  <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditMedication(medication)}
                      >
                        <Ionicons name="create-outline" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteMedication(medication.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                      </TouchableOpacity>
                      {!medication.is_daily && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleLogPrnUsage(medication.id)}
                        >
                          <Ionicons name="checkmark-outline" size={16} color="#2196F3" />
                        </TouchableOpacity>
                      )}
                </View>
          </View>
                  
                  {medication.is_daily && medication.time.length > 0 && (
                    <View style={styles.medicationTimes}>
                      <Text style={styles.medicationTimesLabel}>Times:</Text>
                      <View style={styles.medicationTimesList}>
                        {medication.time.map((time, index) => (
                          <Text key={index} style={styles.medicationTime}>
                            {MedicationService.formatTime(time)}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {medication.instruction && (
                    <Text style={styles.medicationDetail}>Instructions: {medication.instruction}</Text>
                  )}
                  
                  {medication.doctor && (
                    <Text style={styles.medicationDetail}>Doctor: {medication.doctor}</Text>
                  )}
                  
                  {medication.refill_date && (
                    <Text style={styles.medicationDetail}>
                      Refill Date: {new Date(medication.refill_date).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))
            )}
        </View>
      </ScrollView>

        {/* Add/Edit Medication Modal */}
        <Modal
          visible={showAddForm}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddForm(false)}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {
              Keyboard.dismiss();
              setShowAddForm(false);
            }}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Medication</Text>
                  <TouchableOpacity onPress={() => setShowAddForm(false)}>
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  contentContainerStyle={styles.modalFormContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                  scrollEventThrottle={16}
                >
                      <Text style={styles.inputLabel}>Medication Name *</Text>
                <TextInput
                        style={styles.textInput}
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        placeholder="e.g., Metformin"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      />

                      <Text style={styles.inputLabel}>Dosage *</Text>
                  <TextInput
                        style={styles.textInput}
                        value={formData.dosage}
                        onChangeText={(text) => setFormData({ ...formData, dosage: text })}
                        placeholder="e.g., 500mg"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      />

                      <Text style={styles.inputLabel}>Type *</Text>
                      <View style={styles.typeSelectorContainer}>
                        <View style={styles.typeSelector}>
                          {['pill', 'liquid', 'injection', 'cream', 'inhaler'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                                styles.typeOption,
                                formData.type === type && styles.typeOptionSelected
                              ]}
                              onPress={() => setFormData({ ...formData, type: type as any })}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={MedicationService.getMedicationTypeIcon(type as any) as any}
                                size={20}
                                color={formData.type === type ? '#FFFFFF' : MedicationService.getMedicationTypeColor(type as any)}
                              />
                              <Text 
                                style={[
                                  styles.typeOptionText,
                                  formData.type === type && styles.typeOptionTextSelected
                                ]}
                                numberOfLines={2}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>

                      <Text style={[styles.inputLabel, styles.frequencyLabel]}>Frequency *</Text>
                  <TextInput
                        style={styles.textInput}
                        value={formData.frequency}
                        onChangeText={(text) => setFormData({ ...formData, frequency: text })}
                        placeholder="e.g., twice daily"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      />

                      {/* Daily/PRN Toggle */}
                      <Text style={styles.inputLabel}>Medication Type *</Text>
                      <View style={styles.medicationTypeSelector}>
                        <TouchableOpacity
                          style={[
                            styles.medicationTypeOption,
                            formData.is_daily && styles.medicationTypeOptionSelected
                          ]}
                          onPress={() => setFormData({ ...formData, is_daily: true })}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name="calendar-outline" 
                            size={20} 
                            color={formData.is_daily ? '#FFFFFF' : '#4CAF50'} 
                          />
                          <Text style={[
                            styles.medicationTypeOptionText,
                            formData.is_daily && styles.medicationTypeOptionTextSelected
                          ]}>
                            Daily
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.medicationTypeOption,
                            !formData.is_daily && styles.medicationTypeOptionSelected
                          ]}
                          onPress={() => setFormData({ ...formData, is_daily: false })}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name="medical-outline" 
                            size={20} 
                            color={!formData.is_daily ? '#FFFFFF' : '#FF6B6B'} 
                          />
                          <Text style={[
                            styles.medicationTypeOptionText,
                            !formData.is_daily && styles.medicationTypeOptionTextSelected
                          ]}>
                            PRN (As Needed)
                          </Text>
                        </TouchableOpacity>
                </View>

                      {/* Times Section - Only for Daily Medications */}
                      {formData.is_daily && (
                        <>
                          <Text style={styles.inputLabel}>Times *</Text>
                          <View style={styles.timesInputContainer}>
                            {formData.time.map((time, index) => (
                              <View key={index} style={styles.timeInputRow}>
                                <TouchableOpacity
                                  style={styles.timeInputButton}
                                  onPress={() => {
                                    setEditingTimeIndex(index);
                                    setShowTimePicker(true);
                                  }}
                                >
                                  <Text style={styles.timeInputText}>
                                    {MedicationService.formatTime(time)}
                                  </Text>
                                  <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                                
                                {formData.time.length > 1 && (
                                  <TouchableOpacity
                                    style={styles.removeTimeButton}
                                    onPress={() => removeTimeSlot(index)}
                                  >
                                    <Ionicons name="close" size={16} color="#FF6B6B" />
                                  </TouchableOpacity>
                                )}
              </View>
                            ))}
                            
                            <TouchableOpacity
                              style={styles.addTimeButton}
                              onPress={() => {
                                setEditingTimeIndex(null);
                                setShowTimePicker(true);
                              }}
                            >
                              <Ionicons name="add" size={16} color="#4CAF50" />
                              <Text style={styles.addTimeText}>Add Time</Text>
                            </TouchableOpacity>
              </View>
                        </>
                      )}

                      <Text style={styles.inputLabel}>Instructions</Text>
                  <TextInput
                        style={[styles.textInput, styles.multilineInput]}
                        value={formData.instruction}
                        onChangeText={(text) => setFormData({ ...formData, instruction: text })}
                        placeholder="Special instructions"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  multiline
                        numberOfLines={2}
                />

                      <Text style={styles.inputLabel}>Doctor</Text>
                <TextInput
                        style={styles.textInput}
                        value={formData.doctor}
                        onChangeText={(text) => setFormData({ ...formData, doctor: text })}
                        placeholder="Doctor's name"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      />

                      <Text style={styles.inputLabel}>Pharmacy</Text>
                <TextInput
                        style={styles.textInput}
                        value={formData.pharmacy}
                        onChangeText={(text) => setFormData({ ...formData, pharmacy: text })}
                        placeholder="Pharmacy name"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      />

                      <Text style={styles.inputLabel}>Refill Date</Text>
                      <View style={styles.datePickerContainer}>
                <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => setShowDatePicker(true)}
                        >
                          <Text style={styles.datePickerButtonText}>
                            {formData.refill_date 
                              ? new Date(formData.refill_date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Select refill date (optional)'
                            }
                          </Text>
                          <Ionicons name="calendar-outline" size={20} color="#666666" />
                </TouchableOpacity>
                        {formData.refill_date && (
                <TouchableOpacity
                            style={styles.clearDateButton}
                            onPress={clearRefillDate}
                >
                            <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                </TouchableOpacity>
                        )}
              </View>

                      <Text style={styles.inputLabel}>Side Effects</Text>
                      <TextInput
                        style={[styles.textInput, styles.multilineInput]}
                        value={formData.side_effects}
                        onChangeText={(text) => setFormData({ ...formData, side_effects: text })}
                        placeholder="Known side effects"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        multiline
                        numberOfLines={2}
                      />
                </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                    style={styles.cancelButton} 
                    onPress={() => setShowAddForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddMedication}
                >
                    <Text style={styles.saveButtonText}>Save Medication</Text>
                </TouchableOpacity>
              </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Render Pickers */}
        {renderTimePicker()}
        {renderDatePicker()}
    </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'transparent',
  },
  backButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  headerSpacer: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  scheduleContainer: {
    marginBottom: 20,
  },
  scheduleItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  scheduleInstruction: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  medicationsContainer: {
    marginBottom: 20,
  },
  medicationCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  prnBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  prnBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  medicationDosage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  medicationFrequency: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  medicationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  medicationTimes: {
    marginBottom: 10,
  },
  medicationTimesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  medicationTimesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  medicationTime: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  medicationDetail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '85%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalFormContent: {
    paddingVertical: 8,
    paddingBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 20,
  },
  frequencyLabel: {
    marginTop: 36,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
    width: '100%',
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  typeSelectorContainer: {
    width: '100%',
    marginBottom: 32,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
    paddingBottom: 8,
  },
  typeOption: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '18%',
    minWidth: 70,
    maxWidth: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  typeOptionSelected: {
    backgroundColor: '#667eea',
  },
  typeOptionText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 12,
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },
  medicationTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  medicationTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  medicationTypeOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  medicationTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
    textAlign: 'center',
  },
  medicationTypeOptionTextSelected: {
    color: '#FFFFFF',
  },
  timesInputContainer: {
    gap: 12,
    marginBottom: 16,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  timeInputText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  removeTimeButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 10,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  addTimeText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 1,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  clearDateButton: {
    marginLeft: 10,
    padding: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 24,
    paddingHorizontal: 0,
    marginTop: 24,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '60%',
    minHeight: 300,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  pickerContent: {
    maxHeight: 250,
    backgroundColor: '#FFFFFF',
  },
  pickerOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  pickerOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '400',
  },
  pickerOptionTextSelected: {
    color: '#1976D2',
    fontWeight: '600',
  },
});

export default MedicationScreen;
