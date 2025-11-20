import React, { useState } from 'react'
import './CaregiverDashboardScreen.css'
import { User } from '../types'

interface CaregiverDashboardScreenProps {
  caregiver: User
  seniorUserId: string
  onBack: () => void
  onViewAlerts: () => void
  onViewDashboard: () => void
  onViewMedication: () => void
  onViewMonitor: () => void
  onLogout: () => void
  onSettingsPress?: () => void
  onSeniorAdded?: (seniorEmail: string, seniorUserId?: string) => void
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
}) => {
  const [showAddSeniorModal, setShowAddSeniorModal] = useState(false)
  const [seniorEmail, setSeniorEmail] = useState('')

  const hasAccess = seniorUserId && seniorUserId.length > 0

  const quickActions = [
    { id: 'medication', name: 'Medications', icon: '💊', onClick: onViewMedication, color: '#4CAF50' },
    { id: 'monitor', name: 'Health Monitor', icon: '❤️', onClick: onViewMonitor, color: '#F44336' },
    { id: 'dashboard', name: 'Dashboard', icon: '📊', onClick: onViewDashboard, color: '#2196F3' },
    { id: 'alerts', name: 'Alerts', icon: '🔔', onClick: onViewAlerts, color: '#FF9800' },
  ]

  const handleAddSenior = () => {
    if (seniorEmail.trim()) {
      // In a real app, this would call the caregiver service
      alert('Senior access request sent! Please wait for approval.')
      setShowAddSeniorModal(false)
      setSeniorEmail('')
    }
  }
return (
      <div className="caregiver-dashboard-screen">
        <div className="caregiver-header">
          <div className="header-left">
            <h1 className="caregiver-title">Caregiver Dashboard</h1>
            <p className="caregiver-subtitle">Monitoring for {caregiver.seniorEmail || 'Senior'}</p>
          </div>
          <div className="header-actions">
            {onSettingsPress && (
              <button className="icon-button" onClick={onSettingsPress}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
                </svg>
              </button>
            )}
            <button className="logout-button" onClick={onLogout}>Logout</button>
          </div>
        </div>
              <div className="caregiver-content">
        {!hasAccess ? (
          <div className="pending-access">
            <div className="pending-card">
              <div className="pending-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h2>Pending Access Approval</h2>
              <p>Your request to access the senior's health data is pending approval. Once approved, you'll be able to view medications, health metrics, and more.</p>
              <button className="btn-primary" onClick={() => setShowAddSeniorModal(true)}>
                Add Senior Email
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="quick-actions-grid">
              {quickActions.map(action => (
                <div
                  key={action.id}
                  className="action-card"
                  style={{ '--action-color': action.color } as React.CSSProperties}
                  onClick={action.onClick}
                >
                  <div className="action-icon" style={{ backgroundColor: action.color + '20', color: action.color }}>
                    <span style={{ fontSize: '2rem' }}>{action.icon}</span>
                  </div>
                  <h3 className="action-name">{action.name}</h3>
                </div>
              ))}
            </div>

            <div className="summary-section">
              <h2 className="section-title">Today's Summary</h2>
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-label">Medications Due</div>
                  <div className="summary-value">2</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Health Readings</div>
                  <div className="summary-value">3</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Activities Completed</div>
                  <div className="summary-value">1</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
         {showAddSeniorModal && (
        <div className="modal-overlay" onClick={() => setShowAddSeniorModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Senior Email</h2>
              <button className="modal-close" onClick={() => setShowAddSeniorModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Senior's Email Address</label>
                <input
                  type="email"
                  value={seniorEmail}
                  onChange={e => setSeniorEmail(e.target.value)}
                  placeholder="senior@example.com"
                />
                <p className="form-help">Enter the email address of the senior you're caring for. They will need to approve your access request.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddSeniorModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddSenior}>Send Request</button>
            </div>
          </div>
        </div>
      )}
      </div>
)
}

export default CaregiverDashboardScreen
