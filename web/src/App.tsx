import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User } from './types';
import { auth } from './lib/supabase';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import SplashScreen from './components/SplashScreen';
import OnboardingScreen from './components/OnboardingScreen';
import AuthScreen from './components/AuthScreen';
import MainScreen from './components/MainScreen';
import HealthMonitoringScreen from './components/HealthMonitoringScreen';
import ScheduleCheckScreen from './components/ScheduleCheckScreen';
import AIChatScreen from './components/AIChatScreen';
import ChatSelectionScreen from './components/ChatSelectionScreen';
import VoiceChatScreen from './components/VoiceChatScreen';
import ActivitiesScreen from './components/ActivitiesScreen';
import WalkingTrackerScreen from './components/WalkingTrackerScreen';
import StretchingScreen from './components/StretchingScreen';
import BreathingScreen from './components/BreathingScreen';
import SleepCycleScreen from './components/SleepCycleScreen';
import MemoryMatchScreen from './components/MemoryMatchScreen';
import WordSearchScreen from './components/WordSearchScreen';
import PuzzlePiecesScreen from './components/PuzzlePiecesScreen';
import NumberSequenceScreen from './components/NumberSequenceScreen';
import MedicationScreen from './components/MedicationScreen';
import AdminDashboardScreen from './components/AdminDashboardScreen';
import SettingsScreen from './components/SettingsScreen';

// Create a context for user state
const UserContext = React.createContext<{ user: User | null; setUser: (user: User | null) => void } | null>(null);
export const useUser = () => React.useContext(UserContext);

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data, error } = await auth.getSession();
        if (data?.session?.user && !error) {
          const userData: User = {
            id: data.session.user.id,
            firstName: data.session.user.user_metadata?.firstName || '',
            lastName: data.session.user.user_metadata?.lastName || '',
            email: data.session.user.email || '',
            phoneNumber: data.session.user.user_metadata?.phoneNumber,
            userType: data.session.user.user_metadata?.userType || 'hire'
          };
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData: User = {
          id: session.user.id,
          firstName: session.user.user_metadata?.firstName || '',
          lastName: session.user.user_metadata?.lastName || '',
          email: session.user.email || '',
          phoneNumber: session.user.user_metadata?.phoneNumber,
          userType: session.user.user_metadata?.userType || 'hire'
        };
        setUser(userData);
        navigate('/main');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    navigate('/auth');
  };

  if (isLoading) {
    return <SplashScreen onFinish={() => {}} isLoading={true} />;
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Routes>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashScreen onFinish={() => navigate('/onboarding')} />} />
        <Route path="/onboarding" element={<OnboardingScreen onFinish={() => navigate('/auth')} />} />
        <Route path="/auth" element={<AuthScreen onLogin={(userData) => { setUser(userData); navigate('/main'); }} />} />
        <Route path="/main" element={user ? <MainScreen user={user} onLogout={handleLogout} /> : <Navigate to="/auth" replace />} />
        <Route path="/health-monitoring" element={user ? <HealthMonitoringScreen user={user} /> : <Navigate to="/auth" replace />} />
        <Route path="/schedule-check" element={user ? <ScheduleCheckScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/chat-selection" element={user ? <ChatSelectionScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/ai-chat" element={user ? <AIChatScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/voice-chat" element={user ? <VoiceChatScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/activities" element={user ? <ActivitiesScreen user={user} /> : <Navigate to="/auth" replace />} />
        <Route path="/walking-tracker" element={user ? <WalkingTrackerScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/stretching" element={user ? <StretchingScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/breathing" element={user ? <BreathingScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/sleep-cycle" element={user ? <SleepCycleScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/memory-match" element={user ? <MemoryMatchScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/word-search" element={user ? <WordSearchScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/puzzle-pieces" element={user ? <PuzzlePiecesScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/number-sequence" element={user ? <NumberSequenceScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/medication" element={user ? <MedicationScreen user={user} /> : <Navigate to="/auth" replace />} />
        <Route path="/admin-dashboard" element={user ? <AdminDashboardScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/settings" element={user ? <SettingsScreen /> : <Navigate to="/auth" replace />} />
      </Routes>
    </UserContext.Provider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <FontSizeProvider>
        <Router>
          <AppContent />
        </Router>
      </FontSizeProvider>
    </LanguageProvider>
  );
}

