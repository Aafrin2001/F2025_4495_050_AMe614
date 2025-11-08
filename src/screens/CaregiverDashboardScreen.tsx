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
import { auth, supabase } from '../lib/supabase';
import RejectionNotification from '../components/RejectionNotification';

interface CaregiverDashboardScreenProps {
  caregiver: User;
  seniorUserId: string;
  onBack: () => void;
  onViewAlerts: () => void;
  onViewDashboard: () => void;
  onViewMedication: () => void;
  onViewMonitor: () => void;
  onLogout: () => void;
  onSettingsPress?: () => void;
  onSeniorAdded?: (seniorEmail: string, seniorUserId?: string) => void;
}

interface ClientInfo {
  id: string;
  email: string;
  name: string;
  status: 'approved' | 'pending' | 'rejected';
  seniorId?: string;
  relationshipId: string;
  requestedAt: string;
  approvedAt?: string;
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
  onSettingsPress,
  onSeniorAdded,
}) => {
  const [showAddSeniorModal, setShowAddSeniorModal] = useState(false);
  const [seniorEmail, setSeniorEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actualSeniorUserId, setActualSeniorUserId] = useState<string>(seniorUserId);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'approved' | 'rejected'>('rejected');
  const [notificationSeniorEmail, setNotificationSeniorEmail] = useState<string>('');
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  // Load all client relationships
  useEffect(() => {
    const loadClients = async () => {
      if (!caregiver.id) return;
      
      setLoadingClients(true);
      try {
        const { success, data: relationships } = await CaregiverService.getCaregiverRelationships(caregiver.id);
        
        if (success && relationships) {
          // Convert relationships to client info
          const clientsData: ClientInfo[] = relationships.map(rel => {
            // Extract name from email (fallback if we can't get actual name)
            const emailParts = rel.senior_email.split('@');
            const nameFromEmail = emailParts[0].split('.')
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ');
            
            return {
              id: rel.id,
              email: rel.senior_email,
              name: nameFromEmail, // Will try to get actual name from user metadata if available
              status: rel.status as 'approved' | 'pending' | 'rejected',
              seniorId: rel.senior_id || undefined,
              relationshipId: rel.id,
              requestedAt: rel.requested_at,
              approvedAt: rel.approved_at || undefined,
            };
          });

          // Note: We use email-based names since we can't access admin API from client
          // In production, you could create a profiles table or use a serverless function

          setClients(clientsData);
          
          // Set the primary seniorUserId if there's an approved relationship
          const approvedClient = clientsData.find(c => c.status === 'approved');
          if (approvedClient && approvedClient.seniorId) {
            setActualSeniorUserId(approvedClient.seniorId);
            if (onSeniorAdded) {
              onSeniorAdded(approvedClient.email, approvedClient.seniorId);
            }
          } else {
            setActualSeniorUserId('');
          }

          // Count pending requests for notification badge
          const pendingCount = clientsData.filter(c => c.status === 'pending').length;
          setNotificationCount(pendingCount);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, [caregiver.id, seniorUserId]);

  // Listen for caregiver request status changes (approved/rejected) via Supabase Realtime
  useEffect(() => {
    if (!caregiver.id) return;

    console.log('Setting up Realtime subscription for caregiver:', caregiver.id);

    // Subscribe to changes in caregiver_relationships table
    const channel = supabase
      .channel('caregiver-request-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'caregiver_relationships',
          filter: `caregiver_id=eq.${caregiver.id}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          
          // Check if status changed to 'rejected' or 'approved'
          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;
          
          // Only show notification if status actually changed
          if (newStatus !== oldStatus) {
            const seniorEmail = payload.new?.senior_email || 'the senior';
            
            if (newStatus === 'rejected' && oldStatus !== 'rejected') {
              console.log('Request rejected by:', seniorEmail);
              setNotificationType('rejected');
              setNotificationSeniorEmail(seniorEmail);
              setShowNotification(true);
              
              // Reload clients to update UI
              const reloadClients = async () => {
                const { success, data: relationships } = await CaregiverService.getCaregiverRelationships(caregiver.id);
                if (success && relationships) {
                  const clientsData: ClientInfo[] = relationships.map(rel => {
                    const emailParts = rel.senior_email.split('@');
                    const nameFromEmail = emailParts[0].split('.')
                      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(' ');
                    
                    return {
                      id: rel.id,
                      email: rel.senior_email,
                      name: nameFromEmail,
                      status: rel.status as 'approved' | 'pending' | 'rejected',
                      seniorId: rel.senior_id || undefined,
                      relationshipId: rel.id,
                      requestedAt: rel.requested_at,
                      approvedAt: rel.approved_at || undefined,
                    };
                  });
                  setClients(clientsData);
                  
                  const approvedClient = clientsData.find(c => c.status === 'approved' && c.seniorId);
                  if (approvedClient && approvedClient.seniorId) {
                    setActualSeniorUserId(approvedClient.seniorId);
                    if (onSeniorAdded) {
                      onSeniorAdded(approvedClient.email, approvedClient.seniorId);
                    }
                  } else {
                    setActualSeniorUserId('');
                  }
                  
                  const pendingCount = clientsData.filter(c => c.status === 'pending').length;
                  setNotificationCount(pendingCount);
                }
              };
              reloadClients();
            } else if (newStatus === 'approved' && oldStatus !== 'approved') {
              console.log('Request approved by:', seniorEmail);
              setNotificationType('approved');
              setNotificationSeniorEmail(seniorEmail);
              setShowNotification(true);
              
              // Reload clients to update UI
              const reloadClients = async () => {
                const { success, data: relationships } = await CaregiverService.getCaregiverRelationships(caregiver.id);
                if (success && relationships) {
                  const clientsData: ClientInfo[] = relationships.map(rel => {
                    const emailParts = rel.senior_email.split('@');
                    const nameFromEmail = emailParts[0].split('.')
                      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(' ');
                    
                    return {
                      id: rel.id,
                      email: rel.senior_email,
                      name: nameFromEmail,
                      status: rel.status as 'approved' | 'pending' | 'rejected',
                      seniorId: rel.senior_id || undefined,
                      relationshipId: rel.id,
                      requestedAt: rel.requested_at,
                      approvedAt: rel.approved_at || undefined,
                    };
                  });
                  setClients(clientsData);
                  
                  const approvedClient = clientsData.find(c => c.status === 'approved' && c.seniorId);
                  if (approvedClient && approvedClient.seniorId) {
                    setActualSeniorUserId(approvedClient.seniorId);
                    if (onSeniorAdded) {
                      onSeniorAdded(approvedClient.email, approvedClient.seniorId);
                    }
                  }
                  
                  const pendingCount = clientsData.filter(c => c.status === 'pending').length;
                  setNotificationCount(pendingCount);
                }
              };
              reloadClients();
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [caregiver.id]);

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

      // Reload clients list
      const { success: reloadSuccess, data: relationships } = await CaregiverService.getCaregiverRelationships(user.id);
      if (reloadSuccess && relationships) {
        const clientsData: ClientInfo[] = relationships.map(rel => {
          const emailParts = rel.senior_email.split('@');
          const nameFromEmail = emailParts[0].split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
          
          return {
            id: rel.id,
            email: rel.senior_email,
            name: nameFromEmail,
            status: rel.status as 'approved' | 'pending' | 'rejected',
            seniorId: rel.senior_id || undefined,
            relationshipId: rel.id,
            requestedAt: rel.requested_at,
            approvedAt: rel.approved_at || undefined,
          };
        });
        setClients(clientsData);
        
        const approvedClient = clientsData.find(c => c.status === 'approved' && c.seniorId);
        if (approvedClient && approvedClient.seniorId) {
          setActualSeniorUserId(approvedClient.seniorId);
        }
        
        const pendingCount = clientsData.filter(c => c.status === 'pending').length;
        setNotificationCount(pendingCount);
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
                setSeniorEmail('');
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
                setSeniorEmail('');
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

  const handleClientPress = (client: ClientInfo) => {
    if (client.status === 'approved' && client.seniorId) {
      setActualSeniorUserId(client.seniorId);
      if (onSeniorAdded) {
        onSeniorAdded(client.email, client.seniorId);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FFA726';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'pending': return 'hourglass-outline';
      case 'rejected': return 'close-circle';
      default: return 'help-circle-outline';
    }
  };

  const getCareLevel = (client: ClientInfo): string => {
    // This would ideally come from a profile or assessment
    // For now, we'll use a simple logic based on status
    if (client.status === 'approved') {
      return 'Active Care';
    }
    return 'Not Active';
  };

  const renderClientTile = (client: ClientInfo) => (
    <TouchableOpacity
      key={client.id}
      style={styles.clientTile}
      onPress={() => handleClientPress(client)}
      activeOpacity={0.7}
    >
      <View style={styles.clientTileHeader}>
        <View style={styles.clientAvatarContainer}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>
              {client.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(client.status) }]} />
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName} numberOfLines={1}>
            {client.name}
          </Text>
          <Text style={styles.clientEmail} numberOfLines={1}>
            {client.email}
          </Text>
        </View>
      </View>
      
      <View style={styles.clientTileBody}>
        <View style={styles.clientDetailRow}>
          <Ionicons name="medical-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
          <Text style={styles.clientDetailText}>{getCareLevel(client)}</Text>
        </View>
        {client.approvedAt && (
          <View style={styles.clientDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.clientDetailText}>
              Connected {new Date(client.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.clientTileActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (client.seniorId) {
              setActualSeniorUserId(client.seniorId);
              onViewDashboard();
            }
          }}
        >
          <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (client.seniorId) {
              setActualSeniorUserId(client.seniorId);
              onViewMonitor();
            }
          }}
        >
          <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Monitor</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <StatusBar style="light" />
      
      {/* Request Status Notification (Approved/Rejected) */}
      <RejectionNotification
        visible={showNotification}
        type={notificationType}
        seniorEmail={notificationSeniorEmail}
        onHide={() => setShowNotification(false)}
        duration={4000}
      />

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
              <Text style={styles.modalTitle}>Add New Client</Text>
              <TouchableOpacity onPress={handleSkip}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Enter the email address of the senior you'd like to monitor
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
                  <Text style={styles.skipButtonText}>Cancel</Text>
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
      
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.dashboardTitle}>Caregiver Dashboard</Text>
          <View style={styles.headerRight}>
            {/* Notifications Bell */}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => {
                const pendingClients = clients.filter(c => c.status === 'pending');
                if (pendingClients.length > 0) {
                  Alert.alert(
                    'Pending Requests',
                    `You have ${pendingClients.length} pending client request${pendingClients.length !== 1 ? 's' : ''} awaiting approval.`
                  );
                } else {
                  Alert.alert('Notifications', 'No pending requests at this time.');
                }
              }}
            >
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Settings Button */}
            {onSettingsPress && (
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={onSettingsPress}
              >
                <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Logout Button */}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={onLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerBottom}>
          <Text style={styles.welcomeText}>
            Welcome, {caregiver.firstName || 'Caregiver'}
          </Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Clients</Text>

          {loadingClients ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading clients...</Text>
            </View>
          ) : (() => {
            const approvedClients = clients.filter(c => c.status === 'approved');
            return approvedClients.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.emptyStateTitle}>No Clients Yet</Text>
                <Text style={styles.emptyStateText}>
                  Start by adding a client to monitor their health and wellness
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setShowAddSeniorModal(true)}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.emptyStateButtonText}>Add Your First Client</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.clientsGrid}>
                  {approvedClients.map(renderClientTile)}
                </View>
                <TouchableOpacity
                  style={styles.addClientButton}
                  onPress={() => setShowAddSeniorModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.addClientButtonText}>Add Client</Text>
                </TouchableOpacity>
              </>
            );
          })()}
        </View>

        {/* Quick Actions - Only show if there's at least one approved client */}
        {clients.some(c => c.status === 'approved') && actualSeniorUserId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={onViewAlerts}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="alert-circle" size={32} color="#F44336" />
                </View>
                <Text style={styles.quickActionTitle}>Alerts</Text>
                <Text style={styles.quickActionSubtitle}>Critical notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={onViewDashboard}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="analytics-outline" size={32} color="#2196F3" />
                </View>
                <Text style={styles.quickActionTitle}>Dashboard</Text>
                <Text style={styles.quickActionSubtitle}>Health overview</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={onViewMedication}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="medical-outline" size={32} color="#4CAF50" />
                </View>
                <Text style={styles.quickActionTitle}>Medications</Text>
                <Text style={styles.quickActionSubtitle}>Manage schedules</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={onViewMonitor}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="heart-outline" size={32} color="#E91E63" />
                </View>
                <Text style={styles.quickActionTitle}>Monitor</Text>
                <Text style={styles.quickActionSubtitle}>Vital signs</Text>
              </TouchableOpacity>
            </View>
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
  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBottom: {
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  // Section Styles
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  addClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  addClientButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Client Tile Styles
  clientsGrid: {
    gap: 16,
    marginBottom: 20,
  },
  clientTile: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  clientTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientAvatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  clientAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'rgba(102, 126, 234, 1)',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 19,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  clientEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '400',
  },
  clientTileBody: {
    marginBottom: 12,
    gap: 8,
  },
  clientDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientDetailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginLeft: 8,
  },
  clientTileActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionIcon: {
    marginBottom: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
    lineHeight: 22,
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

