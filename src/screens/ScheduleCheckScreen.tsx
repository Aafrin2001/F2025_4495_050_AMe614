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
import DateTimePicker from '@react-native-community/datetimepicker';

interface ScheduleCheckScreenProps {
  onBack: () => void;
}

interface ScheduledCheck {
  id: string;
  title: string;
  date?: string;
  time?: string;
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
  
  // Schedule setup state (shown after check creation)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newlyCreatedCheck, setNewlyCreatedCheck] = useState<ScheduledCheck | null>(null);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
  });
  
  // Date picker state for schedule modal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
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
      type: 'vitals',
      notes: ''
    });
  };

  const validateForm = (): string | null => {
    if (!newCheck.title.trim()) {
      return 'Title is required';
    }
    return null;
  };
  
  const validateScheduleData = (): string | null => {
    const errors: string[] = [];
    
    if (!scheduleData.date) {
      errors.push('Date');
    }
    if (!scheduleData.time) {
      errors.push('Time');
    }
    
    if (errors.length > 0) {
      return `Please fill in the following required fields: ${errors.join(', ')}`;
    }
    
    // Validate date format and ensure it's not in the past
    const selectedDateObj = new Date(scheduleData.date);
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
    if (!timeRegex.test(scheduleData.time)) {
      return 'Please select a valid time';
    }
    
    return null;
  };

  const handleAddCheck = () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Missing Information', validationError);
      return;
    }

    // Create check without date/time initially
    const check: ScheduledCheck = {
      id: Date.now().toString(),
      title: newCheck.title.trim(),
      type: newCheck.type,
      notes: newCheck.notes.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Show schedule setup modal
    setNewlyCreatedCheck(check);
    setScheduleData({
      date: '',
      time: '',
    });
    setShowAddForm(false);
    setShowScheduleModal(true);
  };
  
  const handleSaveSchedule = () => {
    const validationError = validateScheduleData();
    if (validationError) {
      Alert.alert('Missing Information', validationError);
      return;
    }

    if (!newlyCreatedCheck) return;

    // Update check with date and time
    const updatedCheck: ScheduledCheck = {
      ...newlyCreatedCheck,
      date: scheduleData.date,
      time: scheduleData.time,
    };

    setScheduledChecks([...scheduledChecks, updatedCheck]);
    setShowScheduleModal(false);
    setNewlyCreatedCheck(null);
    setScheduleData({ date: '', time: '' });
    setNewCheck({
      title: '',
      type: 'vitals',
      notes: ''
    });
    Alert.alert('Success', 'Check scheduled successfully!');
  };
  
  const handleSkipSchedule = () => {
    if (!newlyCreatedCheck) return;

    // Add check without date/time
    setScheduledChecks([...scheduledChecks, newlyCreatedCheck]);
    setShowScheduleModal(false);
    setNewlyCreatedCheck(null);
    setScheduleData({ date: '', time: '' });
    setNewCheck({
      title: '',
      type: 'vitals',
      notes: ''
    });
    Alert.alert('Success', 'Check created! You can set date and time later.');
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

  const handleScheduleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      const dateString = selectedDate.toISOString().split('T')[0];
      setScheduleData({ ...scheduleData, date: dateString });
      
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const handleScheduleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      const timeString = selectedTime.toTimeString().split(' ')[0].substring(0, 5);
      setScheduleData({ ...scheduleData, time: timeString });
      
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    } else if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };
  
  const renderScheduleDatePicker = () => {
    let initialDate = new Date();
    if (scheduleData.date) {
      initialDate = new Date(scheduleData.date);
    }
    
    if (Platform.OS === 'android') {
      if (!showDatePicker) return null;
      return (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleScheduleDateChange}
          minimumDate={new Date()}
        />
      );
    }
    
    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={styles.pickerOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <Text style={styles.iosPickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, date) => {
                      if (date) {
                        setTempDate(date);
                      }
                    }}
                    minimumDate={new Date()}
                    style={styles.datePicker}
                  />
                </View>
                
                <View style={styles.pickerFooter}>
                  <TouchableOpacity
                    style={styles.pickerDoneButton}
                    onPress={() => {
                      const dateString = tempDate.toISOString().split('T')[0];
                      setScheduleData({ ...scheduleData, date: dateString });
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.pickerDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };
  
  const renderScheduleTimePicker = () => {
    let initialTime = new Date();
    if (scheduleData.time) {
      const [hours, minutes] = scheduleData.time.split(':');
      initialTime.setHours(parseInt(hours), parseInt(minutes));
    }
    
    if (Platform.OS === 'android') {
      if (!showTimePicker) return null;
      return (
        <DateTimePicker
          value={initialTime}
          mode="time"
          display="default"
          onChange={handleScheduleTimeChange}
          is24Hour={false}
        />
      );
    }
    
    return (
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
          <View style={styles.pickerOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <Text style={styles.iosPickerTitle}>Select Time</Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Ionicons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={initialTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, time) => {
                      if (time) {
                        const timeString = time.toTimeString().split(' ')[0].substring(0, 5);
                        setScheduleData({ ...scheduleData, time: timeString });
                      }
                      if (Platform.OS === 'ios') {
                        setShowTimePicker(false);
                      }
                    }}
                    is24Hour={false}
                    style={styles.datePicker}
                  />
                </View>
                
                <View style={styles.pickerFooter}>
                  <TouchableOpacity
                    style={styles.pickerDoneButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.pickerDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
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
          {check.date && check.time && (
            <Text style={styles.checkDateTime}>
              {formatDate(check.date)} at {check.time}
            </Text>
          )}
          {(!check.date || !check.time) && (
            <Text style={styles.checkDateTime}>
              Date & time not set
            </Text>
          )}
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

  // If schedule modal should be shown, render full screen schedule view instead
  if (showScheduleModal) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.scheduleScreenHeader}>
          <TouchableOpacity onPress={handleSkipSchedule} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Check Schedule</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.flex1}
        >
          <ScrollView 
            contentContainerStyle={styles.scheduleScreenContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.infoBox}>
              <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
              <Text style={styles.infoText}>
                {newlyCreatedCheck?.title}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date *</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => {
                  const initialDate = scheduleData.date 
                    ? new Date(scheduleData.date) 
                    : new Date();
                  setTempDate(initialDate);
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.datePickerButtonText}>
                  {scheduleData.date 
                    ? new Date(scheduleData.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Select date'
                  }
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Time *</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => {
                  setShowTimePicker(true);
                }}
              >
                <Text style={styles.datePickerButtonText}>
                  {scheduleData.time 
                    ? scheduleData.time
                    : 'Select time'
                  }
                </Text>
                <Ionicons name="time-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.scheduleButtons}>
              <TouchableOpacity
                style={[styles.scheduleButton, styles.skipButton]}
                onPress={handleSkipSchedule}
              >
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.scheduleButton, styles.saveScheduleButton]}
                onPress={handleSaveSchedule}
              >
                <Text style={styles.saveScheduleButtonText}>Save Schedule</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        {showDatePicker && renderScheduleDatePicker()}
        {showTimePicker && renderScheduleTimePicker()}
      </LinearGradient>
    );
  }

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
                onPress={() => {
                  // Reset form when opening modal
                  setNewCheck({
                    title: '',
                    type: 'vitals',
                    notes: ''
                  });
                  setShowAddForm(true);
                }}
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
        <Modal
          visible={showAddForm}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <TouchableWithoutFeedback onPress={handleCancel}>
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
                      <Text style={styles.modalTitle}>Schedule New Check</Text>
                      <TouchableOpacity onPress={handleCancel}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                    
                    <ScrollView 
                      style={styles.modalFormScrollView}
                      contentContainerStyle={styles.modalFormContent}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
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
                    </ScrollView>

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
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Combined Date & Time Picker */}
        {renderDateTimePicker()}
      </LinearGradient>
    </KeyboardAvoidingView>
  );

  // If schedule modal should be shown, render full screen schedule view instead
  if (showScheduleModal) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.scheduleScreenHeader}>
          <TouchableOpacity onPress={handleSkipSchedule} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Check Schedule</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.flex1}
        >
          <ScrollView 
            contentContainerStyle={styles.scheduleScreenContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.infoBox}>
              <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
              <Text style={styles.infoText}>
                {newlyCreatedCheck?.title}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date *</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => {
                  const initialDate = scheduleData.date 
                    ? new Date(scheduleData.date) 
                    : new Date();
                  setTempDate(initialDate);
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.datePickerButtonText}>
                  {scheduleData.date 
                    ? new Date(scheduleData.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Select date'
                  }
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Time *</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => {
                  setShowTimePicker(true);
                }}
              >
                <Text style={styles.datePickerButtonText}>
                  {scheduleData.time 
                    ? scheduleData.time
                    : 'Select time'
                  }
                </Text>
                <Ionicons name="time-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.scheduleButtons}>
              <TouchableOpacity
                style={[styles.scheduleButton, styles.skipButton]}
                onPress={handleSkipSchedule}
              >
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.scheduleButton, styles.saveScheduleButton]}
                onPress={handleSaveSchedule}
              >
                <Text style={styles.saveScheduleButtonText}>Save Schedule</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        {showDatePicker && renderScheduleDatePicker()}
        {showTimePicker && renderScheduleTimePicker()}
      </LinearGradient>
    );
  }

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
                onPress={() => {
                  // Reset form when opening modal
                  setNewCheck({
                    title: '',
                    type: 'vitals',
                    notes: ''
                  });
                  setShowAddForm(true);
                }}
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
        <Modal
          visible={showAddForm}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <TouchableWithoutFeedback onPress={handleCancel}>
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
                      <Text style={styles.modalTitle}>Schedule New Check</Text>
                      <TouchableOpacity onPress={handleCancel}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                    
                    <ScrollView 
                      style={styles.modalFormScrollView}
                      contentContainerStyle={styles.modalFormContent}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
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
                    </ScrollView>

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
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

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
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalContentKeyboardVisible: {
    maxHeight: '75%',
    marginBottom: 10,
    paddingBottom: 20,
  },
  modalFormScrollView: {
    flex: 1,
  },
  modalFormContent: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    minHeight: 50,
    marginTop: 8,
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
  scheduleScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  scheduleScreenContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    marginTop: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  scheduleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 15,
  },
  scheduleButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveScheduleButton: {
    backgroundColor: '#4CAF50',
  },
  saveScheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  flex1: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  iosPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 0,
    maxHeight: '80%',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  iosPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  datePickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: 200,
  },
  datePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : 'auto',
  },
  pickerFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default ScheduleCheckScreen;