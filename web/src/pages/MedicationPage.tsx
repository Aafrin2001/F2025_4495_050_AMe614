import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MedicationService } from '../lib/medicationService';
import { Medication, MedicationStats, MedicationScheduleItem, User } from '../types';
import { 
  IoArrowBackOutline, 
  IoMedicalOutline, 
  IoAddCircleOutline, 
  IoPencilOutline, 
  IoTrashOutline, 
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoWarningOutline,
  IoCalendarOutline,
  IoFlaskOutline,
  IoEllipseOutline,
  IoWaterOutline,
  IoShieldOutline
} from 'react-icons/io5';
import './MedicationPage.css';

interface MedicationPageProps {
  user: User;
  userId?: string;
}

const MedicationPage: React.FC<MedicationPageProps> = ({ user, userId }) => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [stats, setStats] = useState<MedicationStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<MedicationScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMedications = useCallback(async () => {
    try {
      const result = await MedicationService.getUserMedications(userId);
      if (result.success && result.data) {
        setMedications(result.data);
      } else {
        console.error('Failed to load medications:', result.error);
      }
    } catch (error) {
      console.error('Error in loadMedications:', error);
    }
  }, [userId]);

  const loadStats = useCallback(async () => {
    try {
      const result = await MedicationService.getMedicationStats(userId);
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        console.error('Failed to load stats:', result.error);
      }
    } catch (error) {
      console.error('Error in loadStats:', error);
    }
  }, [userId]);

  const loadTodaySchedule = useCallback(async () => {
    try {
      const result = await MedicationService.getTodaySchedule(userId);
      if (result.success && result.data) {
        setTodaySchedule(result.data);
      } else {
        console.error('Failed to load schedule:', result.error);
      }
    } catch (error) {
      console.error('Error in loadTodaySchedule:', error);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMedications(),
        loadStats(),
        loadTodaySchedule()
      ]);
    } catch (error) {
      console.error('Error loading medication data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadMedications, loadStats, loadTodaySchedule]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, loadData]);

  const getMedicationTypeIcon = (type: string) => {
    switch (type) {
      case 'pill': return <IoEllipseOutline className="med-type-icon" />;
      case 'liquid': return <IoWaterOutline className="med-type-icon" />;
      case 'injection': return <IoShieldOutline className="med-type-icon" />;
      case 'cream': return <IoFlaskOutline className="med-type-icon" />;
      case 'inhaler': return <IoFlaskOutline className="med-type-icon" />;
      default: return <IoMedicalOutline className="med-type-icon" />;
    }
  };

  const getMedicationTypeColor = (type: string) => {
    switch (type) {
      case 'pill': return '#4CAF50';
      case 'liquid': return '#2196F3';
      case 'injection': return '#FF9800';
      case 'cream': return '#9C27B0';
      case 'inhaler': return '#00BCD4';
      default: return '#666666';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return '#FF6B6B';
      case 'due_now': return '#FFA726';
      case 'upcoming': return '#4CAF50';
      default: return '#666666';
    }
  };

  const backPath = user?.userType === 'offer' ? '/caregiver-dashboard' : '/dashboard';

  if (!user) {
    return (
      <div className="medication-page">
        <div className="loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="medication-page">
      <div className="page-header">
        <button onClick={() => navigate(backPath)} className="back-button">
          <IoArrowBackOutline className="back-icon" /> Back
        </button>
        <h1>Medications</h1>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading medications...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="stats-container">
                <div className="stats-grid">
                  <div className="stat-card">
                    <IoMedicalOutline className="stat-icon" />
                    <div className="stat-value">{stats.totalMedications}</div>
                    <div className="stat-label">Total Medications</div>
                  </div>
                  <div className="stat-card">
                    <IoTimeOutline className="stat-icon" />
                    <div className="stat-value">{stats.totalReminders}</div>
                    <div className="stat-label">Daily Reminders</div>
                  </div>
                  <div className="stat-card">
                    <IoWarningOutline className="stat-icon" />
                    <div className="stat-value">{stats.overdueMedications}</div>
                    <div className="stat-label">Overdue</div>
                  </div>
                  <div className="stat-card">
                    <IoCheckmarkCircleOutline className="stat-icon" />
                    <div className="stat-value">{stats.medicationsDueNow}</div>
                    <div className="stat-label">Due Now</div>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Schedule */}
            {todaySchedule.length > 0 && (
              <div className="schedule-section">
                <h2 className="section-title">
                  <IoCalendarOutline className="section-icon" /> Today's Schedule
                </h2>
                <div className="schedule-list">
                  {todaySchedule.slice(0, 5).map((item) => (
                    <div 
                      key={item.id} 
                      className="schedule-item"
                      style={{ borderLeftColor: getStatusColor(item.status) }}
                    >
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
                    <div className="more-schedule">
                      +{todaySchedule.length - 5} more scheduled for today
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medications List */}
            <div className="medications-section">
              <div className="section-header">
                <h2 className="section-title">
                  <IoMedicalOutline className="section-icon" /> All Medications
                </h2>
                <button className="add-button" onClick={() => alert('Add medication feature coming soon')}>
                  <IoAddCircleOutline className="add-icon" /> Add Medication
                </button>
              </div>

              {medications.length === 0 ? (
                <div className="empty-state">
                  <IoMedicalOutline className="empty-icon" />
                  <p>No medications added yet</p>
                  <button className="add-button" onClick={() => alert('Add medication feature coming soon')}>
                    <IoAddCircleOutline className="add-icon" /> Add Your First Medication
                  </button>
                </div>
              ) : (
                <div className="medications-list">
                  {medications.map(med => (
                    <div 
                      key={med.id} 
                      className="medication-card"
                      style={{ borderLeftColor: getMedicationTypeColor(med.type) }}
                    >
                      <div className="medication-header">
                        <div className="medication-info">
                          <div className="medication-type-row">
                            {getMedicationTypeIcon(med.type)}
                            <h3 className="medication-name">{med.name}</h3>
                            {!med.is_daily && (
                              <span className="prn-badge">PRN</span>
                            )}
                          </div>
                          <p className="medication-dosage">{med.dosage}</p>
                          <p className="medication-frequency">{med.frequency}</p>
                          {med.instruction && (
                            <p className="medication-instruction">{med.instruction}</p>
                          )}
                        </div>
                        <div className="medication-actions">
                          <button className="action-button edit" onClick={() => alert('Edit feature coming soon')}>
                            <IoPencilOutline />
                          </button>
                          <button className="action-button delete" onClick={() => alert('Delete feature coming soon')}>
                            <IoTrashOutline />
                          </button>
                        </div>
                      </div>
                      
                      {med.is_daily && med.time && med.time.length > 0 && (
                        <div className="medication-times">
                          <strong>Times:</strong>
                          <div className="times-list">
                            {med.time.map((time, index) => (
                              <span key={index} className="time-badge">{formatTime(time)}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {med.refill_date && (
                        <div className="medication-refill">
                          <strong>Refill Date:</strong> {new Date(med.refill_date).toLocaleDateString()}
                        </div>
                      )}

                      <div className="medication-footer">
                        <span className={`status-badge ${med.is_active ? 'active' : 'inactive'}`}>
                          {med.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MedicationPage;
