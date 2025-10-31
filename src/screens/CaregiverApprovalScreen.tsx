import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CaregiverService, CaregiverRelationship } from '../lib/caregiverService';
import { auth, supabase } from '../lib/supabase';

interface CaregiverApprovalScreenProps {
  onBack: () => void;
  onApprovalComplete: () => void;
}

const CaregiverApprovalScreen: React.FC<CaregiverApprovalScreenProps> = ({
  onBack,
  onApprovalComplete,
}) => {
  const [pendingRequests, setPendingRequests] = useState<CaregiverRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CaregiverRelationship | null>(null);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const { user, error: userError } = await auth.getCurrentUser();
      if (userError || !user) {
        Alert.alert('Error', 'Not authenticated. Please log in again.');
        return;
      }

      // Get pending requests for this senior's email
      const { data, error } = await supabase
        .from('caregiver_relationships')
        .select('*')
        .eq('senior_email', user.email?.toLowerCase())
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error loading requests:', error);
        Alert.alert('Error', 'Failed to load requests');
        return;
      }

      setPendingRequests(data || []);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (relationshipId: string, code?: string) => {
    setProcessing(relationshipId);
    try {
      const { user, error: userError } = await auth.getCurrentUser();
      if (userError || !user) {
        Alert.alert('Error', 'Not authenticated. Please log in again.');
        return;
      }

      const result = await CaregiverService.approveRequest(relationshipId, user.id, code);
      
      if (result.success) {
        Alert.alert('Success', 'Caregiver access approved!');
        await loadPendingRequests();
        onApprovalComplete();
      } else {
        Alert.alert('Error', result.error || 'Failed to approve request');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    } finally {
      setProcessing(null);
      setSelectedRequest(null);
      setVerificationCode('');
    }
  };

  const handleReject = async (relationshipId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this caregiver request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessing(relationshipId);
            try {
              const result = await CaregiverService.rejectRequest(relationshipId);
              if (result.success) {
                Alert.alert('Request Rejected', 'The caregiver has been notified.');
                await loadPendingRequests();
              } else {
                Alert.alert('Error', result.error || 'Failed to reject request');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caregiver Requests</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {pendingRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.emptyText}>No pending requests</Text>
            <Text style={styles.emptySubtext}>All caregiver requests have been processed</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {pendingRequests.length} Pending Request{pendingRequests.length !== 1 ? 's' : ''}
            </Text>
            {pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestEmail}>{request.caregiver_email}</Text>
                    <Text style={styles.requestDate}>
                      Requested: {new Date(request.requested_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {request.verification_code && (
                  <View style={styles.verificationSection}>
                    <Text style={styles.verificationLabel}>Verification Code:</Text>
                    <Text style={styles.verificationCode}>{request.verification_code}</Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleReject(request.id)}
                    disabled={processing === request.id}
                  >
                    {processing === request.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => {
                      setSelectedRequest(request);
                      if (request.verification_code) {
                        // Show verification code input
                        Alert.prompt(
                          'Approve Request',
                          `Enter verification code to approve:\n\nCode: ${request.verification_code}`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Approve',
                              onPress: (code) => {
                                if (code === request.verification_code) {
                                  handleApprove(request.id, code);
                                } else {
                                  Alert.alert('Error', 'Invalid verification code');
                                }
                              },
                            },
                          ],
                          'plain-text',
                          request.verification_code || ''
                        );
                      } else {
                        handleApprove(request.id);
                      }
                    }}
                    disabled={processing === request.id}
                  >
                    {processing === request.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  requestHeader: {
    marginBottom: 15,
  },
  requestInfo: {
    marginBottom: 10,
  },
  requestEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  requestDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  verificationSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  verificationLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 5,
  },
  verificationCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default CaregiverApprovalScreen;

