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

interface StretchingScreenProps {
  onBack: () => void;
  onComplete: (data: StretchingData) => void;
}

interface StretchingData {
  exercisesCompleted: number;
  totalDuration: number; // in minutes
  completed: boolean;
}

interface StretchExercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  instructions: string[];
  icon: string;
}

const StretchingScreen: React.FC<StretchingScreenProps> = ({ onBack, onComplete }) => {
  const [isStretching, setIsStretching] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);

  const exercises: StretchExercise[] = [
    {
      id: '1',
      name: 'Neck Rolls',
      description: 'Gentle neck movements',
      duration: 30,
      instructions: [
        'Sit or stand comfortably',
        'Slowly roll your head in a circle',
        'Go clockwise for 15 seconds',
        'Then counter-clockwise for 15 seconds'
      ],
      icon: 'headset-outline'
    },
    {
      id: '2',
      name: 'Shoulder Shrugs',
      description: 'Shoulder mobility exercise',
      duration: 20,
      instructions: [
        'Keep your arms relaxed at your sides',
        'Lift your shoulders up towards your ears',
        'Hold for 2 seconds',
        'Slowly lower them down'
      ],
      icon: 'fitness-outline'
    },
    {
      id: '3',
      name: 'Arm Circles',
      description: 'Arm and shoulder flexibility',
      duration: 30,
      instructions: [
        'Extend your arms out to the sides',
        'Make small circles with your arms',
        'Go forward for 15 seconds',
        'Then backward for 15 seconds'
      ],
      icon: 'refresh-outline'
    },
    {
      id: '4',
      name: 'Back Stretch',
      description: 'Spinal flexibility',
      duration: 45,
      instructions: [
        'Sit up straight in your chair',
        'Slowly twist your torso to the right',
        'Hold for 10 seconds',
        'Repeat on the left side'
      ],
      icon: 'arrow-back-outline'
    },
    {
      id: '5',
      name: 'Leg Stretches',
      description: 'Leg and hip flexibility',
      duration: 30,
      instructions: [
        'Sit on the edge of your chair',
        'Extend one leg straight out',
        'Hold for 15 seconds',
        'Switch to the other leg'
      ],
      icon: 'walk-outline'
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isStretching && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            nextExercise();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStretching, timeRemaining]);

  const startStretching = () => {
    setIsStretching(true);
    setCurrentExercise(0);
    setTimeRemaining(exercises[0].duration);
    setCompletedExercises(0);
    setShowInstructions(true);
  };

  const nextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setTimeRemaining(exercises[currentExercise + 1].duration);
      setCompletedExercises(prev => prev + 1);
    } else {
      // All exercises completed
      setIsStretching(false);
      setCompletedExercises(prev => prev + 1);
      
      const totalDuration = exercises.reduce((acc, exercise) => acc + exercise.duration, 0) / 60; // Convert to minutes
      
      const stretchingData: StretchingData = {
        exercisesCompleted: completedExercises + 1,
        totalDuration: Math.round(totalDuration * 10) / 10,
        completed: true,
      };

      Alert.alert(
        'Stretching Complete!',
        `Great job! You completed ${completedExercises + 1} stretching exercises in ${Math.round(totalDuration * 10) / 10} minutes.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsStretching(false);
              setCurrentExercise(0);
              setTimeRemaining(0);
              setCompletedExercises(0);
            }
          },
          {
            text: 'Complete Activity',
            onPress: () => {
              onComplete(stretchingData);
              onBack();
            }
          }
        ]
      );
    }
  };

  const skipExercise = () => {
    if (currentExercise < exercises.length - 1) {
      nextExercise();
    } else {
      // Skip last exercise
      setIsStretching(false);
      const totalDuration = exercises.reduce((acc, exercise) => acc + exercise.duration, 0) / 60;
      
      const stretchingData: StretchingData = {
        exercisesCompleted: completedExercises,
        totalDuration: Math.round(totalDuration * 10) / 10,
        completed: true,
      };

      onComplete(stretchingData);
      onBack();
    }
  };

  const stopStretching = () => {
    Alert.alert(
      'Stop Stretching?',
      'Are you sure you want to stop? Your progress will be saved.',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Stop',
          onPress: () => {
            setIsStretching(false);
            const totalDuration = exercises.slice(0, currentExercise + 1).reduce((acc, exercise) => acc + exercise.duration, 0) / 60;
            
            const stretchingData: StretchingData = {
              exercisesCompleted: completedExercises,
              totalDuration: Math.round(totalDuration * 10) / 10,
              completed: true,
            };

            onComplete(stretchingData);
            onBack();
          }
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExerciseData = exercises[currentExercise];

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
        <Text style={styles.headerTitle}>Stretching</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {!isStretching ? (
          <View style={styles.startContainer}>
            <View style={styles.instructionCard}>
              <Ionicons name="fitness" size={48} color="#2196F3" />
              <Text style={styles.instructionTitle}>Ready to Stretch?</Text>
              <Text style={styles.instructionText}>
                We'll guide you through {exercises.length} gentle stretching exercises designed for seniors.
              </Text>
              <Text style={styles.durationText}>
                Total time: {Math.round(exercises.reduce((acc, ex) => acc + ex.duration, 0) / 60)} minutes
              </Text>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startStretching}>
              <Ionicons name="play" size={32} color="#FFFFFF" />
              <Text style={styles.buttonText}>Start Stretching</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.exerciseContainer}>
            <View style={styles.progressCard}>
              <Text style={styles.progressText}>
                Exercise {currentExercise + 1} of {exercises.length}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${((currentExercise + 1) / exercises.length) * 100}%` }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.exerciseCard}>
              <Ionicons name={currentExerciseData.icon as any} size={64} color="#2196F3" />
              <Text style={styles.exerciseName}>{currentExerciseData.name}</Text>
              <Text style={styles.exerciseDescription}>{currentExerciseData.description}</Text>
              
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                <Text style={styles.timerLabel}>remaining</Text>
              </View>
            </View>

            {showInstructions && (
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>Instructions:</Text>
                {currentExerciseData.instructions.map((instruction, index) => (
                  <Text key={index} style={styles.instructionItem}>
                    {index + 1}. {instruction}
                  </Text>
                ))}
                <TouchableOpacity 
                  style={styles.hideInstructionsButton}
                  onPress={() => setShowInstructions(false)}
                >
                  <Text style={styles.hideInstructionsText}>Hide Instructions</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={skipExercise}>
                <Text style={styles.skipButtonText}>Skip Exercise</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.stopButton} onPress={stopStretching}>
                <Ionicons name="stop" size={24} color="#FFFFFF" />
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: 10,
  },
  durationText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#2196F3',
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
  exerciseContainer: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
    backgroundColor: '#2196F3',
  },
  exerciseCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 10,
  },
  exerciseDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  timerLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  instructionsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
  hideInstructionsButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  hideInstructionsText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default StretchingScreen;
