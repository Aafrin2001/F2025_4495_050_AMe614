import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import MainScreen from './src/screens/MainScreen';
import HealthMonitoringScreen from './src/screens/HealthMonitoringScreen';
import ScheduleCheckScreen from './src/screens/ScheduleCheckScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import ChatSelectionScreen from './src/screens/ChatSelectionScreen';
import VoiceChatScreen from './src/screens/VoiceChatScreen';
import ActivitiesScreen from './src/screens/ActivitiesScreen';
import WalkingTrackerScreen from './src/screens/WalkingTrackerScreen';
import StretchingScreen from './src/screens/StretchingScreen';
import BreathingScreen from './src/screens/BreathingScreen';
import SleepCycleScreen from './src/screens/SleepCycleScreen';
import MemoryMatchScreen from './src/screens/MemoryMatchScreen';
import WordSearchScreen from './src/screens/WordSearchScreen';
import PuzzlePiecesScreen from './src/screens/PuzzlePiecesScreen';
import NumberSequenceScreen from './src/screens/NumberSequenceScreen';
import MedicationScreen from './src/screens/MedicationScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';

type Screen = 'splash' | 'onboarding' | 'auth' | 'main' | 'healthMonitoring' | 'scheduleCheck' | 'chatSelection' | 'aiChat' | 'voiceChat' | 'activities' | 'walkingTracker' | 'stretching' | 'breathing' | 'sleepCycle' | 'memoryMatch' | 'wordSearch' | 'puzzlePieces' | 'numberSequence' | 'medication' | 'adminDashboard' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');

  const handleSplashFinish = () => {
    setCurrentScreen('onboarding');
  };

  const handleOnboardingFinish = () => {
    setCurrentScreen('auth');
  };


  const handleAuthSuccess = () => {
    setCurrentScreen('main');
  };

  const handleLogout = () => {
    setCurrentScreen('auth');
  };

  const handleFindServices = () => {
    setCurrentScreen('chatSelection');
  };

  const handleOfferSkills = () => {
    setCurrentScreen('activities');
  };

  const handleSettingsPress = () => {
    setCurrentScreen('settings');
  };

  const handleCreateJob = () => {
    setCurrentScreen('medication');
  };

  const handleViewJobs = () => {
    setCurrentScreen('adminDashboard');
  };

  const handleHealthMonitoring = () => {
    setCurrentScreen('healthMonitoring');
  };

  const handleScheduleCheck = () => {
    setCurrentScreen('scheduleCheck');
  };

  const handleBackToMain = () => {
    setCurrentScreen('main');
  };

  const handleChatSelection = () => {
    setCurrentScreen('chatSelection');
  };

  const handleAIChat = () => {
    setCurrentScreen('aiChat');
  };

  const handleVoiceChat = () => {
    setCurrentScreen('voiceChat');
  };

  const handleActivities = () => {
    setCurrentScreen('activities');
  };

  const handleNavigateToWalking = () => {
    setCurrentScreen('walkingTracker');
  };

  const handleNavigateToStretching = () => {
    setCurrentScreen('stretching');
  };

  const handleNavigateToBreathing = () => {
    setCurrentScreen('breathing');
  };

  const handleNavigateToSleep = () => {
    setCurrentScreen('sleepCycle');
  };

  const handleNavigateToMemoryMatch = () => {
    setCurrentScreen('memoryMatch');
  };

  const handleNavigateToWordSearch = () => {
    setCurrentScreen('wordSearch');
  };

  const handleNavigateToPuzzlePieces = () => {
    setCurrentScreen('puzzlePieces');
  };

  const handleNavigateToNumberSequence = () => {
    setCurrentScreen('numberSequence');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onFinish={handleSplashFinish} />;
      case 'onboarding':
        return <OnboardingScreen onFinish={handleOnboardingFinish} />;
          case 'auth':
            return <AuthScreen onLogin={handleAuthSuccess} />;
      case 'main':
        return (
          <MainScreen
            onLogout={handleLogout}
            onFindServices={handleFindServices}
            onOfferSkills={handleOfferSkills}
            onSettingsPress={handleSettingsPress}
            onCreateJob={handleCreateJob}
            onViewJobs={handleViewJobs}
            onHealthMonitoring={handleHealthMonitoring}
          />
        );
      case 'healthMonitoring':
        return <HealthMonitoringScreen onBack={handleBackToMain} onScheduleCheck={handleScheduleCheck} />;
      case 'scheduleCheck':
        return <ScheduleCheckScreen onBack={handleBackToMain} />;
      case 'chatSelection':
        return (
          <ChatSelectionScreen 
            onBack={handleBackToMain} 
            onTextChat={handleAIChat}
            onVoiceChat={handleVoiceChat}
          />
        );
      case 'aiChat':
        return <AIChatScreen onBack={handleBackToMain} />;
      case 'voiceChat':
        return <VoiceChatScreen onBack={handleBackToMain} />;
      case 'activities':
        return (
          <ActivitiesScreen 
            onBack={handleBackToMain}
            onNavigateToWalking={handleNavigateToWalking}
            onNavigateToStretching={handleNavigateToStretching}
            onNavigateToBreathing={handleNavigateToBreathing}
            onNavigateToSleep={handleNavigateToSleep}
            onNavigateToMemoryMatch={handleNavigateToMemoryMatch}
            onNavigateToWordSearch={handleNavigateToWordSearch}
            onNavigateToPuzzlePieces={handleNavigateToPuzzlePieces}
            onNavigateToNumberSequence={handleNavigateToNumberSequence}
          />
        );
      case 'walkingTracker':
        return <WalkingTrackerScreen onBack={handleActivities} onComplete={() => {}} />;
      case 'stretching':
        return <StretchingScreen onBack={handleActivities} onComplete={() => {}} />;
      case 'breathing':
        return <BreathingScreen onBack={handleActivities} onComplete={() => {}} />;
      case 'sleepCycle':
        return <SleepCycleScreen onBack={handleActivities} onComplete={() => {}} />;
      case 'memoryMatch':
        return <MemoryMatchScreen onBack={handleActivities} onComplete={() => {}} />;
      case 'wordSearch':
        return <WordSearchScreen onBack={handleActivities} onComplete={() => {}} />;
      case 'puzzlePieces':
        return <PuzzlePiecesScreen onBack={handleActivities} onComplete={() => {}} />;
      case 'numberSequence':
        return <NumberSequenceScreen onBack={handleActivities} onComplete={() => {}} />;
      case 'medication':
        return <MedicationScreen onBack={handleBackToMain} />;
      case 'adminDashboard':
        return <AdminDashboardScreen onBack={handleBackToMain} />;
      case 'settings':
        return <SettingsScreen onBack={handleBackToMain} />;
      default:
        return <SplashScreen onFinish={handleSplashFinish} />;
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      {renderScreen()}
    </>
  );
}