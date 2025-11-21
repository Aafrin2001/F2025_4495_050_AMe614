import React, { useState, useEffect } from 'react'
import './HealthMonitoringScreen.css'
import { HealthMetricInput, HealthMetricsSummary, User } from '../types'
import { healthMetricsService } from '../lib/healthMetrics'
import { format, formatDistanceToNow } from 'date-fns'

interface HealthMonitoringScreenProps {
  onBack: () => void
  onScheduleCheck: () => void
  user: User | null
}

interface VitalSign {
  id: string
  name: string
  metric_type: 'blood_pressure' | 'heart_rate' | 'body_temperature' | 'weight' | 'blood_sugar' | 'oxygen_level'
  value: string
  unit: string
  icon: string
  color: string
  lastUpdated?: string
}

type HealthStatus = 'Perfect' | 'Good' | 'Warning'

const HealthMonitoringScreen: React.FC<HealthMonitoringScreenProps> = ({ 
  onBack, 
  onScheduleCheck, 
  user 
}) => {
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([
    { 
      id: '1', 
      name: 'Blood Pressure', 
      metric_type: 'blood_pressure',
      value: '--/--', 
      unit: 'mmHg', 
      icon: 'heart', 
      color: '#FF6B6B' 
    },
    { 
      id: '2', 
      name: 'Heart Rate', 
      metric_type: 'heart_rate',
      value: '--', 
      unit: 'bpm', 
      icon: 'pulse', 
      color: '#4ECDC4' 
    },
    { 
      id: '3', 
      name: 'Body Temperature', 
      metric_type: 'body_temperature',
      value: '--', 
      unit: '°F', 
      icon: 'thermometer', 
      color: '#45B7D1' 
    },
    { 
      id: '4', 
      name: 'Weight', 
      metric_type: 'weight',
      value: '--', 
      unit: 'lbs', 
      icon: 'scale', 
      color: '#96CEB4' 
    },
    { 
      id: '5', 
      name: 'Blood Sugar', 
      metric_type: 'blood_sugar',
      value: '--', 
      unit: 'mg/dL', 
      icon: 'water', 
      color: '#FFEAA7' 
    },
    { 
      id: '6', 
      name: 'Oxygen Level', 
      metric_type: 'oxygen_level',
      value: '--', 
      unit: '%', 
      icon: 'air', 
      color: '#DDA0DD' 
    },
  ])

  const [selectedVital, setSelectedVital] = useState<VitalSign | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentHealthSummary, setCurrentHealthSummary] = useState<HealthMetricsSummary | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [formData, setFormData] = useState<HealthMetricInput>({
    metric_type: 'heart_rate',
    value: 0,
    unit: 'bpm',
    notes: '',
  })
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load latest metrics on component mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadLatestMetrics()
    }
  }, [user?.id])

  const loadLatestMetrics = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    setError(null)
    try {
      const { data: summary, error: fetchError } = await healthMetricsService.getLatestMetrics(user.id)
      
      if (fetchError) {
        setError(fetchError.message || 'Failed to load health metrics')
        console.error('Error loading metrics:', fetchError)
        return
      }

      if (summary) {
        setCurrentHealthSummary(summary)
        updateVitalSignsWithData(summary)
        setLastSyncTime(new Date())
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      console.error('Error loading metrics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadLatestMetrics()
    setIsRefreshing(false)
  }

  const updateVitalSignsWithData = (summary: HealthMetricsSummary) => {
    setVitalSigns(prevVitals => 
      prevVitals.map(vital => {
        const metric = summary[vital.metric_type]
        if (metric) {
          let displayValue = ''
          if (vital.metric_type === 'blood_pressure' && metric.systolic && metric.diastolic) {
            displayValue = `${metric.systolic}/${metric.diastolic}`
          } else {
            displayValue = metric.value.toString()
          }
          
          const recordedDate = new Date(metric.recorded_at)
          const lastUpdated = formatDistanceToNow(recordedDate, { addSuffix: true })
          
          return {
            ...vital,
            value: displayValue,
            lastUpdated
          }
        }
        return vital
      })
    )
  }

  const handleVitalClick = (vital: VitalSign) => {
    setSelectedVital(vital)
    setFormData({
      metric_type: vital.metric_type,
      value: 0,
      unit: vital.unit,
      notes: '',
    })
    setSystolic('')
    setDiastolic('')
    setShowAddModal(true)
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      let input: HealthMetricInput

      if (selectedVital?.metric_type === 'blood_pressure') {
        const sys = parseFloat(systolic)
        const dia = parseFloat(diastolic)
        
        if (!systolic || !diastolic || isNaN(sys) || isNaN(dia)) {
          setError('Please enter both systolic and diastolic values')
          setIsSubmitting(false)
          return
        }

        input = {
          metric_type: 'blood_pressure',
          systolic: sys,
          diastolic: dia,
          value: sys, // Required field, using systolic
          unit: 'mmHg',
          notes: formData.notes,
        }
      } else {
        if (!formData.value || formData.value <= 0) {
          setError('Please enter a valid value')
          setIsSubmitting(false)
          return
        }

        input = {
          ...formData,
          metric_type: selectedVital!.metric_type,
        }
      }

      const { data, error: saveError } = await healthMetricsService.saveMetric(user.id, input)

      if (saveError) {
        setError(saveError.message || 'Failed to save health metric')
        setIsSubmitting(false)
        return
      }

      if (data) {
        // Reload metrics to show updated data
        await loadLatestMetrics()
        setShowAddModal(false)
        setSelectedVital(null)
        setFormData({
          metric_type: 'heart_rate',
          value: 0,
          unit: 'bpm',
          notes: '',
        })
        setSystolic('')
        setDiastolic('')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Health status evaluation functions
  const evaluateBloodPressure = (systolic: number, diastolic: number): HealthStatus => {
    if (systolic < 120 && diastolic < 80) return 'Perfect'
    if (systolic < 140 && diastolic < 90) return 'Good'
    return 'Warning'
  }

  const evaluateHeartRate = (rate: number): HealthStatus => {
    if (rate >= 60 && rate <= 100) return 'Perfect'
    if (rate >= 50 && rate <= 110) return 'Good'
    return 'Warning'
  }

  const evaluateTemperature = (temp: number, unit: string): HealthStatus => {
    const tempF = unit === '°C' ? (temp * 9/5) + 32 : temp
    if (tempF >= 97.8 && tempF <= 99.1) return 'Perfect'
    if (tempF >= 97.0 && tempF <= 100.4) return 'Good'
    return 'Warning'
  }

  const evaluateWeight = (weight: number, unit: string): HealthStatus => {
    if (unit === 'kg') {
      if (weight >= 50 && weight <= 100) return 'Perfect'
      if (weight >= 40 && weight <= 120) return 'Good'
    } else {
      if (weight >= 110 && weight <= 220) return 'Perfect'
      if (weight >= 90 && weight <= 260) return 'Good'
    }
    return 'Warning'
  }

  const evaluateBloodSugar = (sugar: number): HealthStatus => {
    if (sugar >= 70 && sugar <= 100) return 'Perfect'
    if (sugar >= 60 && sugar <= 140) return 'Good'
    return 'Warning'
  }

  const evaluateOxygenLevel = (oxygen: number): HealthStatus => {
    if (oxygen >= 95) return 'Perfect'
    if (oxygen >= 90) return 'Good'
    return 'Warning'
  }

  const calculateOverallHealthStatus = (summary: HealthMetricsSummary): HealthStatus => {
    const statuses: HealthStatus[] = []
    
    if (summary.blood_pressure && summary.blood_pressure.systolic && summary.blood_pressure.diastolic) {
      statuses.push(evaluateBloodPressure(summary.blood_pressure.systolic, summary.blood_pressure.diastolic))
    }
    
    if (summary.heart_rate) {
      statuses.push(evaluateHeartRate(summary.heart_rate.value))
    }
    
    if (summary.body_temperature) {
      statuses.push(evaluateTemperature(summary.body_temperature.value, summary.body_temperature.unit))
    }
    
    if (summary.weight) {
      statuses.push(evaluateWeight(summary.weight.value, summary.weight.unit))
    }
    
    if (summary.blood_sugar) {
      statuses.push(evaluateBloodSugar(summary.blood_sugar.value))
    }
    
    if (summary.oxygen_level) {
      statuses.push(evaluateOxygenLevel(summary.oxygen_level.value))
    }

    if (statuses.length === 0) return 'Good'
    
    if (statuses.includes('Warning')) return 'Warning'
    if (statuses.every(status => status === 'Perfect')) return 'Perfect'
    
    return 'Good'
  }

  const getHealthStatusColor = (status: HealthStatus): string => {
    switch (status) {
      case 'Perfect': return '#4CAF50'
      case 'Good': return '#2196F3'
      case 'Warning': return '#FF9800'
      default: return '#2196F3'
    }
  }

  const getHealthStatusIcon = (status: HealthStatus): string => {
    switch (status) {
      case 'Perfect': return '✓'
      case 'Good': return '✓'
      case 'Warning': return '⚠'
      default: return '✓'
    }
  }

  const getVitalIcon = (icon: string) => {
    const icons: Record<string, JSX.Element> = {
      heart: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      ),
      pulse: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      ),
      thermometer: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"></path>
        </svg>
      ),
      scale: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 16h3a2 2 0 0 0 0-4h-3m-5 0H8a2 2 0 0 0 0 4h3m-5 4h3a2 2 0 0 0 0-4H6m8-8h3a2 2 0 0 1 0 4h-3m-5-4H8a2 2 0 0 1 0 4h3"></path>
        </svg>
      ),
      water: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
      air: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
      ),
    }
    return icons[icon] || icons.heart
  }

  const overallStatus = currentHealthSummary ? calculateOverallHealthStatus(currentHealthSummary) : 'Good'
  const metricsTracked = currentHealthSummary 
    ? Object.values(currentHealthSummary).filter(metric => metric !== null).length 
    : 0

  return (
    <div className="health-monitoring-screen">
      <div className="health-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 className="health-title">Health Monitoring</h1>
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
          <button className="schedule-button" onClick={onScheduleCheck}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Schedule Check
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

      <div className="health-content">
        {isLoading && !currentHealthSummary ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading health metrics...</p>
          </div>
        ) : (
          <>
            {/* Health Summary Card */}
            <div className="health-summary-card">
              <h2 className="summary-title">Health Summary</h2>
              <div className="summary-stats">
                <div className="stat-item">
                  <div className="stat-number">{metricsTracked}</div>
                  <div className="stat-label">Metrics Tracked</div>
                </div>
                <div className="stat-item">
                  <div 
                    className="stat-number" 
                    style={{ color: getHealthStatusColor(overallStatus) }}
                  >
                    {overallStatus}
                  </div>
                  <div className="stat-label">Overall Status</div>
                </div>
                <div className="stat-item">
                  <div 
                    className="stat-icon"
                    style={{ color: getHealthStatusColor(overallStatus) }}
                  >
                    {getHealthStatusIcon(overallStatus)}
                  </div>
                  <div className="stat-label">Health Icon</div>
                </div>
              </div>
            </div>

            {/* Vital Signs Grid */}
            <div className="vitals-section">
              <h2 className="section-title">Vital Signs</h2>
              <div className="vitals-grid">
                {vitalSigns.map(vital => (
                  <div
                    key={vital.id}
                    className="vital-card"
                    style={{ '--vital-color': vital.color } as React.CSSProperties}
                    onClick={() => handleVitalClick(vital)}
                  >
                    <div className="vital-icon" style={{ color: vital.color }}>
                      {getVitalIcon(vital.icon)}
                    </div>
                    <div className="vital-info">
                      <h3 className="vital-name">{vital.name}</h3>
                      <div className="vital-value-group">
                        <span className="vital-value">{vital.value}</span>
                        <span className="vital-unit">{vital.unit}</span>
                      </div>
                      {vital.lastUpdated && (
                        <p className="vital-updated">Updated {vital.lastUpdated}</p>
                      )}
                    </div>
                    <div className="vital-action">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Reading Modal */}
      {showAddModal && selectedVital && (
        <div className="modal-overlay" onClick={() => { 
          setShowAddModal(false)
          setSelectedVital(null)
          setError(null)
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add {selectedVital.name} Reading</h2>
              <button 
                className="modal-close" 
                onClick={() => { 
                  setShowAddModal(false)
                  setSelectedVital(null)
                  setError(null)
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="modal-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {error}
                </div>
              )}

              {selectedVital.metric_type === 'blood_pressure' ? (
                <div className="form-group">
                  <label>Blood Pressure (mmHg)</label>
                  <div className="bp-inputs">
                    <div className="bp-input-group">
                      <label>Systolic</label>
                      <input
                        type="number"
                        value={systolic}
                        onChange={e => setSystolic(e.target.value)}
                        placeholder="120"
                        min="70"
                        max="250"
                        disabled={isSubmitting}
                      />
                    </div>
                    <span className="bp-separator">/</span>
                    <div className="bp-input-group">
                      <label>Diastolic</label>
                      <input
                        type="number"
                        value={diastolic}
                        onChange={e => setDiastolic(e.target.value)}
                        placeholder="80"
                        min="40"
                        max="150"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label>Value ({selectedVital.unit})</label>
                  <input
                    type="number"
                    value={formData.value || ''}
                    onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    placeholder={`Enter ${selectedVital.name.toLowerCase()}`}
                    step="0.1"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any notes about this reading..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => { 
                  setShowAddModal(false)
                  setSelectedVital(null)
                  setError(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  'Save Reading'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HealthMonitoringScreen
