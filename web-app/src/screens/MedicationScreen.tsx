import React, { useState, useEffect } from 'react'
import './MedicationScreen.css'
import { Medication, MedicationInput, MedicationScheduleItem, MedicationStats, User } from '../types'
import { MedicationService } from '../lib/medicationService'
import { format, formatDistanceToNow } from 'date-fns'

interface MedicationScreenProps {
  onBack: () => void
  user: User | null
}

const MedicationScreen: React.FC<MedicationScreenProps> = ({ onBack, user }) => {
  const [medications, setMedications] = useState<Medication[]>([])
  const [stats, setStats] = useState<MedicationStats | null>(null)
  const [todaySchedule, setTodaySchedule] = useState<MedicationScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [newlyCreatedMedication, setNewlyCreatedMedication] = useState<Medication | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<MedicationInput>({
    name: '',
    dosage: '',
    type: 'pill',
    frequency: '',
    time: [],
    instruction: '',
    doctor: '',
    pharmacy: '',
    refill_date: '',
    side_effects: '',
    is_active: true,
    is_daily: true,
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  
  // Schedule modal state
  const [scheduleData, setScheduleData] = useState({
    startDate: '',
    times: [] as string[],
    refillDate: '',
  })
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

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
        loadMedications(),
        loadTodaySchedule(),
        loadStats()
      ])
      setLastSyncTime(new Date())
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMedications = async () => {
    if (!user?.id) return
    
    try {
      const result = await MedicationService.getUserMedications(user.id)
      
      if (!result.success) {
        setError(result.error || 'Failed to load medications')
        return
      }

      if (result.data) {
        setMedications(result.data)
      }
    } catch (err: any) {
      console.error('Error loading medications:', err)
    }
  }

  const loadTodaySchedule = async () => {
    if (!user?.id) return
    
    try {
      const result = await MedicationService.getTodaySchedule(user.id)
      
      if (!result.success) {
        console.error('Failed to load schedule:', result.error)
        return
      }

      if (result.data) {
        setTodaySchedule(result.data)
      }
    } catch (err: any) {
      console.error('Error loading schedule:', err)
    }
  }

  const loadStats = async () => {
    if (!user?.id) return
    
    try {
      const result = await MedicationService.getMedicationStats(user.id)
      
      if (!result.success) {
        console.error('Failed to load stats:', result.error)
        return
      }

      if (result.data) {
        setStats(result.data)
      }
    } catch (err: any) {
      console.error('Error loading stats:', err)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const handleMarkAsTaken = async (scheduleItem: MedicationScheduleItem) => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      // For daily medications, log usage with the scheduled time
      const result = await MedicationService.logPrnUsage(
        scheduleItem.medication_id,
        `Taken at scheduled time: ${scheduleItem.scheduled_time}`,
        user.id
      )

      if (!result.success) {
        setError(result.error || 'Failed to mark medication as taken')
        return
      }

      // Reload schedule and stats to update status
      await Promise.all([loadTodaySchedule(), loadStats()])
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    }
  }

  const handleLogPrnUsage = async (medicationId: string) => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    const notes = prompt('Add notes about taking this medication (optional):')
    
    try {
      const result = await MedicationService.logPrnUsage(
        medicationId,
        notes || undefined,
        user.id
      )

      if (!result.success) {
        setError(result.error || 'Failed to log PRN usage')
        return
      }

      // Reload schedule and stats
      await Promise.all([loadTodaySchedule(), loadStats()])
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    }
  }

  const handleSaveMedication = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    // Validate form
    const validation = MedicationService.validateMedicationInput(formData)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    setError(null)
    setFormErrors([])

    try {
      let result

      if (editingMedication) {
        // Update existing medication
        result = await MedicationService.updateMedication(editingMedication.id, formData)
        
        if (!result.success) {
          setError(result.error || 'Failed to update medication')
          setIsSubmitting(false)
          return
        }

        setShowAddModal(false)
        resetForm()
        await loadData()
      } else {
        // Create new medication
        // For daily medications, save without times first, then show schedule modal
        const medicationToSave = {
          ...formData,
          time: formData.is_daily ? [] : formData.time, // Empty times for daily, will be set in schedule modal
        }

        result = await MedicationService.saveMedication(medicationToSave, user.id)
        
        if (!result.success) {
          setError(result.error || 'Failed to save medication')
          setIsSubmitting(false)
          return
        }

        if (result.data) {
          if (formData.is_daily) {
            // Show schedule modal for daily medications
            setNewlyCreatedMedication(result.data)
            setScheduleData({
              startDate: '',
              times: [],
              refillDate: formData.refill_date || '',
            })
            setShowAddModal(false)
            setShowScheduleModal(true)
          } else {
            // PRN medication - no schedule needed
            setShowAddModal(false)
            resetForm()
            await loadData()
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveSchedule = async () => {
    if (!newlyCreatedMedication) {
      setError('Medication not found')
      return
    }

    if (!scheduleData.startDate) {
      setFormErrors(['Please select a start date'])
      return
    }

    if (scheduleData.times.length === 0) {
      setFormErrors(['Please add at least one time for daily medication'])
      return
    }

    setIsSubmitting(true)
    setError(null)
    setFormErrors([])

    try {
      const result = await MedicationService.updateMedication(newlyCreatedMedication.id, {
        time: scheduleData.times,
        refill_date: scheduleData.refillDate || undefined,
      })

      if (!result.success) {
        setError(result.error || 'Failed to set medication schedule')
        setIsSubmitting(false)
        return
      }

      setShowScheduleModal(false)
      setNewlyCreatedMedication(null)
      setScheduleData({ startDate: '', times: [], refillDate: '' })
      await loadData()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMedication = async (medicationId: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) {
      return
    }

    try {
      const result = await MedicationService.deleteMedication(medicationId)
      
      if (!result.success) {
        setError(result.error || 'Failed to delete medication')
        return
      }

      await loadData()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    }
  }

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication)
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      type: medication.type,
      frequency: medication.frequency,
      time: medication.time,
      instruction: medication.instruction || '',
      doctor: medication.doctor || '',
      pharmacy: medication.pharmacy || '',
      refill_date: medication.refill_date || '',
      side_effects: medication.side_effects || '',
      is_active: medication.is_active,
      is_daily: medication.is_daily,
    })
    setFormErrors([])
    setShowAddModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      type: 'pill',
      frequency: '',
      time: [],
      instruction: '',
      doctor: '',
      pharmacy: '',
      refill_date: '',
      side_effects: '',
      is_active: true,
      is_daily: true,
    })
    setFormErrors([])
    setEditingMedication(null)
  }

  const addTime = () => {
    if (selectedTime) {
      // Convert time input (HH:MM) to proper format
      const timeStr = selectedTime
      if (!formData.time.includes(timeStr)) {
        setFormData({
          ...formData,
          time: [...formData.time, timeStr].sort()
        })
        setSelectedTime('')
      }
    }
  }

  const removeTime = (index: number) => {
    setFormData({
      ...formData,
      time: formData.time.filter((_, i) => i !== index)
    })
  }

  const addScheduleTime = () => {
    if (selectedTime) {
      // Convert time input (HH:MM) to proper format
      const timeStr = selectedTime
      if (!scheduleData.times.includes(timeStr)) {
        setScheduleData({
          ...scheduleData,
          times: [...scheduleData.times, timeStr].sort()
        })
        setSelectedTime('')
      }
    }
  }

  const removeScheduleTime = (index: number) => {
    setScheduleData({
      ...scheduleData,
      times: scheduleData.times.filter((_, i) => i !== index)
    })
  }

  const getMedicationTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      pill: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="2" x2="12" y2="22"></line>
        </svg>
      ),
      liquid: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
      injection: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="2" x2="22" y2="6"></line>
          <line x1="22" y1="2" x2="18" y2="6"></line>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
        </svg>
      ),
      cream: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        </svg>
      ),
      inhaler: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
      ),
    }
    return icons[type] || icons.pill
  }

  const getMedicationTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      pill: '#4CAF50',
      liquid: '#2196F3',
      injection: '#FF9800',
      cream: '#9C27B0',
      inhaler: '#00BCD4',
    }
    return colors[type] || '#666666'
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'overdue': return '#F44336'
      case 'due_now': return '#FF9800'
      case 'upcoming': return '#4CAF50'
      default: return '#666666'
    }
  }

  return (
    <div className="medication-screen">
      <div className="medication-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 className="medication-title">Medications</h1>
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
          <button 
            className="add-button" 
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Medication
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

      <div className="medication-content">
        {isLoading && !medications.length ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading medications...</p>
          </div>
        ) : (
          <>
            {/* Today's Schedule */}
            <div className="schedule-container">
              <h2 className="section-title">Today's Schedule</h2>
              {todaySchedule.length === 0 ? (
                <div className="empty-schedule">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <p className="empty-text">No medications scheduled for today</p>
                </div>
              ) : (
                <div className="schedule-list">
                  {todaySchedule.map((item) => (
                    <div 
                      key={item.id} 
                      className="schedule-item"
                      style={{ borderLeftColor: getStatusColor(item.status) }}
                    >
                      <div className="schedule-item-header">
                        <div className="schedule-item-info">
                          <h3 className="schedule-item-name">{item.name}</h3>
                          <p className="schedule-item-dosage">{item.dosage}</p>
                        </div>
                        <div 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(item.status) }}
                        >
                          {item.status.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="schedule-item-details">
                        <div className="schedule-item-time">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {MedicationService.formatTime(item.scheduled_time)}
                        </div>
                        {item.instruction && (
                          <p className="schedule-item-instruction">{item.instruction}</p>
                        )}
                      </div>

                      {item.status !== 'upcoming' && (
                        <button
                          className="mark-taken-button"
                          onClick={() => handleMarkAsTaken(item)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Mark as Taken
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Statistics Overview */}
            {stats && (
              <div className="stats-container">
                <h2 className="section-title">Overview</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{stats.totalMedications}</div>
                    <div className="stat-label">Total Drugs</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.activeDailyMedications}</div>
                    <div className="stat-label">Daily Drugs</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.activePrnMedications}</div>
                    <div className="stat-label">PRN Drugs</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.totalReminders}</div>
                    <div className="stat-label">Reminders</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#F44336' }}>
                      {stats.overdueMedications}
                    </div>
                    <div className="stat-label">Overdue</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#FF9800' }}>
                      {stats.medicationsDueNow}
                    </div>
                    <div className="stat-label">Due Now</div>
                  </div>
                </div>
              </div>
            )}

            {/* All Medications */}
            <div className="medications-container">
              <h2 className="section-title">All Medications</h2>
              {medications.length === 0 ? (
                <div className="empty-container">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <p className="empty-text">No medications added yet</p>
                  <p className="empty-subtext">Add your first medication to get started</p>
                </div>
              ) : (
                <div className="medications-list">
                  {medications.map((medication) => (
                    <div key={medication.id} className="medication-card">
                      <div className="medication-header-card">
                        <div className="medication-info">
                          <div 
                            className="medication-type-container"
                            style={{ color: getMedicationTypeColor(medication.type) }}
                          >
                            {getMedicationTypeIcon(medication.type)}
                            <span className="medication-name">{medication.name}</span>
                            {!medication.is_daily && (
                              <span className="prn-badge">PRN</span>
                            )}
                          </div>
                          <p className="medication-dosage">{medication.dosage}</p>
                          <p className="medication-frequency">{medication.frequency}</p>
                        </div>
                        
                        <div className="medication-actions">
                          <button
                            className="action-button edit-button"
                            onClick={() => handleEditMedication(medication)}
                            title="Edit medication"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          
                          <button
                            className="action-button delete-button"
                            onClick={() => handleDeleteMedication(medication.id)}
                            title="Delete medication"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                          
                          {!medication.is_daily && (
                            <button
                              className="action-button log-button"
                              onClick={() => handleLogPrnUsage(medication.id)}
                              title="Log PRN usage"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {medication.is_daily && medication.time.length > 0 && (
                        <div className="medication-times">
                          <span className="times-label">Times:</span>
                          <div className="times-container">
                            {medication.time.map((time, index) => (
                              <span key={index} className="time-chip">
                                {MedicationService.formatTime(time)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {medication.instruction && (
                        <p className="medication-detail">Instructions: {medication.instruction}</p>
                      )}
                      
                      {medication.doctor && (
                        <p className="medication-detail">Doctor: {medication.doctor}</p>
                      )}
                      
                      {medication.refill_date && (
                        <p className="medication-detail">
                          Refill Date: {format(new Date(medication.refill_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Medication Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { 
          setShowAddModal(false)
          resetForm()
          setError(null)
        }}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMedication ? 'Edit Medication' : 'Add Medication'}</h2>
              <button 
                className="modal-close" 
                onClick={() => { 
                  setShowAddModal(false)
                  resetForm()
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

              {formErrors.length > 0 && (
                <div className="modal-error">
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {formErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-group">
                <label>Medication Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Aspirin"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Dosage *</label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={e => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 10mg"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    disabled={isSubmitting}
                    className="form-select"
                  >
                    <option value="pill">Pill</option>
                    <option value="liquid">Liquid</option>
                    <option value="injection">Injection</option>
                    <option value="cream">Cream</option>
                    <option value="inhaler">Inhaler</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Frequency *</label>
                  <input
                    type="text"
                    value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                    placeholder="e.g., Twice daily"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Medication Type</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="is_daily"
                      checked={formData.is_daily === true}
                      onChange={() => setFormData({ ...formData, is_daily: true })}
                      disabled={isSubmitting}
                    />
                    <span>Daily (scheduled)</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="is_daily"
                      checked={formData.is_daily === false}
                      onChange={() => setFormData({ ...formData, is_daily: false })}
                      disabled={isSubmitting}
                    />
                    <span>PRN (as needed)</span>
                  </label>
                </div>
              </div>

              {!formData.is_daily && (
                <div className="form-group">
                  <label>Times (HH:MM format) *</label>
                  <div className="time-input-group">
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={e => setSelectedTime(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="btn-small"
                      onClick={addTime}
                      disabled={isSubmitting || !selectedTime}
                    >
                      Add Time
                    </button>
                  </div>
                  {formData.time.length > 0 && (
                    <div className="time-chips">
                      {formData.time.map((time, index) => (
                        <span key={index} className="time-chip">
                          {MedicationService.formatTime(time)}
                          <button
                            type="button"
                            onClick={() => removeTime(index)}
                            className="chip-remove"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Instructions (Optional)</label>
                <textarea
                  value={formData.instruction || ''}
                  onChange={e => setFormData({ ...formData, instruction: e.target.value })}
                  placeholder="e.g., Take with food"
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Doctor (Optional)</label>
                  <input
                    type="text"
                    value={formData.doctor || ''}
                    onChange={e => setFormData({ ...formData, doctor: e.target.value })}
                    placeholder="Dr. Smith"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label>Pharmacy (Optional)</label>
                  <input
                    type="text"
                    value={formData.pharmacy || ''}
                    onChange={e => setFormData({ ...formData, pharmacy: e.target.value })}
                    placeholder="CVS Pharmacy"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Refill Date (Optional)</label>
                <input
                  type="date"
                  value={formData.refill_date || ''}
                  onChange={e => setFormData({ ...formData, refill_date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Side Effects (Optional)</label>
                <textarea
                  value={formData.side_effects || ''}
                  onChange={e => setFormData({ ...formData, side_effects: e.target.value })}
                  placeholder="List any known side effects"
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => { 
                  setShowAddModal(false)
                  resetForm()
                  setError(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSaveMedication}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  editingMedication ? 'Update Medication' : 'Save Medication'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal for Daily Medications */}
      {showScheduleModal && newlyCreatedMedication && (
        <div className="modal-overlay" onClick={() => { 
          setShowScheduleModal(false)
          setNewlyCreatedMedication(null)
          setScheduleData({ startDate: '', times: [], refillDate: '' })
          setError(null)
        }}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Set Medication Schedule</h2>
              <button 
                className="modal-close" 
                onClick={() => { 
                  setShowScheduleModal(false)
                  setNewlyCreatedMedication(null)
                  setScheduleData({ startDate: '', times: [], refillDate: '' })
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
              <div className="info-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>{newlyCreatedMedication.name} - {newlyCreatedMedication.dosage}</span>
              </div>

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

              {formErrors.length > 0 && (
                <div className="modal-error">
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {formErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={scheduleData.startDate}
                  onChange={e => setScheduleData({ ...scheduleData, startDate: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Times (HH:MM format) *</label>
                <div className="time-input-group">
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="btn-small"
                    onClick={addScheduleTime}
                    disabled={isSubmitting || !selectedTime}
                  >
                    Add Time
                  </button>
                </div>
                {scheduleData.times.length > 0 && (
                  <div className="time-chips">
                    {scheduleData.times.map((time, index) => (
                      <span key={index} className="time-chip">
                        {MedicationService.formatTime(time)}
                        <button
                          type="button"
                          onClick={() => removeScheduleTime(index)}
                          className="chip-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Refill Date (Optional)</label>
                <input
                  type="date"
                  value={scheduleData.refillDate}
                  onChange={e => setScheduleData({ ...scheduleData, refillDate: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => { 
                  setShowScheduleModal(false)
                  setNewlyCreatedMedication(null)
                  setScheduleData({ startDate: '', times: [], refillDate: '' })
                  setError(null)
                  loadData()
                }}
                disabled={isSubmitting}
              >
                Skip for Now
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSaveSchedule}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  'Save Schedule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicationScreen
