import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { sendChatMessage, speakText, stopSpeaking, ChatMessage } from '../lib/chatGPTService';

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
  const recognitionRef = useRef<any>(null);
  
  // Convert messages to ChatGPT format
  const getConversationHistory = (): ChatMessage[] => {
    return messages
      .filter(msg => msg.id !== '1') // Exclude the initial greeting
      .map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text,
      }));
  };
  
  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    setIsListening(false);
    setIsProcessing(true);
    
    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      text: transcript,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Get conversation history
      const conversationHistory = getConversationHistory();
      
      // Send to ChatGPT
      const aiResponseText = await sendChatMessage(transcript, conversationHistory);
      
      const aiResponse: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
      setIsSpeaking(true);
      
      // Convert AI response to speech
      await speakText(aiResponseText);
      setIsSpeaking(false);
    } catch (error: any) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
      
      const errorMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: error.message || 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      Alert.alert('Error', error.message || 'Failed to process voice input. Please check your OpenAI API key configuration.');
    }
  };
  
  // Initialize Web Speech API for speech recognition (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleVoiceInput(transcript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          Alert.alert('Error', 'Speech recognition failed. Please try again.');
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
    
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (isProcessing || isSpeaking) return;
    
    // Use Web Speech API on web
    if (Platform.OS === 'web' && typeof window !== 'undefined' && recognitionRef.current) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        Alert.alert('Error', 'Failed to start speech recognition. Please try again.');
      }
    } else {
      // For native platforms, show a message about manual input
      Alert.alert(
        'Speech Recognition',
        'Speech recognition is available on web browsers. On mobile devices, you can use the quick action buttons or type your message manually in the text chat.',
        [
          {
            text: 'Use Text Chat',
            onPress: () => {
              // This could navigate to text chat if needed
            },
          },
          { text: 'OK' },
        ]
      );
    }
  };

  const handleStopListening = () => {
    if (Platform.OS === 'web' && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleQuickAction = async (action: string) => {
    if (isProcessing || isSpeaking) return;
    
    const quickMessage: VoiceMessage = {
      id: Date.now().toString(),
      text: action,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, quickMessage]);
    setIsProcessing(true);

    try {
      // Get conversation history
      const conversationHistory = getConversationHistory();
      
      // Send to ChatGPT
      const aiResponseText = await sendChatMessage(action, conversationHistory);
      
      const aiResponse: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
      setIsSpeaking(true);
      
      // Convert AI response to speech
      await speakText(aiResponseText);
      setIsSpeaking(false);
    } catch (error: any) {
      console.error('Error processing quick action:', error);
      setIsProcessing(false);
      
      const errorMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: error.message || 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
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
