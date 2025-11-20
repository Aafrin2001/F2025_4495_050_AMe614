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
          Back
        </button>
        <h1 className="medication-title">Medication Management</h1>
        <button className="add-button">
          Add Medication
        </button>
      </div>
    </div>
  );
};

)
export default MedicationScreen

