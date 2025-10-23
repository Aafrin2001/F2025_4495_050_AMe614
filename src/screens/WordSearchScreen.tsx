import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface WordSearchScreenProps {
  onBack: () => void;
  onComplete: (data: GameData) => void;
}
interface WordSearchScreenProps {
  onBack: () => void;
  onComplete: (data: GameData) => void;
}

interface GameData {
  score: number;
  time: number; // in seconds
  wordsFound: number;
  completed: boolean;
}

interface Word {
  text: string;
  found: boolean;
  hint: string;
}

interface Cell {
  letter: string;
  isSelected: boolean;
  isFound: boolean;
  row: number;
  col: number;
}
