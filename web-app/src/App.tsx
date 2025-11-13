import React, { useState } from 'react'
import HomePage from './screens/HomePage'
import LoginScreen from './screens/LoginScreen'
import MainScreen from './screens/MainScreen'

interface User {
  id: string
  firstName: string
  lastName?: string
  email: string
  phoneNumber?: string
  userType: 'hire' | 'offer'
}

type Screen = 'home' | 'login' | 'main'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [user, setUser] = useState<User | null>(null)

  const handleSignIn = () => {
    setCurrentScreen('login')
  }

  const handleStartTrial = () => {
    setCurrentScreen('login')
  }

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
    setCurrentScreen('main')
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentScreen('home')
  }

  if (currentScreen === 'home') {
    return (
      <HomePage
        onSignIn={handleSignIn}
        onStartTrial={handleStartTrial}
      />
    )
  }

  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <MainScreen
      user={user}
      onLogout={handleLogout}
      onFindServices={() => console.log('Find services clicked')}
      onOfferSkills={() => console.log('Offer skills clicked')}
      onSettingsPress={() => console.log('Settings clicked')}
      onCreateJob={() => console.log('Create job clicked')}
      onViewJobs={() => console.log('View jobs clicked')}
      onHealthMonitoring={() => console.log('Health monitoring clicked')}
    />
  )
}

export default App

