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

  const handleQuickAction = (action: any) => {
    const newMessage: VoiceMessage = {
      id: Date.now().toString(),
      text: action.text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setIsProcessing(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: `I understand you want to ${action.text.toLowerCase()}. Let me help you with that.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1500);
  };

  const startListening = () => {
    setIsListening(true);
    // Simulate listening for 3 seconds
    setTimeout(() => {
      setIsListening(false);
      setIsProcessing(true);
      
      // Simulate processing and response
      setTimeout(() => {
        const userMessage: VoiceMessage = {
          id: Date.now().toString(),
          text: "I said hello",
          isUser: true,
          timestamp: new Date(),
        };
        const aiResponse: VoiceMessage = {
          id: (Date.now() + 1).toString(),
          text: "Hello! How can I help you today?",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage, aiResponse]);
        setIsProcessing(false);
      }, 1000);
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
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
        <Text style={styles.headerTitle}>Voice Chat</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessage : styles.aiMessage
            ]}
          >
            <Text style={[
              styles.messageText,
              message.isUser ? styles.userMessageText : styles.aiMessageText
            ]}>
              {message.text}
            </Text>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        
        {isProcessing && (
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(action)}
            >
              <Ionicons name={action.icon as any} size={20} color="#FFFFFF" />
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.voiceControls}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            isListening && styles.voiceButtonActive
          ]}
          onPress={isListening ? stopListening : startListening}
        >
          <Animated.View style={[
            styles.voiceButtonInner,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Ionicons 
              name={isListening ? "stop" : "mic"} 
              size={32} 
              color="#FFFFFF" 
            />
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.voiceButtonLabel}>
          {isListening ? "Listening..." : "Tap to speak"}
        </Text>
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
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 15,
    borderBottomRightRadius: 5,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 15,
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 5,
    textAlign: 'right',
  },
  processingContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 15,
    marginVertical: 8,
  },
  processingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontStyle: 'italic',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  voiceControls: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  voiceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    padding: 20,
    marginBottom: 10,
  },
  voiceButtonActive: {
    backgroundColor: '#FF5722',
  },
  voiceButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default VoiceChatScreen;
