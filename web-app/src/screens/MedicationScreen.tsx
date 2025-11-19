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
