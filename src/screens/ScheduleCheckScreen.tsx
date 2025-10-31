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
  completedAt?: string;
  createdAt: string;
}

const ScheduleCheckScreen: React.FC<ScheduleCheckScreenProps> = ({ onBack }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [dateTimePickerTab, setDateTimePickerTab] = useState<'date' | 'time'>('date');
  const [scheduledChecks, setScheduledChecks] = useState<ScheduledCheck[]>([
    {
      id: '1',
      title: 'Blood Pressure Check',
      date: '2024-01-15',
      time: '09:00',
      type: 'vitals',
      notes: 'Morning reading',
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Dr. Smith Appointment',
      date: '2024-01-20',
      time: '14:30',
      type: 'doctor',
      notes: 'Annual checkup',
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Medication Review',
      date: '2024-01-18',
      time: '10:00',
      type: 'medication',
      notes: 'Review with pharmacist',
      completed: true,
      completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      createdAt: new Date().toISOString(),
    },
  ]);

  const [newCheck, setNewCheck] = useState({
    title: '',
    date: '',
    time: '',
    type: 'vitals' as 'doctor' | 'medication' | 'vitals' | 'exercise',
    notes: ''
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

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

  // Auto-remove completed checks after 24 hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setScheduledChecks(prevChecks => 
        prevChecks.filter(check => {
          if (check.completed && check.completedAt) {
            const completedTime = new Date(check.completedAt);
            const hoursSinceCompletion = (now.getTime() - completedTime.getTime()) / (1000 * 60 * 60);
            return hoursSinceCompletion < 24; // Keep if less than 24 hours
          }
          return true; // Keep all non-completed checks
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    dismissKeyboard();
    setShowAddForm(false);
    setNewCheck({
      title: '',
      date: '',
      time: '',
      type: 'vitals',
      notes: ''
    });
  };

  const validateForm = (): string | null => {
    if (!newCheck.title.trim()) {
      return 'Title is required';
    }
    if (!newCheck.date) {
      return 'Date is required';
    }
    if (!newCheck.time) {
      return 'Time is required';
    }
    
    // Validate date format and ensure it's not in the past
    const selectedDateObj = new Date(newCheck.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(selectedDateObj.getTime())) {
      return 'Please select a valid date';
    }
    
    if (selectedDateObj < today) {
      return 'Date cannot be in the past';
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newCheck.time)) {
      return 'Please select a valid time';
    }
    
    return null;
  };

  const handleAddCheck = () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    const check: ScheduledCheck = {
      id: Date.now().toString(),
      title: newCheck.title.trim(),
      date: newCheck.date,
      time: newCheck.time,
      type: newCheck.type,
      notes: newCheck.notes.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setScheduledChecks([...scheduledChecks, check]);
    handleCancel();
    Alert.alert('Success', 'Check scheduled successfully!');
  };

  const toggleCompleted = (id: string) => {
    setScheduledChecks(scheduledChecks.map(check =>
      check.id === id ? { 
        ...check, 
        completed: !check.completed,
        completedAt: !check.completed ? new Date().toISOString() : undefined
      } : check
    ));
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setNewCheck({
      ...newCheck,
      date: date.toISOString().split('T')[0]
    });
    // Auto-switch to time picker after selecting date
    setDateTimePickerTab('time');
  };

  const handleTimeChange = (time: Date) => {
    setSelectedTime(time);
    const timeString = time.toTimeString().split(' ')[0].substring(0, 5);
    setNewCheck({
      ...newCheck,
      time: timeString
    });
    // Close picker after selecting time
    setShowDateTimePicker(false);
    setDateTimePickerTab('date'); // Reset to date tab for next time
  };

  const openDateTimePicker = () => {
    // If date is already selected, start with time tab, otherwise date tab
    setDateTimePickerTab(newCheck.date ? 'time' : 'date');
    setShowDateTimePicker(true);
  };

  // Combined Date & Time Picker Component with Tabs
  const renderDateTimePicker = () => (
    <Modal
      visible={showDateTimePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setShowDateTimePicker(false);
        setDateTimePickerTab('date');
      }}
    >
      <TouchableWithoutFeedback onPress={() => {
        setShowDateTimePicker(false);
        setDateTimePickerTab('date');
      }}>
        <View style={styles.pickerOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Date & Time</Text>
                <TouchableOpacity onPress={() => {
                  setShowDateTimePicker(false);
                  setDateTimePickerTab('date');
                }}>
                  <Ionicons name="close" size={24} color="#666666" />
                </TouchableOpacity>
              </View>

              {/* Tab Switcher */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    dateTimePickerTab === 'date' && styles.tabButtonActive
                  ]}
                  onPress={() => setDateTimePickerTab('date')}
                >
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={dateTimePickerTab === 'date' ? '#FFFFFF' : '#666666'} 
                  />
                  <Text style={[
                    styles.tabButtonText,
                    dateTimePickerTab === 'date' && styles.tabButtonTextActive
                  ]}>
                    Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    dateTimePickerTab === 'time' && styles.tabButtonActive
                  ]}
                  onPress={() => setDateTimePickerTab('time')}
                >
                  <Ionicons 
                    name="time-outline" 
                    size={20} 
                    color={dateTimePickerTab === 'time' ? '#FFFFFF' : '#666666'} 
                  />
                  <Text style={[
                    styles.tabButtonText,
                    dateTimePickerTab === 'time' && styles.tabButtonTextActive
                  ]}>
                    Time
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date Picker Content */}
              {dateTimePickerTab === 'date' && (
                <ScrollView style={styles.pickerContent}>
                  {Array.from({ length: 365 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.pickerOption,
                          isSelected && styles.pickerOptionSelected
                        ]}
                        onPress={() => handleDateChange(date)}
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
              )}

              {/* Time Picker Content */}
              {dateTimePickerTab === 'time' && (
                <ScrollView style={styles.pickerContent}>
                  {Array.from({ length: 24 }, (_, hour) => {
                    return Array.from({ length: 4 }, (_, minuteIndex) => {
                      const minute = minuteIndex * 15; // 0, 15, 30, 45
                      const time = new Date();
                      time.setHours(hour, minute, 0, 0);
                      const timeString = time.toTimeString().split(' ')[0].substring(0, 5);
                      const isSelected = newCheck.time === timeString;
                      
                      return (
                        <TouchableOpacity
                          key={`${hour}-${minute}`}
                          style={[
                            styles.pickerOption,
                            isSelected && styles.pickerOptionSelected
                          ]}
                          onPress={() => handleTimeChange(time)}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            isSelected && styles.pickerOptionTextSelected
                          ]}>
                            {timeString}
                          </Text>
                        </TouchableOpacity>
                      );
                    });
                  })}
                </ScrollView>
              )}

              {/* Show selected date/time summary */}
              <View style={styles.pickerSummary}>
                <Text style={styles.pickerSummaryText}>
                  Selected: {newCheck.date ? formatDate(newCheck.date) : 'No date'} at {newCheck.time || 'No time'}
                </Text>
                {(newCheck.date && newCheck.time) && (
                  <TouchableOpacity
                    style={styles.pickerDoneButton}
                    onPress={() => {
                      setShowDateTimePicker(false);
                      setDateTimePickerTab('date');
                    }}
                  >
                    <Text style={styles.pickerDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

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
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={[
              styles.modalContent,
              isKeyboardVisible && styles.modalContentKeyboardVisible
            ]}>
              <View style={styles.modalFormContent}>
                <Text style={styles.modalTitle}>Schedule New Check</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Title *</Text>
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

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Date & Time *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={openDateTimePicker}
                  >
                    <View style={styles.pickerButtonContent}>
                      <View>
                        <Text style={styles.pickerButtonText}>
                          {newCheck.date || 'Select Date'}
                        </Text>
                        <Text style={styles.pickerButtonSubText}>
                          {newCheck.time || 'Select Time'}
                        </Text>
                      </View>
                      <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
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
              </View>

              <View style={[
                styles.modalButtons,
                isKeyboardVisible && styles.modalButtonsKeyboardVisible
              ]}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleCancel}
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

        {/* Combined Date & Time Picker */}
        {renderDateTimePicker()}
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
    maxWidth: 350,
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
  pickerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  pickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerButtonSubText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#667eea',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 8,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickerSummary: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  pickerSummaryText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
    textAlign: 'center',
  },
  pickerDoneButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScheduleCheckScreen;