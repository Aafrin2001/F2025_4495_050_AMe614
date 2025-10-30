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
            <Ionicons
              name={isListening ? "stop" : "mic"}
              size={32}
              color={isListening ? "#FFFFFF" : "#667eea"}
            />
          </TouchableOpacity>
          <Text style={styles.voiceButtonLabel}>
            {isListening ? "Tap to stop" : "Tap to speak"}
          </Text>
        </View>
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#667eea',
  },
  aiText: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  userTime: {
    color: 'rgba(102, 126, 234, 0.6)',
  },
  aiTime: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  playButton: {
    padding: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  listeningIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  processingIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  speakingIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingVertical: 15,
  },
  quickActionsScroll: {
    flexDirection: 'row',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  quickActionText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  voiceControls: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  voiceButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  voiceButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  voiceButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default VoiceChatScreen;
