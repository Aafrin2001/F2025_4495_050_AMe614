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
}