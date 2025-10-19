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
  
  const handleStartListening = () => {
    setIsListening(true);
    // Simulate listening for 3 seconds
    setTimeout(() => {
      setIsListening(false);
      setIsProcessing(true);
      
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        setIsSpeaking(true);
        
        const userMessage: VoiceMessage = {
          id: Date.now().toString(),
          text: "I need help with my blood pressure reading",
          isUser: true,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Simulate AI response
        setTimeout(() => {
          const aiResponse: VoiceMessage = {
            id: (Date.now() + 1).toString(),
            text: "I understand you need help with your blood pressure reading. I can help you track your readings and provide guidance. Would you like me to show you how to record a new reading?",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiResponse]);
          setIsSpeaking(false);
        }, 2000);
      }, 1500);
    }, 3000);
  };

  const handleStopListening = () => {
    setIsListening(false);
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert('Voice Input', 'Voice recognition stopped. Tap the microphone to try again.');
    }, 1000);
  };

  const handleQuickAction = (action: string) => {
    const quickMessage: VoiceMessage = {
      id: Date.now().toString(),
      text: action,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, quickMessage]);
    setIsSpeaking(true);

    setTimeout(() => {
      const aiResponse: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: `I'd be happy to help you with ${action.toLowerCase()}. This feature will be fully functional in the complete version of the app. Is there anything specific you'd like to know about this?`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsSpeaking(false);
    }, 1500);
  };
    const renderMessage = (message: VoiceMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.aiText,
          ]}
        >
          {message.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              message.isUser ? styles.userTime : styles.aiTime,
            ]}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {!message.isUser && (
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={16} color="#667eea" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderStatusIndicator = () => {
    if (isListening) {
      return (
        <View style={styles.statusContainer}>
          <Animated.View style={[styles.listeningIndicator, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="mic" size={24} color="#FFFFFF" />
          </Animated.View>
          <Text style={styles.statusText}>Listening...</Text>
        </View>
      );
    }
    
    if (isProcessing) {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.processingIndicator}>
            <Ionicons name="hourglass-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.statusText}>Processing...</Text>
        </View>
      );
    }
    
    if (isSpeaking) {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.speakingIndicator}>
            <Ionicons name="volume-high" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.statusText}>AI is speaking...</Text>
        </View>
      );
    }
    
    return null;
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Voice Chat</Text>
          <Text style={styles.headerSubtitle}>Speak naturally</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {renderStatusIndicator()}

        <View style={styles.quickActionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsScroll}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.text)}
              >
                <Ionicons name={action.icon as any} size={20} color="#667eea" />
                <Text style={styles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.voiceControls}>
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isListening && styles.voiceButtonActive,
              (isProcessing || isSpeaking) && styles.voiceButtonDisabled,
            ]}
            onPress={isListening ? handleStopListening : handleStartListening}
            disabled={isProcessing || isSpeaking}
          >
           };
