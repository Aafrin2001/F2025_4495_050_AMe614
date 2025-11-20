import React, { useState, useEffect } from 'react'
import './MedicationScreen.css'
import { Medication, MedicationInput, MedicationScheduleItem, MedicationStats } from '../types'

interface MedicationScreenProps {
  onBack: () => void
  user: any
  userId?: string
}
const MedicationScreen: React.FC<MedicationScreenProps> = ({ onBack, user }) => {
  const [medications, setMedications] = useState<Medication[]>([])
  const [stats, setStats] = useState<MedicationStats | null>(null)
  const [todaySchedule, setTodaySchedule] = useState<MedicationScheduleItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
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
  const [selectedTime, setSelectedTime] = useState('')
   useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    // Mock medications
    const mockMedications: Medication[] = [
      {
        id: '1',
        user_id: user?.id || '1',
        name: 'Aspirin',
        dosage: '81mg',
        type: 'pill',
        frequency: 'Once daily',
        time: ['08:00'],
        instruction: 'Take with food',
        doctor: 'Dr. Smith',
        pharmacy: 'CVS Pharmacy',
        refill_date: '2025-12-01',
        side_effects: '',
        is_active: true,
        is_daily: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
        setMedications(mockMedications)

    // Mock stats
    setStats({
      totalMedications: mockMedications.length,
      activeDailyMedications: 1,
      activePrnMedications: 0,
      totalReminders: 1,
      overdueMedications: 0,
      medicationsDueNow: 0,
      prnUsedToday: 0,
    })

    // Mock schedule
    const mockSchedule: MedicationScheduleItem[] = [
      {
        id: '1',
        medication_id: '1',
        name: 'Aspirin',
        dosage: '81mg',
        type: 'pill',
        scheduled_time: '08:00',
        status: 'upcoming',
        instruction: 'Take with food',
        is_daily: true,
      },
    ]
    setTodaySchedule(mockSchedule)
  }

  const handleAddTime = () => {
    if (selectedTime && !formData.time.includes(selectedTime)) {
      setFormData({ ...formData, time: [...formData.time, selectedTime] })
      setSelectedTime('')
    }
  }

  const handleRemoveTime = (time: string) => {
    setFormData({ ...formData, time: formData.time.filter(t => t !== time) })
  }

  const handleSubmit = () => {
    const errors: string[] = []
    if (!formData.name.trim()) errors.push('Medication name is required')
    if (!formData.dosage.trim()) errors.push('Dosage is required')
    if (!formData.frequency.trim()) errors.push('Frequency is required')
    if (formData.time.length === 0) errors.push('At least one time is required')

    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors([])
    const newMedication: Medication = {
      id: editingMedication?.id || `med_${Date.now()}`,
      user_id: user?.id || '1',
      ...formData,
      created_at: editingMedication?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (editingMedication) {
      setMedications(medications.map(m => m.id === editingMedication.id ? newMedication : m))
    } else {
      setMedications([...medications, newMedication])
    }

    setShowAddModal(false)
    setEditingMedication(null)
    resetForm()
    loadMockData()
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
    setSelectedTime('')
  }

  const handleEdit = (medication: Medication) => {
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
    setShowAddModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      setMedications(medications.filter(m => m.id !== id))
      loadMockData()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return '#F44336'
      case 'due_now': return '#FF9800'
      case 'upcoming': return '#4CAF50'
      default: return '#666'
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
        <h1 className="medication-title">Medication Management</h1>
        <button className="add-button" onClick={() => { resetForm(); setShowAddModal(true) }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Medication
        </button>
      </div>
            <div className="medication-content">
        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalMedications}</div>
                <div className="stat-label">Total Medications</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.activeDailyMedications}</div>
                <div className="stat-label">Daily Medications</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalReminders}</div>
                <div className="stat-label">Daily Reminders</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.medicationsDueNow}</div>
                <div className="stat-label">Due Now</div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        <div className="schedule-section">
          <h2 className="section-title">Today's Schedule</h2>
          {todaySchedule.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <p>No medications scheduled for today</p>
            </div>
          ) : (
            <div className="schedule-list">
              {todaySchedule.map(item => (
                <div key={item.id} className="schedule-item" style={{ borderLeftColor: getStatusColor(item.status) }}>
                  <div className="schedule-time">{item.scheduled_time}</div>
                  <div className="schedule-details">
                    <div className="schedule-name">{item.name}</div>
                    <div className="schedule-dosage">{item.dosage}</div>
                    {item.instruction && <div className="schedule-instruction">{item.instruction}</div>}
                  </div>
                  <div className="schedule-status" style={{ backgroundColor: getStatusColor(item.status) + '20', color: getStatusColor(item.status) }}>
                    {item.status.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medications List */}
        <div className="medications-section">
          <h2 className="section-title">All Medications</h2>
          {medications.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              </svg>
              <p>No medications added yet</p>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>Add Your First Medication</button>
            </div>
          ) : (
            <div className="medications-grid">
              {medications.map(med => (
                <div key={med.id} className="medication-card">
                  <div className="medication-header-card">
                    <div className="medication-icon" style={{ backgroundColor: med.is_active ? '#4CAF50' : '#999' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                      </svg>
                    </div>
                    <div className="medication-info">
                      <h3 className="medication-name">{med.name}</h3>
                      <p className="medication-dosage">{med.dosage} • {med.frequency}</p>
                    </div>
                    <div className="medication-actions">
                      <button className="icon-button" onClick={() => handleEdit(med)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button className="icon-button" onClick={() => handleDelete(med.id)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="medication-details">
                    <div className="detail-item">
                      <span className="detail-label">Times:</span>
                      <span className="detail-value">{med.time.join(', ')}</span>
                    </div>
                    {med.doctor && (
                      <div className="detail-item">
                        <span className="detail-label">Doctor:</span>
                        <span className="detail-value">{med.doctor}</span>
                      </div>
                    )}
                    {med.instruction && (
                      <div className="detail-item">
                        <span className="detail-label">Instructions:</span>
                        <span className="detail-value">{med.instruction}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

)
export default MedicationScreen

