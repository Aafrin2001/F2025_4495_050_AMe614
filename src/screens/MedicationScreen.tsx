import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
  const [medications, setMedications] = useState<Medication[]>([]);
  const [stats, setStats] = useState<MedicationStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<MedicationScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState<MedicationInput>({
    name: '',
    dosage: '',
    type: 'pill',
    frequency: '',
    time: [], // No default time - user must add times
    instruction: '',
    doctor: '',
    pharmacy: '',
    refill_date: '',
    side_effects: '',
    is_active: true,
    is_daily: true,
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scheduleScrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    const interval = setInterval(() => {
      if (user) {
        loadTodaySchedule();
        loadStats();
      }
    }, 60 * 1000); // Refresh every minute

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      clearInterval(interval);
    };
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadMedications(), loadStats(), loadTodaySchedule()]);
    setLoading(false);
  };

  const loadMedications = async () => {
    const { success, data, error } = await MedicationService.getUserMedications();
    if (success && data) {
      setMedications(data);
    } else {
      Alert.alert('Error', error || 'Failed to load medications');
    }
  };

  const loadStats = async () => {
    const { success, data, error } = await MedicationService.getMedicationStats();
    if (success && data) {
      setStats(data);
    } else {
      Alert.alert('Error', error || 'Failed to load stats');
    }
  };

  const loadTodaySchedule = async () => {
    const { success, data, error } = await MedicationService.getTodaySchedule();
    if (success && data) {
      setTodaySchedule(data);
    } else {
      Alert.alert('Error', error || 'Failed to load today\'s schedule');
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
      time: [], // No default time - user must add times
      instruction: '',
      doctor: '',
      pharmacy: '',
      refill_date: '',
      side_effects: '',
      is_active: true,
      is_daily: true,
    });
    setFormErrors([]);
  };

  const handleAddMedication = async () => {
    // Validate form
    const validation = MedicationService.validateMedicationInput(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors([]);

    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    const medicationToSave: MedicationInput = {
      ...formData,
      time: formData.is_daily ? formData.time : [], // Clear times if PRN
      refill_date: formData.refill_date || undefined,
      instruction: formData.instruction?.trim() || undefined,
      doctor: formData.doctor?.trim() || undefined,
      pharmacy: formData.pharmacy?.trim() || undefined,
      side_effects: formData.side_effects?.trim() || undefined,
    };

    let result;
    if (editingMedication) {
      result = await MedicationService.updateMedication(editingMedication.id, medicationToSave);
    } else {
      result = await MedicationService.saveMedication(medicationToSave);
    }

    if (result.success) {
      Alert.alert('Success', `Medication ${editingMedication ? 'updated' : 'added'} successfully!`);
      setShowAddEditModal(false);
      setEditingMedication(null);
      resetForm();
      loadData();
    } else {
      Alert.alert('Error', result.error || `Failed to ${editingMedication ? 'update' : 'add'} medication.`);
    }
  };

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
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
    setFormErrors([]);
    setShowAddEditModal(true);
  };

  const handleDeleteMedication = (medicationId: string) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await MedicationService.deleteMedication(medicationId);
            if (success) {
              Alert.alert('Success', 'Medication deleted successfully!');
              loadData();
            } else {
              Alert.alert('Error', error || 'Failed to delete medication.');
            }
          },
        },
      ]
    );
  };

  const handleLogPrnUsage = (medicationId: string) => {
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
              await loadTodaySchedule();
              await loadStats();
            } else {
              Alert.alert('Error', result.error || 'Failed to log PRN usage.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const clearRefillDate = () => {
    setFormData({ ...formData, refill_date: '' });
  };

  const addTimeSlot = () => {
    // Open time picker to add a new time
    setEditingTimeIndex(null); // null means adding new time
    setShowTimePicker(true);
  };

  const removeTimeSlot = (index: number) => {
    setFormData({
      ...formData,
      time: formData.time.filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (index: number, time: string) => {
    const newTimes = [...formData.time];
    newTimes[index] = time;
    setFormData({
      ...formData,
      time: newTimes,
    });
  };

  const renderTimePicker = () => {
    return (
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={() => {
          setShowTimePicker(false);
          setEditingTimeIndex(null);
        }}
      >
      <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
        <View style={styles.pickerOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
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
                              time: [...formData.time, timeString],
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

  const renderDatePicker = () => (
    <Modal
      visible={showDatePicker}
      transparent={true}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
        <View style={styles.pickerOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Refill Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
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

  const renderMedicationCard = (medication: Medication) => (
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
            style={styles.editButton}
            onPress={() => handleEditMedication(medication)}
          >
            <Ionicons name="pencil" size={16} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMedication(medication.id)}
          >
            <Ionicons name="trash" size={16} color="#FF6B6B" />
          </TouchableOpacity>
          
          {!medication.is_daily && (
            <TouchableOpacity
              style={styles.logButton}
              onPress={() => handleLogPrnUsage(medication.id)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#2196F3" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {medication.is_daily && (
        <View style={styles.medicationTimes}>
          <Text style={styles.timesLabel}>Times:</Text>
          <View style={styles.timesContainer}>
            {medication.time.map((time, index) => (
              <View key={index} style={styles.timeChip}>
                <Text style={styles.timeChipText}>
                  {MedicationService.formatTime(time)}
                </Text>
              </View>
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
  );

  const renderScheduleItem = (item: MedicationScheduleItem) => (
    <View key={item.id} style={[styles.scheduleItem, { borderLeftColor: MedicationService.getStatusColor(item.status) }]}>
      <View style={styles.scheduleItemHeader}>
        <View style={styles.scheduleItemInfo}>
          <Text style={styles.scheduleItemName}>{item.name}</Text>
          <Text style={styles.scheduleItemDosage}>{item.dosage}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: MedicationService.getStatusColor(item.status) }]}>
          <Text style={styles.statusBadgeText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.scheduleItemDetails}>
        <Text style={styles.scheduleItemTime}>
          <Ionicons name="time-outline" size={14} color="#666666" />
          {' '}{MedicationService.formatTime(item.scheduled_time)}
        </Text>
        {item.instruction && (
          <Text style={styles.scheduleItemInstruction}>{item.instruction}</Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medications</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
          {/* Statistics Overview */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.totalMedications || 0}</Text>
                <Text style={styles.statLabel}>Total Drugs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.activeDailyMedications || 0}</Text>
                <Text style={styles.statLabel}>Daily Drugs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.activePrnMedications || 0}</Text>
                <Text style={styles.statLabel}>PRN Drugs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.totalReminders || 0}</Text>
                <Text style={styles.statLabel}>Reminders</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.overdueMedications || 0}</Text>
                <Text style={styles.statLabel}>Overdue</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.prnUsedToday || 0}</Text>
                <Text style={styles.statLabel}>PRN Used Today</Text>
              </View>
            </View>
          </View>

          {/* Today's Schedule */}
          <View style={styles.scheduleContainer}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            {todaySchedule.length === 0 ? (
              <View style={styles.emptySchedule}>
                <Ionicons name="calendar-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.emptyScheduleText}>No medications scheduled for today</Text>
              </View>
            ) : (
              <ScrollView 
                ref={scheduleScrollViewRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scheduleScrollContent}
              >
                {todaySchedule.map(renderScheduleItem)}
              </ScrollView>
            )}
          </View>

          {/* Add Medication Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setShowAddEditModal(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Medication</Text>
          </TouchableOpacity>

          {/* All Medications */}
          <View style={styles.medicationsContainer}>
            <Text style={styles.sectionTitle}>All Medications</Text>
            {medications.length === 0 ? (
              <View style={styles.emptyMedications}>
                <Ionicons name="medical-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.emptyMedicationsText}>No medications added yet</Text>
                <Text style={styles.emptyMedicationsSubtext}>Add your first medication to get started</Text>
              </View>
            ) : (
              medications.map(renderMedicationCard)
            )}
          </View>
        </ScrollView>

        {/* Add/Edit Medication Modal */}
        <Modal
          visible={showAddEditModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddEditModal(false)}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
              >
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        {editingMedication ? 'Edit Medication' : 'Add New Medication'}
                      </Text>
                      <TouchableOpacity onPress={() => setShowAddEditModal(false)}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView 
                      contentContainerStyle={styles.modalFormContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {/* Form Errors */}
                      {formErrors.length > 0 && (
                        <View style={styles.errorContainer}>
                          {formErrors.map((error, index) => (
                            <Text key={index} style={styles.errorText}>• {error}</Text>
                          ))}
                        </View>
                      )}

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Medication Name *</Text>
                        <TextInput
                          style={styles.modalInput}
                          value={formData.name}
                          onChangeText={(text) => setFormData({ ...formData, name: text })}
                          placeholder="e.g., Metformin"
                          placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Dosage *</Text>
                        <TextInput
                          style={styles.modalInput}
                          value={formData.dosage}
                          onChangeText={(text) => setFormData({ ...formData, dosage: text })}
                          placeholder="e.g., 500mg"
                          placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Type *</Text>
                        <View style={styles.typeSelector}>
                        {['pill', 'liquid', 'injection', 'cream', 'inhaler'].map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.typeOption,
                              formData.type === type && styles.typeOptionSelected
                            ]}
                            onPress={() => setFormData({ ...formData, type: type as any })}
                          >
                            <Ionicons
                              name={MedicationService.getMedicationTypeIcon(type as any) as any}
                              size={20}
                              color={formData.type === type ? '#FFFFFF' : MedicationService.getMedicationTypeColor(type as any)}
                            />
                            <Text style={[
                              styles.typeOptionText,
                              formData.type === type && styles.typeOptionTextSelected
                            ]}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        </View>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Frequency *</Text>
                        <TextInput
                          style={styles.modalInput}
                          value={formData.frequency}
                          onChangeText={(text) => setFormData({ ...formData, frequency: text })}
                          placeholder="e.g., Twice daily, Every 8 hours"
                          placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        />
                      </View>

                      {/* Daily/PRN Toggle */}
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Medication Type *</Text>
                        <View style={styles.dailyPrnSelector}>
                        <TouchableOpacity
                          style={[
                            styles.dailyPrnOption,
                            formData.is_daily && styles.dailyPrnOptionSelected
                          ]}
                          onPress={() => setFormData({ ...formData, is_daily: true })}
                        >
                          <Ionicons 
                            name="calendar-outline" 
                            size={20} 
                            color={formData.is_daily ? '#FFFFFF' : '#4CAF50'} 
                          />
                          <Text style={[
                            styles.dailyPrnOptionText,
                            formData.is_daily && styles.dailyPrnOptionTextSelected
                          ]}>
                            Daily
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.dailyPrnOption,
                            !formData.is_daily && styles.dailyPrnOptionSelected
                          ]}
                          onPress={() => setFormData({ ...formData, is_daily: false })}
                        >
                          <Ionicons 
                            name="medical-outline" 
                            size={20} 
                            color={!formData.is_daily ? '#FFFFFF' : '#FF6B6B'} 
                          />
                          <Text style={[
                            styles.dailyPrnOptionText,
                            !formData.is_daily && styles.dailyPrnOptionTextSelected
                          ]}>
                            As Needed (PRN)
                          </Text>
                        </TouchableOpacity>
                        </View>
                      </View>

                      {/* Time Selection for Daily Medications */}
                      {formData.is_daily && (
                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>Times *</Text>
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
                                
                                <TouchableOpacity
                                  style={styles.removeTimeButton}
                                  onPress={() => removeTimeSlot(index)}
                                >
                                  <Ionicons name="close" size={16} color="#FF6B6B" />
                                </TouchableOpacity>
                              </View>
                            ))}
                            
                            <TouchableOpacity
                              style={styles.addTimeButton}
                              onPress={() => {
                                setEditingTimeIndex(null);
                                setShowTimePicker(true);
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="add" size={16} color="#4CAF50" />
                              <Text style={styles.addTimeText}>Add Time</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Instructions</Text>
                        <TextInput
                          style={[styles.modalInput, styles.notesInput]}
                          value={formData.instruction}
                          onChangeText={(text) => setFormData({ ...formData, instruction: text })}
                          placeholder="Special instructions for taking this medication"
                          placeholderTextColor="rgba(255, 255, 255, 0.7)"
                          multiline
                          numberOfLines={3}
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Doctor</Text>
                        <TextInput
                          style={styles.modalInput}
                          value={formData.doctor}
                          onChangeText={(text) => setFormData({ ...formData, doctor: text })}
                          placeholder="Doctor's name"
                          placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Pharmacy</Text>
                        <TextInput
                          style={styles.modalInput}
                          value={formData.pharmacy}
                          onChangeText={(text) => setFormData({ ...formData, pharmacy: text })}
                          placeholder="Pharmacy name"
                          placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Refill Date</Text>
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
                          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
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
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Side Effects</Text>
                        <TextInput
                          style={[styles.modalInput, styles.notesInput]}
                          value={formData.side_effects}
                          onChangeText={(text) => setFormData({ ...formData, side_effects: text })}
                          placeholder="Known side effects or notes"
                          placeholderTextColor="rgba(255, 255, 255, 0.7)"
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                    </ScrollView>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => setShowAddEditModal(false)}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.saveButton]}
                        onPress={handleAddMedication}
                      >
                        <Text style={styles.saveButtonText}>
                          {editingMedication ? 'Update' : 'Add'} Medication
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Only render time/date pickers when they're visible to prevent blocking interactions */}
        {showTimePicker && renderTimePicker()}
        {showDatePicker && renderDatePicker()}
      </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    minHeight: 80,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  scheduleContainer: {
    marginBottom: 20,
  },
  scheduleScrollContent: {
    paddingRight: 20,
  },
  scheduleItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    minWidth: 200,
    borderLeftWidth: 4,
  },
  scheduleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scheduleItemInfo: {
    flex: 1,
  },
  scheduleItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  scheduleItemDosage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleItemDetails: {
    marginTop: 5,
  },
  scheduleItemTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  scheduleItemInstruction: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  emptySchedule: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
  },
  emptyScheduleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 10,
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
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  prnBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  prnBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  medicationDosage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  medicationFrequency: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  medicationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginLeft: 5,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 5,
  },
  logButton: {
    padding: 8,
    marginLeft: 5,
  },
  medicationTimes: {
    marginTop: 10,
  },
  timesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 5,
  },
  timeChipText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  medicationDetail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  emptyMedications: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
  },
  emptyMedicationsText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 10,
  },
  emptyMedicationsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
    textAlign: 'center',
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
    maxHeight: '70%',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalFormContent: {
    paddingBottom: 10,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 5,
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
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    width: '48%',
  },
  typeOptionSelected: {
    backgroundColor: '#667eea',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },
  dailyPrnSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 5,
    marginBottom: 15,
  },
  dailyPrnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  dailyPrnOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  dailyPrnOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  dailyPrnOptionTextSelected: {
    color: '#FFFFFF',
  },
  timesInputContainer: {
    marginBottom: 15,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
    marginRight: 10,
  },
  timeInputText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  removeTimeButton: {
    padding: 8,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  addTimeText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  datePickerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  datePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  clearDateButton: {
    marginLeft: 10,
    padding: 5,
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
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
  },
  saveButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    width: '100%',
    maxHeight: '70%',
    padding: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pickerContent: {
    maxHeight: 400,
  },
  pickerOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  pickerOptionTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
});

export default MedicationScreen;