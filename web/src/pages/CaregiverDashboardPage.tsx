import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoLogOutOutline, IoMedicalOutline, IoHeartOutline, IoWalkOutline, IoStatsChartOutline, IoCalendarOutline, IoWarningOutline, IoTimeOutline, IoCheckmarkCircleOutline, IoRocketOutline, IoPulseOutline, IoRefreshOutline, IoHourglassOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { User } from '../types';
import { MedicationService } from '../lib/medicationService';
import { healthMetricsService } from '../lib/healthMetrics';
import { ActivityService } from '../lib/activityService';
import { AdminDashboardService } from '../lib/adminDashboardService';
import { MedicationStats, MedicationScheduleItem, HealthMetricsSummary, ActivityStats, EmergencyAlert } from '../types';
import './CaregiverDashboardPage.css';

interface CaregiverDashboardPageProps {
  user: User;
  onLogout: () => void;
}

const CaregiverDashboardPage: React.FC<CaregiverDashboardPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [medicationStats, setMedicationStats] = useState<MedicationStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<MedicationScheduleItem[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthMetricsSummary | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user.seniorUserId) {
      loadDashboardData();
      const interval = setInterval(() => {
        loadTodaySchedule();
      }, 60000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user.seniorUserId]);

  const loadDashboardData = async () => {
    if (!user.seniorUserId) return;
    setLoading(true);
    await Promise.all([
      loadMedicationStats(),
      loadTodaySchedule(),
      loadHealthSummary(),
      loadActivityStats(),
      loadCriticalAlerts(),
    ]);
    setLoading(false);
  };

  const loadMedicationStats = async () => {
    if (!user.seniorUserId) return;
    const result = await MedicationService.getMedicationStats(user.seniorUserId);
    if (result.success && result.data) {
      setMedicationStats(result.data);
    }
  };

  const loadTodaySchedule = async () => {
    if (!user.seniorUserId) return;
    const result = await MedicationService.getTodaySchedule(user.seniorUserId);
    if (result.success && result.data) {
      setTodaySchedule(result.data);
    }
  };

  const loadHealthSummary = async () => {
    if (!user.seniorUserId) return;
    const result = await healthMetricsService.getLatestMetrics(user.seniorUserId);
    if (result.data) {
      setHealthSummary(result.data);
    }
  };

  const loadActivityStats = async () => {
    if (!user.seniorUserId) return;
    const result = await ActivityService.getUserActivityStats(user.seniorUserId);
    if (result.success && result.data) {
      setActivityStats(result.data);
    }
  };

  const loadCriticalAlerts = async () => {
    if (!user.seniorUserId) return;
    const result = await AdminDashboardService.getEmergencyAlerts(user.seniorUserId);
    if (result.success && result.data) {
      const critical = result.data.filter(a => a.severity === 'Critical');
      setCriticalAlerts(critical);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return '#F44336';
      case 'due_now': return '#FF9800';
      case 'upcoming': return '#4CAF50';
      default: return '#666666';
    }
  };

  const capitalizeName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="caregiver-dashboard-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading senior's dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user.seniorUserId) {
    return (
      <div className="caregiver-dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1>Caregiver Dashboard</h1>
            <p>No senior account connected</p>
          </div>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
        <div className="main-content">
          <div className="pending-card">
            <IoHourglassOutline className="pending-icon" />
            <h2>Access Pending Approval</h2>
            <p>Your request to monitor {user.seniorEmail || 'the senior'} is pending approval.</p>
            <p>The senior will need to approve your access request before you can view their health information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="caregiver-dashboard-page">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Caregiver Dashboard</h1>
            <p className="header-subtitle">Monitoring: {user.seniorEmail || 'Senior Account'}</p>
          </div>
          <button onClick={onLogout} className="logout-button">
            <IoLogOutOutline className="icon" /> Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        {/* Critical Alerts Banner - Always show for caregivers */}
        <div 
          className={`critical-alerts-banner ${criticalAlerts.length > 0 ? 'has-alerts' : 'no-alerts'}`}
          onClick={() => navigate('/admin-dashboard')}
        >
          {criticalAlerts.length > 0 ? (
            <IoWarningOutline className="alert-icon" />
          ) : (
            <IoCheckmarkCircleOutline className="alert-icon" />
          )}
          <div className="alert-content">
            <h3>
              {criticalAlerts.length > 0 
                ? `${criticalAlerts.length} Critical Alert${criticalAlerts.length !== 1 ? 's' : ''}`
                : 'No Critical Alerts'
              }
            </h3>
            <p>{criticalAlerts.length > 0 ? 'Tap to view details' : 'Nothing to worry about'}</p>
          </div>
          <IoChevronForwardOutline className="alert-arrow" />
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card primary" onClick={() => navigate('/medications')}>
            <IoMedicalOutline className="stat-icon" />
            <div className="stat-info">
              <div className="stat-value">{medicationStats?.totalMedications || 0}</div>
              <div className="stat-label">Total Medications</div>
            </div>
            {medicationStats && medicationStats.medicationsDueNow > 0 && (
              <div className="stat-badge">{medicationStats.medicationsDueNow} due</div>
            )}
          </div>

          <div className="stat-card success" onClick={() => navigate('/health-monitoring')}>
            <IoHeartOutline className="stat-icon" />
            <div className="stat-info">
              <div className="stat-value">
                {healthSummary ? Object.values(healthSummary).filter(m => m !== null).length : 0}
              </div>
              <div className="stat-label">Health Metrics</div>
            </div>
          </div>

          <div className="stat-card info" onClick={() => navigate('/activities')}>
            <IoWalkOutline className="stat-icon" />
            <div className="stat-info">
              <div className="stat-value">{activityStats?.totalActivities || 0}</div>
              <div className="stat-label">Activities</div>
            </div>
            {activityStats && activityStats.activitiesThisWeek > 0 && (
              <div className="stat-badge">{activityStats.activitiesThisWeek} this week</div>
            )}
          </div>

          <div className="stat-card warning" onClick={() => navigate('/admin-dashboard')}>
            <IoWarningOutline className="stat-icon" />
            <div className="stat-info">
              <div className="stat-value">{criticalAlerts.length}</div>
              <div className="stat-label">Critical Alerts</div>
            </div>
          </div>
        </div>

        {/* Today's Medication Schedule */}
        <div className="section-card">
          <div className="section-header">
            <h2><IoCalendarOutline className="section-icon" /> Today's Medication Schedule</h2>
            <button className="view-all-btn" onClick={() => navigate('/medications')}>
              View All <IoChevronForwardOutline className="arrow-icon" />
            </button>
          </div>
          {todaySchedule.length === 0 ? (
            <div className="empty-state-small">
              <p>No medications scheduled for today</p>
            </div>
          ) : (
            <div className="schedule-list">
              {todaySchedule.slice(0, 5).map((item) => (
                <div key={item.id} className="schedule-item" style={{ borderLeftColor: getStatusColor(item.status) }}>
                  <div className="schedule-time">{formatTime(item.scheduled_time)}</div>
                  <div className="schedule-details">
                    <div className="schedule-name">{item.name}</div>
                    <div className="schedule-dosage">{item.dosage}</div>
                  </div>
                  <div className="schedule-status" style={{ color: getStatusColor(item.status) }}>
                    {item.status === 'overdue' ? (
                      <><IoWarningOutline className="status-icon" /> Overdue</>
                    ) : item.status === 'due_now' ? (
                      <><IoTimeOutline className="status-icon" /> Due Now</>
                    ) : (
                      <><IoCheckmarkCircleOutline className="status-icon" /> Upcoming</>
                    )}
                  </div>
                </div>
              ))}
              {todaySchedule.length > 5 && (
                <div className="more-items" onClick={() => navigate('/medications')}>
                  +{todaySchedule.length - 5} more medications
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="section-card quick-actions-section">
          <h2><IoRocketOutline className="section-icon" /> Quick Actions</h2>
          <div className="quick-actions-grid">
            <div className="quick-action" onClick={() => navigate('/admin-dashboard')}>
              <IoWarningOutline className="action-icon" />
              <div className="action-label">Critical Alerts</div>
            </div>
            <div className="quick-action" onClick={() => navigate('/admin-dashboard')}>
              <IoStatsChartOutline className="action-icon" />
              <div className="action-label">Dashboard</div>
            </div>
            <div className="quick-action" onClick={() => navigate('/medications')}>
              <IoMedicalOutline className="action-icon" />
              <div className="action-label">Medications</div>
            </div>
            <div className="quick-action" onClick={() => navigate('/health-monitoring')}>
              <IoHeartOutline className="action-icon" />
              <div className="action-label">Monitor</div>
            </div>
          </div>
        </div>

        {/* Health Metrics Summary */}
        {healthSummary && (
          <div className="section-card health-metrics-section">
            <h2><IoPulseOutline className="section-icon" /> Latest Health Metrics</h2>
            <div className="health-metrics-grid">
              {healthSummary.blood_pressure && (
                <div className="metric-item">
                  <div className="metric-label">Blood Pressure</div>
                  <div className="metric-value">
                    {healthSummary.blood_pressure.systolic}/{healthSummary.blood_pressure.diastolic} mmHg
                  </div>
                </div>
              )}
              {healthSummary.heart_rate && (
                <div className="metric-item">
                  <div className="metric-label">Heart Rate</div>
                  <div className="metric-value">{healthSummary.heart_rate.value} bpm</div>
                </div>
              )}
              {healthSummary.body_temperature && (
                <div className="metric-item">
                  <div className="metric-label">Temperature</div>
                  <div className="metric-value">{healthSummary.body_temperature.value}°{healthSummary.body_temperature.unit}</div>
                </div>
              )}
              {healthSummary.weight && (
                <div className="metric-item">
                  <div className="metric-label">Weight</div>
                  <div className="metric-value">{healthSummary.weight.value} {healthSummary.weight.unit}</div>
                </div>
              )}
            </div>
            <button className="view-all-btn" onClick={() => navigate('/health-monitoring')}>
              View All Metrics <IoChevronForwardOutline className="arrow-icon" />
            </button>
          </div>
        )}
      </div>

      <button className="refresh-button" onClick={handleRefresh} disabled={refreshing}>
        <IoRefreshOutline className="refresh-icon" />
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
};

export default CaregiverDashboardPage;
