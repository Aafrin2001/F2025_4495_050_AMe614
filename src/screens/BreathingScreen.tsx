import React, { useState, useEffect, useRef } from 'react';
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

interface BreathingScreenProps {
  onBack: () => void;
  onComplete: (data: BreathingData) => void;
}

interface BreathingData {
  cyclesCompleted: number;
  totalDuration: number; // in minutes
  completed: boolean;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'pause';

const BreathingScreen: React.FC<BreathingScreenProps> = ({ onBack, onComplete }) => {
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [totalCycles, setTotalCycles] = useState(5);
  const [phaseTime, setPhaseTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const phaseTimer = useRef<NodeJS.Timeout | null>(null);

  const phaseDurations = {
    inhale: 4, // seconds
    hold: 2,
    exhale: 4,
    pause: 1
  };

  const phaseInstructions = {
    inhale: 'Breathe in slowly through your nose',
    hold: 'Hold your breath gently',
    exhale: 'Breathe out slowly through your mouth',
    pause: 'Rest and prepare for the next breath'
  };

  useEffect(() => {
    if (isBreathing) {
      startBreathingCycle();
    } else {
      stopBreathingCycle();
    }

    return () => {
      if (phaseTimer.current) clearInterval(phaseTimer.current);
    };
  }, [isBreathing]);

  const startBreathingCycle = () => {
    setBreathPhase('inhale');
    setPhaseTime(phaseDurations.inhale);
    animateBreathing();
  };

  const animateBreathing = () => {
    if (!isBreathing) return;

    const currentPhase = breathPhase;
    const duration = phaseDurations[currentPhase] * 1000;

    // Animate the breathing circle
    if (currentPhase === 'inhale') {
      Animated.timing(breathingAnim, {
        toValue: 1.3,
        duration: duration,
        useNativeDriver: true,
      }).start();
    } else if (currentPhase === 'exhale') {
      Animated.timing(breathingAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }).start();
    }

    // Set up phase timer
    phaseTimer.current = setInterval(() => {
      setPhaseTime((prev) => {
        if (prev <= 1) {
          nextPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextPhase = () => {
    if (phaseTimer.current) clearInterval(phaseTimer.current);

    switch (breathPhase) {
      case 'inhale':
        setBreathPhase('hold');
        setPhaseTime(phaseDurations.hold);
        break;
      case 'hold':
        setBreathPhase('exhale');
        setPhaseTime(phaseDurations.exhale);
        break;
      case 'exhale':
        setBreathPhase('pause');
        setPhaseTime(phaseDurations.pause);
        break;
      case 'pause':
        setCycleCount(prev => {
          if (prev + 1 >= totalCycles) {
            completeBreathing();
            return prev;
          }
          setBreathPhase('inhale');
          setPhaseTime(phaseDurations.inhale);
          return prev + 1;
        });
        break;
    }

    // Continue animation for next phase
    setTimeout(() => {
      if (isBreathing) {
        animateBreathing();
      }
    }, 100);
  };

  const completeBreathing = () => {
    setIsBreathing(false);
    const totalDuration = (totalCycles * (phaseDurations.inhale + phaseDurations.hold + phaseDurations.exhale + phaseDurations.pause)) / 60;

    const breathingData: BreathingData = {
      cyclesCompleted: totalCycles,
      totalDuration: Math.round(totalDuration * 10) / 10,
      completed: true,
    };

    Alert.alert(
      'Breathing Complete!',
      `Excellent! You completed ${totalCycles} deep breathing cycles in ${Math.round(totalDuration * 10) / 10} minutes.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setIsBreathing(false);
            setCycleCount(0);
            setBreathPhase('inhale');
            setPhaseTime(0);
          }
        },
        {
          text: 'Complete Activity',
          onPress: () => {
            onComplete(breathingData);
            onBack();
          }
        }
      ]
    );
  };

  const stopBreathingCycle = () => {
    if (phaseTimer.current) clearInterval(phaseTimer.current);
    breathingAnim.stopAnimation();
    breathingAnim.setValue(1);
  };

  const startBreathing = () => {
    setIsBreathing(true);
    setCycleCount(0);
    setBreathPhase('inhale');
    setPhaseTime(phaseDurations.inhale);
  };

  const stopBreathing = () => {
    Alert.alert(
      'Stop Breathing Exercise?',
      'Are you sure you want to stop? Your progress will be saved.',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Stop',
          onPress: () => {
            setIsBreathing(false);
            const completedCycles = cycleCount + (breathPhase === 'pause' ? 1 : 0);
            const totalDuration = (completedCycles * (phaseDurations.inhale + phaseDurations.hold + phaseDurations.exhale + phaseDurations.pause)) / 60;

            const breathingData: BreathingData = {
              cyclesCompleted: completedCycles,
              totalDuration: Math.round(totalDuration * 10) / 10,
              completed: true,
            };

            onComplete(breathingData);
            onBack();
          }
        }
      ]
    );
  };

  const getPhaseColor = () => {
    switch (breathPhase) {
      case 'inhale': return '#4CAF50';
      case 'hold': return '#FF9800';
      case 'exhale': return '#2196F3';
      case 'pause': return '#9C27B0';
      default: return '#4CAF50';
    }
  };

  const getPhaseIcon = () => {
    switch (breathPhase) {
      case 'inhale': return 'arrow-up';
      case 'hold': return 'pause';
      case 'exhale': return 'arrow-down';
      case 'pause': return 'ellipse';
      default: return 'arrow-up';
    }
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
        <Text style={styles.headerTitle}>Deep Breathing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {!isBreathing ? (
          <View style={styles.startContainer}>
            <View style={styles.instructionCard}>
              <Ionicons name="leaf" size={48} color="#FF9800" />
              <Text style={styles.instructionTitle}>Ready to Breathe?</Text>
              <Text style={styles.instructionText}>
                Follow the guided breathing exercise to relax and reduce stress.
              </Text>
              <Text style={styles.durationText}>
                {totalCycles} cycles • {Math.round((totalCycles * 11) / 60 * 10) / 10} minutes
              </Text>
            </View>

            <View style={styles.cycleSelector}>
              <Text style={styles.cycleLabel}>Number of cycles:</Text>
              <View style={styles.cycleButtons}>
                {[3, 5, 7, 10].map((cycles) => (
                  <TouchableOpacity
                    key={cycles}
                    style={[
                      styles.cycleButton,
                      totalCycles === cycles && styles.cycleButtonSelected
                    ]}
                    onPress={() => setTotalCycles(cycles)}
                  >
                    <Text style={[
                      styles.cycleButtonText,
                      totalCycles === cycles && styles.cycleButtonTextSelected
                    ]}>
                      {cycles}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startBreathing}>
              <Ionicons name="play" size={32} color="#FFFFFF" />
              <Text style={styles.buttonText}>Start Breathing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.breathingContainer}>
            <View style={styles.progressCard}>
              <Text style={styles.progressText}>
                Cycle {cycleCount + 1} of {totalCycles}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${((cycleCount + 1) / totalCycles) * 100}%` }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.breathingCircleContainer}>
              <Animated.View 
                style={[
                  styles.breathingCircle, 
                  { 
                    transform: [{ scale: breathingAnim }],
                    borderColor: getPhaseColor()
                  }
                ]}
              >
                <Ionicons 
                  name={getPhaseIcon() as any} 
                  size={48} 
                  color={getPhaseColor()} 
                />
              </Animated.View>
            </View>

            <View style={styles.phaseInfo}>
              <Text style={[styles.phaseText, { color: getPhaseColor() }]}>
                {breathPhase.toUpperCase()}
              </Text>
              <Text style={styles.phaseInstruction}>
                {phaseInstructions[breathPhase]}
              </Text>
              <Text style={styles.phaseTimer}>{phaseTime}s</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.stopButton} onPress={stopBreathing}>
                <Ionicons name="stop" size={24} color="#FFFFFF" />
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!isBreathing && (
          <TouchableOpacity 
            style={styles.instructionsToggle}
            onPress={() => setShowInstructions(!showInstructions)}
          >
            <Text style={styles.instructionsToggleText}>
              {showInstructions ? 'Hide' : 'Show'} Instructions
            </Text>
          </TouchableOpacity>
        )}

        {showInstructions && !isBreathing && (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>How to Practice Deep Breathing:</Text>
            <Text style={styles.instructionItem}>1. Find a comfortable seated position</Text>
            <Text style={styles.instructionItem}>2. Place one hand on your chest, one on your belly</Text>
            <Text style={styles.instructionItem}>3. Breathe in slowly through your nose (4 seconds)</Text>
            <Text style={styles.instructionItem}>4. Hold your breath gently (2 seconds)</Text>
            <Text style={styles.instructionItem}>5. Breathe out slowly through your mouth (4 seconds)</Text>
            <Text style={styles.instructionItem}>6. Rest briefly before the next breath (1 second)</Text>
            <Text style={styles.instructionItem}>7. Repeat for the selected number of cycles</Text>
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
  startContainer: {
    alignItems: 'center',
  },
  instructionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
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
    marginBottom: 10,
  },
  durationText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  cycleSelector: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  cycleLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  cycleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cycleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cycleButtonSelected: {
    backgroundColor: '#FF9800',
  },
  cycleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cycleButtonTextSelected: {
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#FF9800',
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
  breathingContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  progressText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
  },
  breathingCircleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  phaseInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  phaseText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  phaseInstruction: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 10,
  },
  phaseTimer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  instructionsToggle: {
    marginTop: 20,
    alignSelf: 'center',
  },
  instructionsToggleText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  instructionItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default BreathingScreen;
