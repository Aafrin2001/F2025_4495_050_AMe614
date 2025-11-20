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
      </div>
)
}

export default CaregiverDashboardScreen
