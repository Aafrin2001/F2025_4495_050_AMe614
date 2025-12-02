import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { auth } from './lib/supabase'
import { User } from './types'
import { CaregiverService } from './lib/caregiverService'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

// Import pages
import AuthPage from './pages/AuthPage'
import MainPage from './pages/MainPage'
import CaregiverDashboardPage from './pages/CaregiverDashboardPage'
import MedicationPage from './pages/MedicationPage'
import HealthMonitoringPage from './pages/HealthMonitoringPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ActivityPage from './pages/ActivityPage'
import SettingsPage from './pages/SettingsPage'
import CaregiverApprovalPage from './pages/CaregiverApprovalPage'
import SplashPage from './pages/SplashPage'

const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff'
  }}>
    <div>Loading...</div>
  </div>
);

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    console.log('App: Initializing...');
    const initializeAuth = async () => {
      try {
        // Check if Supabase is properly configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        console.log('App: Supabase config check', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey });
        
        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn('Supabase environment variables not set. Some features may not work.');
          setIsLoading(false);
          return;
        }

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('App: Auth initialization timeout, proceeding anyway');
          setIsLoading(false);
        }, 5000); // 5 second timeout

        try {
          const { data, error } = await auth.getSession()
          
          clearTimeout(timeoutId);
          
          if (data?.session?.user && !error) {
            const userData: User = {
              id: data.session.user.id,
              firstName: data.session.user.user_metadata?.firstName || '',
              lastName: data.session.user.user_metadata?.lastName || '',
              email: data.session.user.email || '',
              phoneNumber: data.session.user.user_metadata?.phoneNumber,
              userType: data.session.user.user_metadata?.userType || 'hire'
            }
            
            // If caregiver, load relationship
            if (userData.userType === 'offer') {
              try {
                const relationship = await CaregiverService.getSeniorUserId(userData.id)
                if (relationship.success && relationship.seniorUserId) {
                  userData.seniorUserId = relationship.seniorUserId
                  userData.seniorEmail = relationship.seniorEmail
                }
              } catch (err) {
                console.error('Error loading caregiver relationship:', err)
              }
            }
            
            setUser(userData)
          }
        } catch (sessionError) {
          clearTimeout(timeoutId);
          console.error('Error getting session:', sessionError);
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setInitError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        console.log('App: Auth initialization complete, isLoading = false');
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    try {
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
            try {
              const relationship = await CaregiverService.getSeniorUserId(userData.id)
              if (relationship.success && relationship.seniorUserId) {
                userData.seniorUserId = relationship.seniorUserId
                userData.seniorEmail = relationship.seniorEmail
              }
            } catch (err) {
              console.error('Error loading caregiver relationship:', err)
            }
          }
          
          setUser(userData)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      return () => {}
    }
  }, [])

  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co';

  console.log('App: Render check', { isLoading, isConfigured, hasUser: !!user, initError });

  if (initError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: '#fff'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          padding: '2rem',
          borderRadius: '15px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#FFA726' }}>⚠️ Initialization Error</h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    console.log('App: Showing configuration required message');
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: '#fff'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          padding: '2rem',
          borderRadius: '15px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#FFA726' }}>⚠️ Configuration Required</h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
            Supabase environment variables are not set.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Setup Instructions:</h2>
            <ol style={{ marginLeft: '1.5rem', lineHeight: '2' }}>
              <li style={{ marginBottom: '0.5rem' }}>Navigate to the <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>web</code> directory</li>
              <li style={{ marginBottom: '0.5rem' }}>Copy <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>.env.example</code> to <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>.env</code></li>
              <li style={{ marginBottom: '0.5rem' }}>Add your Supabase credentials:
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '1rem',
                  borderRadius: '8px',
                  overflowX: 'auto',
                  marginTop: '0.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}>{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}</pre>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>Run <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>npm install</code> if you haven't already</li>
              <li>Restart the development server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    console.log('App: Showing splash page (loading)');
    return <SplashPage />;
  }

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  console.log('App: Rendering router', { user: user ? 'exists' : 'null', path: currentPath });

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/auth" element={
            !user ? (
              <ErrorBoundary>
                <AuthPage onLogin={setUser} />
              </ErrorBoundary>
            ) : (
              <Navigate to={user.userType === 'offer' ? '/caregiver-dashboard' : '/dashboard'} replace />
            )
          } />
          <Route path="/dashboard" element={
            user && user.userType !== 'offer' ? (
              <ErrorBoundary>
                <MainPage user={user} onLogout={() => setUser(null)} />
              </ErrorBoundary>
            ) : (
              <Navigate to="/auth" replace />
            )
          } />
          <Route path="/caregiver-dashboard" element={
            user && user.userType === 'offer' ? (
              <ErrorBoundary>
                <CaregiverDashboardPage user={user} onLogout={() => setUser(null)} />
              </ErrorBoundary>
            ) : (
              <Navigate to="/auth" replace />
            )
          } />
          <Route path="/medications" element={
            user ? (
              <ErrorBoundary>
                <MedicationPage user={user} userId={user.userType === 'offer' && user.seniorUserId ? user.seniorUserId : undefined} />
              </ErrorBoundary>
            ) : (
              <Navigate to="/auth" replace />
            )
          } />
          <Route path="/health-monitoring" element={
            user ? (
              <ErrorBoundary>
                <HealthMonitoringPage user={user} userId={user.userType === 'offer' && user.seniorUserId ? user.seniorUserId : undefined} />
              </ErrorBoundary>
            ) : (
              <Navigate to="/auth" replace />
            )
          } />
          <Route path="/admin-dashboard" element={
            user ? (
              <ErrorBoundary>
                <AdminDashboardPage userId={user.userType === 'offer' && user.seniorUserId ? user.seniorUserId : user.id} />
              </ErrorBoundary>
            ) : (
              <Navigate to="/auth" replace />
            )
          } />
          <Route path="/activities" element={
            user ? (
              <ErrorBoundary>
                <ActivityPage user={user} userId={user.userType === 'offer' && user.seniorUserId ? user.seniorUserId : undefined} />
              </ErrorBoundary>
            ) : (
              <Navigate to="/auth" replace />
            )
          } />
          <Route path="/settings" element={
            user ? (
              <ErrorBoundary>
                <SettingsPage />
              </ErrorBoundary>
            ) : (
              <Navigate to="/auth" replace />
            )
          } />
          <Route path="/caregiver-approval" element={
            user && user.userType === 'hire' ? (
              <ErrorBoundary>
                <CaregiverApprovalPage />
              </ErrorBoundary>
            ) : (
              <Navigate to={user?.userType === 'offer' ? '/caregiver-dashboard' : '/auth'} replace />
            )
          } />
          <Route path="/" element={
            <Navigate to={user ? (user.userType === 'offer' ? '/caregiver-dashboard' : '/dashboard') : '/auth'} replace />
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App
