/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  HelpCircle, 
  MessageSquare, 
  ArrowRight, 
  Zap,
  Copy,
  RotateCcw,
  Save,
  Plus,
  Loader2,
  ChevronRight,
  Search,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { handleApiResponse } from '../lib/api';
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { ChatMessage } from '../types';

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: any;
}

export default function AskPilotAI() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string>('');
  const [savedId, setSavedId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "How can I increase my sales?",
    "Give me a marketing strategy.",
    "Analyze my business.",
    "How can I get more customers?",
    "Should I increase my prices?",
    "How do I compete with bigger businesses?"
  ];

  // Load conversations on mount or user change
  useEffect(() => {
    let active = true;

    async function loadData() {
      if (user && auth.currentUser) {
        const path = `users/${user.id}/conversations`;
        try {
          const convosRef = collection(db, 'users', user.id, 'conversations');
          const q = query(convosRef, orderBy('updatedAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const loaded: Conversation[] = [];
          
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              title: data.title || 'New Conversation',
              messages: data.messages || [],
              updatedAt: data.updatedAt
            });
          });

          if (!active) return;

          if (loaded.length > 0) {
            setConversations(loaded);
            setActiveConvoId(loaded[0].id);
          } else {
            // Create initial
            const initialId = 'init-' + Math.random().toString(36).substring(2, 9);
            const initialConvo: Conversation = {
              id: initialId,
              title: 'Getting Started',
              messages: [
                {
                  id: 'welcome',
                  sender: 'pilot',
                  text: 'Hello! I am BizPilot AI, your expert business advisory agent. I can help analyze your performance, generate strategic roadmaps, design high-converting marketing campaigns, or draft invoices and budgets.\n\nChoose one of the suggested prompts below or ask me any question to kickstart your customized strategic analysis!',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ],
              updatedAt: new Date().toISOString()
            };
            setConversations([initialConvo]);
            setActiveConvoId(initialId);
            saveConversationToStore(initialConvo);
          }
        } catch (err: any) {
          console.error("Error loading conversations from Firestore:", err);
          if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
            handleFirestoreError(err, OperationType.LIST, path);
          }
          // Fallback to localStorage
          loadFromLocal();
        }
      } else {
        loadFromLocal();
      }
    }

    function loadFromLocal() {
      const saved = localStorage.getItem('bizpilot_conversations');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            setConversations(parsed);
            setActiveConvoId(parsed[0].id);
            return;
          }
        } catch (e) {
          console.error("Error parsing local conversations:", e);
        }
      }
      
      // Initial empty state
      const initialId = 'init-local';
      const initialConvo: Conversation = {
        id: initialId,
        title: 'Getting Started',
        messages: [
          {
            id: 'welcome',
            sender: 'pilot',
            text: 'Hello! I am BizPilot AI, your expert business advisory agent. I can help analyze your performance, generate strategic roadmaps, design high-converting marketing campaigns, or draft invoices and budgets.\n\nChoose one of the suggested prompts below or ask me any question to kickstart your customized strategic analysis!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ],
        updatedAt: new Date().toISOString()
      };
      setConversations([initialConvo]);
      setActiveConvoId(initialId);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user]);

  // Save specific conversation either to Firestore or localStorage
  const saveConversationToStore = async (convo: Conversation) => {
    if (user && auth.currentUser) {
      const path = `users/${user.id}/conversations/${convo.id}`;
      try {
        const convoDocRef = doc(db, 'users', user.id, 'conversations', convo.id);
        await setDoc(convoDocRef, {
          title: convo.title,
          messages: convo.messages,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err: any) {
        console.error("Failed to write conversation to Firestore:", err);
        if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    } else {
      // Save entire array to localStorage
      setConversations(prev => {
        const updated = prev.map(c => c.id === convo.id ? convo : c);
        localStorage.setItem('bizpilot_conversations', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Scroll to bottom when active message stream or typing status changes
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConvoId, isTyping]);

  const activeConvo = conversations.find(c => c.id === activeConvoId);

  const startNewConversation = () => {
    const newId = 'convo-' + Math.random().toString(36).substring(2, 9);
    const newConvo: Conversation = {
      id: newId,
      title: 'New Advisory Chat',
      messages: [
        {
          id: 'welcome-' + newId,
          sender: 'pilot',
          text: 'Hello! I am BizPilot AI, your virtual executive business consultant. Ask me anything about increasing sales, competitor analysis, pricing optimization, or business systems.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      updatedAt: new Date().toISOString()
    };

    setConversations(prev => [newConvo, ...prev]);
    setActiveConvoId(newId);
    saveConversationToStore(newConvo);
    showToast('success', 'New advisory session started.', 'Consultant Connected');
  };

  const deleteActiveConversation = async () => {
    if (!activeConvoId) return;
    
    if (confirm('Are you sure you want to delete this advisory session from your history?')) {
      const remaining = conversations.filter(c => c.id !== activeConvoId);
      
      if (user && auth.currentUser) {
        const path = `users/${user.id}/conversations/${activeConvoId}`;
        try {
          const convoDocRef = doc(db, 'users', user.id, 'conversations', activeConvoId);
          await deleteDoc(convoDocRef);
        } catch (err: any) {
          console.error("Failed to delete from Firestore:", err);
          if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
            handleFirestoreError(err, OperationType.DELETE, path);
          }
        }
      }

      setConversations(remaining);
      showToast('success', 'Conversation deleted successfully.', 'Session Removed');

      if (remaining.length > 0) {
        setActiveConvoId(remaining[0].id);
      } else {
        const initialId = 'init-' + Math.random().toString(36).substring(2, 9);
        const initialConvo: Conversation = {
          id: initialId,
          title: 'Getting Started',
          messages: [
            {
              id: 'welcome',
              sender: 'pilot',
              text: 'Hello! I am BizPilot AI, your expert business advisory agent. Choose a suggested prompt below to begin.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ],
          updatedAt: new Date().toISOString()
        };
        setConversations([initialConvo]);
        setActiveConvoId(initialId);
        saveConversationToStore(initialConvo);
      }
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !activeConvoId || isTyping) return;

    // 1. Create User Message
    const userMsg: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const targetConvo = conversations.find(c => c.id === activeConvoId);
    if (!targetConvo) return;

    // Update conversation title based on first query
    const rawTitle = targetConvo.title === 'New Advisory Chat' || targetConvo.title === 'Getting Started'
      ? textToSend.slice(0, 30) + (textToSend.length > 30 ? '...' : '')
      : targetConvo.title;

    const updatedMessages = [...targetConvo.messages, userMsg];
    const updatedConvo = {
      ...targetConvo,
      title: rawTitle,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    // Reactively update state
    setConversations(prev => prev.map(c => c.id === activeConvoId ? updatedConvo : c));
    setInput('');
    setIsTyping(true);

    try {
      // 2. Fetch from backend endpoint (Express server proxies safely to keep key hidden)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: targetConvo.messages.filter(m => m.id !== 'welcome' && !m.id.startsWith('welcome-'))
        })
      });

      const responseData = await handleApiResponse(response);
      
      const pilotMsg: ChatMessage = {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        sender: 'pilot',
        text: responseData.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalConvo = {
        ...updatedConvo,
        messages: [...updatedMessages, pilotMsg],
        updatedAt: new Date().toISOString()
      };

      setConversations(prev => prev.map(c => c.id === activeConvoId ? finalConvo : c));
      saveConversationToStore(finalConvo);
    } catch (err: any) {
      console.error("Advisory Chat Error:", err);
      showToast('error', err.message || "An error occurred. Check your Gemini API Key in Settings.", "Generation Failed");
      
      // Fallback message for user comfort
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Math.random().toString(36).substring(2, 9),
        sender: 'pilot',
        text: `⚠️ **API Communication Alert**\n\nI was unable to establish a secure connection with the Gemini Advisory Engine. This typically indicates a missing or expired **GEMINI_API_KEY** in the Secrets setup.\n\n**To resolve this:**\n1. Go to the workspace **Settings** menu.\n2. Ensure your **Secrets / API Keys** panel has a valid Gemini credential.\n3. Retry sending your query.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const errorConvo = {
        ...updatedConvo,
        messages: [...updatedMessages, errorMsg],
        updatedAt: new Date().toISOString()
      };
      setConversations(prev => prev.map(c => c.id === activeConvoId ? errorConvo : c));
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    showToast('success', 'Response copied to clipboard.', 'Copied');
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleRegenerate = (msgIdx: number) => {
    if (!activeConvo || isTyping) return;
    
    // Find the last user message preceding this point
    let lastUserMessageText = '';
    for (let i = msgIdx - 1; i >= 0; i--) {
      if (activeConvo.messages[i].sender === 'user') {
        lastUserMessageText = activeConvo.messages[i].text;
        break;
      }
    }

    if (lastUserMessageText) {
      // Remove all messages after that user message
      const cutIdx = activeConvo.messages.findIndex(m => m.text === lastUserMessageText) + 1;
      const truncatedMessages = activeConvo.messages.slice(0, cutIdx);
      
      const truncatedConvo = {
        ...activeConvo,
        messages: truncatedMessages,
        updatedAt: new Date().toISOString()
      };

      setConversations(prev => prev.map(c => c.id === activeConvoId ? truncatedConvo : c));
      handleSendMessage(lastUserMessageText);
    } else {
      showToast('warning', 'No preceding user query was found to regenerate from.', 'No Prompt Found');
    }
  };

  const handleSaveResponse = async (msgId: string, responseText: string) => {
    setSavedId(msgId);
    const summaryHeader = responseText.split('\n')[0] || 'Strategic AI Advice';
    const cleanTitle = summaryHeader.replace(/[#*`]/g, '').trim().slice(0, 45) || 'BizPilot AI Strategic Advice';

    const documentPayload = {
      id: 'doc-' + Math.random().toString(36).substring(2, 9),
      title: cleanTitle,
      category: 'plan' as const,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      details: responseText,
      size: `${Math.ceil(responseText.length / 1024)} KB`
    };

    if (user && auth.currentUser) {
      const path = `users/${user.id}/documents/${documentPayload.id}`;
      try {
        const docRef = doc(db, 'users', user.id, 'documents', documentPayload.id);
        await setDoc(docRef, documentPayload);
        showToast('success', 'This strategic advisory summary has been exported to your Document History!', 'Document Saved');
      } catch (err: any) {
        console.error("Failed to save document to Firestore:", err);
        if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        showToast('error', 'Could not sync document with cloud store.', 'Save Failed');
      }
    } else {
      // localStorage fallback
      const savedDocs = localStorage.getItem('bizpilot_documents');
      let currentDocs = [];
      if (savedDocs) {
        try {
          currentDocs = JSON.parse(savedDocs);
        } catch (e) {
          console.error(e);
        }
      }
      currentDocs.unshift(documentPayload);
      localStorage.setItem('bizpilot_documents', JSON.stringify(currentDocs));
      showToast('success', 'Response saved to your local Document History!', 'Document Saved');
    }

    setTimeout(() => setSavedId(''), 2000);
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.messages.some(m => m.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Advanced custom markdown renderer with clean visual styles
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      const trimmed = line.trim();

      // Heading 2 (## Section Title)
      if (trimmed.startsWith('## ')) {
        const title = trimmed.substring(3).trim();
        return (
          <h3 key={lineIdx} className="font-display font-black text-sm text-gray-900 tracking-tight mt-6 mb-2 border-b border-gray-100 pb-1 flex items-center gap-1.5 uppercase">
            <span className="h-3.5 w-1 bg-blue-600 rounded-sm" />
            {title}
          </h3>
        );
      }

      // Heading 1 (# Title)
      if (trimmed.startsWith('# ')) {
        const title = trimmed.substring(2).trim();
        return (
          <h2 key={lineIdx} className="font-display font-black text-base text-gray-950 tracking-tight mt-6 mb-2.5">
            {title}
          </h2>
        );
      }

      // Bullets (* or -)
      const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
      const cleanLine = isBullet ? trimmed.substring(2) : trimmed;

      // Handle bold blocks (**text**)
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={partIdx} className="font-extrabold text-gray-950">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex gap-2 ml-1 mt-1.5 items-start">
            <span className="shrink-0 mt-1.5 h-1.5 w-1.5 bg-blue-600 rounded-full" />
            <span className="flex-1 text-gray-700 leading-relaxed text-xs">{renderedParts}</span>
          </div>
        );
      }

      // Normal paragraph (with clean spacing)
      if (trimmed === '') {
        return <div key={lineIdx} className="h-2" />;
      }

      return (
        <p key={lineIdx} className="text-gray-700 leading-relaxed text-xs mt-1.5">
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div id="ask-pilot-view" className="bg-white border border-gray-200 rounded-2xl h-full flex flex-col lg:flex-row overflow-hidden font-sans shadow-xs select-none">
      
      {/* LEFT SIDEBAR: Past Advisory Chats */}
      <div className={`${sidebarOpen ? 'w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-150' : 'w-0 hidden'} transition-all duration-300 flex flex-col shrink-0 bg-gray-50/50 h-64 lg:h-auto`}>
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-gray-150 flex items-center justify-between bg-white">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-gray-800">Past Consultations</span>
          </div>
          <button 
            onClick={startNewConversation}
            className="p-1 hover:bg-gray-100 text-blue-600 hover:text-blue-800 rounded-lg transition-colors cursor-pointer"
            title="Start New Chat"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2.5 border-b border-gray-100 bg-gray-50/30">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((convo) => {
              const isActive = convo.id === activeConvoId;
              return (
                <div
                  key={convo.id}
                  onClick={() => setActiveConvoId(convo.id)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between group cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-200' : 'text-gray-400'}`} />
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>
                      {convo.title}
                    </p>
                  </div>
                  <ChevronRight className={`h-3 w-3 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-blue-200' : 'text-gray-400'}`} />
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-[11px] text-gray-400">
              No chat logs found
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CONTENT: Active Advisor Stream */}
      <div className="flex-1 flex flex-col min-w-0 bg-white h-full">
        {/* Advisory Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 mr-1 cursor-pointer"
              title="Toggle sidebar history"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-gray-800">BizPilot Advisory Model v3.5</p>
              <p className="text-[10px] text-gray-400">Powered by Gemini • Real-time Multi-role Consulting</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={deleteActiveConversation}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Delete advisory log"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/40 min-h-0">
          {activeConvo?.messages.map((m, idx) => {
            const isPilot = m.sender === 'pilot';
            return (
              <div 
                key={m.id} 
                className={`flex gap-3 max-w-4xl animate-fade-in ${
                  isPilot ? '' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isPilot ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-200 text-gray-700'
                }`}>
                  {isPilot ? 'AI' : 'ME'}
                </div>

                {/* Message Speech bubble */}
                <div className={`flex flex-col max-w-[85%] ${isPilot ? '' : 'items-end'}`}>
                  <div className={`p-4 rounded-2xl text-xs border transition-all ${
                    isPilot
                      ? 'bg-white border-gray-250 shadow-xs text-gray-800 rounded-tl-none'
                      : 'bg-blue-600 border-blue-600 text-white rounded-tr-none'
                  }`}>
                    {isPilot ? (
                      <div className="space-y-1.5">
                        {renderFormattedText(m.text)}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed text-xs">{m.text}</p>
                    )}
                    
                    <span className={`block text-[9px] mt-2.5 font-mono ${isPilot ? 'text-gray-400' : 'text-blue-200'}`}>
                      {m.timestamp}
                    </span>
                  </div>

                  {/* Actions (Only on pilot response and if it's not the first default welcome message) */}
                  {isPilot && m.id !== 'welcome' && !m.id.startsWith('welcome-') && (
                    <div className="flex gap-3 mt-1.5 px-1">
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="text-[10px] text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy text to clipboard"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy response</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRegenerate(idx)}
                        className="text-[10px] text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Re-run the preceding query"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Regenerate</span>
                      </button>
                      <button
                        onClick={() => handleSaveResponse(m.id, m.text)}
                        className="text-[10px] text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Export advice to Saved Documents"
                      >
                        {savedId === m.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 font-bold">Saved!</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3" />
                            <span>Save advice</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-2xl animate-pulse">
              <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold border border-blue-200">
                AI
              </div>
              <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <Loader2 className="h-4.5 w-4.5 text-blue-600 animate-spin" />
                <span className="text-[11px] text-gray-500 font-medium">Pilot AI is structuring audit models...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* SUGGESTED PROMPTS ROW (Shows when convo has only 1 welcome greeting) */}
        {activeConvo?.messages.length === 1 && !isTyping && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Suggested strategic prompts</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {suggestedPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(promptText)}
                  className="px-3 py-2 text-left bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-xs transition-all text-xs text-gray-700 font-semibold cursor-pointer truncate"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input bar */}
        <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
          <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2">
            <input
              id="chat-input"
              type="text"
              placeholder="Ask anything (e.g. 'How can I get more customers?', 'Should I increase my prices?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="w-full pl-3 pr-12 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-900 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
          <p className="text-[9px] text-gray-400 text-center mt-2.5">
            BizPilot structures high-fidelity advisory models. Section schemas: Executive Summary • Analysis • Recommendations • Risks • Opportunities • 30-Day Plan.
          </p>
        </div>
      </div>

    </div>
  );
}
