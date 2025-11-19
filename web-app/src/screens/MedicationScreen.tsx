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
