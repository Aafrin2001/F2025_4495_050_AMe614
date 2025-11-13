import React, { useState } from 'react'
import './MainScreen.css'

interface User {
  id: string
  firstName: string
  lastName?: string
  email: string
  userType: 'hire' | 'offer'
}

interface MainScreenProps {
  user: User | null
  onLogout: () => void
  onFindServices: () => void
  onOfferSkills: () => void
  onSettingsPress: () => void
  onCreateJob: () => void
  onViewJobs: () => void
  onHealthMonitoring: () => void
  onCaregiverApproval?: () => void
}

const MainScreen: React.FC<MainScreenProps> = ({
  user,
  onLogout,
  onFindServices,
  onOfferSkills,
  onSettingsPress,
  onCreateJob,
  onViewJobs,
  onHealthMonitoring,
  onCaregiverApproval
}) => {
  const [pendingCaregiverRequests] = useState(0)

  const showAsEmployer = true
  const showAsProvider = true

  return (
    <div className="main-screen">
      {/* Header */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo">EAi</div>
          <div className="header-actions">
            <button className="icon-button" onClick={onSettingsPress} aria-label="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0L5.636 17.364m12.728 0l-4.243-4.243m-4.242 0L5.636 6.636"></path>
              </svg>
            </button>
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          {/* Welcome Card */}
          <div className="welcome-card">
            <h1 className="welcome-title">
              Welcome{user?.firstName ? ` ${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)}` : ''}!
            </h1>
            <p className="welcome-subtitle">Your AI Health Companion</p>
          </div>

          {/* Pending Caregiver Requests Notification */}
          {user?.userType === 'hire' && pendingCaregiverRequests > 0 && onCaregiverApproval && (
            <div className="notification-card" onClick={onCaregiverApproval}>
              <div className="notification-content">
                <div className="notification-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <div className="notification-text">
                  <div className="notification-title">
                    {pendingCaregiverRequests} Caregiver Request{pendingCaregiverRequests !== 1 ? 's' : ''} Pending
                  </div>
                  <div className="notification-subtext">Tap to review and approve</div>
                </div>
                <div className="notification-badge">{pendingCaregiverRequests}</div>
              </div>
            </div>
          )}

          {/* Feature Grid */}
          <div className="feature-grid">
            {showAsEmployer && (
              <div className="feature-card" onClick={onHealthMonitoring}>
                <div className="feature-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <h3 className="feature-title">Health Monitoring</h3>
              </div>
            )}

            {showAsProvider && (
              <div className="feature-card" onClick={onOfferSkills}>
                <div className="feature-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <h3 className="feature-title">Activities</h3>
              </div>
            )}

            {showAsEmployer && (
              <div className="feature-card" onClick={onCreateJob}>
                <div className="feature-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                  </svg>
                </div>
                <h3 className="feature-title">Medication</h3>
              </div>
            )}

            {showAsProvider && (
              <div className="feature-card" onClick={onViewJobs}>
                <div className="feature-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <polyline points="6 10 12 4 18 10"></polyline>
                  </svg>
                </div>
                <h3 className="feature-title">Dashboard</h3>
              </div>
            )}
          </div>

          {/* CTA Card */}
          <div className="cta-card" onClick={showAsEmployer ? onFindServices : onOfferSkills}>
            <h2 className="cta-title">Chat with AI</h2>
            <p className="cta-description">
              Get instant health advice and support from your AI companion
            </p>
            <div className="cta-button">
              <span>Start Chat</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default MainScreen

