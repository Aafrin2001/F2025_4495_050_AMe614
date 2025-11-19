import React, { useState, useEffect } from 'react'
import './MedicationScreen.css'
import { Medication, MedicationInput, MedicationScheduleItem, MedicationStats } from '../types'

interface MedicationScreenProps {
  onBack: () => void
  user: any
  userId?: string
}
