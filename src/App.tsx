/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { LoadingSpinner } from './components/UI';
import { PublicPassportPage } from './components/PublicPassportPage';
import { VerificationPage } from './components/VerificationPage';
import { AdminPanel } from './components/AdminPanel';

// অভ্যন্তরীণ রাউটিং উইজেট (Inner Routing Widget with access to useAuth)
function MainRouter() {
  const { user, loading, logout } = useAuth();
  
  // ট্র্যাকিং স্ক্রিন স্টেট ('home' | 'login' | 'signup' | 'dashboard')
  const [currentScreen, setCurrentScreen] = useState<'home' | 'login' | 'signup'>('home');

  // ইউআরএল পাথ পার্স করা (Parse URL path for public passport and verification routes)
  const path = window.location.pathname;
  
  if (path.startsWith('/admin')) {
    return <AdminPanel />;
  }
  
  if (path.startsWith('/passport/')) {
    const passportId = path.split('/')[2];
    return <PublicPassportPage passportId={passportId} />;
  }
  
  if (path.startsWith('/verify/')) {
    const id = path.split('/')[2];
    // If it starts with SP-BD, it's a full passport verification
    return <VerificationPage verificationId={id} />;
  }

  let initialTab = 'dashboard';
  if (path === '/dashboard/passport') {
    initialTab = 'passport';
  } else if (path === '/dashboard/growth') {
    initialTab = 'growth';
  } else if (path === '/dashboard/reports') {
    initialTab = 'reports';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <LoadingSpinner />
        <span className="text-sm font-semibold text-slate-500 mt-4 font-mono animate-pulse">
          SkillProof AI Bangladesh Loading...
        </span>
      </div>
    );
  }

  // যদি লগইন করা থাকে, সরাসরি ড্যাশবোর্ডে নিয়ে যাবে (If authenticated, show protected Dashboard)
  if (user) {
    return (
      <Dashboard 
        initialTab={initialTab}
        onLogout={async () => {
          await logout();
          setCurrentScreen('home');
        }} 
      />
    );
  }

  // গেস্ট ইউজার স্ক্রিনসমুহ (Unauthenticated Screens)
  if (currentScreen === 'login') {
    return (
      <AuthScreen 
        initialScreen="login"
        onNavigateHome={() => setCurrentScreen('home')}
        onAuthSuccess={() => setCurrentScreen('home')} // triggers auto-redirect via user hook
      />
    );
  }

  if (currentScreen === 'signup') {
    return (
      <AuthScreen 
        initialScreen="signup"
        onNavigateHome={() => setCurrentScreen('home')}
        onAuthSuccess={() => setCurrentScreen('home')}
      />
    );
  }

  // ডিফল্ট ল্যান্ডিং পেজ (Default Landing Page)
  return (
    <LandingPage 
      onNavigateToAuth={(screen) => setCurrentScreen(screen)}
      onEnterDemo={() => {
        // ডেমো মোডে প্রবেশ (Enter with Demo Account)
        setCurrentScreen('login');
      }}
    />
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </LanguageProvider>
  );
}
