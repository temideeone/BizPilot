/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Route } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  Sparkles,
  Settings,
  User,
  LogOut,
  X,
  CreditCard,
  FileText
} from 'lucide-react';

interface HeaderProps {
  currentRoute: Route;
  setCurrentRoute: (route: Route) => void;
  isSidebarCollapsed: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function Header({
  currentRoute,
  setCurrentRoute,
  isSidebarCollapsed,
  setIsMobileOpen,
  onLogout
}: HeaderProps) {
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const pagesList = [
    { id: 'dashboard' as Route, name: 'Dashboard', desc: 'Overview, analytics & metrics' },
    { id: 'ask-pilot' as Route, name: 'Ask Pilot AI', desc: 'AI assistant & business advice' },
    { id: 'business-plan' as Route, name: 'Business Plan', desc: 'Structure a professional business plan' },
    { id: 'quotation-gen' as Route, name: 'Quotation Generator', desc: 'Build professional client quotes' },
    { id: 'invoice-gen' as Route, name: 'Invoice Generator', desc: 'Generate & download PDF invoices' },
    { id: 'marketing-suite' as Route, name: 'Marketing Suite', desc: 'AI marketing & social scheduler' },
    { id: 'email-writer' as Route, name: 'Email Writer', desc: 'AI tone-optimized email composer' },
    { id: 'name-gen' as Route, name: 'Business Name Generator', desc: 'Generate business names & slogan ideas' },
    { id: 'health-score' as Route, name: 'Business Health Score', desc: 'Audit business financial health' },
    { id: 'history' as Route, name: 'History', desc: 'Saved files and generated assets' },
    { id: 'pricing' as Route, name: 'Pricing Plans', desc: 'Upgrade or manage subscription' },
    { id: 'profile' as Route, name: 'Profile Settings', desc: 'Your account & business info' },
    { id: 'settings' as Route, name: 'System Settings', desc: 'Integrations & application configs' },
  ];

  const filteredPages = pagesList.filter((page) =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const notifications = [
    {
      id: '1',
      title: 'Invoice Sent Successfully',
      desc: 'Invoice #INV-2026-004 sent to client Acme Corp.',
      time: '5 mins ago',
      unread: true
    },
    {
      id: '2',
      title: 'New AI Advice Ready',
      desc: 'BizPilot AI generated a revised marketing strategy proposal.',
      time: '2 hours ago',
      unread: true
    },
    {
      id: '3',
      title: 'Monthly Summary Report',
      desc: 'Your business health report for June is ready for download.',
      time: '1 day ago',
      unread: false
    }
  ];

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const routeTitles: Record<Route, string> = {
    landing: 'Home',
    login: 'Login',
    register: 'Register',
    'forgot-password': 'Reset Password',
    'reset-password': 'Reset Password',
    dashboard: 'Dashboard Overview',
    'ask-pilot': 'BizPilot AI Assistant',
    'business-plan': 'Business Plan Constructor',
    'quotation-gen': 'Quotation Generator',
    'invoice-gen': 'Invoice Builder',
    'marketing-suite': 'AI Marketing Hub',
    'email-writer': 'AI Email Writer',
    'name-gen': 'Business Name Engine',
    'health-score': 'Business Health Audit',
    history: 'Documents & History',
    pricing: 'Subscription & Plans',
    profile: 'Profile & Business Details',
    settings: 'Global Settings',
  };

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 px-4 md:px-6 flex items-center justify-between z-20">
      {/* Mobile Toggle Button & Route Title */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle"
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display font-black text-xl text-gray-950 tracking-tight hidden sm:block">
            {routeTitles[currentRoute] || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Global Interactive Search Bar */}
      <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search tools, plans, invoices... (Press '/' to search)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full pl-9 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Live Navigation search results */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Tools & Views
              </span>
              <span className="text-[10px] text-gray-400">
                {filteredPages.length} matches
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
              {filteredPages.length > 0 ? (
                filteredPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      setCurrentRoute(page.id);
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600">
                        {page.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{page.desc}</p>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-gray-400 bg-gray-100 group-hover:bg-blue-100 group-hover:text-blue-600 px-1.5 py-0.5 rounded">
                      Go to
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-gray-500">
                  No matches found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right side utilities */}
      <div className="flex items-center gap-3">
        {/* Real-time UTC timezone badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>UTC 2026-06-27</span>
        </div>

        {/* Bell Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            id="notification-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-100 relative"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Notifications</span>
                <span className="text-[10px] text-blue-600 cursor-pointer font-medium hover:underline">
                  Mark all as read
                </span>
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start gap-1">
                      <p className={`text-xs ${n.unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </p>
                      {n.unread && <span className="h-1.5 w-1.5 bg-blue-600 rounded-full shrink-0" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{n.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="user-profile-dropdown-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.full_name} 
                className="h-8 w-8 rounded-full object-cover border border-gray-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs border border-blue-100">
                {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US'}
              </div>
            )}
            <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
          </button>

          {showProfileMenu && user && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-900 truncate">{user.full_name}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setCurrentRoute('profile');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4 text-gray-400" />
                My Profile
              </button>
              <button
                onClick={() => {
                  setCurrentRoute('settings');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                Settings
              </button>
              <button
                onClick={() => {
                  setCurrentRoute('pricing');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="h-4 w-4 text-gray-400" />
                Billing & Plans
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={() => {
                  onLogout();
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4 text-red-400" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
