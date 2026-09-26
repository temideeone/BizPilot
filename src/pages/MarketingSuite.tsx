/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  MessageSquare, 
  Mail, 
  Sparkles, 
  FileText, 
  Layers, 
  Copy, 
  Save, 
  Download, 
  RefreshCw, 
  Languages, 
  Users, 
  Building, 
  Check, 
  Eye, 
  Trash2, 
  AlertCircle,
  FileDown,
  Megaphone,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, getDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { handleApiResponse } from '../lib/api';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

// Module configuration definitions
interface MarketingModule {
  id: string;
  name: string;
  desc: string;
  icon: any;
  color: string;
  borderColor: string;
  badgeBg: string;
}

const MODULES: MarketingModule[] = [
  { 
    id: 'facebook', 
    name: 'Facebook Post', 
    desc: 'Craft scroll-stopping updates with visual bullet points, emojis, and highly specific hooks.',
    icon: Facebook, 
    color: 'text-blue-600 bg-blue-50',
    borderColor: 'border-blue-100 hover:border-blue-400',
    badgeBg: 'bg-blue-100 text-blue-800'
  },
  { 
    id: 'instagram', 
    name: 'Instagram Caption', 
    desc: 'Develop lifestyle aesthetic captions with engaging prompts and dot-separated hashtags.',
    icon: Instagram, 
    color: 'text-pink-600 bg-pink-50',
    borderColor: 'border-pink-100 hover:border-pink-400',
    badgeBg: 'bg-pink-100 text-pink-800'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn Post', 
    desc: 'Build thought leadership sequences, story hooks, and corporate value-sharing insights.',
    icon: Linkedin, 
    color: 'text-sky-700 bg-sky-50',
    borderColor: 'border-sky-100 hover:border-sky-400',
    badgeBg: 'bg-sky-100 text-sky-800'
  },
  { 
    id: 'x', 
    name: 'X Post Generator', 
    desc: 'Write punchy individual posts under 280 characters or high-impact mini threads.',
    icon: Twitter, 
    color: 'text-gray-900 bg-gray-50',
    borderColor: 'border-gray-200 hover:border-gray-500',
    badgeBg: 'bg-gray-200 text-gray-800'
  },
  { 
    id: 'whatsapp', 
    name: 'WhatsApp Promotion', 
    desc: 'Create mobile promotional copy utilizing standard WhatsApp bold/italic styles.',
    icon: MessageSquare, 
    color: 'text-emerald-600 bg-emerald-50',
    borderColor: 'border-emerald-100 hover:border-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-800'
  },
  { 
    id: 'email', 
    name: 'Email Campaign', 
    desc: 'Write complete marketing campaigns with subject line tests, preheaders, and strong CTAs.',
    icon: Mail, 
    color: 'text-indigo-600 bg-indigo-50',
    borderColor: 'border-indigo-100 hover:border-indigo-400',
    badgeBg: 'bg-indigo-100 text-indigo-800'
  },
  { 
    id: 'business_name', 
    name: 'Business Name Generator', 
    desc: 'Generate distinct name concepts with matching taglines, suitability scores, and reasoning.',
    icon: Sparkles, 
    color: 'text-amber-600 bg-amber-50',
    borderColor: 'border-amber-100 hover:border-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800'
  },
  { 
    id: 'slogan', 
    name: 'Slogan Generator', 
    desc: 'Generate 15 high-impact taglines categorized by brand psychology and style goals.',
    icon: FileText, 
    color: 'text-purple-600 bg-purple-50',
    borderColor: 'border-purple-100 hover:border-purple-400',
    badgeBg: 'bg-purple-100 text-purple-800'
  },
  { 
    id: 'brand_story', 
    name: 'Brand Story', 
    desc: 'Establish deep customer resonance with origin spark narratives and future vision.',
    icon: Layers, 
    color: 'text-rose-600 bg-rose-50',
    borderColor: 'border-rose-100 hover:border-rose-400',
    badgeBg: 'bg-rose-100 text-rose-800'
  }
];

const TONES = [
  'Professional',
  'Friendly & Warm',
  'Bold & Authoritative',
  'Playful & Creative',
  'Persuasive & Sales-driven',
  'Elegant & Luxury',
  'Urgent & Exciting',
  'Informative & Techy'
];

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
  { code: 'Yoruba', label: 'Yoruba' },
  { code: 'Igbo', label: 'Igbo' },
  { code: 'Hausa', label: 'Hausa' },
  { code: 'Arabic', label: 'Arabic (العربية)' },
  { code: 'Chinese', label: 'Chinese (中文)' },
  { code: 'Japanese', label: 'Japanese (日本語)' }
];

interface SavedAsset {
  id: string;
  title: string;
  module: string;
  content: string;
  tone: string;
  language: string;
  createdAt: string;
}

export default function MarketingSuite() {
  const { session } = useAuth();
  const { showToast } = useToast();

  // Selected state
  const [activeModule, setActiveModule] = useState<string>('facebook');
  const [tone, setTone] = useState<string>('Professional');
  const [targetAudience, setTargetAudience] = useState<string>('Small Business Owners');
  const [businessType, setBusinessType] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  const [description, setDescription] = useState<string>('');

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(false);

  // Load user details if they have prefilled onboarding settings
  useEffect(() => {
    if (session && auth.currentUser) {
      // Look up and fetch user profile to prefill business name/type
      const getProfile = async () => {
        const path = `users/${session.uid}`;
        try {
          const userDocSnap = await getDoc(doc(db, 'users', session.uid));
          if (userDocSnap.exists()) {
            const profile = userDocSnap.data();
            if (profile.business_name) {
              setBusinessType(profile.business_name);
            }
          }
        } catch (e: any) {
          console.warn('Silent failure loading prefilled profile data:', e);
          if (e?.code === 'permission-denied' || String(e?.message || e).includes('Missing or insufficient permissions')) {
            handleFirestoreError(e, OperationType.GET, path);
          }
        }
      };
      getProfile();
      fetchSavedAssets();
    }
  }, [session]);

  const fetchSavedAssets = async () => {
    if (!session || !auth.currentUser) return;
    setIsLoadingSaved(true);
    const path = `users/${session.uid}/documents`;
    try {
      const q = query(
        collection(db, path),
        where('category', '==', 'marketing'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const docs: SavedAsset[] = snap.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || 'Marketing Asset',
        module: doc.data().module || 'facebook',
        content: doc.data().content || '',
        tone: doc.data().tone || 'Professional',
        language: doc.data().language || 'English',
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleDateString() : 'Recent'
      }));
      setSavedAssets(docs);
    } catch (err: any) {
      console.error('Failed to load saved assets:', err);
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
      // Fallback if index is building or not configured yet
      try {
        const qFallback = query(collection(db, path), where('category', '==', 'marketing'));
        const snapFallback = await getDocs(qFallback);
        const docsFallback: SavedAsset[] = snapFallback.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Marketing Asset',
          module: doc.data().module || 'facebook',
          content: doc.data().content || '',
          tone: doc.data().tone || 'Professional',
          language: doc.data().language || 'English',
          createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleDateString() : 'Recent'
        }));
        setSavedAssets(docsFallback);
      } catch (innerErr) {
        // Mock fallback if user is completely sandbox or offline
        setSavedAssets([
          {
            id: 'mock-1',
            title: 'Q3 Product Launch Promo (Facebook)',
            module: 'facebook',
            content: '🚀 EXCITING NEWS founders! BizPilot AI is live on the workspace...',
            tone: 'Urgent & Exciting',
            language: 'English',
            createdAt: 'June 26, 2026'
          }
        ]);
      }
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleGenerate = async () => {
    if (!businessType.trim()) {
      showToast('error', 'Please enter your business type or company name.', 'Input Required');
      return;
    }

    setIsGenerating(true);
    setGeneratedText('');

    try {
      const response = await fetch('/api/generate-marketing-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: activeModule,
          tone,
          targetAudience,
          businessType,
          language,
          description
        })
      });

      const data = await handleApiResponse(response);
      setGeneratedText(data.text);
      showToast('success', 'Your marketing copy has been crafted successfully!', 'Creative Crafted');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to generate copy. Verify settings.', 'Generation Failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    showToast('success', 'Marketing copy successfully copied to clipboard.', 'Copied!');
  };

  const handleSaveToCloud = async () => {
    if (!session || !auth.currentUser) {
      showToast('error', 'Please sign in or register to save copy to cloud database.', 'Authorization Required');
      return;
    }
    if (!generatedText) return;

    const path = `users/${session.uid}/documents`;
    const selectedModName = MODULES.find(m => m.id === activeModule)?.name || 'Marketing Copy';
    const documentTitle = `${selectedModName} (${tone})`;

    try {
      await addDoc(collection(db, path), {
        title: documentTitle,
        category: 'marketing',
        module: activeModule,
        content: generatedText,
        tone,
        language,
        createdAt: new Date().toISOString(),
        details: `${selectedModName} copy created on ${new Date().toLocaleDateString()}`,
        size: `${Math.round(generatedText.length / 1024 * 10) / 10} KB`
      });

      showToast('success', 'Successfully persisted to your cloud-saved history.', 'Saved to Cloud');
      fetchSavedAssets(); // reload history tray
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session || !auth.currentUser) return;
    if (!confirm('Are you sure you want to permanently delete this marketing asset?')) return;

    const path = `users/${session.uid}/documents/${id}`;
    try {
      await deleteDoc(doc(db, `users/${session.uid}/documents`, id));
      showToast('success', 'Marketing asset successfully removed from database.', 'Deleted');
      fetchSavedAssets();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleLoadAsset = (asset: SavedAsset) => {
    setActiveModule(asset.module);
    setTone(asset.tone);
    setLanguage(asset.language);
    setGeneratedText(asset.content);
    showToast('info', `Loaded previously saved copy: ${asset.title}`, 'Asset Restored');
    
    // Smooth scroll up to result viewport
    const resultsPanel = document.getElementById('marketing-results-container');
    if (resultsPanel) {
      resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Advanced PDF generator
  const handleDownloadPDF = () => {
    if (!generatedText) return;
    const selectedModName = MODULES.find(m => m.id === activeModule)?.name || 'Marketing Copy';
    
    const docPdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 20;
    const pageWidth = docPdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = 25;

    // Deep Slate Header Graphic
    docPdf.setFillColor(30, 41, 59); // slate-800
    docPdf.rect(0, 0, pageWidth, 40, 'F');

    // Title text
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('Helvetica', 'bold');
    docPdf.setFontSize(18);
    docPdf.text('BIZPILOT AI - MARKETING COPY REPORT', margin, 18);

    // Metadata lines
    docPdf.setFont('Helvetica', 'normal');
    docPdf.setFontSize(9);
    docPdf.text(`Channel: ${selectedModName.toUpperCase()}`, margin, 26);
    docPdf.text(`Brand Tone: ${tone} | Language: ${language}`, margin, 31);
    docPdf.text(`Compiled Date: ${new Date().toLocaleDateString()} | Business: ${businessType || 'Specified Entity'}`, margin, 36);

    yPosition = 50;
    docPdf.setTextColor(51, 65, 85); // slate-700
    docPdf.setFontSize(11);

    const cleanLineMarkdown = (raw: string) => {
      return raw
        .replace(/#+\s+/g, '') // remove headers
        .replace(/\*\*/g, '')  // remove bold marker
        .replace(/\*/g, '')    // remove italic marker
        .replace(/_/g, '')     // remove underline
        .replace(/`+/g, '');   // remove code wraps
    };

    const paragraphs = generatedText.split('\n');
    const pageHeightLimit = docPdf.internal.pageSize.getHeight() - margin;

    paragraphs.forEach((line) => {
      const cleaned = cleanLineMarkdown(line).trim();
      if (cleaned === '' && line === '') {
        yPosition += 5;
        return;
      }

      const isHeader = line.startsWith('#');
      if (isHeader) {
        docPdf.setFont('Helvetica', 'bold');
        docPdf.setFontSize(12);
        docPdf.setTextColor(15, 23, 42); // slate-900
        yPosition += 3;
      } else {
        docPdf.setFont('Helvetica', 'normal');
        docPdf.setFontSize(10.5);
        docPdf.setTextColor(51, 65, 85); // slate-700
      }

      const splitLines = docPdf.splitTextToSize(cleaned, contentWidth);
      splitLines.forEach((wLine: string) => {
        if (yPosition > pageHeightLimit) {
          docPdf.addPage();
          yPosition = 20;
        }
        docPdf.text(wLine, margin, yPosition);
        yPosition += 6.5;
      });

      if (isHeader) {
        yPosition += 2;
      }
    });

    // Signature footer
    docPdf.setFont('Helvetica', 'italic');
    docPdf.setFontSize(8);
    docPdf.setTextColor(148, 163, 184);
    docPdf.text('Generated using BizPilot AI Marketing suite - All rights reserved.', margin, docPdf.internal.pageSize.getHeight() - 10);

    docPdf.save(`bizpilot-${activeModule}-copy.pdf`);
    showToast('success', 'PDF compiled and downloaded successfully.', 'PDF Exported');
  };

  const activeModuleDetails = MODULES.find(m => m.id === activeModule) || MODULES[0];

  return (
    <div className="space-y-8 font-sans select-none animate-fade-in pb-12">
      {/* Dynamic Suite Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 rounded-full backdrop-blur-md text-[10px] font-bold tracking-widest text-blue-200 uppercase border border-white/5 transition-colors">
            <Sparkles className="h-3 w-3 animate-pulse text-blue-400" />
            Suite Core Engine
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight leading-tight">
            AI Marketing Suite
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Instantly formulate conversion-optimized copy, brand assets, and platform-specific social posts utilizing elite copywriting frameworks tailored precisely to your specific target audience.
          </p>
        </div>
      </div>

      {/* Grid of Modules - Premium Selection Block */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Select Marketing Channel / Module</h2>
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-mono">9 Available Engines</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isSelected = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod.id);
                  // Clear generated outputs to avoid confusion when shifting modules
                  setGeneratedText('');
                }}
                className={`text-left p-4 rounded-2xl border transition-all duration-250 cursor-pointer relative group flex flex-col justify-between h-40 bg-white ${
                  isSelected 
                    ? 'border-blue-500 shadow-md ring-2 ring-blue-100' 
                    : 'border-gray-200/80 hover:bg-gray-50/50 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${mod.color} shrink-0 transition-transform group-hover:scale-105`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full font-mono uppercase tracking-widest">
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-xs text-gray-900 group-hover:text-blue-600 transition-colors">
                    {mod.name}
                  </h3>
                  <p className="text-[10.5px] text-gray-400 leading-relaxed mt-1 line-clamp-2">
                    {mod.desc}
                  </p>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-50 mt-1">
                  <span className="text-[9px] font-bold text-gray-400 group-hover:text-gray-700 flex items-center gap-0.5 font-mono">
                    Configure
                    <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Configurations & Results Workspace */}
      <div id="marketing-results-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Setup Parameters Panel (Takes 5/12 space) */}
        <div className="lg:col-span-5 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider mb-2 font-mono ${activeModuleDetails.badgeBg}`}>
              {activeModuleDetails.name} Configuration
            </span>
            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
              BizPilot AI adapts strategic copy principles tailored exactly to the parameters selected below.
            </p>
          </div>

          <div className="space-y-4">
            {/* Business Type Input */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-mono">
                <Building className="h-3.5 w-3.5 text-gray-400" />
                Business Name & Core Concept
              </label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g. Acme SaaS CRM, Pioneer Local Bakery, etc."
                className="w-full text-xs px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold shadow-2xs"
              />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[8.5px] font-bold text-gray-400 uppercase font-mono py-0.5">Quick fill:</span>
                {['Fintech Startup', 'Local Gym', 'Consulting Firm', 'Fashion Label'].map((text) => (
                  <button
                    key={text}
                    onClick={() => setBusinessType(text)}
                    className="text-[9px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200/80 px-2 py-0.5 rounded transition-all cursor-pointer"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience Input */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-mono">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                Target Audience Demographics
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Busy freelance developers, College graduates aged 21-25"
                className="w-full text-xs px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold shadow-2xs"
              />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {['Corporate Executives', 'Busy Parents', 'E-commerce Buyers', 'SME Founders'].map((text) => (
                  <button
                    key={text}
                    onClick={() => setTargetAudience(text)}
                    className="text-[9px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200/80 px-2 py-0.5 rounded transition-all cursor-pointer"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Dual selects: Tone & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-mono">
                  <Megaphone className="h-3.5 w-3.5 text-gray-400" />
                  Brand Tone Accent
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full text-xs px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-700 font-semibold shadow-2xs"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-mono">
                  <Languages className="h-3.5 w-3.5 text-gray-400" />
                  Language Selector
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full text-xs px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-700 font-semibold shadow-2xs"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional context */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-mono">
                <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                Additional Keywords & Context (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="e.g. Offering a 15% discount code BIZLAUNCH. Focus on rapid delivery benefits, and address security fears of developers."
                className="w-full text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-medium leading-relaxed resize-none shadow-2xs"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden"
          >
            <Sparkles className="h-4 w-4 animate-pulse-slow" />
            <span>Generate {activeModuleDetails.name} Copy</span>
          </button>
        </div>

        {/* Right Side: Copy Workbench Output View (Takes 7/12 space) */}
        <div className="lg:col-span-7 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-display font-black text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${generatedText ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'}`} />
                Live AI Copy Sandbox
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold">
                Copy, save to cloud profiles, or download as official PDF reports instantly.
              </p>
            </div>

            {/* Quick Actions bar (visible only when content is ready) */}
            {generatedText && !isGenerating && (
              <div className="flex gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-150 transition-colors cursor-pointer"
                  title="Copy Raw Content"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleSaveToCloud}
                  className="p-1.5 bg-gray-50 hover:bg-blue-50 rounded-lg text-blue-600 border border-blue-100 transition-colors cursor-pointer"
                  title="Save Asset to Cloud"
                >
                  <Save className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="p-1.5 bg-gray-50 hover:bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100 transition-colors cursor-pointer"
                  title="Compile PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Results Viewer Panel */}
          <div className="min-h-[300px] flex flex-col justify-between">
            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="relative flex items-center justify-center h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                  <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-gray-900 animate-pulse">BizPilot AI is writing...</h4>
                  <p className="text-[10px] text-gray-400 italic max-w-xs mx-auto mt-1 leading-relaxed">
                    Structuring copy hooks, optimizing audience triggers, and formatting for chosen parameters. Please wait.
                  </p>
                </div>
              </div>
            ) : generatedText ? (
              <div className="flex-1 space-y-4">
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150/70 text-xs text-gray-700 leading-relaxed font-sans prose prose-slate max-w-none prose-xs selection:bg-blue-100">
                  <ReactMarkdown>{generatedText}</ReactMarkdown>
                </div>

                {/* Additional controls footer */}
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-150/70">
                  <span className="text-[9px] font-bold text-gray-400 font-mono">
                    Size: {Math.round(generatedText.length / 1024 * 10) / 10} KB | {generatedText.length} Chars
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerate}
                      className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg border border-gray-200 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3 animate-pulse-slow" />
                      Regenerate
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <FileDown className="h-3 w-3" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-400 max-w-md mx-auto">
                <div className="h-10 w-10 bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-center mb-3">
                  <Megaphone className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs font-semibold leading-relaxed text-gray-500">
                  Your generated copywriting campaign content will display here.
                </p>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  Choose your targeted marketing channel above, input your business keywords, select a brand accent tone, and tap **Generate**.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Saved Assets History List - Elite Workspace Touch */}
      {session && (
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-display font-black text-sm text-slate-800 tracking-tight">
                Saved Suite Library
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold">
                Quickly load, download, or manage your previously persisted marketing copy and brand assets.
              </p>
            </div>
            <button
              onClick={fetchSavedAssets}
              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-150 transition-all cursor-pointer"
              title="Refresh saved items"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {isLoadingSaved ? (
            <div className="py-8 text-center text-xs text-gray-400 font-mono flex items-center justify-center gap-1.5">
              <span className="h-3.5 w-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              Loading your cloud saved library...
            </div>
          ) : savedAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedAssets.map((asset) => {
                const modMeta = MODULES.find(m => m.id === asset.module) || MODULES[0];
                const ModIcon = modMeta.icon;
                return (
                  <div
                    key={asset.id}
                    onClick={() => handleLoadAsset(asset)}
                    className="p-3.5 bg-gray-50/55 hover:bg-gray-50 border border-gray-150 hover:border-blue-300 rounded-xl cursor-pointer transition-all flex flex-col justify-between h-36 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`p-1.5 rounded-md ${modMeta.color} shrink-0`}>
                            <ModIcon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-700 truncate font-mono">
                            {asset.title}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSaved(asset.id, e)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors shrink-0"
                          title="Delete copy"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-3 leading-relaxed">
                        {asset.content.replace(/#+\s+/g, '').replace(/\*\*/g, '')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100/70 pt-2 mt-2 text-[9px] font-bold font-mono text-gray-400">
                      <span>{asset.tone}</span>
                      <span>{asset.createdAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 max-w-sm mx-auto">
              <FileText className="h-7 w-7 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500">Your cloud library is empty.</p>
              <p className="text-[10px] text-gray-400 mt-1">
                Any copies you save using the cloud icon will appear here for immediate restore.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
