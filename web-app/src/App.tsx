import React, { useState, useEffect } from 'react'
import { auth } from './lib/supabase'
import { CaregiverService } from './lib/caregiverService'
import { User } from './types'
import HomePage from './screens/HomePage'
import LoginScreen from './screens/LoginScreen'
import MainScreen from './screens/MainScreen'
// Import other screens as we create them
// import MedicationScreen from './screens/MedicationScreen'
// import HealthMonitoringScreen from './screens/HealthMonitoringScreen'
// import ActivityScreen from './screens/ActivityScreen'
// etc.

type Screen = 'home' | 'login' | 'main' | 'medication' | 'healthMonitoring' | 'activities' | 'settings' | 'adminDashboard' | 'caregiverDashboard' | 'caregiverApproval' | 'chatSelection' | 'aiChat' | 'voiceChat'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data, error } = await auth.getSession()
        
        if (data?.session?.user && !error) {
          const userData: User = {
            id: data.session.user.id,
            firstName: data.session.user.user_metadata?.firstName || '',
            lastName: data.session.user.user_metadata?.lastName || '',
            email: data.session.user.email || '',
            phoneNumber: data.session.user.user_metadata?.phoneNumber,
            userType: data.session.user.user_metadata?.userType || 'hire'
          }
          
          if (userData.userType === 'offer') {
            const relationship = await CaregiverService.getSeniorUserId(userData.id)
            if (relationship.success && relationship.seniorUserId) {
              userData.seniorUserId = relationship.seniorUserId
              userData.seniorEmail = relationship.seniorEmail
            }
          }
          
          setUser(userData)
          if (userData.userType === 'offer') {
            setCurrentScreen('caregiverDashboard')
          } else {
            setCurrentScreen('main')
          }
        } else {
          setCurrentScreen('home')
        }
      } catch (error) {
        console.error('Error checking auth session:', error)
        setCurrentScreen('home')
      } finally {
        setIsCheckingAuth(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData: User = {
          id: session.user.id,
          firstName: session.user.user_metadata?.firstName || '',
          lastName: session.user.user_metadata?.lastName || '',
          email: session.user.email || '',
          phoneNumber: session.user.user_metadata?.phoneNumber,
          userType: session.user.user_metadata?.userType || 'hire'
        }
        
        if (userData.userType === 'offer') {
          const relationship = await CaregiverService.getSeniorUserId(userData.id)
          if (relationship.success && relationship.seniorUserId) {
            userData.seniorUserId = relationship.seniorUserId
            userData.seniorEmail = relationship.seniorEmail
          }
        }
        
        setUser(userData)
        if (userData.userType === 'offer') {
          setCurrentScreen('caregiverDashboard')
        } else {
          setCurrentScreen('main')
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setCurrentScreen('home')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogin = async (loggedInUser: User) => {
    if (loggedInUser.userType === 'offer') {
      const relationship = await CaregiverService.getSeniorUserId(loggedInUser.id)
      if (relationship.success && relationship.seniorUserId) {
        loggedInUser.seniorUserId = relationship.seniorUserId
        loggedInUser.seniorEmail = relationship.seniorEmail
      }
    }
    setUser(loggedInUser)
    if (loggedInUser.userType === 'offer') {
      setCurrentScreen('caregiverDashboard')
    } else {
      setCurrentScreen('main')
    }
  }

  const handleLogout = async () => {
    await auth.signOut()
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

  if (isCheckingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
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

  // Placeholder screens - will be created next
  if (currentScreen === 'medication') {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={handleBackToMain}>Back</button>
        <h1>Medication Management</h1>
        <p>Medication screen coming soon...</p>
      </div>
    )
  }

  if (currentScreen === 'healthMonitoring') {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={handleBackToMain}>Back</button>
        <h1>Health Monitoring</h1>
        <p>Health monitoring screen coming soon...</p>
      </div>
    )
  }

  if (currentScreen === 'activities') {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={handleBackToMain}>Back</button>
        <h1>Activities</h1>
        <p>Activities screen coming soon...</p>
      </div>
    )
  }

  if (currentScreen === 'settings') {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={handleBackToMain}>Back</button>
        <h1>Settings</h1>
        <p>Settings screen coming soon...</p>
      </div>
    )
  }

  if (currentScreen === 'adminDashboard') {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={handleBackToMain}>Back</button>
        <h1>Admin Dashboard</h1>
        <p>Admin dashboard screen coming soon...</p>
      </div>
    )
  }

  if (currentScreen === 'caregiverDashboard') {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={handleLogout}>Logout</button>
        <h1>Caregiver Dashboard</h1>
        <p>Caregiver dashboard screen coming soon...</p>
      </div>
    )
  }

  if (currentScreen === 'caregiverApproval') {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={handleBackToMain}>Back</button>
        <h1>Caregiver Approval</h1>
        <p>Caregiver approval screen coming soon...</p>
      </div>
    )
  }

  if (currentScreen === 'chatSelection') {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={handleBackToMain}>Back</button>
        <h1>Chat Selection</h1>
        <p>Chat selection screen coming soon...</p>
      </div>
    )
  }

  if (currentScreen === 'aiChat') {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => setCurrentScreen('chatSelection')}>Back</button>
        <h1>AI Chat</h1>
        <p>AI chat screen coming soon...</p>
      </div>
    )
  }

  if (currentScreen === 'voiceChat') {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => setCurrentScreen('chatSelection')}>Back</button>
        <h1>Voice Chat</h1>
        <p>Voice chat screen coming soon...</p>
      </div>
    )
  }

  return <HomePage onSignIn={() => setCurrentScreen('login')} onStartTrial={() => setCurrentScreen('login')} />
}

export default App
