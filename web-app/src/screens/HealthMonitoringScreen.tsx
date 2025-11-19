import React, { useState } from 'react'
import './HealthMonitoringScreen.css'
import { HealthMetricInput } from '../types'

interface HealthMonitoringScreenProps {

}

interface VitalSign {
  id: string
  name: string
  metric_type: 'blood_pressure' | 'heart_rate' | 'body_temperature' | 'weight' | 'blood_sugar' | 'oxygen_level'
  value: string
  unit: string
  icon: string
  color: string
  lastUpdated?: string
}

const HealthMonitoringScreen: React.FC<HealthMonitoringScreenProps> = ({ onBack, onScheduleCheck }) => {
  const [vitalSigns] = useState<VitalSign[]>([
    { id: '1', name: 'Blood Pressure', metric_type: 'blood_pressure', value: '120/80', unit: 'mmHg', icon: 'heart', color: '#FF6B6B', lastUpdated: 'Today' },
    { id: '2', name: 'Heart Rate', metric_type: 'heart_rate', value: '72', unit: 'bpm', icon: 'pulse', color: '#4ECDC4', lastUpdated: 'Today' },
    { id: '3', name: 'Body Temperature', metric_type: 'body_temperature', value: '98.6', unit: '°F', icon: 'thermometer', color: '#45B7D1', lastUpdated: 'Today' },
    { id: '4', name: 'Weight', metric_type: 'weight', value: '165', unit: 'lbs', icon: 'scale', color: '#96CEB4', lastUpdated: '2 days ago' },
    { id: '5', name: 'Blood Sugar', metric_type: 'blood_sugar', value: '95', unit: 'mg/dL', icon: 'water', color: '#FFEAA7', lastUpdated: 'Today' },
    { id: '6', name: 'Oxygen Level', metric_type: 'oxygen_level', value: '98', unit: '%', icon: 'air', color: '#DDA0DD', lastUpdated: 'Today' },
  ])

  const [selectedVital, setSelectedVital] = useState<VitalSign | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState<HealthMetricInput>({
    metric_type: 'heart_rate',
    value: 0,
    unit: 'bpm',
    notes: '',
  })
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')

  const handleVitalClick = (vital: VitalSign) => {
    setSelectedVital(vital)
    setFormData({
      metric_type: vital.metric_type,
      value: 0,
      unit: vital.unit,
      notes: '',
    })
    setShowAddModal(true)
  }

  const handleSubmit = () => {
    // In a real app, this would save to backend
    console.log('Saving health metric:', formData)
    setShowAddModal(false)
    setSelectedVital(null)
    alert('Health reading saved successfully!')
  }

 
