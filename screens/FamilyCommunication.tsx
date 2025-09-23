import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  lastContact: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  from: string;
  message: string;
  timestamp: string;
  type: 'sent' | 'received';
}

interface FamilyCommunicationProps {
  onNavigate: (screen: 'healthcare' | 'medications' | 'walk' | 'family') => void;
}

export default function FamilyCommunication({ onNavigate }: FamilyCommunicationProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      relationship: 'Daughter',
      phone: '+1 (555) 123-4567',
      lastContact: '2 hours ago',
      isOnline: true,
    },
    {
      id: '2',
      name: 'Michael Johnson',
      relationship: 'Son',
      phone: '+1 (555) 987-6543',
      lastContact: '1 day ago',
      isOnline: false,
    },
    {
      id: '3',
      name: 'Dr. Emily Smith',
      relationship: 'Doctor',
      phone: '+1 (555) 456-7890',
      lastContact: '3 days ago',
      isOnline: true,
    },
  ]);

  const [recentMessages, setRecentMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'Sarah Johnson',
      message: 'Hi Dad! How are you feeling today?',
      timestamp: '2 hours ago',
      type: 'received',
    },
    {
      id: '2',
      from: 'You',
      message: 'I\'m doing well, dear. Just took my morning walk!',
      timestamp: '1 hour ago',
      type: 'sent',
    },
    {
      id: '3',
      from: 'Dr. Emily Smith',
      message: 'Your next appointment is tomorrow at 2 PM. See you then!',
      timestamp: '3 days ago',
      type: 'received',
    },
  ]);

  const [isCalling, setIsCalling] = useState(false);

  const callFamilyMember = (member: FamilyMember) => {
    setIsCalling(true);
    Speech.speak(
      `Calling ${member.name}. Please wait while I connect you.`,
      { rate: 0.8 }
    );
    
    // Simulate call connection
    setTimeout(() => {
      setIsCalling(false);
      Alert.alert(
        'Call Connected',
        `Connected to ${member.name}`,
        [
          {
            text: 'End Call',
            onPress: () => {
              Speech.speak('Call ended. Have a great day!', { rate: 0.8 });
            },
          },
        ]
      );
    }, 3000);
  };

  const sendQuickMessage = (member: FamilyMember) => {
    Alert.alert(
      'Send Message',
      `Send a quick message to ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            const message = `Hi ${member.name.split(' ')[0]}! I'm doing well and wanted to check in. Love you!`;
            Speech.speak(
              `Message sent to ${member.name}. They'll receive it shortly.`,
              { rate: 0.8 }
            );
            
            // Add to recent messages
            const newMessage: Message = {
              id: Date.now().toString(),
              from: 'You',
              message,
              timestamp: 'Just now',
              type: 'sent',
            };
            setRecentMessages(prev => [newMessage, ...prev]);
          },
        },
      ]
    );
  };

  const sendHealthUpdate = () => {
    const healthUpdate = `Health Update: Feeling good today! Walked 2,500 steps, took all medications, and blood pressure is normal. Love you all!`;
    
    Speech.speak(
      "I've sent your health update to all family members. They'll be happy to hear you're doing well!",
      { rate: 0.8 }
    );
    
    // Add to recent messages
    const newMessage: Message = {
      id: Date.now().toString(),
      from: 'You',
      message: healthUpdate,
      timestamp: 'Just now',
      type: 'sent',
    };
    setRecentMessages(prev => [newMessage, ...prev]);
  };

  const emergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'This will call all family members and emergency contacts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency',
          style: 'destructive',
          onPress: () => {
            Speech.speak(
              "Emergency call initiated. All family members and emergency contacts have been notified. Help is on the way!",
              { rate: 0.8 }
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('healthcare')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Family & Care Team 👨‍👩‍👧‍👦</Text>
          <Text style={styles.subtitle}>Stay connected with your loved ones</Text>
        </View>

        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyButton} onPress={emergencyCall}>
          <Text style={styles.emergencyIcon}>🚨</Text>
          <Text style={styles.emergencyText}>Emergency Call</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={sendHealthUpdate}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionText}>Send Health Update</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>📞</Text>
            <Text style={styles.quickActionText}>Call All Family</Text>
          </TouchableOpacity>
        </View>

        {/* Family Members */}
        <View style={styles.familySection}>
          <Text style={styles.sectionTitle}>Family & Care Team</Text>
          {familyMembers.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <View style={styles.onlineStatus}>
                    <View style={[
                      styles.statusDot, 
                      { backgroundColor: member.isOnline ? '#22c55e' : '#94a3b8' }
                    ]} />
                    <Text style={styles.statusText}>
                      {member.isOnline ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.memberRelationship}>{member.relationship}</Text>
                <Text style={styles.memberPhone}>{member.phone}</Text>
                <Text style={styles.lastContact}>Last contact: {member.lastContact}</Text>
              </View>
              
              <View style={styles.memberActions}>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => callFamilyMember(member)}
                  disabled={isCalling}
                >
                  <Text style={styles.callButtonIcon}>📞</Text>
                  <Text style={styles.callButtonText}>
                    {isCalling ? 'Calling...' : 'Call'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.messageButton}
                  onPress={() => sendQuickMessage(member)}
                >
                  <Text style={styles.messageButtonIcon}>💬</Text>
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Messages */}
        <View style={styles.messagesSection}>
          <Text style={styles.sectionTitle}>Recent Messages</Text>
          {recentMessages.map((message) => (
            <View key={message.id} style={[
              styles.messageCard,
              message.type === 'sent' && styles.sentMessage
            ]}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageFrom}>{message.from}</Text>
                <Text style={styles.messageTime}>{message.timestamp}</Text>
              </View>
              <Text style={styles.messageText}>{message.message}</Text>
            </View>
          ))}
        </View>

        {/* Voice Commands */}
        <View style={styles.voiceCommands}>
          <Text style={styles.voiceTitle}>Voice Commands</Text>
          <View style={styles.commandList}>
            <Text style={styles.commandItem}>• "Call Sarah"</Text>
            <Text style={styles.commandItem}>• "Send health update to family"</Text>
            <Text style={styles.commandItem}>• "Message my doctor"</Text>
            <Text style={styles.commandItem}>• "Emergency call"</Text>
            <Text style={styles.commandItem}>• "Who's online?"</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  emergencyButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  emergencyText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quickActionButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  familySection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInfo: {
    marginBottom: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  memberRelationship: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 4,
  },
  memberPhone: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  lastContact: {
    fontSize: 12,
    color: '#94a3b8',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  callButtonIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  messageButtonIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messagesSection: {
    marginBottom: 30,
  },
  messageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sentMessage: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageFrom: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  messageTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  messageText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  voiceCommands: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  commandList: {
    gap: 8,
  },
  commandItem: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
