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
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';

interface WalkData {
  steps: number;
  distance: number; // in miles
  duration: number; // in minutes
  calories: number;
  isWalking: boolean;
  startTime?: Date;
}

interface WalkTrackerProps {
  onNavigate: (screen: 'healthcare' | 'medications' | 'walk' | 'family') => void;
}

export default function WalkTracker({ onNavigate }: WalkTrackerProps) {
  const [walkData, setWalkData] = useState<WalkData>({
    steps: 0,
    distance: 0,
    duration: 0,
    calories: 0,
    isWalking: false,
  });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  useEffect(() => {
    requestLocationPermission();
    // Load today's walk data from storage
    loadTodayWalkData();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      console.error('Error getting location permission:', error);
    }
  };

  const loadTodayWalkData = () => {
    // In a real app, this would load from AsyncStorage
    setWalkData({
      steps: 2847,
      distance: 1.2,
      duration: 18,
      calories: 95,
      isWalking: false,
    });
  };

  const startWalk = () => {
    setWalkData(prev => ({
      ...prev,
      isWalking: true,
      startTime: new Date(),
    }));
    
    Speech.speak(
      "Walk started! I'll track your steps and distance. Stay safe and enjoy your walk!",
      { rate: 0.8 }
    );
  };

  const stopWalk = () => {
    setWalkData(prev => ({
      ...prev,
      isWalking: false,
    }));
    
    Speech.speak(
      `Great walk! You completed ${walkData.steps} steps and walked ${walkData.distance} miles.`,
      { rate: 0.8 }
    );
  };

  const getWalkStatus = () => {
    if (walkData.steps >= 10000) {
      return { status: 'Excellent!', color: '#22c55e', icon: '🏆' };
    } else if (walkData.steps >= 5000) {
      return { status: 'Good!', color: '#3b82f6', icon: '👍' };
    } else if (walkData.steps >= 2500) {
      return { status: 'Getting there', color: '#f59e0b', icon: '🚶‍♂️' };
    } else {
      return { status: 'Keep moving', color: '#ef4444', icon: '💪' };
    }
  };

  const getMotivationalMessage = () => {
    const status = getWalkStatus();
    const messages = {
      'Excellent!': [
        "Amazing work! You're crushing your daily goals!",
        "Outstanding! Your health is in great shape!",
        "Fantastic! You're an inspiration to others!"
      ],
      'Good!': [
        "Great job! You're well on your way to your goal!",
        "Nice work! Keep up the momentum!",
        "Excellent progress! You're doing great!"
      ],
      'Getting there': [
        "Good start! A few more steps and you'll reach your goal!",
        "You're making progress! Keep going!",
        "Every step counts! You're doing well!"
      ],
      'Keep moving': [
        "Let's get moving! Your health is worth it!",
        "Time for a walk! Your body will thank you!",
        "Ready to start your fitness journey? Let's go!"
      ]
    };
    
    const messageArray = messages[status.status as keyof typeof messages];
    return messageArray[Math.floor(Math.random() * messageArray.length)];
  };

  const notifyFamily = () => {
    Alert.alert(
      'Notify Family',
      'Send your walk progress to your family?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            Speech.speak(
              "I've sent your walk progress to your family. They're proud of your activity!",
              { rate: 0.8 }
            );
          },
        },
      ]
    );
  };

  const walkStatus = getWalkStatus();

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
          <Text style={styles.title}>Walk Tracker 🚶‍♂️</Text>
          <Text style={styles.subtitle}>Stay active and healthy</Text>
        </View>

        {/* Walk Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: walkStatus.color }]}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>{walkStatus.icon}</Text>
            <Text style={styles.statusText}>{walkStatus.status}</Text>
          </View>
          <Text style={styles.motivationalMessage}>
            {getMotivationalMessage()}
          </Text>
        </View>

        {/* Walk Data Grid */}
        <View style={styles.dataGrid}>
          <View style={styles.dataCard}>
            <Text style={styles.dataIcon}>👣</Text>
            <Text style={styles.dataValue}>{walkData.steps.toLocaleString()}</Text>
            <Text style={styles.dataLabel}>Steps</Text>
          </View>
          <View style={styles.dataCard}>
            <Text style={styles.dataIcon}>📏</Text>
            <Text style={styles.dataValue}>{walkData.distance}</Text>
            <Text style={styles.dataLabel}>Miles</Text>
          </View>
          <View style={styles.dataCard}>
            <Text style={styles.dataIcon}>⏱️</Text>
            <Text style={styles.dataValue}>{walkData.duration}</Text>
            <Text style={styles.dataLabel}>Minutes</Text>
          </View>
          <View style={styles.dataCard}>
            <Text style={styles.dataIcon}>🔥</Text>
            <Text style={styles.dataValue}>{walkData.calories}</Text>
            <Text style={styles.dataLabel}>Calories</Text>
          </View>
        </View>

        {/* Walk Controls */}
        <View style={styles.walkControls}>
          {!walkData.isWalking ? (
            <TouchableOpacity style={styles.startButton} onPress={startWalk}>
              <Text style={styles.startButtonIcon}>🚶‍♂️</Text>
              <Text style={styles.startButtonText}>Start Walk</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopWalk}>
              <Text style={styles.stopButtonIcon}>⏹️</Text>
              <Text style={styles.stopButtonText}>Stop Walk</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Daily Goal Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min((walkData.steps / 10000) * 100, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {walkData.steps.toLocaleString()} / 10,000 steps
          </Text>
        </View>

        {/* Location Info */}
        {location && (
          <View style={styles.locationCard}>
            <Text style={styles.locationTitle}>📍 Current Location</Text>
            <Text style={styles.locationText}>
              Lat: {location.coords.latitude.toFixed(4)}
            </Text>
            <Text style={styles.locationText}>
              Lng: {location.coords.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={notifyFamily}>
            <Text style={styles.actionIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.actionText}>Notify Family</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>View History</Text>
          </TouchableOpacity>
        </View>

        {/* Voice Commands */}
        <View style={styles.voiceCommands}>
          <Text style={styles.voiceTitle}>Voice Commands</Text>
          <View style={styles.commandList}>
            <Text style={styles.commandItem}>• "Start my walk"</Text>
            <Text style={styles.commandItem}>• "How many steps today?"</Text>
            <Text style={styles.commandItem}>• "Stop walking"</Text>
            <Text style={styles.commandItem}>• "Tell family about my walk"</Text>
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
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  motivationalMessage: {
    fontSize: 16,
    color: '#64748b',
    fontStyle: 'italic',
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dataCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  dataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  dataLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  walkControls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
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
