import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import SplashScreenComponent from './screens/SplashScreen';
import OnboardingScreenComponent from './screens/OnboardingScreen';
import HealthcareDashboard from './screens/HealthcareDashboard';
import DoctorProfile from './screens/DoctorProfile';
import WalkTracker from './screens/WalkTracker';
import FamilyCommunication from './screens/FamilyCommunication';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

type AppState = 'splash' | 'onboarding' | 'healthcare' | 'doctor' | 'walk' | 'family';

export default function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [currentScreen, setCurrentScreen] = useState<AppState>('healthcare');

  const handleSplashFinish = () => {
    setAppState('onboarding');
  };

  const handleOnboardingComplete = () => {
    setAppState('healthcare');
    setCurrentScreen('healthcare');
  };

  const navigateToScreen = (screen: AppState) => {
    setAppState(screen);
    setCurrentScreen(screen);
  };

  const renderCurrentScreen = () => {
    switch (appState) {
      case 'splash':
        return <SplashScreenComponent onFinish={handleSplashFinish} />;
      case 'onboarding':
        return <OnboardingScreenComponent onComplete={handleOnboardingComplete} />;
              case 'healthcare':
                return <HealthcareDashboard onNavigate={navigateToScreen} />;
              case 'doctor':
                return <DoctorProfile onNavigate={navigateToScreen} />;
              case 'walk':
                return <WalkTracker onNavigate={navigateToScreen} />;
              case 'family':
                return <FamilyCommunication onNavigate={navigateToScreen} />;
      default:
        return <HealthcareDashboard onNavigate={navigateToScreen} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
