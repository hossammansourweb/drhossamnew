import React, { useState, useEffect } from 'react';
import { ClinicSettings, Appointment } from '../shared/types';
import {
  getAdminCurrentUser,
  adminSignOut,
  getAllAppointments,
} from '../shared/services/bookingService';
import { AdminLogin } from './components/AdminLogin';
import { AdminSidebar, AdminTab } from './components/AdminSidebar';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

interface Props {
  settings: ClinicSettings;
  onSettingsUpdated: (settings: ClinicSettings) => void;
  onReturnToPatient: () => void;
}

export const AdminApp: React.FC<Props> = ({
  settings,
  onSettingsUpdated,
  onReturnToPatient
}) => {
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [appointmentInitialFilter, setAppointmentInitialFilter] = useState<string>('all');

  // Check initial auth state
  useEffect(() => {
    async function checkAuth() {
      setAuthChecking(true);
      try {
        const user = await getAdminCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // Fetch appointments when authenticated
  const fetchData = async () => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const appts = await getAllAppointments();
      setAppointments(appts);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      // Periodically refresh data every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await adminSignOut();
      setCurrentUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700 mb-2" />
        <p className="text-xs font-semibold">جاري التحقق من الجلسة...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AdminLogin
        onLoginSuccess={(email) => setCurrentUser({ email })}
        onReturnToPatient={onReturnToPatient}
      />
    );
  }

  const newAppointmentsCount = appointments.filter(a => a.bookingStatus === 'new').length;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50" dir="rtl">
      
      {/* Clean Side Navigation Bar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogout={handleLogout}
        onReturnToPatient={onReturnToPatient}
        newAppointmentsCount={newAppointmentsCount}
      />

      {/* Main Admin Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'appointments' && (
          <AppointmentsPage
            appointments={appointments}
            initialFilter={appointmentInitialFilter}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            settings={settings}
            onSettingsUpdated={onSettingsUpdated}
          />
        )}
      </main>

    </div>
  );
};
