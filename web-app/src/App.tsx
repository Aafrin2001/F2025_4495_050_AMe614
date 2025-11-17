import React, { useState } from 'react'
import { User } from './types'
import HomePage from './screens/HomePage'
import LoginScreen from './screens/LoginScreen'
import MainScreen from './screens/MainScreen'
import MedicationScreen from './screens/MedicationScreen'
import HealthMonitoringScreen from './screens/HealthMonitoringScreen'
import ActivityScreen from './screens/ActivityScreen'
import SettingsScreen from './screens/SettingsScreen'
import AdminDashboardScreen from './screens/AdminDashboardScreen'
import CaregiverDashboardScreen from './screens/CaregiverDashboardScreen'
import CaregiverApprovalScreen from './screens/CaregiverApprovalScreen'
import ChatSelectionScreen from './screens/ChatSelectionScreen'
import AIChatScreen from './screens/AIChatScreen'
import VoiceChatScreen from './screens/VoiceChatScreen'

type Screen = 'home' | 'login' | 'main' | 'medication' | 'healthMonitoring' | 'activities' | 'settings' | 'adminDashboard' | 'caregiverDashboard' | 'caregiverApproval' | 'chatSelection' | 'aiChat' | 'voiceChat' | 'scheduleCheck' | 'walkingTracker' | 'stretching' | 'breathing' | 'sleepCycle' | 'memoryMatch' | 'wordSearch' | 'puzzlePieces' | 'numberSequence'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [user, setUser] = useState<User | null>(null)

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
    if (loggedInUser.userType === 'offer') {
      setCurrentScreen('caregiverDashboard')
    } else {
    setCurrentScreen('main')
    }
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentScreen('home')
  }

  const handleBackToMain = () => {
    if (user?.userType === 'offer') {
      setCurrentScreen('caregiverDashboard')
    } else {
      setCurrentScreen('main')
    }
  }

  if (currentScreen === 'home') {
    return (
      <HomePage
        onSignIn={() => setCurrentScreen('login')}
        onStartTrial={() => setCurrentScreen('login')}
      />
    )
  }

  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (currentScreen === 'main') {
  return (
    <MainScreen
      user={user}
      onLogout={handleLogout}
        onFindServices={() => setCurrentScreen('chatSelection')}
        onOfferSkills={() => setCurrentScreen('activities')}
        onSettingsPress={() => setCurrentScreen('settings')}
        onCreateJob={() => setCurrentScreen('medication')}
        onViewJobs={() => setCurrentScreen('adminDashboard')}
        onHealthMonitoring={() => setCurrentScreen('healthMonitoring')}
        onCaregiverApproval={() => setCurrentScreen('caregiverApproval')}
      />
    )
  }

  if (currentScreen === 'medication') {
    return <MedicationScreen onBack={handleBackToMain} user={user} />
  }

  if (currentScreen === 'healthMonitoring') {
    return (
      <HealthMonitoringScreen
        onBack={handleBackToMain}
        onScheduleCheck={() => setCurrentScreen('scheduleCheck')}
        user={user}
      />
    )
  }

  if (currentScreen === 'activities') {
    return (
      <ActivityScreen
        onBack={handleBackToMain}
        user={user}
        onNavigateToWalking={() => setCurrentScreen('walkingTracker')}
        onNavigateToStretching={() => setCurrentScreen('stretching')}
        onNavigateToBreathing={() => setCurrentScreen('breathing')}
        onNavigateToSleep={() => setCurrentScreen('sleepCycle')}
        onNavigateToMemoryMatch={() => setCurrentScreen('memoryMatch')}
        onNavigateToWordSearch={() => setCurrentScreen('wordSearch')}
        onNavigateToPuzzlePieces={() => setCurrentScreen('puzzlePieces')}
        onNavigateToNumberSequence={() => setCurrentScreen('numberSequence')}
      />
    )
  }

  if (currentScreen === 'settings') {
    return <SettingsScreen onBack={handleBackToMain} />
  }

  if (currentScreen === 'adminDashboard') {
    return <AdminDashboardScreen onBack={handleBackToMain} userId={user?.id} />
  }

  if (currentScreen === 'caregiverDashboard') {
    return (
      <CaregiverDashboardScreen
        caregiver={user!}
        seniorUserId={user?.seniorUserId || ''}
        onBack={() => {}}
        onViewAlerts={() => setCurrentScreen('adminDashboard')}
        onViewDashboard={() => setCurrentScreen('adminDashboard')}
        onViewMedication={() => setCurrentScreen('medication')}
        onViewMonitor={() => setCurrentScreen('healthMonitoring')}
        onLogout={handleLogout}
        onSettingsPress={() => setCurrentScreen('settings')}
      />
    )
  }

  if (currentScreen === 'caregiverApproval') {
    return (
      <CaregiverApprovalScreen
        onBack={handleBackToMain}
        onApprovalComplete={() => setCurrentScreen('main')}
      />
    )
  }

  if (currentScreen === 'chatSelection') {
    return (
      <ChatSelectionScreen
        onBack={handleBackToMain}
        onTextChat={() => setCurrentScreen('aiChat')}
        onVoiceChat={() => setCurrentScreen('voiceChat')}
      />
    )
  }

  if (currentScreen === 'aiChat') {
    return <AIChatScreen onBack={() => setCurrentScreen('chatSelection')} />
  }

  if (currentScreen === 'voiceChat') {
    return <VoiceChatScreen onBack={() => setCurrentScreen('chatSelection')} />
  }

  if (currentScreen === 'scheduleCheck') {
    return (
      <div className="placeholder-screen">
        <button onClick={() => setCurrentScreen('healthMonitoring')}>Back</button>
        <h1>Schedule Health Check</h1>
        <p>Schedule your next health check-up</p>
      </div>
    )
  }

  if (currentScreen === 'walkingTracker') {
    return (
      <div className="placeholder-screen">
        <button onClick={() => setCurrentScreen('activities')}>Back</button>
        <h1>Walking Tracker</h1>
        <p>Track your daily walks and steps</p>
      </div>
    )
  }

  if (currentScreen === 'stretching') {
    return (
      <div className="placeholder-screen">
        <button onClick={() => setCurrentScreen('activities')}>Back</button>
        <h1>Stretching Exercises</h1>
        <p>Guided stretching routines</p>
      </div>
    )
  }

  if (currentScreen === 'breathing') {
    return (
      <div className="placeholder-screen">
        <button onClick={() => setCurrentScreen('activities')}>Back</button>
        <h1>Breathing Exercises</h1>
        <p>Relaxation and mindfulness exercises</p>
      </div>
    )
  }

  if (currentScreen === 'sleepCycle') {
    return (
      <div className="placeholder-screen">
        <button onClick={() => setCurrentScreen('activities')}>Back</button>
        <h1>Sleep Cycle</h1>
        <p>Track and improve your sleep</p>
      </div>
    )
  }

  if (currentScreen === 'memoryMatch') {
    return (
      <div className="placeholder-screen">
        <button onClick={() => setCurrentScreen('activities')}>Back</button>
        <h1>Memory Match Game</h1>
        <p>Match pairs of cards to improve memory</p>
      </div>
    )
  }

  if (currentScreen === 'wordSearch') {
    return (
      <div className="placeholder-screen">
        <button onClick={() => setCurrentScreen('activities')}>Back</button>
        <h1>Word Search</h1>
        <p>Find hidden words in puzzles</p>
      </div>
    )
  }

  if (currentScreen === 'puzzlePieces') {
    return (
      <div className="placeholder-screen">
        <button onClick={() => setCurrentScreen('activities')}>Back</button>
        <h1>Puzzle Pieces</h1>
        <p>Complete jigsaw puzzles</p>
      </div>
    )
  }

  if (currentScreen === 'numberSequence') {
    return (
      <div className="placeholder-screen">
        <button onClick={() => setCurrentScreen('activities')}>Back</button>
        <h1>Number Sequence</h1>
        <p>Complete number patterns</p>
      </div>
    )
  }

  return <HomePage onSignIn={() => setCurrentScreen('login')} onStartTrial={() => setCurrentScreen('login')} />
}

export default App
