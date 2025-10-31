import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { User } from './src/types';
import { auth } from './src/lib/supabase';
import { FontSizeProvider } from './src/contexts/FontSizeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ActivityTrackingProvider } from './src/contexts/ActivityTrackingContext';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import MainScreen from './src/screens/MainScreen';
import HealthMonitoringScreen from './src/screens/HealthMonitoringScreen';
import ScheduleCheckScreen from './src/screens/ScheduleCheckScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import ChatSelectionScreen from './src/screens/ChatSelectionScreen';
import VoiceChatScreen from './src/screens/VoiceChatScreen';
import ActivityScreen from './src/screens/ActivityScreen';
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
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing authentication on app start and listen for auth changes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data, error } = await auth.getSession();
        
        if (data?.session?.user && !error) {
          // User is already logged in, convert to our User type
          const userData: User = {
            id: data.session.user.id,
            firstName: data.session.user.user_metadata?.firstName || '',
            lastName: data.session.user.user_metadata?.lastName || '',
            email: data.session.user.email || '',
            phoneNumber: data.session.user.user_metadata?.phoneNumber,
            userType: data.session.user.user_metadata?.userType || 'hire'
          };
          setUser(userData);
          // Skip splash and onboarding, go directly to main screen
          setCurrentScreen('main');
        } else {
          // No existing session, proceed with normal flow
          setCurrentScreen('onboarding');
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        // On error, proceed with normal flow
        setCurrentScreen('onboarding');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in
        const userData: User = {
          id: session.user.id,
          firstName: session.user.user_metadata?.firstName || '',
          lastName: session.user.user_metadata?.lastName || '',
          email: session.user.email || '',
          phoneNumber: session.user.user_metadata?.phoneNumber,
          userType: session.user.user_metadata?.userType || 'hire'
        };
        setUser(userData);
        setCurrentScreen('main');
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setUser(null);
        setCurrentScreen('auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSplashFinish = () => {
    // Only proceed to onboarding if we're not checking auth
    if (!isCheckingAuth) {
      setCurrentScreen('onboarding');
    }
  };

  const handleOnboardingFinish = () => {
    setCurrentScreen('auth');
  };


  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setCurrentScreen('main');
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
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

  const handleBackToChatSelection = () => {
    setCurrentScreen('chatSelection');
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
    // Show splash screen while checking authentication
    if (isCheckingAuth) {
      return <SplashScreen onFinish={handleSplashFinish} isLoading={true} />;
    }

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
            user={user}
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
        return <HealthMonitoringScreen onBack={handleBackToMain} onScheduleCheck={handleScheduleCheck} user={user} />;
      case 'scheduleCheck':
        return <ScheduleCheckScreen onBack={handleHealthMonitoring} />;
      case 'chatSelection':
        return (
          <ChatSelectionScreen 
            onBack={handleBackToMain} 
            onTextChat={handleAIChat}
            onVoiceChat={handleVoiceChat}
          />
        );
      case 'aiChat':
        return <AIChatScreen onBack={handleBackToChatSelection} />;
      case 'voiceChat':
        return <VoiceChatScreen onBack={handleBackToChatSelection} />;
      case 'activities':
        return (
          <ActivityScreen 
            onBack={handleBackToMain} 
            user={user}
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
        return <MedicationScreen onBack={handleBackToMain} user={user} />;
      case 'adminDashboard':
        return <AdminDashboardScreen onBack={handleBackToMain} />;
      case 'settings':
        return <SettingsScreen onBack={handleBackToMain} />;
      default:
        return <SplashScreen onFinish={handleSplashFinish} />;
    }
  };

  return (
    <LanguageProvider>
      <FontSizeProvider>
        <ActivityTrackingProvider>
          <StatusBar style="auto" />
          {renderScreen()}
        </ActivityTrackingProvider>
      </FontSizeProvider>
    </LanguageProvider>
  );
}