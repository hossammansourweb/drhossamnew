/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ClinicSettings } from './shared/types';
import { DEFAULT_SETTINGS } from './shared/data/defaults';
import { getClinicSettings } from './shared/services/bookingService';
import { applySeoForView } from './shared/seo';
import { AppNavbar } from './shared/components/AppNavbar';
import { LegalPagesModal, LegalPageType } from './shared/components/LegalPagesModal';
import { FirebaseGuideModal } from './shared/components/FirebaseGuideModal';
import { PatientApp } from './patient/PatientApp';
// Lazy-load the admin bundle so public visitors (Google + patients) get a
// smaller initial JS payload — better LCP / Core Web Vitals. Admin is private.
const AdminApp = lazy(() => import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })));

export default function App() {
  // Determine initial view from window URL path or default to 'patient'
  const [currentView, setCurrentView] = useState<'patient' | 'admin'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    return 'patient';
  });

  const [settings, setSettings] = useState<ClinicSettings>(DEFAULT_SETTINGS);
  const [firebaseModalOpen, setFirebaseModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [selectedLegalPage, setSelectedLegalPage] = useState<LegalPageType>('privacy');
  const [homeKey, setHomeKey] = useState(0);

  // Load clinic settings from Firestore
  useEffect(() => {
    async function loadSettings() {
      try {
        const fetched = await getClinicSettings();
        setSettings(fetched);
      } catch (err) {
        console.warn('Using default settings due to fetch fallback:', err);
      }
    }
    loadSettings();
  }, []);

  // Listen to popstate for browser navigation
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        setCurrentView('admin');
      } else {
        setCurrentView('patient');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Per-view SEO: unique indexable title/meta for public view,
  // forced noindex for the private admin view.
  useEffect(() => {
    applySeoForView(currentView);
  }, [currentView]);

  // Navigation helper — updates view + URL + scroll
  const handleNavigate = (view: 'patient' | 'admin') => {
    setCurrentView(view);
    const path = view === 'admin' ? '/admin' : '/';
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

const handleLogoClick = () => {
  // Go to home page - reset patient flow by remounting PatientApp via homeKey
  setCurrentView('patient');
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    window.history.pushState({}, '', '/');
  }
  setHomeKey((k) => k + 1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" dir="rtl">
      
      {/* Top Header Navbar - ONLY on patient view */}
      {currentView === 'patient' && (
        <AppNavbar
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogoClick={handleLogoClick}
          onOpenLegalPage={(pageType) => {
            setSelectedLegalPage(pageType);
            setLegalModalOpen(true);
          }}
          settings={settings}
        />
      )}

      {/* Main App Content View */}
      <main className="flex-1 flex flex-col">
        {currentView === 'patient' ? (
          <PatientApp key={homeKey} settings={settings} />
        ) : (
          <Suspense
            fallback={
              <div className="min-h-[50vh] flex items-center justify-center text-slate-500 text-xs font-bold">
                جاري تحميل لوحة التحكم...
              </div>
            }
          >
            <AdminApp
              settings={settings}
              onSettingsUpdated={(newSettings) => setSettings(newSettings)}
              onReturnToPatient={() => handleNavigate('patient')}
            />
          </Suspense>
        )}
      </main>

      {/* Legal & Public Pages Modal */}
      <LegalPagesModal
        isOpen={legalModalOpen}
        pageType={selectedLegalPage}
        onClose={() => setLegalModalOpen(false)}
        settings={settings}
        onSelectPage={(t) => setSelectedLegalPage(t)}
      />

      {/* Firebase Setup Guide Modal */}
      <FirebaseGuideModal
        isOpen={firebaseModalOpen}
        onClose={() => setFirebaseModalOpen(false)}
      />

    </div>
  );
}

