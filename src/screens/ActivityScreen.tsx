import React, { useState, useEffect, useRef } from 'react';
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
import { ActivityService } from '../lib/activityService';
import { Activity, ActivitySession, ActivityStats } from '../types';
import { useActivityTracking } from '../contexts/ActivityTrackingContext';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface ActivityScreenProps {
  onBack: () => void;
  user: any;
  onNavigateToWalking?: () => void;
  onNavigateToStretching?: () => void;
  onNavigateToBreathing?: () => void;
  onNavigateToSleep?: () => void;
  onNavigateToMemoryMatch?: () => void;
  onNavigateToWordSearch?: () => void;
  onNavigateToPuzzlePieces?: () => void;
  onNavigateToNumberSequence?: () => void;
}

const ActivityScreen: React.FC<ActivityScreenProps> = ({ 
  onBack, 
  user,
  onNavigateToWalking,
  onNavigateToStretching,
  onNavigateToBreathing,
  onNavigateToSleep,
  onNavigateToMemoryMatch,
  onNavigateToWordSearch,
  onNavigateToPuzzlePieces,
  onNavigateToNumberSequence,
}) => {
  // Activity tracking context
  const { activeActivity, startActivity: startGlobalActivity, stopActivity: stopGlobalActivity, updateActivity } = useActivityTracking();
  
  // State management
  const [showAddForm, setShowAddForm] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Current activity session (for local display and sleep quality handling)
  const [currentSession, setCurrentSession] = useState<ActivitySession | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionCalories, setSessionCalories] = useState(0);
  const [sessionDistance, setSessionDistance] = useState(0);
  
  // Form state
  const [activityType, setActivityType] = useState<'walk' | 'exercise' | 'stairs_climbing' | 'sleep'>('walk');
  const [notes, setNotes] = useState('');
  const [sleepQuality, setSleepQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  
  // Sync local state with global activity context for display
  useEffect(() => {
    if (activeActivity && activeActivity.type !== 'walking_tracker') {
      setSessionDuration(activeActivity.duration);
      setSessionCalories(activeActivity.caloriesBurned);
      setSessionDistance(activeActivity.distance);
      
      // Update local session for display
      if (!currentSession || currentSession.id !== activeActivity.id) {
        setCurrentSession({
          id: activeActivity.id,
          type: activeActivity.type,
          startTime: activeActivity.startTime,
          duration: activeActivity.duration,
          caloriesBurned: activeActivity.caloriesBurned,
          distance: activeActivity.distance,
          notes: activeActivity.notes,
          isActive: true,
        });
      }
    } else if (!activeActivity && currentSession) {
      // Activity was stopped, clear local session
      resetSession();
    }
  }, [activeActivity]);
  
  // Games data
  const [games] = useState<Game[]>([
    {
      id: '1',
      name: 'Memory Match',
      description: 'Match pairs of cards to improve memory',
      icon: 'brain-outline',
      color: '#E91E63',
      difficulty: 'Easy',
    },
    {
      id: '2',
      name: 'Word Search',
      description: 'Find hidden words in a grid',
      icon: 'search-outline',
      color: '#3F51B5',
      difficulty: 'Medium',
    },
    {
      id: '3',
      name: 'Puzzle Pieces',
      description: 'Complete jigsaw puzzles',
      icon: 'extension-puzzle-outline',
      color: '#FF5722',
      difficulty: 'Easy',
    },
    {
      id: '4',
      name: 'Number Sequence',
      description: 'Complete number patterns',
      icon: 'calculator-outline',
      color: '#607D8B',
      difficulty: 'Medium',
    },
  ]);
  
  // Timer refs (kept for local display sync, but global context manages actual timer)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Load activities and stats on component mount and when user.id changes
  useEffect(() => {
    if (user?.id) {
      loadActivities();
      loadStats();
    }
  }, [user?.id]); // Reload when user.id changes (important for caregivers)

  // Keyboard visibility handling
  useEffect(() => {
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

  // Sync local display timer with global context (for UI updates)
  useEffect(() => {
    if (activeActivity && activeActivity.type !== 'walking_tracker') {
      timerRef.current = setInterval(() => {
        if (activeActivity) {
          setSessionDuration(activeActivity.duration);
          setSessionCalories(activeActivity.caloriesBurned);
          setSessionDistance(activeActivity.distance);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeActivity]);

  const loadActivities = async () => {
    try {
      // For caregivers, we need to get seniorUserId from props or user object
      const targetUserId = user?.id || undefined;
      console.log('ActivityScreen - loadActivities called with userId:', targetUserId);
      const result = await ActivityService.getUserActivities(20, targetUserId);
      console.log('ActivityScreen - loadActivities result:', { success: result.success, dataCount: result.data?.length, error: result.error });
      if (result.success && result.data) {
        setActivities(result.data);
        console.log('ActivityScreen - Activities set to state:', result.data.length, 'items');
      } else {
        console.error('Failed to load activities:', result.error);
        if (result.error?.includes('Access denied') || result.error?.includes('RLS')) {
          Alert.alert(
            'Access Denied',
            'Please ensure RLS policies for caregiver access are set up in Supabase. See caregiver_rls_policies.sql',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const loadStats = async () => {
    try {
      // For caregivers, we need to get seniorUserId from props or user object
      const targetUserId = user?.id || undefined;
      const result = await ActivityService.getUserActivityStats(targetUserId);
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        console.error('Failed to load stats:', result.error);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const startActivity = () => {
    // Start activity in global context (this will handle the timer globally)
    startGlobalActivity(activityType, notes);
    
    // Keep local session for display and sleep quality handling
    const startTime = new Date();
    const sessionId = `session_${Date.now()}`;
    
    const newSession: ActivitySession = {
      id: sessionId,
      type: activityType,
      startTime,
      duration: 0,
      caloriesBurned: 0,
      distance: 0,
      notes: notes.trim(),
      isActive: true,
    };

    setCurrentSession(newSession);
    setSessionDuration(0);
    setSessionCalories(0);
    setSessionDistance(0);
    startTimeRef.current = startTime;

    setShowAddForm(false);
    setNotes('');
  };

  const stopActivity = async () => {
    if (!currentSession && !activeActivity) return;

    const activityToStop = activeActivity || {
      id: currentSession!.id,
      type: currentSession!.type,
      startTime: currentSession!.startTime,
      duration: sessionDuration,
      caloriesBurned: sessionCalories,
      distance: sessionDistance,
      notes: currentSession!.notes,
    };

    try {
      // For sleep activities, ask for sleep quality before saving
      if (activityToStop.type === 'sleep') {
        // Show sleep quality selection alert
        Alert.alert(
          'Sleep Quality',
          'How was your sleep quality?',
          [
            { text: 'Poor', onPress: () => saveSleepActivity('poor', activityToStop) },
            { text: 'Fair', onPress: () => saveSleepActivity('fair', activityToStop) },
            { text: 'Good', onPress: () => saveSleepActivity('good', activityToStop) },
            { text: 'Excellent', onPress: () => saveSleepActivity('excellent', activityToStop) },
          ],
          { cancelable: false }
        );
      } else {
        // For non-sleep activities, save directly then stop global activity
        await saveActivityToDatabase(activityToStop);
        await stopGlobalActivity();
      }
    } catch (error) {
      console.error('Error stopping activity:', error);
      Alert.alert('Error', 'Failed to save activity');
    }
  };

  const saveSleepActivity = async (quality: 'poor' | 'fair' | 'good' | 'excellent', activity: { id: string; type: string; startTime: Date; duration: number; caloriesBurned: number; distance: number; notes?: string }) => {
    try {
      const endTime = new Date();
      
      // Save sleep activity to Supabase
      const result = await ActivityService.saveActivity({
        type: activity.type as 'sleep',
        start_time: activity.startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: activity.duration,
        calories_burned: activity.caloriesBurned,
        distance: activity.distance,
        notes: activity.notes || undefined,
        sleep_quality: quality,
      });

      if (result.success) {
        Alert.alert(
          'Sleep Activity Completed!',
          `Great! You slept for ${ActivityService.formatDuration(activity.duration)} with ${quality} quality.`,
          [{ text: 'OK' }]
        );
        
        // Refresh data
        await loadActivities();
        await loadStats();
      } else {
        Alert.alert('Error', result.error || 'Failed to save sleep activity');
      }
    } catch (error) {
      console.error('Error saving sleep activity:', error);
      Alert.alert('Error', 'Failed to save sleep activity');
    }

    // Stop global activity and reset session
    await stopGlobalActivity();
    resetSession();
  };

  const saveActivityToDatabase = async (activity?: { id: string; type: string; startTime: Date; duration: number; caloriesBurned: number; distance: number; notes?: string }) => {
    try {
      const endTime = new Date();
      const activityData = activity || {
        id: currentSession!.id,
        type: currentSession!.type,
        startTime: currentSession!.startTime,
        duration: sessionDuration,
        caloriesBurned: sessionCalories,
        distance: sessionDistance,
        notes: currentSession!.notes,
      };
      
      // Save activity to Supabase
      const result = await ActivityService.saveActivity({
        type: activityData.type as 'walk' | 'exercise' | 'stairs_climbing',
        start_time: activityData.startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: activityData.duration,
        calories_burned: activityData.caloriesBurned,
        distance: activityData.distance,
        notes: activityData.notes || undefined,
      });

      if (result.success) {
        Alert.alert(
          'Activity Completed!',
          `Great job! You burned ${activityData.caloriesBurned} calories in ${ActivityService.formatDuration(activityData.duration)}.`,
          [{ text: 'OK' }]
        );
        
        // Refresh data
        await loadActivities();
        await loadStats();
      } else {
        Alert.alert('Error', result.error || 'Failed to save activity');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', 'Failed to save activity');
    }

    // Reset session
    resetSession();
  };

  const resetSession = () => {
    setCurrentSession(null);
    setSessionDuration(0);
    setSessionCalories(0);
    setSessionDistance(0);
    setSleepQuality('good');
    startTimeRef.current = null;
  };

  const cancelActivity = async () => {
    // Stop global activity if active
    if (activeActivity) {
      await stopGlobalActivity();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setCurrentSession(null);
    setSessionDuration(0);
    setSessionCalories(0);
    setSessionDistance(0);
    setShowAddForm(false);
    setNotes('');
    startTimeRef.current = null;
  };

  const deleteActivity = async (activityId: string) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await ActivityService.deleteActivity(activityId);
            if (result.success) {
              await loadActivities();
              await loadStats();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete activity');
            }
          },
        },
      ]
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'walk': return 'walk-outline';
      case 'exercise': return 'fitness-outline';
      case 'stairs_climbing': return 'trending-up-outline';
      case 'sleep': return 'moon-outline';
      default: return 'pulse-outline';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'walk': return '#4CAF50';
      case 'exercise': return '#FF9800';
      case 'stairs_climbing': return '#9C27B0';
      case 'sleep': return '#2196F3';
      default: return '#2196F3';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleGamePress = (game: Game) => {
    switch (game.id) {
      case '1': // Memory Match
        onNavigateToMemoryMatch?.();
        break;
      case '2': // Word Search
        onNavigateToWordSearch?.();
        break;
      case '3': // Puzzle Pieces
        onNavigateToPuzzlePieces?.();
        break;
      case '4': // Number Sequence
        onNavigateToNumberSequence?.();
        break;
      default:
        Alert.alert(
          'Game Coming Soon',
          `${game.name} will be available in the next update!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Play Now', onPress: () => Alert.alert('Game Started', 'Game functionality will be implemented in the full version!') }
          ]
        );
        break;
    }
  };

  const renderGame = (game: Game) => (
    <TouchableOpacity
      key={game.id}
      style={[styles.gameCard, { borderLeftColor: game.color }]}
      onPress={() => handleGamePress(game)}
    >
      <View style={styles.gameHeader}>
        <View style={styles.gameIconContainer}>
          <Ionicons name={game.icon as any} size={24} color={game.color} />
        </View>
        <View style={styles.gameInfo}>
          <Text style={styles.gameName}>{game.name}</Text>
          <Text style={styles.gameDescription}>{game.description}</Text>
          <View style={styles.gameMeta}>
            <Text style={[styles.difficultyBadge, { backgroundColor: game.color }]}>
              {game.difficulty}
            </Text>
          </View>
        </View>
        <Ionicons name="play-circle-outline" size={24} color={game.color} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activities...</Text>
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
          <Text style={styles.headerTitle}>Activities</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats Overview */}
          {stats && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Your Activity Summary</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.totalActivities}</Text>
                  <Text style={styles.statLabel}>Total Activities</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{ActivityService.formatDuration(stats.totalDuration)}</Text>
                  <Text style={styles.statLabel}>Total Time</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.totalCaloriesBurned}</Text>
                  <Text style={styles.statLabel}>Calories Burned</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{stats.totalDistance.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Distance (km)</Text>
                </View>
              </View>
            </View>
          )}

          {/* Current Activity Session */}
          {currentSession && (
            <View style={styles.currentSessionContainer}>
              <Text style={styles.currentSessionTitle}>Current Activity</Text>
              <View style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionTypeContainer}>
                    <Ionicons 
                      name={getActivityIcon(currentSession.type)} 
                      size={24} 
                      color={getActivityColor(currentSession.type)} 
                    />
                    <Text style={styles.sessionTypeText}>
                      {currentSession.type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={stopActivity} style={styles.stopButton}>
                    <Ionicons name="stop" size={20} color="#FFFFFF" />
                    <Text style={styles.stopButtonText}>Stop</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.sessionStats}>
                  <View style={styles.sessionStat}>
                    <Text style={styles.sessionStatValue}>{ActivityService.formatDuration(sessionDuration)}</Text>
                    <Text style={styles.sessionStatLabel}>Duration</Text>
                  </View>
                  <View style={styles.sessionStat}>
                    <Text style={styles.sessionStatValue}>{sessionCalories.toFixed(1)}</Text>
                    <Text style={styles.sessionStatLabel}>Calories</Text>
                  </View>
                  <View style={styles.sessionStat}>
                    <Text style={styles.sessionStatValue}>{sessionDistance.toFixed(2)}</Text>
                    <Text style={styles.sessionStatLabel}>Distance (km)</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Add Activity Button */}
          {!currentSession && (
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Activity</Text>
            </TouchableOpacity>
          )}

          {/* Activities List */}
          <View style={styles.activitiesContainer}>
            <Text style={styles.activitiesTitle}>Recent Activities</Text>
            {activities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="fitness-outline" size={48} color="#FFFFFF" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No activities yet</Text>
                <Text style={styles.emptySubtext}>Start tracking your activities to see them here</Text>
              </View>
            ) : (
              activities.map((activity) => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <View style={styles.activityTypeContainer}>
                      <Ionicons 
                        name={getActivityIcon(activity.type)} 
                        size={20} 
                        color={getActivityColor(activity.type)} 
                      />
                      <Text style={styles.activityTypeText}>
                        {activity.type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => deleteActivity(activity.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.activityStats}>
                    <View style={styles.activityStat}>
                      <Text style={styles.activityStatValue}>{ActivityService.formatDuration(activity.duration)}</Text>
                      <Text style={styles.activityStatLabel}>Duration</Text>
                    </View>
                    <View style={styles.activityStat}>
                      <Text style={styles.activityStatValue}>{activity.calories_burned}</Text>
                      <Text style={styles.activityStatLabel}>Calories</Text>
                    </View>
                    <View style={styles.activityStat}>
                      <Text style={styles.activityStatValue}>{activity.distance.toFixed(2)}</Text>
                      <Text style={styles.activityStatLabel}>Distance (km)</Text>
                    </View>
                  </View>
                  
                  {/* Show sleep quality for sleep activities */}
                  {activity.type === 'sleep' && activity.sleep_quality && (
                    <View style={styles.sleepQualityDisplay}>
                      <Text style={styles.sleepQualityLabel}>Sleep Quality:</Text>
                      <Text style={[styles.sleepQualityValue, { color: getActivityColor(activity.type) }]}>
                        {activity.sleep_quality.charAt(0).toUpperCase() + activity.sleep_quality.slice(1)}
                      </Text>
                    </View>
                  )}
                  
                  <Text style={styles.activityDate}>{formatDate(activity.created_at)}</Text>
                  {activity.notes && (
                    <Text style={styles.activityNotes}>{activity.notes}</Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Games Section */}
          <View style={styles.gamesContainer}>
            <Text style={styles.gamesTitle}>Brain Games</Text>
            <Text style={styles.gamesSubtitle}>Keep your mind sharp with these fun games</Text>
            
            <View style={styles.gamesList}>
              {games.map(renderGame)}
            </View>
          </View>
        </ScrollView>

        {/* Add Activity Modal */}
        <Modal
          visible={showAddForm}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddForm(false)}
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
                      <Text style={styles.modalTitle}>Start New Activity</Text>
                      <TouchableOpacity onPress={() => setShowAddForm(false)}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.modalFormContent}>
                      <Text style={styles.inputLabel}>Activity Type</Text>
                      <View style={styles.activityTypeSelector}>
                        {(['walk', 'exercise', 'stairs_climbing', 'sleep'] as const).map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.activityTypeOption,
                              activityType === type && styles.activityTypeOptionSelected
                            ]}
                            onPress={() => setActivityType(type)}
                          >
                            <Ionicons 
                              name={getActivityIcon(type)} 
                              size={20} 
                              color={activityType === type ? '#FFFFFF' : getActivityColor(type)} 
                            />
                            <Text style={[
                              styles.activityTypeOptionText,
                              activityType === type && styles.activityTypeOptionTextSelected
                            ]}>
                              {type.replace('_', ' ').toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.inputLabel}>Notes (Optional)</Text>
                      <TextInput
                        style={styles.notesInput}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Add any notes about your activity..."
                        placeholderTextColor="#999999"
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity 
                        style={styles.cancelButton} 
                        onPress={() => setShowAddForm(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.startButton} 
                        onPress={startActivity}
                      >
                        <Text style={styles.startButtonText}>Start Activity</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  currentSessionContainer: {
    marginBottom: 20,
  },
  currentSessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sessionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionStat: {
    alignItems: 'center',
  },
  sessionStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  sessionStatLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activitiesContainer: {
    marginBottom: 20,
  },
  activitiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 5,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  activityStat: {
    alignItems: 'center',
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  activityStatLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  sleepQualityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  sleepQualityLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginRight: 8,
  },
  sleepQualityValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityDate: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 5,
  },
  activityNotes: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontStyle: 'italic',
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
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  activityTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  activityTypeOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityTypeOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#4CAF50',
  },
  activityTypeOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 5,
    textAlign: 'center',
  },
  activityTypeOptionTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    marginLeft: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gamesContainer: {
    marginBottom: 20,
  },
  gamesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  gamesSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 15,
  },
  gamesList: {
    gap: 15,
  },
  gameCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 15,
    borderLeftWidth: 4,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  gameDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
  },
  gameMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default ActivityScreen;
