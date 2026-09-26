/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Route, ActivityLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, limit, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import {
  TrendingUp,
  FileText,
  Receipt,
  Sparkles,
  ArrowRight,
  Plus,
  Compass,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Megaphone,
  UserCheck,
  FolderOpen,
  MessageSquare,
  HelpCircle,
  DollarSign
} from 'lucide-react';

interface DashboardProps {
  setCurrentRoute: (route: Route) => void;
}

interface SavedDocument {
  id: string;
  title: string;
  category: 'invoice' | 'plan' | 'marketing' | 'email' | 'name';
  date: string;
  details: string;
  size: string;
}

interface SavedConvo {
  id: string;
  title: string;
  updatedAt: string;
}

export default function Dashboard({ setCurrentRoute }: DashboardProps) {
  const { user } = useAuth();
  const [recentDocs, setRecentDocs] = useState<SavedDocument[]>([]);
  const [recentChats, setRecentChats] = useState<SavedConvo[]>([]);
  const [counts, setCounts] = useState({ docs: 0, chats: 0 });
  const [loading, setLoading] = useState(true);

  // Dynamic welcome strings
  const userName = user?.full_name ? user.full_name.split(' ')[0] : 'Strategic Partner';
  const businessName = user?.business_name || 'your enterprise';

  // Load actual Documents and Chat conversations from Firestore or localStorage
  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      if (user && auth.currentUser) {
        try {
          // 1. Fetch recent documents
          const docsRef = collection(db, 'users', user.id, 'documents');
          const dQuery = query(docsRef, orderBy('date', 'desc'), limit(4));
          const docsSnap = await getDocs(dQuery);
          const docsList: SavedDocument[] = [];
          
          docsSnap.forEach((d) => {
            const data = d.data();
            docsList.push({
              id: d.id,
              title: data.title || 'Untitled Document',
              category: data.category || 'plan',
              date: data.date || 'Just now',
              details: data.details || '',
              size: data.size || '4 KB'
            });
          });

          // Get total doc count
          const allDocsSnap = await getDocs(docsRef);
          const totalDocs = allDocsSnap.size;

          // 2. Fetch recent chats
          const chatsRef = collection(db, 'users', user.id, 'conversations');
          const cQuery = query(chatsRef, orderBy('updatedAt', 'desc'), limit(4));
          const chatsSnap = await getDocs(cQuery);
          const chatsList: SavedConvo[] = [];

          chatsSnap.forEach((c) => {
            const data = c.data();
            chatsList.push({
              id: c.id,
              title: data.title || 'Advisory Chat',
              updatedAt: data.updatedAt ? new Date(data.updatedAt.toDate()).toLocaleDateString() : 'Just now'
            });
          });

          // Get total chat count
          const allChatsSnap = await getDocs(chatsRef);
          const totalChats = allChatsSnap.size;

          if (!active) return;

          setRecentDocs(docsList);
          setRecentChats(chatsList);
          setCounts({ docs: totalDocs, chats: totalChats });
        } catch (err: any) {
          console.error("Error loading dashboard Firestore metrics:", err);
          if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
            handleFirestoreError(err, OperationType.LIST, `users/${user.id}`);
          }
          loadFromLocal();
        } finally {
          if (active) setLoading(false);
        }
      } else {
        loadFromLocal();
        setLoading(false);
      }
    }

    function loadFromLocal() {
      // Load docs fallback
      const savedDocs = localStorage.getItem('bizpilot_documents');
      let docsList: SavedDocument[] = [];
      if (savedDocs) {
        try {
          docsList = JSON.parse(savedDocs).slice(0, 4);
        } catch (e) {
          console.error(e);
        }
      }

      // Load chats fallback
      const savedChats = localStorage.getItem('bizpilot_conversations');
      let chatsList: SavedConvo[] = [];
      if (savedChats) {
        try {
          const parsed = JSON.parse(savedChats);
          chatsList = parsed.slice(0, 4).map((c: any) => ({
            id: c.id,
            title: c.title,
            updatedAt: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : 'Just now'
          }));
        } catch (e) {
          console.error(e);
        }
      }

      const totalDocs = savedDocs ? JSON.parse(savedDocs).length : 0;
      const totalChats = savedChats ? JSON.parse(savedChats).length : 0;

      if (active) {
        setRecentDocs(docsList);
        setRecentChats(chatsList);
        setCounts({ docs: totalDocs, chats: totalChats });
      }
    }

    loadDashboardData();

    return () => {
      active = false;
    };
  }, [user]);

  // Handle clicking a recent AI Conversation to redirect
  const handleChatClick = async (convoId: string) => {
    // Boost updatedAt to float it to top of the chat panel
    if (user) {
      try {
        const convoRef = doc(db, 'users', user.id, 'conversations', convoId);
        await updateDoc(convoRef, {
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      const saved = localStorage.getItem('bizpilot_conversations');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const updated = parsed.map((c: any) => {
            if (c.id === convoId) {
              return { ...c, updatedAt: new Date().toISOString() };
            }
            return c;
          });
          localStorage.setItem('bizpilot_conversations', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
    }
    setCurrentRoute('ask-pilot');
  };

  const quickActions = [
    { id: 'business-plan' as Route, title: 'Build Business Plan', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100/60' },
    { id: 'invoice-gen' as Route, title: 'Invoicing Terminal', icon: Receipt, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100/60' },
    { id: 'ask-pilot' as Route, title: 'Ask BizPilot AI', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-100 hover:bg-purple-100/60' },
    { id: 'marketing-suite' as Route, title: 'Marketing Suite', icon: Megaphone, color: 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100/60' },
  ];

  const usageStats = [
    { label: 'Strategic Plans', value: counts.docs, limit: 'No Limit', desc: 'Investor summaries saved' },
    { label: 'AI Consultations', value: counts.chats, limit: 'Unlimited', desc: 'Active strategic briefings' },
    { label: 'Business Health', value: '88/100', limit: 'Grade A', desc: 'Operational audit score' },
    { label: 'Platform Status', value: 'Active', limit: 'Professional', desc: 'Secure cloud workspace' },
  ];

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-10">
      
      {/* 1. PERSONALIZED WELCOME HERO CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-indigo-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 space-y-2.5 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            Advisory Console Active
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight leading-none">
            Welcome back, {userName}!
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Let's drive <span className="font-extrabold text-blue-400">{businessName}</span> to full strategic alignment today. Analyze performance, balance risk, and execute your Q3 growth roadmap.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setCurrentRoute('ask-pilot')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Consult BizPilot AI
            </button>
            <button
              onClick={() => setCurrentRoute('health-score')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl transition-colors cursor-pointer"
            >
              Run Operational Audit
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE STATS CARDS (Beautiful responsive grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {usageStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-display font-black text-gray-900 tracking-tight">{stat.value}</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {stat.limit}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 leading-none">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* 3. QUICK ACTIONS & CHARTS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Trend Area Chart */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">AI Advisory & Operations Trend</h3>
              <p className="text-[10px] text-gray-500">Advisory and document generation events this week</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" /> AI Sessions</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Operations</span>
            </div>
          </div>

          {/* Aesthetic responsive custom SVG Area Chart */}
          <div className="h-44 w-full relative mt-2">
            <svg viewBox="0 0 500 150" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0"/>
                </linearGradient>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              
              {/* Gridlines */}
              <line x1="0" y1="37" x2="500" y2="37" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="112" x2="500" y2="112" stroke="#f1f5f9" strokeWidth="1" />
              
              {/* AI sessions Area & Path */}
              <path d="M 0 110 L 80 80 L 160 120 L 240 50 L 320 30 L 400 130 L 500 90 L 500 150 L 0 150 Z" fill="url(#blueGradient)" />
              <path d="M 0 110 L 80 80 L 160 120 L 240 50 L 320 30 L 400 130 L 500 90" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

              {/* Operations Area & Path */}
              <path d="M 0 140 L 80 120 L 160 90 L 240 110 L 320 60 L 400 80 L 500 40 L 500 150 L 0 150 Z" fill="url(#emeraldGradient)" />
              <path d="M 0 140 L 80 120 L 160 90 L 240 110 L 320 60 L 400 80 L 500 40" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
            </svg>
            
            {/* Legend Days */}
            <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-1 px-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Center */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">Quick Action Center</h3>
            <p className="text-[10px] text-gray-500 mb-4">Instantly jump into tools & operations</p>
            
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentRoute(action.id)}
                    className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all cursor-pointer text-center ${action.color}`}
                  >
                    <Icon className="h-5 w-5 mb-1.5 shrink-0" />
                    <span className="text-[10px] font-extrabold leading-tight">{action.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
            <div className="p-1 rounded bg-blue-50">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-800 leading-none">Unlimited Workspace</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Secure Firestore cloud storage active</p>
            </div>
          </div>
        </div>

      </div>

      {/* 4. BUSINESS INSIGHTS & RECENT DOCUMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Business Documents */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">Recent Business Documents</h3>
              <p className="text-[10px] text-gray-500">Access saved strategic files & templates</p>
            </div>
            <button
              onClick={() => setCurrentRoute('history')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 group"
            >
              All Files
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {recentDocs.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentDocs.map((doc) => (
                <div 
                  key={doc.id} 
                  onClick={() => setCurrentRoute('history')}
                  className="py-2.5 flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 border border-gray-200">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 truncate">{doc.title}</p>
                      <span className="text-[9px] text-gray-400 font-mono capitalize">{doc.category} • {doc.date}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">{doc.size}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <FolderOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">No documents saved yet</p>
              <p className="text-[10px] text-gray-400 mt-1 max-w-sm mx-auto">Generate names, marketing suites or plans and select 'Save advice' to register them in your history.</p>
              <button 
                onClick={() => setCurrentRoute('business-plan')}
                className="mt-3 px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Construct First Plan
              </button>
            </div>
          )}
        </div>

        {/* Business Insights Panel */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="h-4.5 w-4.5 text-blue-600 animate-pulse-slow shrink-0" />
              <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">Smart Business Insights</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl text-xs leading-relaxed">
                <p className="font-bold text-blue-950">Referral Loop ROI Boost</p>
                <p className="text-gray-600 text-[11px] mt-1 leading-relaxed">
                  Your organic loops are hitting 4.8x ROI. Scale your LinkedIn marketing budget or build standard social campaign posts to keep cost-per-acquisition low.
                </p>
              </div>

              <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs leading-relaxed">
                <p className="font-bold text-indigo-950">Strategic Invoice Balance</p>
                <p className="text-gray-600 text-[11px] mt-1 leading-relaxed">
                  85% invoice collection rate is excellent. For remaining margins, automate late notifications using the **Email Suite** to secure capital.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentRoute('health-score')}
            className="w-full mt-4 flex items-center justify-center gap-1 py-1.5 bg-gray-50 hover:bg-gray-100 text-[11px] font-bold text-gray-700 rounded-xl border border-gray-200 transition-colors cursor-pointer"
          >
            Audit Operational Health
          </button>
        </div>

      </div>

      {/* 5. RECENT AI CONVERSATIONS SECTION */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">Recent AI Advisory Conversations</h3>
            <p className="text-[10px] text-gray-500">Pick up strategic advice right where you left off</p>
          </div>
          <button
            onClick={() => setCurrentRoute('ask-pilot')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 group"
          >
            Open Pilot Chat
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {recentChats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentChats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className="p-3.5 bg-gray-50/60 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-white hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800 truncate group-hover:text-blue-600">{chat.title}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Updated: {chat.updatedAt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">No active AI advisory history found</p>
            <p className="text-[10px] text-gray-400 mt-1 max-w-sm mx-auto">Need high-quality insights? Start a direct strategic dialogue with BizPilot AI regarding pricing, competitors, or operations.</p>
            <button 
              onClick={() => setCurrentRoute('ask-pilot')}
              className="mt-3 px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Consult Advisory Model
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
