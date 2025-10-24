import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface AdminDashboardScreenProps {
  onBack: () => void;
}

interface DailyActivity {
  id: string;
  date: string;
  walkingMinutes: number;
  stretchingCompleted: boolean;
  breathingSessions: number;
  sleepHours: number;
  brainGamesPlayed: number;
  medicationsTaken: number;
  totalMedications: number;
  healthReadings: number;
}

interface HealthTrend {
  date: string;
  bloodPressure: string;
  heartRate: number;
  weight: number;
  mood: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

interface MedicationAlert {
  id: string;
  medicationName: string;
  currentStock: number;
  daysRemaining: number;
  isLow: boolean;
  isCritical: boolean;
  lastRefill: string;
}

interface EmergencyAlert {
  id: string;
  type: 'Health' | 'Medication' | 'Activity' | 'Safety';
  message: string;
  timestamp: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  isResolved: boolean;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onBack }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [showHealthTrends, setShowHealthTrends] = useState(false);
  const [showMedicationAlerts, setShowMedicationAlerts] = useState(false);
  const [showEmergencyAlerts, setShowEmergencyAlerts] = useState(false);

  // Mock data - in a real app, this would come from an API
  const dailyActivities: DailyActivity[] = [
    {
      id: '1',
      date: '2024-01-15',
      walkingMinutes: 25,
      stretchingCompleted: true,
      breathingSessions: 2,
      sleepHours: 7.5,
      brainGamesPlayed: 3,
      medicationsTaken: 3,
      totalMedications: 3,
      healthReadings: 2,
    },
    {
      id: '2',
      date: '2024-01-14',
      walkingMinutes: 15,
      stretchingCompleted: false,
      breathingSessions: 1,
      sleepHours: 6.8,
      brainGamesPlayed: 2,
      medicationsTaken: 2,
      totalMedications: 3,
      healthReadings: 1,
    },
    {
      id: '3',
      date: '2024-01-13',
      walkingMinutes: 30,
      stretchingCompleted: true,
      breathingSessions: 3,
      sleepHours: 8.2,
      brainGamesPlayed: 4,
      medicationsTaken: 3,
      totalMedications: 3,
      healthReadings: 3,
    },
  ];

  const healthTrends: HealthTrend[] = [
    { date: '2024-01-15', bloodPressure: '120/80', heartRate: 72, weight: 165, mood: 'Good' },
    { date: '2024-01-14', bloodPressure: '125/82', heartRate: 75, weight: 166, mood: 'Fair' },
    { date: '2024-01-13', bloodPressure: '118/78', heartRate: 70, weight: 165, mood: 'Excellent' },
    { date: '2024-01-12', bloodPressure: '130/85', heartRate: 78, weight: 167, mood: 'Fair' },
    { date: '2024-01-11', bloodPressure: '122/79', heartRate: 73, weight: 166, mood: 'Good' },
  ];

  const medicationAlerts: MedicationAlert[] = [
    {
      id: '1',
      medicationName: 'Lisinopril',
      currentStock: 5,
      daysRemaining: 3,
      isLow: true,
      isCritical: false,
      lastRefill: '2024-01-10',
    },
    {
      id: '2',
      medicationName: 'Metformin',
      currentStock: 2,
      daysRemaining: 1,
      isLow: true,
      isCritical: true,
      lastRefill: '2024-01-08',
    },
    {
      id: '3',
      medicationName: 'Albuterol',
      currentStock: 15,
      daysRemaining: 10,
      isLow: false,
      isCritical: false,
      lastRefill: '2024-01-12',
    },
  ];

