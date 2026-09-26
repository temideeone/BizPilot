/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Route } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Calculator,
  Receipt,
  Megaphone,
  Mail,
  Lightbulb,
  Activity,
  History,
  CreditCard,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  currentRoute: Route;
  setCurrentRoute: (route: Route) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentRoute,
  setCurrentRoute,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onLogout
}: SidebarProps) {
  const { user } = useAuth();
  
  const menuItems = [
    { id: 'dashboard' as Route, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ask-pilot' as Route, label: 'Ask Pilot AI', icon: Sparkles, badge: 'New' },
    { id: 'business-plan' as Route, label: 'Business Plan', icon: FileText },
    { id: 'quotation-gen' as Route, label: 'Quotation Gen', icon: Calculator },
    { id: 'invoice-gen' as Route, label: 'Invoice Gen', icon: Receipt },
    { id: 'marketing-suite' as Route, label: 'Marketing Suite', icon: Megaphone },
    { id: 'email-writer' as Route, label: 'Email Writer', icon: Mail },
    { id: 'name-gen' as Route, label: 'Business Name Gen', icon: Lightbulb },
    { id: 'health-score' as Route, label: 'Health Score', icon: Activity },
    { id: 'history' as Route, label: 'History', icon: History },
    { id: 'pricing' as Route, label: 'Pricing', icon: CreditCard },
  ];

  const subItems = [
    { id: 'profile' as Route, label: 'Profile', icon: User },
    { id: 'settings' as Route, label: 'Settings', icon: Settings },
  ];

  const renderNavLinks = (items: typeof menuItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = currentRoute === item.id;
      return (
        <button
          key={item.id}
          id={`sidebar-item-${item.id}`}
          onClick={() => {
            setCurrentRoute(item.id);
            setIsMobileOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative ${
            isActive
              ? 'bg-blue-50/80 text-blue-600 font-bold dark:bg-blue-950/40 dark:text-blue-400 border-l-2 border-blue-600 rounded-l-none pl-2.5'
              : 'text-gray-600 font-semibold hover:bg-gray-50/70 hover:text-gray-900'
          }`}
        >
          <Icon
            className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
            }`}
          />
          {(!isSidebarCollapsed || isMobileOpen) && (
            <span className="truncate flex-1 text-left">{item.label}</span>
          )}
          {(!isSidebarCollapsed || isMobileOpen) && item.badge && (
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
              {item.badge}
            </span>
          )}

          {/* Hover tooltip for collapsed state */}
          {isSidebarCollapsed && !isMobileOpen && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50 whitespace-nowrap shadow-md">
              {item.label}
            </div>
          )}
        </button>
      );
    });
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 py-4 px-3 min-h-0">
      {/* Brand Logo and Title */}
      <div className="shrink-0">
        <div className="flex items-center justify-between px-2 mb-6">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setCurrentRoute('dashboard')}
          >
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-300">
              <Sparkles className="h-4.5 w-4.5 animate-pulse-slow" />
            </div>
            {(!isSidebarCollapsed || isMobileOpen) && (
              <span className="font-display font-black text-lg tracking-tight text-gray-950">
                Biz<span className="text-blue-600">Pilot</span>
                <span className="text-[10px] font-mono font-bold ml-1.5 px-1.5 py-0.5 bg-emerald-500 text-white rounded">AI</span>
              </span>
            )}
          </div>
          {/* Desktop Collapse Toggle button inside logo row (hidden on mobile) */}
          <button
            id="sidebar-toggle-desktop"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Menu Links - Scrollable Container */}
      <div className="flex-1 overflow-y-auto pr-0.5 min-h-0 space-y-1">
        <div className="px-2 mb-2">
          {(!isSidebarCollapsed || isMobileOpen) ? (
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Main Tools
            </p>
          ) : (
            <div className="h-px bg-gray-100 my-2" />
          )}
        </div>
        <nav className="space-y-1">{renderNavLinks(menuItems)}</nav>
      </div>

      {/* Footer Profile & Settings Links */}
      <div className="shrink-0 space-y-4 pt-4 border-t border-gray-100 mt-2">
        <div className="space-y-1">
          {renderNavLinks(subItems)}
          <button
            id="sidebar-logout"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200 group relative"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 text-red-500" />
            {(!isSidebarCollapsed || isMobileOpen) && (
              <span className="truncate text-left flex-1">Logout</span>
            )}
            {isSidebarCollapsed && !isMobileOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50 whitespace-nowrap shadow-md">
                Logout
              </div>
            )}
          </button>
        </div>

        {/* User Card */}
        {(!isSidebarCollapsed || isMobileOpen) && user && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.full_name} 
                className="h-9 w-9 rounded-full object-cover border border-gray-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.full_name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.business_name || 'Pilot Member'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Persistent Sidebar */}
      <aside
        id="sidebar-desktop"
        className={`hidden md:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 ${
          isSidebarCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <aside
        id="sidebar-mobile"
        className={`fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
