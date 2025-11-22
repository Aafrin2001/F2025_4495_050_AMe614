import React, { useState, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import './CaregiverDashboardScreen.css'
import { CaregiverService, CaregiverRelationship } from '../lib/caregiverService'
import { healthMetricsService } from '../lib/healthMetrics'
import { MedicationService } from '../lib/medicationService'
import { ActivityService } from '../lib/activityService'
import { User } from '../types'
import { auth } from '../lib/supabase'

interface CaregiverDashboardScreenProps {
  caregiver: User
  seniorUserId?: string
  onBack?: () => void
  onViewAlerts?: () => void
  onViewDashboard?: () => void
  onViewMedication?: () => void
  onViewMonitor?: () => void
  onLogout: () => void
  onSettingsPress?: () => void
  onSeniorAdded?: (seniorEmail: string, seniorUserId?: string) => void
}

interface PatientInfo {
  id: string
  email: string
  name: string
  status: 'approved' | 'pending' | 'rejected'
  seniorId?: string
  relationshipId: string
  requestedAt: string
  approvedAt?: string
  // Health data
  healthSummary?: {
    heartRate?: number
    bloodPressure?: { systolic: number; diastolic: number }
    temperature?: number
    weight?: number
    lastUpdated?: string
  }
  medicationStatus?: {
    total: number
    taken: number
    missed: number
    nextDose?: string
  }
  activitySummary?: {
    todaySteps?: number
    todayCalories?: number
    todayDistance?: number
    lastActivity?: string
  }
  recentAlerts?: Array<{
    id: string
    type: 'medication' | 'health' | 'activity' | 'emergency'
    message: string
    timestamp: string
    severity: 'low' | 'medium' | 'high'
  }>
}

const CaregiverDashboardScreen: React.FC<CaregiverDashboardScreenProps> = ({
  caregiver,
  seniorUserId,
  onViewAlerts,
  onViewDashboard,
  onViewMedication,
  onViewMonitor,
  onLogout,
  onSettingsPress,
  onSeniorAdded,
}) => {
  const [patients, setPatients] = useState<PatientInfo[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [showAddPatientModal, setShowAddPatientModal] = useState(false)
  const [seniorEmail, setSeniorEmail] = useState('')
  const [isAddingPatient, setIsAddingPatient] = useState(false)

  // Load patients on mount
  useEffect(() => {
    if (caregiver?.id) {
      loadPatients()
    }
  }, [caregiver?.id])

  const loadPatients = async () => {
    if (!caregiver?.id) return

    setIsLoading(true)
    setError(null)
    try {
      // Fetch caregiver relationships
      const { success, data: relationships, error: relError } = await CaregiverService.getCaregiverRelationships(caregiver.id)

      if (!success || !relationships) {
        setError(relError || 'Failed to load patients')
        setIsLoading(false)
        return
      }

      // Convert relationships to patient info
      const patientsData: PatientInfo[] = relationships.map(rel => {
        const emailParts = rel.senior_email.split('@')
        const nameFromEmail = emailParts[0].split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')

        return {
          id: rel.id,
          email: rel.senior_email,
          name: nameFromEmail,
          status: rel.status as 'approved' | 'pending' | 'rejected',
          seniorId: rel.senior_id || undefined,
          relationshipId: rel.id,
          requestedAt: rel.requested_at,
          approvedAt: rel.approved_at || undefined,
        }
      })

      // Load health data for approved patients
      const patientsWithData = await Promise.all(
        patientsData.map(async (patient) => {
          if (patient.status === 'approved' && patient.seniorId) {
            try {
              // Load health metrics
              const healthResult = await healthMetricsService.getLatestMetrics(patient.seniorId)
              const healthSummary = healthResult.data ? {
                heartRate: healthResult.data.heart_rate?.value,
                bloodPressure: healthResult.data.blood_pressure ? {
                  systolic: healthResult.data.blood_pressure.systolic || 0,
                  diastolic: healthResult.data.blood_pressure.diastolic || 0,
                } : undefined,
                temperature: healthResult.data.body_temperature?.value,
                weight: healthResult.data.weight?.value,
                lastUpdated: healthResult.data.heart_rate?.recorded_at || 
                            healthResult.data.blood_pressure?.recorded_at ||
                            healthResult.data.body_temperature?.recorded_at,
              } : undefined

              // Load medication status
              const medResult = await MedicationService.getTodaySchedule(patient.seniorId)
              const scheduleItems = medResult.data || []
              const medicationStatus = {
                total: scheduleItems.length,
                taken: scheduleItems.filter(item => item.status === 'taken').length,
                missed: scheduleItems.filter(item => item.status === 'missed').length,
                nextDose: scheduleItems.find(item => item.status === 'upcoming')?.time,
              }

              // Load activity summary
              const activityResult = await ActivityService.getUserActivities(10, patient.seniorId)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const todayActivities = activityResult.data?.filter(act => {
                const actDate = new Date(act.start_time)
                actDate.setHours(0, 0, 0, 0)
                return actDate.getTime() === today.getTime()
              }) || []

              const activitySummary = {
                todaySteps: todayActivities.reduce((sum, act) => sum + (act.distance || 0) * 1250, 0), // Approximate steps
                todayCalories: todayActivities.reduce((sum, act) => sum + (act.calories_burned || 0), 0),
                todayDistance: todayActivities.reduce((sum, act) => sum + (act.distance || 0), 0),
                lastActivity: activityResult.data?.[0]?.start_time,
              }

              // Generate recent alerts
              const recentAlerts: PatientInfo['recentAlerts'] = []
              
              // Medication alerts
              if (medicationStatus.missed > 0) {
                recentAlerts.push({
                  id: `med-${patient.id}`,
                  type: 'medication',
                  message: `${medicationStatus.missed} missed medication${medicationStatus.missed > 1 ? 's' : ''} today`,
                  timestamp: new Date().toISOString(),
                  severity: medicationStatus.missed > 2 ? 'high' : 'medium',
                })
              }

              // Health alerts
              if (healthSummary?.heartRate) {
                if (healthSummary.heartRate < 60 || healthSummary.heartRate > 100) {
                  recentAlerts.push({
                    id: `hr-${patient.id}`,
                    type: 'health',
                    message: `Heart rate ${healthSummary.heartRate} bpm is outside normal range`,
                    timestamp: healthSummary.lastUpdated || new Date().toISOString(),
                    severity: healthSummary.heartRate < 50 || healthSummary.heartRate > 120 ? 'high' : 'medium',
                  })
                }
              }

              if (healthSummary?.bloodPressure) {
                const { systolic, diastolic } = healthSummary.bloodPressure
                if (systolic > 140 || diastolic > 90) {
                  recentAlerts.push({
                    id: `bp-${patient.id}`,
                    type: 'health',
                    message: `Blood pressure ${systolic}/${diastolic} mmHg is elevated`,
                    timestamp: healthSummary.lastUpdated || new Date().toISOString(),
                    severity: systolic > 160 || diastolic > 100 ? 'high' : 'medium',
                  })
                }
              }

              return {
                ...patient,
                healthSummary,
                medicationStatus,
                activitySummary,
                recentAlerts: recentAlerts.slice(0, 5), // Limit to 5 most recent
              }
            } catch (err: any) {
              console.error(`Error loading data for patient ${patient.id}:`, err)
              return patient
            }
          }
          return patient
        })
      )

      setPatients(patientsWithData)
      setLastSyncTime(new Date())

      // Set primary senior if provided
      if (seniorUserId) {
        const primaryPatient = patientsWithData.find(p => p.seniorId === seniorUserId)
        if (primaryPatient) {
          setSelectedPatient(primaryPatient)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadPatients()
    setIsRefreshing(false)
  }

  const handleAddPatient = async () => {
    if (!seniorEmail.trim()) {
      setError('Please enter the senior\'s email address')
      return
    }

    if (!caregiver?.id) {
      setError('Caregiver information not available')
      return
    }

    setIsAddingPatient(true)
    setError(null)
    try {
      const { user } = await auth.getCurrentUser()
      if (!user) {
        setError('Could not retrieve user information. Please try logging in again.')
        setIsAddingPatient(false)
        return
      }

      // Request caregiver access
      const requestResult = await CaregiverService.requestAccess(
        seniorEmail.trim(),
        user.id,
        user.email || ''
      )

      if (!requestResult.success) {
        setError(requestResult.error || 'Could not create access request.')
        setIsAddingPatient(false)
        return
      }

      // Verify if already approved
      const verifyResult = await CaregiverService.verifyAccess(
        user.id,
        seniorEmail.trim()
      )

      if (verifyResult.success && verifyResult.relationship) {
        // Already approved
        if (onSeniorAdded) {
          onSeniorAdded(verifyResult.relationship.senior_email, verifyResult.relationship.senior_id || undefined)
        }
        setShowAddPatientModal(false)
        setSeniorEmail('')
        await loadPatients()
      } else {
        // Pending approval
        alert(`Access request sent to ${seniorEmail.trim()}. The senior will need to approve your access.\n\nVerification Code: ${requestResult.verificationCode}`)
        setShowAddPatientModal(false)
        setSeniorEmail('')
        await loadPatients()
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsAddingPatient(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved': return '#4CAF50'
      case 'pending': return '#FFA726'
      case 'rejected': return '#F44336'
      default: return '#9E9E9E'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'approved': return 'Active'
      case 'pending': return 'Pending Approval'
      case 'rejected': return 'Rejected'
      default: return 'Unknown'
    }
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return '#F44336'
      case 'medium': return '#FF9800'
      case 'low': return '#2196F3'
      default: return '#9E9E9E'
    }
  }

  const approvedPatients = patients.filter(p => p.status === 'approved')
  const pendingPatients = patients.filter(p => p.status === 'pending')
  const rejectedPatients = patients.filter(p => p.status === 'rejected')

  return (
    <div className="caregiver-dashboard-screen">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">Caregiver Dashboard</h1>
          <p className="dashboard-subtitle">Manage your patients and monitor their health</p>
        </div>
        <div className="header-actions">
          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh data"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isRefreshing ? 'spinning' : ''}
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
          {onSettingsPress && (
            <button className="settings-button" onClick={onSettingsPress} title="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
              </svg>
            </button>
          )}
          <button className="logout-button" onClick={onLogout} title="Logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {lastSyncTime && (
        <div className="sync-timestamp">
          Last synced: {format(lastSyncTime, 'PPp')} ({formatDistanceToNow(lastSyncTime, { addSuffix: true })})
        </div>
      )}

      <div className="dashboard-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading patients...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{approvedPatients.length}</div>
                  <div className="stat-label">Active Patients</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(255, 167, 38, 0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{pendingPatients.length}</div>
                  <div className="stat-label">Pending Requests</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(244, 67, 54, 0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {patients.reduce((sum, p) => sum + (p.recentAlerts?.filter(a => a.severity === 'high').length || 0), 0)}
                  </div>
                  <div className="stat-label">High Priority Alerts</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(33, 150, 243, 0.2)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {patients.reduce((sum, p) => sum + (p.medicationStatus?.missed || 0), 0)}
                  </div>
                  <div className="stat-label">Missed Medications</div>
                </div>
              </div>
            </div>

            {/* Add Patient Button */}
            <div className="section-header">
              <h2 className="section-title">Patients</h2>
              <button className="add-patient-button" onClick={() => setShowAddPatientModal(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Patient
              </button>
            </div>

            {/* Approved Patients */}
            {approvedPatients.length > 0 && (
              <div className="patients-section">
                <h3 className="patients-section-title">Active Patients</h3>
                <div className="patients-grid">
                  {approvedPatients.map(patient => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      getStatusColor={getStatusColor}
                      getStatusLabel={getStatusLabel}
                      getSeverityColor={getSeverityColor}
                      onViewDashboard={onViewDashboard}
                      onViewMonitor={onViewMonitor}
                      onViewMedication={onViewMedication}
                      onViewAlerts={onViewAlerts}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Patients */}
            {pendingPatients.length > 0 && (
              <div className="patients-section">
                <h3 className="patients-section-title">Pending Approval</h3>
                <div className="patients-grid">
                  {pendingPatients.map(patient => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      getStatusColor={getStatusColor}
                      getStatusLabel={getStatusLabel}
                      getSeverityColor={getSeverityColor}
                      onViewDashboard={onViewDashboard}
                      onViewMonitor={onViewMonitor}
                      onViewMedication={onViewMedication}
                      onViewAlerts={onViewAlerts}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Patients */}
            {rejectedPatients.length > 0 && (
              <div className="patients-section">
                <h3 className="patients-section-title">Rejected Requests</h3>
                <div className="patients-grid">
                  {rejectedPatients.map(patient => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      getStatusColor={getStatusColor}
                      getStatusLabel={getStatusLabel}
                      getSeverityColor={getSeverityColor}
                      onViewDashboard={onViewDashboard}
                      onViewMonitor={onViewMonitor}
                      onViewMedication={onViewMedication}
                      onViewAlerts={onViewAlerts}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Patients */}
            {patients.length === 0 && (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h3>No Patients Yet</h3>
                <p>Add your first patient to start monitoring their health</p>
                <button className="add-patient-button primary" onClick={() => setShowAddPatientModal(true)}>
                  Add Patient
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="modal-overlay" onClick={() => setShowAddPatientModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Patient</h2>
              <button className="modal-close" onClick={() => setShowAddPatientModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Enter the email address of the senior you'd like to monitor
              </p>
              <div className="form-group">
                <label>Senior's Email Address</label>
                <input
                  type="email"
                  value={seniorEmail}
                  onChange={e => setSeniorEmail(e.target.value)}
                  placeholder="senior@example.com"
                  disabled={isAddingPatient}
                  onKeyPress={e => e.key === 'Enter' && handleAddPatient()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddPatientModal(false)} disabled={isAddingPatient}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddPatient} disabled={isAddingPatient || !seniorEmail.trim()}>
                {isAddingPatient ? 'Requesting...' : 'Request Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Patient Card Component
interface PatientCardProps {
  patient: PatientInfo
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
  getSeverityColor: (severity: string) => string
  onViewDashboard?: () => void
  onViewMonitor?: () => void
  onViewMedication?: () => void
  onViewAlerts?: () => void
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  getStatusColor,
  getStatusLabel,
  getSeverityColor,
  onViewDashboard,
  onViewMonitor,
  onViewMedication,
  onViewAlerts,
}) => {
  const initials = patient.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="patient-card">
      <div className="patient-card-header">
        <div className="patient-avatar">
          <div className="patient-avatar-circle">{initials}</div>
          <div
            className="patient-status-indicator"
            style={{ backgroundColor: getStatusColor(patient.status) }}
          />
        </div>
        <div className="patient-info">
          <h3 className="patient-name">{patient.name}</h3>
          <p className="patient-email">{patient.email}</p>
          <div className="patient-status-badge" style={{ backgroundColor: getStatusColor(patient.status) }}>
            {getStatusLabel(patient.status)}
          </div>
        </div>
      </div>

      {patient.status === 'approved' && patient.seniorId && (
        <>
          {/* Health Summary */}
          {patient.healthSummary && (
            <div className="patient-section">
              <h4 className="patient-section-title">Health Summary</h4>
              <div className="health-metrics-grid">
                {patient.healthSummary.heartRate && (
                  <div className="health-metric">
                    <span className="metric-label">Heart Rate</span>
                    <span className="metric-value">{patient.healthSummary.heartRate} bpm</span>
                  </div>
                )}
                {patient.healthSummary.bloodPressure && (
                  <div className="health-metric">
                    <span className="metric-label">Blood Pressure</span>
                    <span className="metric-value">
                      {patient.healthSummary.bloodPressure.systolic}/{patient.healthSummary.bloodPressure.diastolic} mmHg
                    </span>
                  </div>
                )}
                {patient.healthSummary.temperature && (
                  <div className="health-metric">
                    <span className="metric-label">Temperature</span>
                    <span className="metric-value">{patient.healthSummary.temperature}°F</span>
                  </div>
                )}
                {patient.healthSummary.weight && (
                  <div className="health-metric">
                    <span className="metric-label">Weight</span>
                    <span className="metric-value">{patient.healthSummary.weight} lbs</span>
                  </div>
                )}
              </div>
              {patient.healthSummary.lastUpdated && (
                <p className="last-updated">
                  Updated {formatDistanceToNow(new Date(patient.healthSummary.lastUpdated), { addSuffix: true })}
                </p>
              )}
            </div>
          )}

          {/* Medication Status */}
          {patient.medicationStatus && (
            <div className="patient-section">
              <h4 className="patient-section-title">Medications</h4>
              <div className="medication-status">
                <div className="medication-stat">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{patient.medicationStatus.total}</span>
                </div>
                <div className="medication-stat success">
                  <span className="stat-label">Taken</span>
                  <span className="stat-value">{patient.medicationStatus.taken}</span>
                </div>
                <div className="medication-stat error">
                  <span className="stat-label">Missed</span>
                  <span className="stat-value">{patient.medicationStatus.missed}</span>
                </div>
              </div>
              {patient.medicationStatus.nextDose && (
                <p className="next-dose">Next dose: {patient.medicationStatus.nextDose}</p>
              )}
            </div>
          )}

          {/* Activity Summary */}
          {patient.activitySummary && (
            <div className="patient-section">
              <h4 className="patient-section-title">Activity Today</h4>
              <div className="activity-stats">
                {patient.activitySummary.todaySteps && (
                  <div className="activity-stat">
                    <span className="activity-label">Steps</span>
                    <span className="activity-value">{Math.round(patient.activitySummary.todaySteps)}</span>
                  </div>
                )}
                {patient.activitySummary.todayCalories && (
                  <div className="activity-stat">
                    <span className="activity-label">Calories</span>
                    <span className="activity-value">{Math.round(patient.activitySummary.todayCalories)}</span>
                  </div>
                )}
                {patient.activitySummary.todayDistance && (
                  <div className="activity-stat">
                    <span className="activity-label">Distance</span>
                    <span className="activity-value">{patient.activitySummary.todayDistance.toFixed(1)} mi</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Alerts */}
          {patient.recentAlerts && patient.recentAlerts.length > 0 && (
            <div className="patient-section">
              <h4 className="patient-section-title">Recent Alerts</h4>
              <div className="alerts-list">
                {patient.recentAlerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="alert-item" style={{ borderLeftColor: getSeverityColor(alert.severity) }}>
                    <div className="alert-content">
                      <span className="alert-type">{alert.type}</span>
                      <span className="alert-message">{alert.message}</span>
                    </div>
                    <span className="alert-time">
                      {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="patient-actions">
            {onViewMonitor && (
              <button className="patient-action-btn" onClick={onViewMonitor}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Monitor
              </button>
            )}
            {onViewMedication && (
              <button className="patient-action-btn" onClick={onViewMedication}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Medications
              </button>
            )}
            {onViewDashboard && (
              <button className="patient-action-btn" onClick={onViewDashboard}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                Dashboard
              </button>
            )}
            {onViewAlerts && patient.recentAlerts && patient.recentAlerts.length > 0 && (
              <button className="patient-action-btn alert" onClick={onViewAlerts}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Alerts ({patient.recentAlerts.length})
              </button>
            )}
          </div>
        </>
      )}

      {patient.status === 'pending' && (
        <div className="pending-message">
        <p>Waiting for approval from {patient.email}</p>
        {patient.requestedAt && (
          <p className="requested-date">
            Requested {format(new Date(patient.requestedAt), 'MMM d, yyyy')}
          </p>
        )}
      </div>
      )}

      {patient.status === 'rejected' && (
        <div className="rejected-message">
          <p>Access request was rejected</p>
          {patient.requestedAt && (
            <p className="requested-date">
              Requested {format(new Date(patient.requestedAt), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default CaregiverDashboardScreen
