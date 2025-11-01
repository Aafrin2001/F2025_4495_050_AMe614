import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AdminDashboardService, AdminDashboardStats, HealthTrend, MedicationAlert, EmergencyAlert, DailyActivity, InactivityAlert } from '../lib/adminDashboardService';

interface AdminDashboardScreenProps {
  onBack: () => void;
  userId?: string; // Optional: for caregivers viewing senior's dashboard
}

const { width } = Dimensions.get('window');

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onBack, userId }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [healthTrends, setHealthTrends] = useState<HealthTrend[]>([]);
  const [medicationAlerts, setMedicationAlerts] = useState<MedicationAlert[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [inactivityAlerts, setInactivityAlerts] = useState<InactivityAlert[]>([]);
  
  // Modal states
  const [showHealthTrends, setShowHealthTrends] = useState(false);
  const [showMedicationAlerts, setShowMedicationAlerts] = useState(false);
  const [showEmergencyAlerts, setShowEmergencyAlerts] = useState(false);
  const [showInactivityAlerts, setShowInactivityAlerts] = useState(false);
  const [selectedAlertDetails, setSelectedAlertDetails] = useState<EmergencyAlert | null>(null);
  
  // Auto-refresh timer
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAllData();
    
    // Set up auto-refresh every 5 minutes
    refreshTimer.current = setInterval(() => {
      loadAllData(true);
    }, 5 * 60 * 1000);

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [selectedTimeframe, userId]);

  const loadAllData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [
        statsResult,
        healthTrendsResult,
        medicationAlertsResult,
        emergencyAlertsResult,
        dailyActivitiesResult,
        inactivityAlertsResult,
      ] = await Promise.all([
        AdminDashboardService.getDashboardStats(selectedTimeframe, userId),
        AdminDashboardService.getHealthTrends(selectedTimeframe, userId),
        AdminDashboardService.getMedicationAlerts(userId),
        AdminDashboardService.getEmergencyAlerts(userId),
        AdminDashboardService.getDailyActivities(selectedTimeframe, userId),
        AdminDashboardService.getInactivityAlerts(userId),
      ]);

      if (statsResult.success) setStats(statsResult.data || null);
      if (healthTrendsResult.success) setHealthTrends(healthTrendsResult.data || []);
      if (medicationAlertsResult.success) setMedicationAlerts(medicationAlertsResult.data || []);
      if (emergencyAlertsResult.success) setEmergencyAlerts(emergencyAlertsResult.data || []);
      if (dailyActivitiesResult.success) setDailyActivities(dailyActivitiesResult.data || []);
      if (inactivityAlertsResult.success) setInactivityAlerts(inactivityAlertsResult.data || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAllData(true);
  };

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 7 Days';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'High': return '#F44336';
      case 'Critical': return '#D32F2F';
      default: return '#FFFFFF';
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'High': return '#F44336';
      case 'Critical': return '#D32F2F';
      default: return '#FFFFFF';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatsCard = (icon: string, value: string | number, label: string, color: string) => (
    <View style={styles.summaryCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.summaryNumber}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );

  const renderHealthTrendCard = (trend: HealthTrend) => (
    <View key={trend.date} style={styles.trendCard}>
      <Text style={styles.trendDate}>{formatDate(trend.date)}</Text>
      <View style={styles.trendMetrics}>
        {trend.bloodPressure !== '0/0' && (
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>BP</Text>
            <Text style={styles.trendValue}>{trend.bloodPressure}</Text>
          </View>
        )}
        {trend.heartRate > 0 && (
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>HR</Text>
            <Text style={styles.trendValue}>{trend.heartRate} bpm</Text>
          </View>
        )}
        {trend.weight > 0 && (
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Weight</Text>
            <Text style={styles.trendValue}>{trend.weight} lbs</Text>
          </View>
        )}
        {trend.temperature > 0 && (
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Temp</Text>
            <Text style={styles.trendValue}>{trend.temperature}°F</Text>
          </View>
        )}
        {trend.oxygenLevel > 0 && (
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>O2</Text>
            <Text style={styles.trendValue}>{trend.oxygenLevel}%</Text>
          </View>
        )}
        {trend.bloodSugar > 0 && (
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Glucose</Text>
            <Text style={styles.trendValue}>{trend.bloodSugar} mg/dL</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderMedicationAlertCard = (alert: MedicationAlert) => (
    <View key={alert.id} style={[styles.alertCard, { borderLeftColor: alert.isCritical ? '#F44336' : '#FF9800' }]}>
      <View style={styles.alertHeader}>
        <Ionicons 
          name={alert.isCritical ? "warning" : "alert-circle"} 
          size={20} 
          color={alert.isCritical ? '#F44336' : '#FF9800'} 
        />
        <Text style={styles.alertTitle}>{alert.medicationName}</Text>
        <Text style={[styles.alertSeverity, { color: alert.isCritical ? '#F44336' : '#FF9800' }]}>
          {alert.isCritical ? 'CRITICAL' : 'UPCOMING'}
        </Text>
      </View>
      <Text style={styles.alertMessage}>
        {alert.userName} - {alert.daysUntilRefill} day{alert.daysUntilRefill !== 1 ? 's' : ''} until refill
      </Text>
      <Text style={styles.alertTimestamp}>Refill due: {formatDate(alert.refillDate)}</Text>
    </View>
  );

  const renderEmergencyAlertCard = (alert: EmergencyAlert) => (
    <TouchableOpacity 
      key={alert.id} 
      style={[styles.emergencyCard, { borderLeftColor: getSeverityColor(alert.severity) }]}
      onPress={() => setSelectedAlertDetails(alert)}
      activeOpacity={0.7}
    >
      <View style={styles.alertHeader}>
        <Ionicons 
          name={alert.type === 'Health' ? 'heart' : alert.type === 'Medication' ? 'medical' : 'warning'} 
          size={20} 
          color={getSeverityColor(alert.severity)} 
        />
        <Text style={styles.alertTitle}>{alert.userName}</Text>
        <Text style={[styles.alertSeverity, { color: getSeverityColor(alert.severity) }]}>
          {alert.severity.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      <Text style={styles.alertTimestamp}>{formatDate(alert.timestamp)} at {formatTime(alert.timestamp)}</Text>
      {alert.isResolved && (
        <View style={styles.resolvedBadge}>
          <Text style={styles.resolvedText}>RESOLVED</Text>
        </View>
      )}
      <View style={styles.tapIndicator}>
        <Text style={styles.tapIndicatorText}>Tap for details →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAlertDetails = () => {
    if (!selectedAlertDetails) return null;

    const alert = selectedAlertDetails;
    const details = alert.details;

    // Format health metric details
    const getHealthMetricDetails = () => {
      if (!details || alert.type !== 'Health') return null;

      switch (details.metric_type) {
        case 'blood_pressure':
          return {
            title: 'Blood Pressure Reading',
            values: [
              { label: 'Systolic', value: `${details.systolic} mmHg`, color: '#F44336' },
              { label: 'Diastolic', value: `${details.diastolic} mmHg`, color: '#F44336' },
              { label: 'Normal Range', value: '90-120 / 60-80 mmHg', color: '#4CAF50' },
              { label: 'Status', value: details.systolic > 180 || details.diastolic > 110 ? 'Critical - Seek immediate medical attention' : 'High - Monitor closely', color: '#F44336' },
            ],
            recommendations: [
              'Seek immediate medical attention if reading is consistently high',
              'Monitor blood pressure regularly',
              'Follow up with healthcare provider',
              'Consider lifestyle changes: reduce sodium, exercise regularly',
            ],
          };
        case 'heart_rate':
          return {
            title: 'Heart Rate Reading',
            values: [
              { label: 'Heart Rate', value: `${details.value} bpm`, color: '#F44336' },
              { label: 'Normal Range', value: '60-100 bpm', color: '#4CAF50' },
              { label: 'Status', value: details.value > 120 || details.value < 40 ? 'Critical - Seek immediate medical attention' : 'Abnormal - Monitor closely', color: '#F44336' },
            ],
            recommendations: [
              'Seek immediate medical attention for critical readings',
              'Avoid strenuous activity if heart rate is very high',
              'Monitor heart rate throughout the day',
              'Consult with healthcare provider',
            ],
          };
        case 'body_temperature':
          return {
            title: 'Body Temperature Reading',
            values: [
              { label: 'Temperature', value: `${details.value}°F`, color: '#F44336' },
              { label: 'Normal Range', value: '97-99°F', color: '#4CAF50' },
              { label: 'Status', value: details.value > 103 || details.value < 95 ? 'Critical - Seek immediate medical attention' : 'Abnormal - Monitor closely', color: '#F44336' },
            ],
            recommendations: [
              'Seek immediate medical attention for critical temperatures',
              'Stay hydrated',
              'Rest and monitor temperature regularly',
              'Contact healthcare provider if temperature persists',
            ],
          };
        case 'oxygen_level':
          return {
            title: 'Oxygen Level Reading',
            values: [
              { label: 'Oxygen Saturation', value: `${details.value}%`, color: '#F44336' },
              { label: 'Normal Range', value: '95-100%', color: '#4CAF50' },
              { label: 'Status', value: 'Critical - Low oxygen levels require immediate medical attention', color: '#F44336' },
            ],
            recommendations: [
              'Seek immediate emergency medical attention',
              'Sit upright and try to breathe slowly',
              'Do not ignore low oxygen levels',
              'Contact emergency services if below 90%',
            ],
          };
        default:
          return null;
      }
    };

    const healthDetails = getHealthMetricDetails();

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedAlertDetails !== null}
        onRequestClose={() => setSelectedAlertDetails(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.detailsHeaderRow}>
                <Ionicons 
                  name={alert.type === 'Health' ? 'heart' : alert.type === 'Medication' ? 'medical' : 'warning'} 
                  size={28} 
                  color={getSeverityColor(alert.severity)} 
                />
                <View style={styles.detailsTitleContainer}>
                  <Text style={styles.detailsTitle}>Critical Health Alert</Text>
                  <Text style={[styles.detailsSeverity, { color: getSeverityColor(alert.severity) }]}>
                    {alert.severity.toUpperCase()} SEVERITY
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedAlertDetails(null)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsContent}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Alert Information</Text>
                <View style={styles.detailsInfoRow}>
                  <Text style={styles.detailsLabel}>Patient:</Text>
                  <Text style={styles.detailsValue}>{alert.userName}</Text>
                </View>
                <View style={styles.detailsInfoRow}>
                  <Text style={styles.detailsLabel}>Alert Type:</Text>
                  <Text style={styles.detailsValue}>{alert.type}</Text>
                </View>
                <View style={styles.detailsInfoRow}>
                  <Text style={styles.detailsLabel}>Message:</Text>
                  <Text style={[styles.detailsValue, styles.alertMessageText]}>{alert.message}</Text>
                </View>
                <View style={styles.detailsInfoRow}>
                  <Text style={styles.detailsLabel}>Date & Time:</Text>
                  <Text style={styles.detailsValue}>
                    {formatDate(alert.timestamp)} at {formatTime(alert.timestamp)}
                  </Text>
                </View>
              </View>

              {healthDetails && (
                <>
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>{healthDetails.title}</Text>
                    {healthDetails.values.map((item, index) => (
                      <View key={index} style={styles.detailsInfoRow}>
                        <Text style={styles.detailsLabel}>{item.label}:</Text>
                        <Text style={[styles.detailsValue, { color: item.color }]}>{item.value}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Recommendations</Text>
                    {healthDetails.recommendations.map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.recommendationText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {details?.notes && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Additional Notes</Text>
                  <Text style={styles.notesText}>{details.notes}</Text>
                </View>
              )}

              {alert.isResolved && (
                <View style={styles.resolvedSection}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={styles.resolvedSectionText}>This alert has been resolved</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.detailsFooter}>
              <TouchableOpacity
                style={styles.closeDetailsButton}
                onPress={() => setSelectedAlertDetails(null)}
              >
                <Text style={styles.closeDetailsButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderInactivityAlertCard = (alert: InactivityAlert) => (
    <View key={alert.id} style={[styles.inactivityCard, { borderLeftColor: getAlertLevelColor(alert.alertLevel) }]}>
      <View style={styles.alertHeader}>
        <Ionicons 
          name="time-outline" 
          size={20} 
          color={getAlertLevelColor(alert.alertLevel)} 
        />
        <Text style={styles.alertTitle}>{alert.userName}</Text>
        <Text style={[styles.alertSeverity, { color: getAlertLevelColor(alert.alertLevel) }]}>
          {alert.alertLevel.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.alertMessage}>
        {alert.daysInactive === 999 ? 'No activity ever recorded' : `${alert.daysInactive} days inactive`}
      </Text>
      <Text style={styles.alertTimestamp}>
        Last activity: {formatDate(alert.lastActivityDate)}
      </Text>
      {alert.isResolved && (
        <View style={styles.resolvedBadge}>
          <Text style={styles.resolvedText}>RESOLVED</Text>
        </View>
      )}
    </View>
  );

  const renderDailyActivityCard = (activity: DailyActivity) => (
    <View key={activity.id} style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
        <Text style={styles.activityUser}>{activity.userName}</Text>
        <View style={styles.activityScore}>
          <Text style={styles.scoreText}>{activity.activityScore}%</Text>
        </View>
      </View>
      
      <View style={styles.activityMetrics}>
        <View style={styles.metricItem}>
          <Ionicons name="walk" size={16} color="#4CAF50" />
          <Text style={styles.metricText}>{activity.walkingMinutes} min</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="fitness" size={16} color="#2196F3" />
          <Text style={styles.metricText}>{activity.stretchingCompleted ? '✓' : '✗'}</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="leaf" size={16} color="#FF9800" />
          <Text style={styles.metricText}>{activity.breathingSessions}</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="moon" size={16} color="#9C27B0" />
          <Text style={styles.metricText}>{activity.sleepHours}h</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="bulb" size={16} color="#E91E63" />
          <Text style={styles.metricText}>{activity.brainGamesPlayed}</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="medical" size={16} color="#F44336" />
          <Text style={styles.metricText}>{activity.medicationsTaken}/{activity.totalMedications}</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="heart" size={16} color="#FF5722" />
          <Text style={styles.metricText}>{activity.healthReadings}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        <Text style={styles.headerTitle}>Personal Dashboard</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFFFFF" />
        }
      >
        {/* Timeframe Selector */}
        <View style={styles.timeframeSelector}>
          {(['7d', '30d', '90d'] as const).map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.timeframeButtonSelected
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text style={[
                styles.timeframeButtonText,
                selectedTimeframe === timeframe && styles.timeframeButtonTextSelected
              ]}>
                {getTimeframeLabel(timeframe)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        {stats && (
          <View style={styles.summaryGrid}>
            {renderStatsCard('trending-up', stats.walkDistance.toFixed(1), 'Walk Distance (km)', '#4CAF50')}
            {renderStatsCard('moon', stats.sleepDuration.toFixed(1), 'Sleep Duration (hrs)', '#9C27B0')}
            {renderStatsCard('medical', `${stats.medicationAdherence.toFixed(0)}%`, 'Med Adherence', '#F44336')}
            {renderStatsCard('bulb', stats.gamesPlayed.toFixed(1), 'Games Played', '#E91E63')}
            {renderStatsCard('checkmark-circle', stats.activeUsers > 0 ? 'Active' : 'Inactive', 'Status', stats.activeUsers > 0 ? '#4CAF50' : '#FF9800')}
            {renderStatsCard('warning', stats.criticalAlerts, 'Critical Alerts', stats.criticalAlerts > 0 ? '#F44336' : '#4CAF50')}
          </View>
        )}

        {/* Critical Alerts Summary */}
        {(stats?.criticalAlerts || 0) > 0 && (
          <View style={styles.criticalAlertsBanner}>
            <Ionicons name="warning" size={24} color="#FFFFFF" />
            <Text style={styles.criticalAlertsText}>
              {stats?.criticalAlerts} Critical Alert{(stats?.criticalAlerts || 0) !== 1 ? 's' : ''} Require Your Attention
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowHealthTrends(true)}
          >
            <Ionicons name="pulse" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Health Trends</Text>
            <Text style={styles.actionSubtext}>{healthTrends.length} readings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowMedicationAlerts(true)}
          >
            <Ionicons name="medical" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Med Alerts</Text>
            <Text style={styles.actionSubtext}>{medicationAlerts.length} alerts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowEmergencyAlerts(true)}
          >
            <Ionicons name="warning" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Critical Alerts</Text>
            <Text style={styles.actionSubtext}>
              {emergencyAlerts.filter(a => a.severity === 'Critical').length} critical
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowInactivityAlerts(true)}
          >
            <Ionicons name="time-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Inactivity</Text>
            <Text style={styles.actionSubtext}>{inactivityAlerts.length} alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Activities ({dailyActivities.length})</Text>
          {dailyActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.emptyStateText}>No activities recorded</Text>
            </View>
          ) : (
            <View style={styles.activitiesList}>
              {dailyActivities.slice(0, 10).map(renderDailyActivityCard)}
            </View>
          )}
        </View>

        {/* Critical Alerts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critical Alerts</Text>
          {emergencyAlerts.filter(a => a.severity === 'Critical').length > 0 ? (
            <View style={styles.alertsList}>
              {emergencyAlerts.filter(a => a.severity === 'Critical').map(renderEmergencyAlertCard)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={64} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.emptyStateText}>No critical alerts</Text>
              <Text style={styles.emptyStateSubtext}>Nothing to worry about</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Health Trends Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHealthTrends}
        onRequestClose={() => setShowHealthTrends(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Health Trends ({healthTrends.length})</Text>
              <TouchableOpacity onPress={() => setShowHealthTrends(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.trendsList}>
              {healthTrends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="heart-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.emptyStateText}>No health data available</Text>
                </View>
              ) : (
                healthTrends.map(renderHealthTrendCard)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Medication Alerts Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMedicationAlerts}
        onRequestClose={() => setShowMedicationAlerts(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Medication Alerts ({medicationAlerts.length})</Text>
              <TouchableOpacity onPress={() => setShowMedicationAlerts(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.alertsList}>
              {medicationAlerts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="medical-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.emptyStateText}>No medication alerts</Text>
                </View>
              ) : (
                medicationAlerts.map(renderMedicationAlertCard)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Critical Alerts Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEmergencyAlerts}
        onRequestClose={() => setShowEmergencyAlerts(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Critical Alerts ({emergencyAlerts.filter(a => a.severity === 'Critical').length})
              </Text>
              <TouchableOpacity onPress={() => setShowEmergencyAlerts(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.alertsList}>
              {emergencyAlerts.filter(a => a.severity === 'Critical').length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle" size={64} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.emptyStateText}>No critical alerts</Text>
                  <Text style={styles.emptyStateSubtext}>Nothing to worry about</Text>
                </View>
              ) : (
                emergencyAlerts.filter(a => a.severity === 'Critical').map(renderEmergencyAlertCard)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Inactivity Alerts Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showInactivityAlerts}
        onRequestClose={() => setShowInactivityAlerts(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Inactivity Alerts ({inactivityAlerts.length})</Text>
              <TouchableOpacity onPress={() => setShowInactivityAlerts(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.alertsList}>
              {inactivityAlerts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.emptyStateText}>No inactivity alerts</Text>
                </View>
              ) : (
                inactivityAlerts.map(renderInactivityAlertCard)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Alert Details Modal */}
      {renderAlertDetails()}
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
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
  },
  timeframeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeframeButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeframeButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  timeframeButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  criticalAlertsBanner: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.5)',
  },
  criticalAlertsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
  },
  emptyStateText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 15,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  activitiesList: {
    gap: 15,
  },
  activityCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  activityDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityUser: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
    textAlign: 'center',
  },
  activityScore: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activityMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  alertsList: {
    gap: 15,
  },
  alertCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
  },
  emergencyCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
  },
  inactivityCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  alertTimestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  resolvedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  resolvedText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
  trendsList: {
    gap: 15,
  },
  trendCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
  },
  trendDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  trendMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trendItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 10,
  },
  trendLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 5,
  },
  trendValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tapIndicator: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'flex-end',
  },
  tapIndicatorText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  detailsModalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailsTitleContainer: {
    marginLeft: 15,
    flex: 1,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailsSeverity: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  detailsContent: {
    maxHeight: '70%',
  },
  detailsSection: {
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  detailsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
  },
  detailsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  detailsValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  alertMessageText: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 5,
  },
  recommendationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  notesText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  resolvedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  resolvedSectionText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 10,
  },
  detailsFooter: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeDetailsButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  closeDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminDashboardScreen;