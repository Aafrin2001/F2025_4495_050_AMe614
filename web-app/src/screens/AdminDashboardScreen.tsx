import React, { useState } from 'react'
import './AdminDashboardScreen.css'

interface AdminDashboardScreenProps {
  onBack: () => void
  userId?: string
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onBack }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('7d')

  const stats = {
    walkDistance: 12.5,
    sleepDuration: 7.5,
    medicationAdherence: 95,
    gamesPlayed: 24,
    totalUsers: 1,
    activeUsers: 1,
    criticalAlerts: 0,
  }

  const alerts = [
    { id: '1', type: 'Medication', message: 'Medication refill due in 3 days', severity: 'Medium', timestamp: '2 hours ago' },
    { id: '2', type: 'Health', message: 'Blood pressure reading slightly elevated', severity: 'Low', timestamp: '1 day ago' },
  ]

  return (
    <div className="admin-dashboard-screen">
      <div className="dashboard-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="timeframe-selector">
          <button
            className={`timeframe-btn ${selectedTimeframe === '7d' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('7d')}
          >
            7 Days
          </button>
          <button
            className={`timeframe-btn ${selectedTimeframe === '30d' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('30d')}
          >
            30 Days
          </button>
          <button
            className={`timeframe-btn ${selectedTimeframe === '90d' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('90d')}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.walkDistance} km</div>
              <div className="stat-label">Walk Distance</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.sleepDuration} hrs</div>
              <div className="stat-label">Sleep Duration</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.medicationAdherence}%</div>
              <div className="stat-label">Medication Adherence</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.gamesPlayed}</div>
              <div className="stat-label">Games Played</div>
            </div>
          </div>
        </div>

        <div className="alerts-section">
          <h2 className="section-title">Alerts & Notifications</h2>
          {alerts.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4M12 16h.01"></path>
              </svg>
              <p>No alerts at this time</p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map(alert => (
                <div key={alert.id} className="alert-card" data-severity={alert.severity.toLowerCase()}>
                  <div className="alert-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div className="alert-content">
                    <div className="alert-header">
                      <span className="alert-type">{alert.type}</span>
                      <span className="alert-severity">{alert.severity}</span>
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    <span className="alert-timestamp">{alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardScreen

