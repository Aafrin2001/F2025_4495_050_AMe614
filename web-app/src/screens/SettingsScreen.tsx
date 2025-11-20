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
