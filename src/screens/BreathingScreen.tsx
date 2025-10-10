import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface ActivitiesScreenProps {
  onBack: () => void;
  onNavigateToWalking: () => void;
  onNavigateToStretching: () => void;
  onNavigateToBreathing: () => void;
  onNavigateToSleep: () => void;
  onNavigateToMemoryMatch: () => void;
  onNavigateToWordSearch: () => void;
  onNavigateToPuzzlePieces: () => void;
  onNavigateToNumberSequence: () => void;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  duration: number; // in minutes
  completed: boolean;
  points: number;
}

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const ActivitiesScreen: React.FC<ActivitiesScreenProps> = ({ 
  onBack, 
  onNavigateToWalking, 
  onNavigateToStretching, 
  onNavigateToBreathing, 
  onNavigateToSleep,
  onNavigateToMemoryMatch,
  onNavigateToWordSearch,
  onNavigateToPuzzlePieces,
  onNavigateToNumberSequence
}) => {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      name: 'Morning Walk',
      description: 'Take a gentle 15-minute walk around your neighborhood',
      icon: 'walk-outline',
      color: '#4CAF50',
      duration: 15,
      completed: false,
      points: 10,
    },
    {
      id: '2',
      name: 'Stretching',
      description: 'Simple stretching exercises for flexibility',
      icon: 'fitness-outline',
      color: '#2196F3',
      duration: 10,
      completed: true,
      points: 5,
    },
    {
      id: '3',
      name: 'Deep Breathing',
      description: '5 minutes of deep breathing exercises',
      icon: 'leaf-outline',
      color: '#FF9800',
      duration: 5,
      completed: false,
      points: 5,
    },
    {
      id: '4',
      name: 'Sleep Cycle',
      description: 'Track your sleep patterns and quality',
      icon: 'moon-outline',
      color: '#9C27B0',
      duration: 8,
      completed: false,
      points: 15,
    },
  ]);

  const [games, setGames] = useState<Game[]>([
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

  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    duration: '',
  });

  const [totalPoints, setTotalPoints] = useState(25); // Starting points

  const handleActivityPress = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    // Navigate to specific activity page
    switch (id) {
      case '1': // Morning Walk
        onNavigateToWalking();
        break;
      case '2': // Stretching
        onNavigateToStretching();
        break;
      case '3': // Deep Breathing
        onNavigateToBreathing();
        break;
      case '4': // Sleep Cycle
        onNavigateToSleep();
        break;
      default:
        // For custom activities, just toggle completion
        handleActivityComplete(id);
        break;
    }
  };

  const handleActivityComplete = (id: string) => {
    setActivities(activities.map(activity =>
      activity.id === id 
        ? { ...activity, completed: !activity.completed }
        : activity
    ));
    
    const activity = activities.find(a => a.id === id);
    if (activity && !activity.completed) {
      setTotalPoints(prev => prev + activity.points);
      Alert.alert('Great Job!', `You earned ${activity.points} points!`);
    }
  };

  const handleActivityCompleteFromPage = (activityData: any) => {
    // This will be called when user completes an activity from the individual page
    const activity = activities.find(a => a.id === activityData.id);
    if (activity) {
      setActivities(activities.map(a =>
        a.id === activityData.id ? { ...a, completed: true } : a
      ));
      setTotalPoints(prev => prev + activity.points);
    }
  };

  const handleAddActivity = () => {
    if (!newActivity.name || !newActivity.duration) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const activity: Activity = {
      id: Date.now().toString(),
      name: newActivity.name,
      description: newActivity.description,
      icon: 'add-circle-outline',
      color: '#667eea',
      duration: parseInt(newActivity.duration),
      completed: false,
      points: Math.max(5, parseInt(newActivity.duration) * 2),
    };

    setActivities([...activities, activity]);
    setNewActivity({ name: '', description: '', duration: '' });
    setShowAddActivity(false);
    Alert.alert('Success', 'Activity added successfully!');
  };

  const handleGamePress = (game: Game) => {
    // Navigate to specific game page
    switch (game.id) {
      case '1': // Memory Match
        onNavigateToMemoryMatch();
        break;
      case '2': // Word Search
        onNavigateToWordSearch();
        break;
      case '3': // Puzzle Pieces
        onNavigateToPuzzlePieces();
        break;
      case '4': // Number Sequence
        onNavigateToNumberSequence();
        break;
      default:
        Alert.alert(
          game.name,
          `${game.description}\n\nDifficulty: ${game.difficulty}\n\nThis game will help improve your cognitive function and keep your mind sharp!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Play Now', onPress: () => Alert.alert('Game Started', 'Game functionality will be implemented in the full version!') }
          ]
        );
        break;
    }
  };

  const renderActivity = (activity: Activity) => (
    <TouchableOpacity
      key={activity.id}
      style={[
        styles.activityCard,
        { borderLeftColor: activity.color },
        activity.completed && styles.completedCard
      ]}
      onPress={() => handleActivityPress(activity.id)}
    >
      <View style={styles.activityHeader}>
        <View style={styles.activityIconContainer}>
          <Ionicons name={activity.icon as any} size={24} color={activity.color} />
        </View>
        <View style={styles.activityInfo}>
          <Text style={[styles.activityName, activity.completed && styles.completedText]}>
            {activity.name}
          </Text>
          <Text style={styles.activityDescription}>{activity.description}</Text>
          <View style={styles.activityMeta}>
            <Text style={styles.activityDuration}>{activity.duration} min</Text>
            <Text style={styles.activityPoints}>{activity.points} pts</Text>
          </View>
        </View>
        <View style={styles.activityStatus}>
          {activity.completed ? (
            <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
          ) : (
            <Ionicons name="ellipse-outline" size={28} color="rgba(255, 255, 255, 0.5)" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Activities</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Progress</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{activities.filter(a => a.completed).length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{activities.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Activities</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddActivity(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activitiesList}>
            {activities.map(renderActivity)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brain Games</Text>
          <Text style={styles.sectionSubtitle}>Keep your mind sharp with these fun games</Text>
          
          <View style={styles.gamesList}>
            {games.map(renderGame)}
          </View>
        </View>
      </ScrollView>

      {/* Add Activity Modal */}
      {showAddActivity && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showAddActivity}
          onRequestClose={() => setShowAddActivity(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Activity</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Activity Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newActivity.name}
                  onChangeText={(text) => setNewActivity({...newActivity, name: text})}
                  placeholder="e.g., Evening Stroll"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.notesInput]}
                  value={newActivity.description}
                  onChangeText={(text) => setNewActivity({...newActivity, description: text})}
                  placeholder="Describe the activity..."
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Duration (minutes)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newActivity.duration}
                  onChangeText={(text) => setNewActivity({...newActivity, duration: text})}
                  placeholder="15"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowAddActivity(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddActivity}
                >
                  <Text style={styles.saveButtonText}>Add Activity</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
};

