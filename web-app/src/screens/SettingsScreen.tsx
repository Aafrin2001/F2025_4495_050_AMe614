import React, { useState } from 'react'
import './SettingsScreen.css'

interface SettingsScreenProps {
  onBack: () => void
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    medicationReminders: true,
    healthCheckReminders: true,
    activityReminders: true,
    emergencyAlerts: true,
    darkMode: false,
    fontSize: 'medium',
    language: 'English',
  })

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings({ ...settings, [key]: !settings[key] })
    }
  }

  const settingGroups = [
    {
      title: 'Notifications',
      settings: [
        { key: 'medicationReminders', label: 'Medication Reminders', type: 'toggle' },
        { key: 'healthCheckReminders', label: 'Health Check Reminders', type: 'toggle' },
        { key: 'activityReminders', label: 'Activity Reminders', type: 'toggle' },
        { key: 'emergencyAlerts', label: 'Emergency Alerts', type: 'toggle' },
      ],
    },
    {
      title: 'Appearance',
      settings: [
        { key: 'darkMode', label: 'Dark Mode', type: 'toggle' },
        { key: 'fontSize', label: 'Font Size', type: 'select', options: ['Small', 'Medium', 'Large'] },
      ],
    },
    {
      title: 'Language',
      settings: [
        { key: 'language', label: 'Language', type: 'select', options: ['English', 'Spanish', 'French'] },
      ],
    },
  ]

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-content">
        {settingGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="settings-group">
            <h2 className="group-title">{group.title}</h2>
            <div className="settings-list">
              {group.settings.map((setting, idx) => (
                <div key={idx} className="setting-item">
                  <div className="setting-info">
                    <label className="setting-label">{setting.label}</label>
                  </div>
                  {setting.type === 'toggle' ? (
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings[setting.key as keyof typeof settings] as boolean}
                        onChange={() => handleToggle(setting.key as keyof typeof settings)}
                        id={setting.key}
                      />
                      <label htmlFor={setting.key} className="toggle-label"></label>
                    </div>
                  ) : (
                    <select
                      value={settings[setting.key as keyof typeof settings] as string}
                      onChange={e => setSettings({ ...settings, [setting.key]: e.target.value })}
                      className="setting-select"
                    >
                      {setting.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="settings-group">
          <h2 className="group-title">About</h2>
          <div className="about-section">
            <p className="app-version">EAi Health Companion v1.0.0</p>
            <p className="app-description">Your AI-powered health companion for better wellness</p>
            <div className="about-links">
              <a href="#" className="about-link">Privacy Policy</a>
              <a href="#" className="about-link">Terms of Service</a>
              <a href="#" className="about-link">Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsScreen

