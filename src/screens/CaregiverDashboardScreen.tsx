import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { CaregiverService } from '../lib/caregiverService';
import { auth } from '../lib/supabase';

interface CaregiverDashboardScreenProps {
  caregiver: User;
  seniorUserId: string;
  onBack: () => void;
  onViewAlerts: () => void;
  onViewDashboard: () => void;
  onViewMedication: () => void;
  onViewMonitor: () => void;
  onLogout: () => void;
  onSeniorAdded?: (seniorEmail: string, seniorUserId?: string) => void;
}

const CaregiverDashboardScreen: React.FC<CaregiverDashboardScreenProps> = ({
  caregiver,
  seniorUserId,
  onBack,
  onViewAlerts,
  onViewDashboard,
  onViewMedication,
  onViewMonitor,
  onLogout,
  onSeniorAdded,
}) => {
  const [showAddSeniorModal, setShowAddSeniorModal] = useState(!caregiver.seniorEmail);
  const [seniorEmail, setSeniorEmail] = useState(caregiver.seniorEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [actualSeniorUserId, setActualSeniorUserId] = useState<string>(seniorUserId);

  // Reload relationship when component mounts to ensure we have the latest data
  useEffect(() => {
    const loadRelationship = async () => {
      if (!caregiver.id) return;
      
      try {
        const relationship = await CaregiverService.getSeniorUserId(caregiver.id);
        if (relationship.success && relationship.seniorUserId) {
          console.log('Loaded relationship:', relationship);
          setActualSeniorUserId(relationship.seniorUserId);
          if (onSeniorAdded) {
            onSeniorAdded(relationship.seniorEmail || '', relationship.seniorUserId);
          }
        } else {
          console.log('No approved relationship found:', relationship.error);
          setActualSeniorUserId('');
        }
      } catch (error) {
        console.error('Error loading relationship:', error);
      }
    };

    // Only load if we don't have a seniorUserId yet
    if (!seniorUserId && caregiver.userType === 'offer') {
      loadRelationship();
    } else {
      setActualSeniorUserId(seniorUserId);
    }
  }, [caregiver.id, seniorUserId]);

  const handleAddSenior = async () => {
    if (!seniorEmail.trim()) {
      Alert.alert('Error', 'Please enter the senior\'s email address');
      return;
    }

    setIsLoading(true);
    try {
      // Get current user
      const { user, error: userError } = await auth.getCurrentUser();
      if (userError || !user) {
        Alert.alert('Error', 'Could not retrieve user information. Please try logging in again.');
        setIsLoading(false);
        return;
      }

      // Request caregiver access
      const requestResult = await CaregiverService.requestAccess(
        seniorEmail.trim(),
        user.id,
        user.email || ''
      );

      if (!requestResult.success) {
        Alert.alert(
          'Request Failed',
          requestResult.error || 'Could not create access request.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // Verify if already approved
      const verifyResult = await CaregiverService.verifyAccess(
        user.id,
        seniorEmail.trim()
      );

      if (verifyResult.success && verifyResult.relationship) {
        // Already approved
        Alert.alert(
          'Success',
          'Access approved! Connected to senior account.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowAddSeniorModal(false);
                if (onSeniorAdded) {
                  onSeniorAdded(verifyResult.relationship!.senior_email, verifyResult.relationship!.senior_id || undefined);
                }
              }
            }
          ]
        );
      } else {
        // Pending approval
        Alert.alert(
          'Access Request Sent',
          `A request has been sent to ${seniorEmail.trim()}. The senior will need to approve your access before you can view their information.\n\nVerification Code: ${requestResult.verificationCode}\n\nPlease ask the senior to approve your request or provide this code for verification.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowAddSeniorModal(false);
                if (onSeniorAdded) {
                  onSeniorAdded(seniorEmail.trim());
                }
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error requesting caregiver access:', error);
      Alert.alert(
        'Error', 
        error?.message || 'An unexpected error occurred while requesting access. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setShowAddSeniorModal(false);
  };
  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <StatusBar style="light" />

      {/* Add Senior Modal */}
      <Modal
        visible={showAddSeniorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleSkip}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect to Senior Account</Text>
              <TouchableOpacity onPress={handleSkip}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Enter the email address of the senior you are monitoring
              </Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="person-outline" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Senior's Email Address"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={seniorEmail}
                    onChangeText={setSeniorEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.skipButton]}
                  onPress={handleSkip}
                  disabled={isLoading}
                >
                  <Text style={styles.skipButtonText}>Skip for Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.connectButton, isLoading && styles.buttonDisabled]}
                  onPress={handleAddSenior}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.connectButtonText}>Request Access</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Header */}
      <View style={styles.header}>
        {/* No back button for caregivers - they stay on dashboard */}
        <View style={styles.backButton} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Caregiver Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Monitoring: {caregiver.seniorEmail || 'Senior Account'}
          </Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome, {caregiver.firstName}!</Text>
          {!actualSeniorUserId ? (
            <View style={styles.pendingCard}>
              <Ionicons name="hourglass-outline" size={32} color="#FFA726" style={styles.pendingIcon} />
              <Text style={styles.pendingTitle}>
                {caregiver.seniorEmail ? 'Access Pending Approval' : 'No Senior Connected'}
              </Text>
              {caregiver.seniorEmail ? (
                <>
                  <Text style={styles.pendingText}>
                    Your request to monitor {caregiver.seniorEmail} is pending approval.
                  </Text>
                  <Text style={styles.pendingSubtext}>
                    The senior will need to approve your access request before you can view their health information.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.pendingText}>
                    Connect to a senior account to start monitoring their health information.
                  </Text>
                  <TouchableOpacity
                    style={styles.addSeniorButton}
                    onPress={() => setShowAddSeniorModal(true)}
                  >
                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.addSeniorButtonText}>Add Senior</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <Text style={styles.welcomeSubtitle}>
              Monitor and manage the health and wellness of your loved one
            </Text>
          )}
        </View>

        {/* Main Feature Cards - Only show if access approved */}
        {seniorUserId ? (
          <View style={styles.featureGrid}>
          {/* Alerts Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={onViewAlerts}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="alert-circle" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.featureTitle}>Alerts</Text>
            <Text style={styles.featureDescription}>
              View critical health alerts and emergency notifications
            </Text>
          </TouchableOpacity>

          {/* Dashboard Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={onViewDashboard}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="analytics-outline" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.featureTitle}>Dashboard</Text>
            <Text style={styles.featureDescription}>
              Comprehensive health overview and analytics
            </Text>
          </TouchableOpacity>

          {/* Medication Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={onViewMedication}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="medical-outline" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.featureTitle}>Medication</Text>
            <Text style={styles.featureDescription}>
              Manage medications, schedules, and reminders
            </Text>
          </TouchableOpacity>

          {/* Monitor Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={onViewMonitor}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="heart-outline" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.featureTitle}>Monitor</Text>
            <Text style={styles.featureDescription}>
              Track vital signs and health metrics
            </Text>
          </TouchableOpacity>
        </View>
        ) : (
          <View style={styles.disabledMessage}>
            <Ionicons name="lock-closed-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.disabledText}>
              Access to these features requires senior approval
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    padding: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  featureGrid: {
    gap: 20,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  cardIconContainer: {
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  pendingCard: {
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
    borderRadius: 15,
    padding: 20,
    marginTop: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 167, 38, 0.3)',
  },
  pendingIcon: {
    marginBottom: 10,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 5,
  },
  pendingSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 5,
  },
  disabledMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  disabledText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 15,
  },
  addSeniorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 8,
  },
  addSeniorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default CaregiverDashboardScreen;

