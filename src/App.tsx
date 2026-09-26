/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Route } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Context Providers
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPages from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import AskPilotAI from './pages/AskPilotAI';
import BusinessPlan from './pages/BusinessPlan';
import QuotationGenerator from './pages/QuotationGenerator';
import InvoiceGenerator from './pages/InvoiceGenerator';
import MarketingSuite from './pages/MarketingSuite';
import EmailWriter from './pages/EmailWriter';
import BusinessNameGenerator from './pages/BusinessNameGenerator';
import BusinessHealthScore from './pages/BusinessHealthScore';
import HistoryPage from './pages/History';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import SettingsPage from './pages/Settings';
import NotFoundPage from './pages/NotFoundPage';
import { Sparkles } from 'lucide-react';

function MainApp() {
  const { user, loading, signOut } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<Route>('landing');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Restore Theme on Mount
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // 1. Automatically scroll main content panel to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const panel = document.getElementById('main-scroll-panel');
    if (panel) {
      panel.scrollTop = 0;
    }
  }, [currentRoute]);

  // 2. Catch Firebase/Supabase password recovery email redirect token in URL on mount
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    if (
      (hash && (hash.includes('type=recovery') || hash.includes('recovery') || hash.includes('access_token=') || hash.includes('oobCode=') || hash.includes('resetPassword'))) ||
      (search && (search.includes('oobCode=') || search.includes('mode=resetPassword')))
    ) {
      setCurrentRoute('reset-password');
    }
  }, []);

  // 3. Routing protection and redirects
  useEffect(() => {
    if (loading) return;

    const isAuthOrLanding = ['landing', 'login', 'register', 'forgot-password', 'reset-password'].includes(currentRoute);

    if (!user && !isAuthOrLanding) {
      // Redirect unauthenticated users to login page
      setCurrentRoute('login');
    } else if (user && isAuthOrLanding && currentRoute !== 'landing') {
      // Redirect authenticated users to dashboard if trying to access auth pages
      setCurrentRoute('dashboard');
    }
  }, [user, currentRoute, loading]);

  const handleLogout = async () => {
    await signOut();
    setCurrentRoute('landing');
  };

  // Render loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
          </div>
          <div className="text-center">
            <h4 className="font-display font-black text-sm text-gray-900 tracking-tight">Syncing BizPilot AI...</h4>
            <p className="text-[10px] text-gray-400 font-medium font-mono mt-0.5">Authorizing secure session</p>
          </div>
        </div>
      </div>
    );
  }

  // Render client-side page based on current state route
  const renderPage = () => {
    switch (currentRoute) {
      case 'landing':
        return <LandingPage setCurrentRoute={setCurrentRoute} />;
      case 'login':
        return (
          <AuthPages
            view="login"
            setCurrentRoute={setCurrentRoute}
          />
        );
      case 'register':
        return (
          <AuthPages
            view="register"
            setCurrentRoute={setCurrentRoute}
          />
        );
      case 'forgot-password':
        return (
          <AuthPages
            view="forgot-password"
            setCurrentRoute={setCurrentRoute}
          />
        );
      case 'reset-password':
        return (
          <AuthPages
            view="reset-password"
            setCurrentRoute={setCurrentRoute}
          />
        );
      case 'dashboard':
        return <Dashboard setCurrentRoute={setCurrentRoute} />;
      case 'ask-pilot':
        return <AskPilotAI />;
      case 'business-plan':
        return <BusinessPlan />;
      case 'quotation-gen':
        return <QuotationGenerator />;
      case 'invoice-gen':
        return <InvoiceGenerator />;
      case 'marketing-suite':
        return <MarketingSuite />;
      case 'email-writer':
        return <EmailWriter />;
      case 'name-gen':
        return <BusinessNameGenerator />;
      case 'health-score':
        return <BusinessHealthScore />;
      case 'history':
        return <HistoryPage />;
      case 'pricing':
        return <Pricing />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <NotFoundPage setCurrentRoute={setCurrentRoute} />;
    }
  };

  // If viewing landing or auth, do not show sidebar or header wrappers
  const isAuthOrLanding = ['landing', 'login', 'register', 'forgot-password', 'reset-password'].includes(currentRoute);

  if (isAuthOrLanding && !user) {
    return <div className="min-h-screen bg-white">{renderPage()}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50 text-gray-900 font-sans antialiased">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Top Header Utilities */}
        <Header
          currentRoute={currentRoute}
          setCurrentRoute={setCurrentRoute}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsMobileOpen={setIsMobileOpen}
          onLogout={handleLogout}
        />

        {/* Dynamic page wrapper with custom scroll container */}
        <main
          id="main-scroll-panel"
          className={`flex-1 min-h-0 p-4 md:p-6 lg:p-8 focus:outline-hidden ${
            currentRoute === 'ask-pilot'
              ? 'overflow-hidden h-[calc(100vh-4rem)] flex flex-col'
              : 'overflow-y-auto space-y-6'
          }`}
        >
          <div className={`max-w-7xl mx-auto w-full ${
            currentRoute === 'ask-pilot' ? 'flex-1 h-full min-h-0 flex flex-col' : ''
          }`}>
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
