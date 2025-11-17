import React, { useState } from 'react'
import './HealthMonitoringScreen.css'
import { HealthMetricInput } from '../types'

interface HealthMonitoringScreenProps {
  onBack: () => void
  onScheduleCheck: () => void
  user: any
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

const HealthMonitoringScreen: React.FC<HealthMonitoringScreenProps> = ({ onBack, onScheduleCheck }) => {
  const [vitalSigns] = useState<VitalSign[]>([
    { id: '1', name: 'Blood Pressure', metric_type: 'blood_pressure', value: '120/80', unit: 'mmHg', icon: 'heart', color: '#FF6B6B', lastUpdated: 'Today' },
    { id: '2', name: 'Heart Rate', metric_type: 'heart_rate', value: '72', unit: 'bpm', icon: 'pulse', color: '#4ECDC4', lastUpdated: 'Today' },
    { id: '3', name: 'Body Temperature', metric_type: 'body_temperature', value: '98.6', unit: '°F', icon: 'thermometer', color: '#45B7D1', lastUpdated: 'Today' },
    { id: '4', name: 'Weight', metric_type: 'weight', value: '165', unit: 'lbs', icon: 'scale', color: '#96CEB4', lastUpdated: '2 days ago' },
    { id: '5', name: 'Blood Sugar', metric_type: 'blood_sugar', value: '95', unit: 'mg/dL', icon: 'water', color: '#FFEAA7', lastUpdated: 'Today' },
    { id: '6', name: 'Oxygen Level', metric_type: 'oxygen_level', value: '98', unit: '%', icon: 'air', color: '#DDA0DD', lastUpdated: 'Today' },
  ])

  const [selectedVital, setSelectedVital] = useState<VitalSign | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState<HealthMetricInput>({
    metric_type: 'heart_rate',
    value: 0,
    unit: 'bpm',
    notes: '',
  })
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')

  const handleVitalClick = (vital: VitalSign) => {
    setSelectedVital(vital)
    setFormData({
      metric_type: vital.metric_type,
      value: 0,
      unit: vital.unit,
      notes: '',
    })
    setShowAddModal(true)
  }

  const handleSubmit = () => {
    // In a real app, this would save to backend
    console.log('Saving health metric:', formData)
    setShowAddModal(false)
    setSelectedVital(null)
    alert('Health reading saved successfully!')
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
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
      ),
    }
    return icons[icon] || icons.heart
  }

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
        <button className="schedule-button" onClick={onScheduleCheck}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Schedule Check
        </button>
      </div>

      <div className="health-content">
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

        <div className="health-summary">
          <h2 className="section-title">Health Summary</h2>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-label">Overall Status</div>
              <div className="summary-value good">Good</div>
              <div className="summary-description">All vitals within normal range</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Last Check-up</div>
              <div className="summary-value">2 weeks ago</div>
              <div className="summary-description">Regular monitoring recommended</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Trend</div>
              <div className="summary-value stable">Stable</div>
              <div className="summary-description">No significant changes</div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && selectedVital && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setSelectedVital(null) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add {selectedVital.name} Reading</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setSelectedVital(null) }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {selectedVital.metric_type === 'blood_pressure' ? (
                <div className="form-group">
                  <label>Blood Pressure</label>
                  <div className="bp-inputs">
                    <div>
                      <label>Systolic</label>
                      <input
                        type="number"
                        value={systolic}
                        onChange={e => setSystolic(e.target.value)}
                        placeholder="120"
                      />
                    </div>
                    <span className="bp-separator">/</span>
                    <div>
                      <label>Diastolic</label>
                      <input
                        type="number"
                        value={diastolic}
                        onChange={e => setDiastolic(e.target.value)}
                        placeholder="80"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label>Value</label>
                  <input
                    type="number"
                    value={formData.value || ''}
                    onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter value"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any notes about this reading..."
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => { setShowAddModal(false); setSelectedVital(null) }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSubmit}>
                Save Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HealthMonitoringScreen