  const emergencyAlerts: EmergencyAlert[] = [
    {
      id: '1',
      type: 'Medication',
      message: 'Metformin running critically low - only 1 day remaining',
      timestamp: '2024-01-15 14:30',
      severity: 'Critical',
      isResolved: false,
    },
    {
      id: '2',
      type: 'Health',
      message: 'Blood pressure reading above normal range',
      timestamp: '2024-01-14 09:15',
      severity: 'Medium',
      isResolved: true,
    },
    {
      id: '3',
      type: 'Activity',
      message: 'No physical activity recorded for 2 days',
      timestamp: '2024-01-13 18:00',
      severity: 'Low',
      isResolved: true,
    },
  ];

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

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Excellent': return '#4CAF50';
      case 'Good': return '#8BC34A';
      case 'Fair': return '#FF9800';
      case 'Poor': return '#F44336';
      default: return '#FFFFFF';
    }
  };

  const calculateAverage = (data: number[]) => {
    return data.length > 0 ? (data.reduce((sum, val) => sum + val, 0) / data.length).toFixed(1) : '0';
  };

  const renderActivityCard = (activity: DailyActivity) => (
    <View key={activity.id} style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityDate}>{activity.date}</Text>
        <View style={styles.activityScore}>
          <Text style={styles.scoreText}>
            {Math.round(((activity.walkingMinutes > 0 ? 1 : 0) + 
                         (activity.stretchingCompleted ? 1 : 0) + 
                         (activity.breathingSessions > 0 ? 1 : 0) + 
                         (activity.brainGamesPlayed > 0 ? 1 : 0) + 
                         (activity.medicationsTaken / activity.totalMedications)) * 20)}%
          </Text>
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
      </View>
    </View>
  );

  const renderHealthTrend = (trend: HealthTrend) => (
    <View key={trend.date} style={styles.trendCard}>
      <Text style={styles.trendDate}>{trend.date}</Text>
      <View style={styles.trendMetrics}>
        <View style={styles.trendItem}>
          <Text style={styles.trendLabel}>BP</Text>
          <Text style={styles.trendValue}>{trend.bloodPressure}</Text>
        </View>
        <View style={styles.trendItem}>
          <Text style={styles.trendLabel}>HR</Text>
          <Text style={styles.trendValue}>{trend.heartRate} bpm</Text>
        </View>
        <View style={styles.trendItem}>
          <Text style={styles.trendLabel}>Weight</Text>
          <Text style={styles.trendValue}>{trend.weight} lbs</Text>
        </View>
        <View style={styles.trendItem}>
          <Text style={[styles.trendValue, { color: getMoodColor(trend.mood) }]}>
            {trend.mood}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderMedicationAlert = (alert: MedicationAlert) => (
    <View key={alert.id} style={[styles.alertCard, { borderLeftColor: alert.isCritical ? '#F44336' : '#FF9800' }]}>
      <View style={styles.alertHeader}>
        <Ionicons 
          name={alert.isCritical ? "warning" : "alert-circle"} 
          size={20} 
          color={alert.isCritical ? '#F44336' : '#FF9800'} 
        />
        <Text style={styles.alertTitle}>{alert.medicationName}</Text>
        <Text style={[styles.alertSeverity, { color: alert.isCritical ? '#F44336' : '#FF9800' }]}>
          {alert.isCritical ? 'CRITICAL' : 'LOW STOCK'}
        </Text>
      </View>
      <Text style={styles.alertMessage}>
        Only {alert.daysRemaining} day{alert.daysRemaining !== 1 ? 's' : ''} remaining ({alert.currentStock} pills left)
      </Text>
      <Text style={styles.alertTimestamp}>Last refill: {alert.lastRefill}</Text>
    </View>
  );

  const renderEmergencyAlert = (alert: EmergencyAlert) => (
    <View key={alert.id} style={[styles.emergencyCard, { borderLeftColor: getSeverityColor(alert.severity) }]}>
      <View style={styles.alertHeader}>
        <Ionicons 
          name={alert.type === 'Health' ? 'heart' : alert.type === 'Medication' ? 'medical' : 'warning'} 
          size={20} 
          color={getSeverityColor(alert.severity)} 
        />
        <Text style={styles.alertTitle}>{alert.type} Alert</Text>
        <Text style={[styles.alertSeverity, { color: getSeverityColor(alert.severity) }]}>
          {alert.severity.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.alertMessage}>{alert.message}</Text>
      <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
      {alert.isResolved && (
        <View style={styles.resolvedBadge}>
          <Text style={styles.resolvedText}>RESOLVED</Text>
        </View>
      )}
    </View>
  );

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
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.summaryNumber}>
              {calculateAverage(dailyActivities.map(a => a.walkingMinutes))}
            </Text>
            <Text style={styles.summaryLabel}>Avg Walk (min)</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Ionicons name="moon" size={24} color="#9C27B0" />
            <Text style={styles.summaryNumber}>
              {calculateAverage(dailyActivities.map(a => a.sleepHours))}
            </Text>
            <Text style={styles.summaryLabel}>Avg Sleep (hrs)</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Ionicons name="medical" size={24} color="#F44336" />
            <Text style={styles.summaryNumber}>
              {Math.round(dailyActivities.reduce((sum, a) => sum + (a.medicationsTaken / a.totalMedications), 0) / dailyActivities.length * 100)}%
            </Text>
            <Text style={styles.summaryLabel}>Med Adherence</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Ionicons name="bulb" size={24} color="#E91E63" />
            <Text style={styles.summaryNumber}>
              {calculateAverage(dailyActivities.map(a => a.brainGamesPlayed))}
            </Text>
            <Text style={styles.summaryLabel}>Avg Games</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowHealthTrends(true)}
          >
            <Ionicons name="pulse" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Health Trends</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowMedicationAlerts(true)}
          >
            <Ionicons name="medical" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Med Alerts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowEmergencyAlerts(true)}
          >
            <Ionicons name="warning" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Emergencies</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Activities</Text>
          <View style={styles.activitiesList}>
            {dailyActivities.map(renderActivityCard)}
          </View>
        </View>

        {/* Critical Alerts */}
        {medicationAlerts.filter(a => a.isCritical).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Critical Alerts</Text>
            <View style={styles.alertsList}>
              {medicationAlerts.filter(a => a.isCritical).map(renderMedicationAlert)}
            </View>
          </View>
        )}
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
              <Text style={styles.modalTitle}>Health Trends</Text>
              <TouchableOpacity onPress={() => setShowHealthTrends(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.trendsList}>
              {healthTrends.map(renderHealthTrend)}
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
              <Text style={styles.modalTitle}>Medication Alerts</Text>
              <TouchableOpacity onPress={() => setShowMedicationAlerts(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.alertsList}>
              {medicationAlerts.map(renderMedicationAlert)}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Emergency Alerts Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEmergencyAlerts}
        onRequestClose={() => setShowEmergencyAlerts(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency Alerts</Text>
              <TouchableOpacity onPress={() => setShowEmergencyAlerts(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.alertsList}>
              {emergencyAlerts.map(renderEmergencyAlert)}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
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
  emergencyCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
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
    justifyContent: 'space-between',
  },
  trendItem: {
    alignItems: 'center',
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
});

export default AdminDashboardScreen;
