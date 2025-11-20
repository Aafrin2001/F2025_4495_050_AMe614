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
return (  )
}

export default CaregiverDashboardScreen
