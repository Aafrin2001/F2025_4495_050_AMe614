import React, { useState, useEffect } from 'react'
import { User } from './types'
import HomePage from './screens/HomePage'
import LoginScreen from './screens/LoginScreen'
import MainScreen from './screens/MainScreen'
import HealthMonitoringScreen from './screens/HealthMonitoringScreen'
import ActivityScreen from './screens/ActivityScreen'
import MedicationScreen from './screens/MedicationScreen'
import AIChatScreen from './screens/AIChatScreen'
import VoiceChatScreen from './screens/VoiceChatScreen'
import ChatSelectionScreen from './screens/ChatSelectionScreen'
import SettingsScreen from './screens/SettingsScreen'
import CaregiverDashboardScreen from './screens/CaregiverDashboardScreen'
import { auth, isConfigured } from './lib/supabase'
import { CaregiverService } from './lib/caregiverService'

type Screen = 'home' | 'login' | 'main' | 'medication' | 'healthMonitoring' | 'activities' | 'settings' | 'adminDashboard' | 'caregiverDashboard' | 'caregiverApproval' | 'chatSelection' | 'aiChat' | 'voiceChat'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      try {
        // Check if Supabase is configured
        if (!isConfigured) {
          console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
          if (isMounted) {
            setCurrentScreen('home')
            setIsCheckingAuth(false)
          }
          return
        }

        // Set a timeout to prevent infinite loading (5 seconds)
        const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('Auth check timeout - proceeding without session')
            resolve({ data: null, error: { message: 'Timeout' } })
          }, 5000)
        })

        // Check for existing session with timeout
        const sessionPromise = auth.getSession()
        let sessionResult: any
        
        try {
          sessionResult = await Promise.race([sessionPromise, timeoutPromise])
        } catch (err) {
          console.error('Error in session check:', err)
          sessionResult = { data: null, error: { message: 'Session check failed' } }
        }
        
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (!isMounted) return
        
        const { data, error } = sessionResult
        
        if (data?.session?.user && !error) {
          // User is already logged in, convert to our User type
          const userData: User = {
            id: data.session.user.id,
            firstName: data.session.user.user_metadata?.firstName || '',
            lastName: data.session.user.user_metadata?.lastName || '',
            email: data.session.user.email || '',
            phoneNumber: data.session.user.user_metadata?.phoneNumber,
            userType: data.session.user.user_metadata?.userType || 'hire'
          }
          
          // If caregiver, load relationship (with timeout)
          if (userData.userType === 'offer') {
            try {
              const relationshipPromise = CaregiverService.getSeniorUserId(userData.id)
              const relationshipTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Relationship check timeout')), 3000)
              })
              
              const relationship = await Promise.race([relationshipPromise, relationshipTimeout]) as any
              if (relationship?.success && relationship.seniorUserId) {
                userData.seniorUserId = relationship.seniorUserId
                userData.seniorEmail = relationship.seniorEmail
              }
            } catch (relError) {
              console.error('Error loading caregiver relationship:', relError)
              // Continue without relationship data
            }
          }
          
          if (isMounted) {
            setUser(userData)
            // Route caregivers to caregiver dashboard (even if pending), seniors to main screen
            if (userData.userType === 'offer') {
              setCurrentScreen('caregiverDashboard')
            } else {
              setCurrentScreen('main')
            }
          }
        } else {
          // No existing session, proceed with normal flow
          if (isMounted) {
            setCurrentScreen('home')
          }
        }
      } catch (error: any) {
        console.error('Error checking auth session:', error)
        // On error, proceed with normal flow
        if (isMounted) {
          setCurrentScreen('home')
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        if (isMounted) {
          setIsCheckingAuth(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }

    // Listen for auth state changes (only if Supabase is configured)
    let subscription: { unsubscribe: () => void } | null = null
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseKey) {
        const { data } = auth.onAuthStateChange(async (event, session) => {
          try {
            if (event === 'SIGNED_IN' && session?.user) {
              // User signed in
              const userData: User = {
                id: session.user.id,
                firstName: session.user.user_metadata?.firstName || '',
                lastName: session.user.user_metadata?.lastName || '',
                email: session.user.email || '',
                phoneNumber: session.user.user_metadata?.phoneNumber,
                userType: session.user.user_metadata?.userType || 'hire'
              }
              
              // If caregiver, load relationship to get seniorUserId
              if (userData.userType === 'offer') {
                try {
                  const relationship = await CaregiverService.getSeniorUserId(userData.id)
                  if (relationship.success && relationship.seniorUserId) {
                    userData.seniorUserId = relationship.seniorUserId
                    userData.seniorEmail = relationship.seniorEmail
                  }
                } catch (relError) {
                  console.error('Error loading caregiver relationship:', relError)
                }
              }
              
              setUser(userData)
              // Route caregivers to caregiver dashboard (even if pending), seniors to main screen
              if (userData.userType === 'offer') {
                setCurrentScreen('caregiverDashboard')
              } else {
                setCurrentScreen('main')
              }
            } else if (event === 'SIGNED_OUT') {
              // User signed out
              setUser(null)
              setCurrentScreen('home')
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error)
          }
        })
        subscription = data?.subscription || null
      }
    } catch (error) {
      console.error('Error setting up auth state listener:', error)
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
    if (loggedInUser.userType === 'offer') {
      setCurrentScreen('caregiverDashboard')
    } else {
      setCurrentScreen('main')
    }
  }

  const handleLogout = async () => {
    try {
      await auth.signOut()
      setUser(null)
      setCurrentScreen('home')
    } catch (error) {
      console.error('Error signing out:', error)
      // Still clear user state even if signOut fails
      setUser(null)
      setCurrentScreen('home')
    }
  }

  const handleBackToMain = () => {
    if (user?.userType === 'offer') {
      setCurrentScreen('caregiverDashboard')
    } else {
      setCurrentScreen('main')
    }
  }

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
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

  if (currentScreen === 'medication') {
    return <MedicationScreen onBack={handleBackToMain} user={user} />;
  }

  if (currentScreen === 'healthMonitoring') {
    return (
      <HealthMonitoringScreen
        onBack={handleBackToMain}
        onScheduleCheck={() => {
          // TODO: Implement schedule check functionality
          alert('Schedule check feature coming soon')
        }}
        user={user}
      />
    )
  }

  if (currentScreen === 'activities') {
    return (
      <ActivityScreen
        onBack={handleBackToMain}
        user={user}
      />
    )
  }

  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        onBack={handleBackToMain}
        user={user}
        onLogout={handleLogout}
      />
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
      <CaregiverDashboardScreen
        caregiver={user!}
        seniorUserId={user?.seniorUserId}
        onViewAlerts={() => setCurrentScreen('adminDashboard')}
        onViewDashboard={() => setCurrentScreen('adminDashboard')}
        onViewMedication={() => setCurrentScreen('medication')}
        onViewMonitor={() => setCurrentScreen('healthMonitoring')}
        onLogout={handleLogout}
        onSettingsPress={() => setCurrentScreen('settings')}
        onSeniorAdded={async (seniorEmail, seniorUserId) => {
          if (user) {
            user.seniorEmail = seniorEmail
            user.seniorUserId = seniorUserId
            setUser({ ...user })
          }
        }}
      />
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
      <ChatSelectionScreen
        onBack={handleBackToMain}
        onTextChat={() => setCurrentScreen('aiChat')}
        onVoiceChat={() => setCurrentScreen('voiceChat')}
      />
    )
  }

  if (currentScreen === 'aiChat') {
    return <AIChatScreen onBack={() => setCurrentScreen('chatSelection')} user={user} />;
  }

  if (currentScreen === 'voiceChat') {
    return <VoiceChatScreen onBack={() => setCurrentScreen('chatSelection')} user={user} />;
  }

  return <HomePage onSignIn={() => setCurrentScreen('login')} onStartTrial={() => setCurrentScreen('login')} />
}

export default App
