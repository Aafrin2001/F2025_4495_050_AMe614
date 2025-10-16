import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface WalkingTrackerScreenProps {
  onBack: () => void;
  onComplete: (data: WalkingData) => void;
}

interface WalkingData {
  duration: number; // in minutes
  steps: number;
  distance: number; // in miles
  calories: number;
  completed: boolean;
}

const WalkingTrackerScreen: React.FC<WalkingTrackerScreenProps> = ({ onBack, onComplete }) => {
  const [isWalking, setIsWalking] = useState(false);
  const [walkingDuration, setWalkingDuration] = useState(0);
  const [steps, setSteps] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isWalking) {
      // Start pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Update timer and steps
      interval = setInterval(() => {
        setWalkingDuration((prev) => prev + 1);
        setSteps((prev) => prev + Math.floor(Math.random() * 3) + 1); // Simulate steps
      }, 1000);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWalking]);

  const startWalking = () => {
    setIsWalking(true);
    setStartTime(new Date());
    setWalkingDuration(0);
    setSteps(0);
  };

  const stopWalking = () => {
    setIsWalking(false);
    const distance = steps * 0.0005; // Approximate miles per step
    const calories = Math.round(steps * 0.04); // Approximate calories per step

    const walkingData: WalkingData = {
      duration: walkingDuration,
      steps: steps,
      distance: parseFloat(distance.toFixed(2)),
      calories: calories,
      completed: true,
    };

    Alert.alert(
      'Walk Complete!',
      `Great job! You walked for ${Math.floor(walkingDuration / 60)}:${(walkingDuration % 60).toString().padStart(2, '0')} minutes.\n\nSteps: ${steps}\nDistance: ${distance.toFixed(2)} miles\nCalories: ${calories}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setIsWalking(false);
            setWalkingDuration(0);
            setSteps(0);
          }
        },
        {
          text: 'Complete Activity',
          onPress: () => {
            onComplete(walkingData);
            onBack();
          }
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
        <Text style={styles.headerTitle}>Walking Tracker</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.instructionCard}>
          <Ionicons name="walk" size={48} color="#4CAF50" />
          <Text style={styles.instructionTitle}>
            {isWalking ? 'Keep Walking!' : 'Ready to Walk?'}
          </Text>
          <Text style={styles.instructionText}>
            {isWalking 
              ? 'Your walk is being tracked. Tap stop when you\'re done.'
              : 'Start your walk and we\'ll track your progress automatically.'
            }
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(walkingDuration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{steps.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(steps * 0.0005).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Miles</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(steps * 0.04)}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {!isWalking ? (
            <TouchableOpacity style={styles.startButton} onPress={startWalking}>
              <Ionicons name="play" size={32} color="#FFFFFF" />
              <Text style={styles.buttonText}>Start Walking</Text>
            </TouchableOpacity>
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={styles.stopButton} onPress={stopWalking}>
                <Ionicons name="stop" size={32} color="#FFFFFF" />
                <Text style={styles.buttonText}>Stop Walking</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {isWalking && (
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#FFD700" />
            <Text style={styles.tipText}>
              Keep your phone in your pocket or hold it steady for accurate step counting!
            </Text>
          </View>
        )}
      </View>
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
    justifyContent: 'center',
  },
  instructionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 50,
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  tipCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  tipText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
});

export default WalkingTrackerScreen;

