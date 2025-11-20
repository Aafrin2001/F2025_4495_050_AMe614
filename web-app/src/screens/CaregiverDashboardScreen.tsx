import React, { useState } from 'react'
import './CaregiverDashboardScreen.css'
import { User } from '../types'

interface CaregiverDashboardScreenProps {
  caregiver: User
  seniorUserId: string
}
