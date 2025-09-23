import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import * as Speech from 'expo-speech';

interface HealthData {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  weight: number;
  mood: string;
  painLevel: number;
}

interface HealthcareDashboardProps {
  onNavigate: (screen: 'healthcare' | 'medications' | 'walk' | 'family') => void;
}

export default function HealthcareDashboard({ onNavigate }: HealthcareDashboardProps) {
  const [isListening, setIsListening] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState('');
  const [healthData, setHealthData] = useState<HealthData>({
    bloodPressure: '120/80',
    heartRate: 72,
    temperature: 98.6,
    weight: 150,
    mood: 'Good',
    painLevel: 2,
  });

  // Speak welcome message on load
  useEffect(() => {
    const welcomeMessage = "Welcome to your health companion. I'm here to help you track your health, medications, and activities. Just speak to me anytime!";
    Speech.speak(welcomeMessage, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.8, // Slower for elderly users
    });
  }, []);

  const handleVoiceCommand = (command: string) => {
    setLastVoiceCommand(command);
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('medication') || lowerCommand.includes('medicine')) {
      speakResponse("Let me check your medication schedule. You have 3 medications to take today.");
    } else if (lowerCommand.includes('doctor') || lowerCommand.includes('appointment')) {
      speakResponse("Your next doctor appointment is tomorrow at 2 PM with Dr. Smith.");
    } else if (lowerCommand.includes('walk') || lowerCommand.includes('exercise')) {
      speakResponse("You've walked 2,500 steps today. Would you like to go for a walk?");
    } else if (lowerCommand.includes('health') || lowerCommand.includes('how are you')) {
      speakResponse(`Your health looks good today. Blood pressure is ${healthData.bloodPressure}, heart rate is ${healthData.heartRate}.`);
    } else if (lowerCommand.includes('family') || lowerCommand.includes('call')) {
      speakResponse("I'll notify your family that you'd like to call them. They'll be in touch soon.");
    } else {
      speakResponse("I'm here to help with your health, medications, appointments, or connecting with family. What would you like to do?");
    }
  };

  const speakResponse = (text: string) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const startListening = () => {
    setIsListening(true);
    speakResponse("I'm listening. Please speak your command.");
    // In a real app, this would integrate with voice recognition
    setTimeout(() => {
      setIsListening(false);
      handleVoiceCommand("check health");
    }, 2000);
  };

  const healthCards = [
    {
      title: 'Blood Pressure',
      value: healthData.bloodPressure,
      icon: '🩸',
      color: '#ef4444',
    },
    {
      title: 'Heart Rate',
      value: `${healthData.heartRate} bpm`,
      icon: '❤️',
      color: '#f97316',
    },
    {
      title: 'Temperature',
      value: `${healthData.temperature}°F`,
      icon: '🌡️',
      color: '#eab308',
    },
    {
      title: 'Weight',
      value: `${healthData.weight} lbs`,
      icon: '⚖️',
      color: '#22c55e',
    },
    {
      title: 'Mood',
      value: healthData.mood,
      icon: '😊',
      color: '#3b82f6',
    },
    {
      title: 'Pain Level',
      value: `${healthData.painLevel}/10`,
      icon: '🤕',
      color: '#8b5cf6',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with User Profile */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>F</Text>
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Fulano</Text>
              <Text style={styles.userStatus}>Premium Member</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.searchDivider} />
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* AI Companion Section */}
        <View style={styles.aiCompanionContainer}>
          <View style={styles.aiCompanionCard}>
            <View style={styles.aiCompanionContent}>
              <Text style={styles.aiCompanionSubtitle}>Your AI Companion</Text>
              <Text style={styles.aiCompanionTitle}>Hi Fulano</Text>
              <TouchableOpacity 
                style={styles.aiCompanionButton}
                onPress={startListening}
              >
                <Text style={styles.aiCompanionButtonText}>Speak to AI</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.aiCompanionIcon}>
              <Image 
                source={require('../assets/mic-back-icon.png')} 
                style={styles.aiBackIcon}
                resizeMode="contain"
              />
              <Image 
                source={require('../assets/voice-icon.png')} 
                style={styles.aiIcon}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Vitals Section */}
        <View style={styles.vitalsSection}>
          <Text style={styles.sectionTitle}>Vitals</Text>
          <View style={styles.vitalsGrid}>
            <TouchableOpacity 
              style={styles.vitalCard}
              onPress={() => onNavigate('medications')}
            >
              <Image 
                source={require('../assets/medication-icon.png')} 
                style={styles.vitalIcon}
                resizeMode="contain"
              />
              <Text style={styles.vitalNumber}>3</Text>
              <Text style={styles.vitalLabel}>Medication</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.vitalCard}
              onPress={() => onNavigate('walk')}
            >
              <Image 
                source={require('../assets/walk-icon.png')} 
                style={styles.vitalIcon}
                resizeMode="contain"
              />
              <Text style={styles.vitalNumber}>52</Text>
              <Text style={styles.vitalLabel}>Activities</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.vitalCard}
              onPress={() => onNavigate('family')}
            >
              <Image 
                source={require('../assets/family-icon.png')} 
                style={styles.vitalIcon}
                resizeMode="contain"
              />
              <Text style={styles.vitalNumber}>1</Text>
              <Text style={styles.vitalLabel}>Connects</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Activities */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Today's Activities</Text>
          <View style={styles.activitiesList}>
            <View style={styles.activityItem}>
              <View style={styles.activityPlaceholder}>
                <Image 
                  source={require('../assets/walk-icon.png')} 
                  style={styles.activityIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>355m Distance covered</Text>
                <Text style={styles.activityTime}>1 hour ago</Text>
              </View>
              <Text style={styles.activityDuration}>1h</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityPlaceholder}>
                <Image 
                  source={require('../assets/medication-icon.png')} 
                  style={styles.activityIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Last medication taken</Text>
                <Text style={styles.activityTime}>3 hours ago</Text>
              </View>
              <Text style={styles.activityDuration}>3h</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIconActive}>●</Text>
          </View>
          <View style={styles.navIndicator} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => onNavigate('doctor')}
        >
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>○</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => onNavigate('walk')}
        >
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>○</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => onNavigate('family')}
        >
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>○</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100, // Space for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 12,
  },
  filterButton: {
    padding: 4,
  },
  filterIcon: {
    fontSize: 20,
  },
  aiCompanionContainer: {
    marginBottom: 30,
  },
  aiCompanionCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiCompanionContent: {
    flex: 1,
  },
  aiCompanionSubtitle: {
    fontSize: 14,
    color: '#C4B5FD',
    marginBottom: 4,
  },
  aiCompanionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  aiCompanionButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  aiCompanionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aiCompanionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -60 }], // Half of the 120px height to center it
  },
  aiBackIcon: {
    width: 120,
    height: 120,
    position: 'absolute',
  },
  aiIcon: {
    width: 20,
    height: 20,
    zIndex: 1,
  },
  vitalsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#03314B',
    marginBottom: 16,
  },
  vitalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  vitalIcon: {
    width: 20,
    height: 20,
    marginBottom: 8,
  },
  vitalNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#C4B5FD',
    fontWeight: '500',
  },
  activitiesSection: {
    marginBottom: 30,
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIcon: {
    width: 20,
    height: 20,
  },
  activityPlaceholderText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 34, // Account for home indicator
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 8,
  },
  navIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  navIconActive: {
    fontSize: 18,
    color: '#03314B',
    fontWeight: 'bold',
  },
  navIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#03314B',
  },
});
