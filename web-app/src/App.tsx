import React from 'react'
import MainScreen from './screens/MainScreen'

function App() {
  // Mock user data for demo
  const mockUser = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    userType: 'hire' as const
  }

  return (
    <MainScreen
      user={mockUser}
      onLogout={() => console.log('Logout clicked')}
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

