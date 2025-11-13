import React, { useState } from 'react'
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

function App() {
  const [user, setUser] = useState<User | null>(null)

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (!user) {
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

