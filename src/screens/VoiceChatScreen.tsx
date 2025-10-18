import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface VoiceChatScreenProps {
  onBack: () => void;
}
interface VoiceChatScreenProps {
  onBack: () => void;
}

interface VoiceMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isPlaying?: boolean;
}

const VoiceChatScreen: React.FC<VoiceChatScreenProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your AI health companion. I'm here to help you with health monitoring, medication reminders, and answer any health-related questions you might have. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const quickActions = [
    { id: '1', text: 'Check my vitals', icon: 'heart-outline' },
    { id: '2', text: 'Medication reminder', icon: 'medical-outline' },
    { id: '3', text: 'Schedule appointment', icon: 'calendar-outline' },
    { id: '4', text: 'Emergency help', icon: 'warning-outline' },
  ];

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);
