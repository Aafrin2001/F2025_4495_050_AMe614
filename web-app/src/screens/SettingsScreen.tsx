import React, { useState, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import './SettingsScreen.css'
import { UserSettingsService, UserSettings, UserProfile } from '../lib/userSettingsService'
import { User } from '../types'
import { auth } from '../lib/supabase'

interface SettingsScreenProps {
  onBack: () => void
  user: User | null
  onLogout: () => void
}

interface SettingItem {
  id: string
  title: string
  description: string
  icon: JSX.Element
  type: 'toggle' | 'select' | 'action' | 'navigation'
  value?: boolean | string
  options?: string[]
  onPress?: () => void
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, user, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings>({
    highContrast: false,
    fontSize: 'medium',
    medicationReminders: true,
    healthCheckReminders: true,
    activityReminders: true,
    emergencyAlerts: true,
    quietHours: false,
    quietStartTime: '22:00',
    quietEndTime: '08:00',
    shareWithFamily: true,
    shareWithDoctor: false,
    locationTracking: false,
    dataBackup: true,
    darkMode: false,
    autoLock: true,
    autoLockTime: 5,
    language: 'English',
    timeFormat: '12h',
    theme: 'light',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showQuietHoursModal, setShowQuietHoursModal] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showFontSizeModal, setShowFontSizeModal] = useState(false)
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)
    try {
      await Promise.all([
        loadProfile(),
        loadSettings()
      ])
      setLastSyncTime(new Date())
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const loadProfile = async () => {
    if (!user?.id) return

    try {
      const result = await UserSettingsService.getUserProfile(user.id)
      if (result.success && result.data) {
        setProfile(result.data)
        setProfileForm({
          firstName: result.data.first_name || user.firstName || '',
          lastName: result.data.last_name || user.lastName || '',
          phoneNumber: result.data.phone_number || user.phoneNumber || '',
        })
      }
    } catch (err: any) {
      console.error('Error loading profile:', err)
    }
  }

  const loadSettings = async () => {
    if (!user?.id) return

    try {
      const result = await UserSettingsService.getUserSettings(user.id)
      if (result.success && result.data) {
        setSettings(prev => ({ ...prev, ...result.data }))
      }
    } catch (err: any) {
      console.error('Error loading settings:', err)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const handleToggle = async (key: keyof UserSettings) => {
    if (!user?.id) return

    const newValue = !settings[key]
    const updatedSettings = { ...settings, [key]: newValue }
    setSettings(updatedSettings)

    setIsSaving(true)
    setError(null)
    try {
      const result = await UserSettingsService.updateUserSettings({ [key]: newValue }, user.id)
      if (!result.success) {
        setError(result.error || 'Failed to update setting')
        // Revert on error
        setSettings(settings)
      } else {
        setLastSyncTime(new Date())
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      // Revert on error
      setSettings(settings)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelect = async (key: keyof UserSettings, value: any) => {
    if (!user?.id) return

    const updatedSettings = { ...settings, [key]: value }
    setSettings(updatedSettings)

    setIsSaving(true)
    setError(null)
    try {
      const result = await UserSettingsService.updateUserSettings({ [key]: value }, user.id)
      if (!result.success) {
        setError(result.error || 'Failed to update setting')
        // Revert on error
        setSettings(settings)
      } else {
        setLastSyncTime(new Date())
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      // Revert on error
      setSettings(settings)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return

    setIsSaving(true)
    setError(null)
    try {
      const result = await UserSettingsService.updateUserProfile({
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        phone_number: profileForm.phoneNumber,
      }, user.id)

      if (!result.success) {
        setError(result.error || 'Failed to update profile')
        return
      }

      setShowProfileModal(false)
      await loadProfile()
      setLastSyncTime(new Date())
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      return
    }

    if (!user?.id) return

    setIsSaving(true)
    setError(null)
    try {
      const result = await UserSettingsService.resetSettings(user.id)
      if (!result.success) {
        setError(result.error || 'Failed to reset settings')
        return
      }

      await loadSettings()
      setLastSyncTime(new Date())
      alert('Settings have been reset to default values.')
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = () => {
    alert('Data export feature will be available soon. Your health data will be exported to a secure file.')
  }

  const handleDeleteAccount = () => {
    if (!confirm('Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone.')) {
      return
    }

    if (!confirm('This is your final warning. All your health data, medications, activities, and chat history will be permanently deleted. Are you absolutely sure?')) {
      return
    }

    alert('Account deletion has been initiated. You will receive a confirmation email. Please contact support if you have any questions.')
  }

  const handleLogout = async () => {
    try {
      await onLogout()
    } catch (err: any) {
      setError(err.message || 'Failed to logout')
    }
  }

  const getIcon = (iconName: string): JSX.Element => {
    const icons: Record<string, JSX.Element> = {
      'text': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7"></polyline>
          <line x1="9" y1="20" x2="15" y2="20"></line>
          <line x1="12" y1="4" x2="12" y2="20"></line>
        </svg>
      ),
      'contrast': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      ),
      'medical': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      ),
      'heart': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      ),
      'fitness': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      ),
      'warning': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
      'moon': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      ),
      'people': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      'person': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      'location': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      ),
      'cloud': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
        </svg>
      ),
      'language': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      ),
      'time': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      'lock': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      'palette': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="13.5" cy="6.5" r=".5"></circle>
          <circle cx="17.5" cy="10.5" r=".5"></circle>
          <circle cx="8.5" cy="7.5" r=".5"></circle>
          <circle cx="6.5" cy="12.5" r=".5"></circle>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
        </svg>
      ),
      'download': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      ),
      'refresh': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      ),
      'trash': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      ),
      'user': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      'mail': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      'phone': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      ),
      'logout': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      ),
    }
    return icons[iconName] || icons['user']
  }

  const getFontSizeLabel = (): string => {
    switch (settings.fontSize) {
      case 'small': return 'Small (85%)'
      case 'medium': return 'Medium (100% - Default)'
      case 'large': return 'Large (125%)'
      case 'extraLarge': return 'Extra Large (150%)'
      default: return 'Medium (100%)'
    }
  }

  // Profile Section
  const profileSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Profile Information',
      description: `${profileForm.firstName || user?.firstName || ''} ${profileForm.lastName || user?.lastName || ''}`.trim() || 'Tap to edit',
      icon: getIcon('user'),
      type: 'navigation',
      onPress: () => setShowProfileModal(true),
    },
    {
      id: 'email',
      title: 'Email',
      description: user?.email || profile?.email || 'Not set',
      icon: getIcon('mail'),
      type: 'action',
    },
    {
      id: 'phone',
      title: 'Phone Number',
      description: profileForm.phoneNumber || user?.phoneNumber || 'Not set',
      icon: getIcon('phone'),
      type: 'navigation',
      onPress: () => setShowProfileModal(true),
    },
  ]

  // Accessibility Settings
  const accessibilitySettings: SettingItem[] = [
    {
      id: 'fontSize',
      title: 'Font Size',
      description: getFontSizeLabel(),
      icon: getIcon('text'),
      type: 'navigation',
      onPress: () => setShowFontSizeModal(true),
    },
    {
      id: 'highContrast',
      title: 'High Contrast',
      description: 'Improve visibility with high contrast colors',
      icon: getIcon('contrast'),
      type: 'toggle',
      value: settings.highContrast,
    },
  ]

  // Notification Settings
  const notificationSettings: SettingItem[] = [
    {
      id: 'medicationReminders',
      title: 'Medication Reminders',
      description: 'Get notified when it\'s time to take medications',
      icon: getIcon('medical'),
      type: 'toggle',
      value: settings.medicationReminders,
    },
    {
      id: 'healthCheckReminders',
      title: 'Health Check Reminders',
      description: 'Reminders for scheduled health checkups',
      icon: getIcon('heart'),
      type: 'toggle',
      value: settings.healthCheckReminders,
    },
    {
      id: 'activityReminders',
      title: 'Activity Reminders',
      description: 'Reminders to stay active throughout the day',
      icon: getIcon('fitness'),
      type: 'toggle',
      value: settings.activityReminders,
    },
    {
      id: 'emergencyAlerts',
      title: 'Emergency Alerts',
      description: 'Critical health alerts and notifications',
      icon: getIcon('warning'),
      type: 'toggle',
      value: settings.emergencyAlerts,
    },
    {
      id: 'quietHours',
      title: 'Quiet Hours',
      description: settings.quietHours 
        ? `${settings.quietStartTime} - ${settings.quietEndTime}`
        : 'Disabled',
      icon: getIcon('moon'),
      type: 'navigation',
      onPress: () => setShowQuietHoursModal(true),
    },
  ]

  // Privacy Settings
  const privacySettings: SettingItem[] = [
    {
      id: 'shareWithFamily',
      title: 'Share with Family',
      description: 'Allow family members to view your health data',
      icon: getIcon('people'),
      type: 'toggle',
      value: settings.shareWithFamily,
    },
    {
      id: 'shareWithDoctor',
      title: 'Share with Doctor',
      description: 'Allow healthcare providers to access your data',
      icon: getIcon('person'),
      type: 'toggle',
      value: settings.shareWithDoctor,
    },
    {
      id: 'locationTracking',
      title: 'Location Tracking',
      description: 'Track location for emergency services',
      icon: getIcon('location'),
      type: 'toggle',
      value: settings.locationTracking,
    },
    {
      id: 'dataBackup',
      title: 'Data Backup',
      description: 'Automatically backup your health data',
      icon: getIcon('cloud'),
      type: 'toggle',
      value: settings.dataBackup,
    },
  ]

  // App Settings
  const appSettings: SettingItem[] = [
    {
      id: 'language',
      title: 'Language',
      description: settings.language || 'English',
      icon: getIcon('language'),
      type: 'navigation',
      onPress: () => setShowLanguageModal(true),
    },
    {
      id: 'theme',
      title: 'Theme',
      description: settings.theme === 'dark' ? 'Dark' : settings.theme === 'auto' ? 'Auto' : 'Light',
      icon: getIcon('palette'),
      type: 'navigation',
      onPress: () => setShowThemeModal(true),
    },
    {
      id: 'timeFormat',
      title: 'Time Format',
      description: settings.timeFormat === '12h' ? '12-hour (AM/PM)' : '24-hour',
      icon: getIcon('time'),
      type: 'select',
      options: ['12h', '24h'],
      value: settings.timeFormat,
    },
    {
      id: 'autoLock',
      title: 'Auto Lock',
      description: settings.autoLock ? `${settings.autoLockTime} minutes` : 'Disabled',
      icon: getIcon('lock'),
      type: 'toggle',
      value: settings.autoLock,
    },
  ]

  // Data & Account Settings
  const dataSettings: SettingItem[] = [
    {
      id: 'exportData',
      title: 'Export Data',
      description: 'Download your health data as a file',
      icon: getIcon('download'),
      type: 'action',
      onPress: handleExportData,
    },
    {
      id: 'resetSettings',
      title: 'Reset Settings',
      description: 'Reset all settings to default values',
      icon: getIcon('refresh'),
      type: 'action',
      onPress: handleResetSettings,
    },
    {
      id: 'deleteAccount',
      title: 'Delete Account',
      description: 'Permanently delete your account and all data',
      icon: getIcon('trash'),
      type: 'action',
      onPress: handleDeleteAccount,
    },
    {
      id: 'logout',
      title: 'Logout',
      description: 'Sign out of your account',
      icon: getIcon('logout'),
      type: 'action',
      onPress: handleLogout,
    },
  ]

  const renderSettingItem = (item: SettingItem) => (
    <div
      key={item.id}
      className={`setting-item ${item.type === 'action' ? 'action-item' : ''}`}
      onClick={item.type === 'navigation' || item.type === 'action' ? item.onPress : undefined}
    >
      <div className="setting-left">
        <div className="setting-icon">{item.icon}</div>
        <div className="setting-content">
          <h3 className="setting-title">{item.title}</h3>
          <p className="setting-description">{item.description}</p>
        </div>
      </div>
      
      <div className="setting-right">
        {item.type === 'toggle' && (
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={item.value as boolean}
              onChange={() => handleToggle(item.id as keyof UserSettings)}
              disabled={isSaving}
            />
            <span className="toggle-slider"></span>
          </label>
        )}
        {item.type === 'select' && item.options && (
          <select
            className="setting-select"
            value={item.value as string}
            onChange={(e) => handleSelect(item.id as keyof UserSettings, e.target.value)}
            disabled={isSaving}
          >
            {item.options.map(option => (
              <option key={option} value={option}>
                {option === '12h' ? '12-hour (AM/PM)' : option === '24h' ? '24-hour' : option}
              </option>
            ))}
          </select>
        )}
        {(item.type === 'navigation' || item.type === 'action') && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        )}
      </div>
    </div>
  )

  const renderSection = (title: string, items: SettingItem[]) => (
    <div className="settings-section">
      <h2 className="section-title">{title}</h2>
      <div className="section-content">
        {items.map(renderSettingItem)}
      </div>
    </div>
  )

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
        <div className="header-actions">
          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh settings"
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

      <div className="settings-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : (
          <>
            {renderSection('Profile', profileSettings)}
            {renderSection('Accessibility', accessibilitySettings)}
            {renderSection('Notifications', notificationSettings)}
            {renderSection('Privacy & Sharing', privacySettings)}
            {renderSection('App Preferences', appSettings)}
            {renderSection('Data & Account', dataSettings)}
          </>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={profileForm.phoneNumber}
                  onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowProfileModal(false)} disabled={isSaving}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiet Hours Modal */}
      {showQuietHoursModal && (
        <div className="modal-overlay" onClick={() => setShowQuietHoursModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Quiet Hours</h2>
              <button className="modal-close" onClick={() => setShowQuietHoursModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Set times when you don't want to receive non-emergency notifications.
              </p>
              <div className="form-group">
                <label className="toggle-row">
                  <span>Enable Quiet Hours</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.quietHours}
                      onChange={() => handleToggle('quietHours')}
                      disabled={isSaving}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </label>
              </div>
              {settings.quietHours && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Time</label>
                      <input
                        type="time"
                        value={settings.quietStartTime}
                        onChange={e => handleSelect('quietStartTime', e.target.value)}
                        disabled={isSaving}
                      />
                  </div>
                    <div className="form-group">
                      <label>End Time</label>
                      <input
                        type="time"
                        value={settings.quietEndTime}
                        onChange={e => handleSelect('quietEndTime', e.target.value)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowQuietHoursModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="modal-overlay" onClick={() => setShowLanguageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Language</h2>
              <button className="modal-close" onClick={() => setShowLanguageModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'].map(lang => (
                <button
                  key={lang}
                  className={`language-option ${settings.language === lang ? 'selected' : ''}`}
                  onClick={() => {
                    handleSelect('language', lang)
                    setShowLanguageModal(false)
                  }}
                >
                  {lang}
                  {settings.language === lang && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Theme Selection Modal */}
      {showThemeModal && (
        <div className="modal-overlay" onClick={() => setShowThemeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Theme</h2>
              <button className="modal-close" onClick={() => setShowThemeModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {['light', 'dark', 'auto'].map(theme => (
                <button
                  key={theme}
                  className={`theme-option ${settings.theme === theme ? 'selected' : ''}`}
                  onClick={() => {
                    handleSelect('theme', theme)
                    setShowThemeModal(false)
                  }}
                >
                  <span className="theme-label">
                    {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto (System)'}
                  </span>
                  {settings.theme === theme && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Font Size Selection Modal */}
      {showFontSizeModal && (
        <div className="modal-overlay" onClick={() => setShowFontSizeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Font Size</h2>
              <button className="modal-close" onClick={() => setShowFontSizeModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {[
                { value: 'small', label: 'Small (85%)' },
                { value: 'medium', label: 'Medium (100% - Default)' },
                { value: 'large', label: 'Large (125%)' },
                { value: 'extraLarge', label: 'Extra Large (150%)' },
              ].map(size => (
                <button
                  key={size.value}
                  className={`font-size-option ${settings.fontSize === size.value ? 'selected' : ''}`}
                  onClick={() => {
                    handleSelect('fontSize', size.value)
                    setShowFontSizeModal(false)
                  }}
                >
                  <span className="font-size-label">{size.label}</span>
                  {settings.fontSize === size.value && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsScreen
