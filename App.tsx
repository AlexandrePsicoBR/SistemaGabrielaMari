import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PatientLayout from './components/PatientLayout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Inventory from './pages/Inventory';
import Financial from './pages/Financial';
import Services from './pages/Services';
import Agenda from './pages/Agenda';
import Login from './pages/Login';
import Blog from './pages/Blog';

// Patient Portal Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientHistory from './pages/patient/PatientHistory';
import PatientNews from './pages/patient/PatientNews';
import PatientProfile from './pages/patient/PatientProfile';

import { View } from './types';
import { supabase } from './lib/supabase';
import { profileService } from './lib/profile';

import UpdatePassword from './components/auth/UpdatePassword';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const isAuthRef = React.useRef<boolean>(false); // Ref to track auth state inside closures
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false); // Default false to show Login immediately
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userRole, setUserRole] = useState<'admin' | 'patient' | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      const profile = await profileService.getProfile(userId);
      const role = profile?.role === 'admin' ? 'admin' : 'patient';
      setUserRole(role);

      // FORCE REDIRECT based on role
      if (role === 'admin') {
        setCurrentView('dashboard');
      } else {
        setCurrentView('patient-dashboard');
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      // Fallback for error -> Treat as patient to be safe, or stay on login?
      // Let's safe fail to patient dashboard if auth passed but role failed
      setUserRole('patient');
      setCurrentView('patient-dashboard');
    }
  };

  useEffect(() => {
    // 1. Force Logout on Startup (Fix for "Always Login" requirement)
    // 1. Force Logout on Startup (Fix for "Always Login" requirement)
    const initSession = async () => {
      // Check for recovery flow in URL
      // const isRecovery = window.location.hash && window.location.hash.includes('type=recovery');

      // 4-Day Session Persistence Logic
      // We store a timestamp on first login and check it here.
      const EXPIRY_MS = 4 * 24 * 60 * 60 * 1000;
      const storedTimestamp = localStorage.getItem('session_start_timestamp');
      const now = new Date().getTime();

      if (storedTimestamp) {
        if (now - parseInt(storedTimestamp) > EXPIRY_MS) {
          console.log('Session expired (4 days confirmed). Logging out.');
          await supabase.auth.signOut();
          localStorage.removeItem('session_start_timestamp');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
      } else {
        // First login or legacy session -> Set timestamp now
        localStorage.setItem('session_start_timestamp', now.toString());
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        isAuthRef.current = true;
        // Optionally fetch role here if needed, but onAuthStateChange usually handles it
        // triggering role fetch here just in case:
        fetchUserRole(session.user.id);
      }

      setLoading(false);
    };



    initSession();

    // Safety timeout: ensure loading screen never persists longer than 5 seconds
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // 2. Listen for Explicit Login
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Event:', event);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_IN') {
        // Only trigger loading on explicit SIGNED_IN if not already authenticated
        if (session && !isAuthRef.current) {
          console.log('Processing SIGNED_IN event...');
          isAuthRef.current = true;
          setIsAuthenticated(true);
          setLoading(true); // Show loading while fetching role

          try {
            await Promise.race([
              fetchUserRole(session.user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Role fetch timeout')), 8000))
            ]);
          } catch (err) {
            console.error("Role fetch failed or timed out", err);
            setLoading(false);
          }
          setLoading(false);
        } else if (session && isAuthRef.current) {
          console.log('SIGNED_IN ignored - already authenticated');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Just update auth state if needed, but DO NOT block UI with loading
        if (session) {
          setIsAuthenticated(true);
          // Optional: silently refresh role if really needed, but usually not necessary
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        isAuthRef.current = false;
        setUserRole(null);
        setCurrentView('dashboard'); // Reset view context
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handlePatientSelect = (id: string) => {
    setSelectedPatientId(id);
    setCurrentView('patient-detail');
  };

  const renderView = () => {
    switch (currentView) {
      // Admin Views
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} onSelectPatient={handlePatientSelect} />;
      case 'blog':
        return <Blog />;
      case 'agenda':
        return <Agenda />;
      case 'patients':
        return <Patients onPatientClick={handlePatientSelect} />;
      case 'patient-detail':
        return <PatientDetail patientId={selectedPatientId} userRole={userRole} onBack={() => setCurrentView('patients')} />;
      case 'services':
        return <Services />;
      case 'inventory':
        return <Inventory />;
      case 'financial':
        return <Financial />;

      // Patient Portal Views
      case 'patient-dashboard':
        return <PatientDashboard onNavigate={setCurrentView} />;
      case 'patient-appointments':
        return <PatientAppointments />;
      case 'patient-history':
        return <PatientHistory />;
      case 'patient-news':
        return <PatientNews />;
      case 'patient-profile':
        return <PatientProfile />;

      default:
        // Fallback for unmatched views, try to stay within role context if possible
        if (userRole === 'patient') return <PatientDashboard onNavigate={setCurrentView} />;

        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-text-muted">
              <span className="material-symbols-outlined text-4xl mb-2">construction</span>
              <p>Página em construção</p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FDFBF9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted text-sm font-medium animate-pulse">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return <UpdatePassword onSuccess={() => {
      setIsPasswordRecovery(false);
      setIsAuthenticated(true);
    }} />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // Layout selection based on Role
  if (userRole === 'patient') {
    return (
      <PatientLayout
        currentView={currentView}
        onChangeView={setCurrentView}
        onLogout={async () => {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          isAuthRef.current = false;
          setUserRole(null);
          setCurrentView('patient-dashboard'); // Reset to default for next login attempt
        }}
      >
        {renderView()}
      </PatientLayout>
    );
  }

  // Admin Layout & Routing Guard
  // If we are here, we are authenticated. If User is Patient, they should have been caught above.
  // Double check to prevent leaks
  if (userRole !== 'admin') {
    // If somehow a patient gets here, force them back to patient layout
    return (
      <PatientLayout
        currentView={currentView}
        onChangeView={setCurrentView}
        onLogout={async () => {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
        }}
      >
        {/* Force patient dashboard if they tried to access admin view */}
        <PatientDashboard onNavigate={setCurrentView} />
      </PatientLayout>
    );
  }

  return (
    <Layout
      currentView={currentView === 'patient-detail' ? 'patients' : currentView}
      onChangeView={(view) => {
        // Prevent Admin from mistakenly navigating to patient-only views via some glitch, though Layout usually only shows admin links
        setCurrentView(view);
      }}
      onLogout={async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        isAuthRef.current = false;
        setUserRole(null);
        setCurrentView('dashboard');
      }}
    >
      {renderView()}
    </Layout>
  );
};

export default App;