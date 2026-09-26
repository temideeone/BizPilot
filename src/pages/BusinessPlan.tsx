/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  FileDown, 
  CheckCircle, 
  Clock, 
  RotateCcw, 
  Copy, 
  RefreshCw, 
  FileText,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { jsPDF } from 'jspdf';
import { handleApiResponse } from '../lib/api';

interface PlanSection {
  id: string;
  title: string;
  desc: string;
  content: string;
  completed: boolean;
}

const defaultSections: PlanSection[] = [
  {
    id: 'exec',
    title: '1. Executive Summary',
    desc: 'Brief high-level overview of your business vision, problem statement, and solution.',
    content: '',
    completed: false
  },
  {
    id: 'market',
    title: '2. Market Analysis',
    desc: 'Target audience segment size, competitor weaknesses, and market opportunities.',
    content: '',
    completed: false
  },
  {
    id: 'swot',
    title: '3. SWOT Analysis',
    desc: 'Strengths, Weaknesses, Opportunities, and Threats affecting operations.',
    content: '',
    completed: false
  },
  {
    id: 'finance',
    title: '4. Financial Plan',
    desc: 'Startup expenses, forecasts, break-even timelines, and recurring budget projections.',
    content: '',
    completed: false
  },
  {
    id: 'marketing',
    title: '5. Marketing Strategy',
    desc: 'Customer acquisition roadmap, branding, digital marketing, and organic loops.',
    content: '',
    completed: false
  },
  {
    id: 'revenue',
    title: '6. Revenue Model',
    desc: 'Pricing points, gross margins, subscriptions, and recurring income streams.',
    content: '',
    completed: false
  },
  {
    id: 'conclusion',
    title: '7. Conclusion',
    desc: 'Strategic company milestones, investor viability, and next-step checklist.',
    content: '',
    completed: false
  }
];

export default function BusinessPlan() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [planTitle, setPlanTitle] = useState('My Pioneer Plan');
  const [industry, setIndustry] = useState('Tech SaaS');
  const [targetAudience, setTargetAudience] = useState('');
  const [budget, setBudget] = useState('');
  const [usp, setUsp] = useState('');
  
  const [sections, setSections] = useState<PlanSection[]>(defaultSections);
  const [activeSectionId, setActiveSectionId] = useState('exec');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];

  const handleContentChange = (val: string) => {
    setSections(prev =>
      prev.map(s =>
        s.id === activeSectionId
          ? { ...s, content: val, completed: val.trim().length > 30 }
          : s
      )
    );
  };

  // Helper function to extract markdown headers safely
  const parseGeminiPlan = (text: string) => {
    const parsedSections = [...defaultSections];
    
    const sectionHeaders: { [key: string]: string[] } = {
      exec: ['## Executive Summary', 'Executive Summary'],
      market: ['## Market Analysis', 'Market Analysis'],
      swot: ['## SWOT', 'SWOT Analysis', '## SWOT Analysis'],
      finance: ['## Financial Plan', 'Financial Plan', '## Financial Forecasts'],
      marketing: ['## Marketing Strategy', 'Marketing Strategy'],
      revenue: ['## Revenue Model', 'Revenue Model'],
      conclusion: ['## Conclusion', 'Conclusion']
    };

    // Split text by lines and parse
    const lines = text.split('\n');
    let currentId = '';
    let buffer: string[] = [];

    lines.forEach((line) => {
      let headingMatch = false;

      // Check if line corresponds to a new section header
      for (const [id, headers] of Object.entries(sectionHeaders)) {
        if (headers.some(h => line.toLowerCase().includes(h.toLowerCase()))) {
          // Flush buffer of previous section
          if (currentId) {
            const idx = parsedSections.findIndex(s => s.id === currentId);
            if (idx !== -1) {
              parsedSections[idx].content = buffer.join('\n').trim();
              parsedSections[idx].completed = parsedSections[idx].content.length > 30;
            }
          }
          currentId = id;
          buffer = [];
          headingMatch = true;
          break;
        }
      }

      if (!headingMatch && currentId) {
        buffer.push(line);
      }
    });

    // Flush last section
    if (currentId) {
      const idx = parsedSections.findIndex(s => s.id === currentId);
      if (idx !== -1) {
        parsedSections[idx].content = buffer.join('\n').trim();
        parsedSections[idx].completed = parsedSections[idx].content.length > 30;
      }
    }

    // In case no sections matched, distribute draft text proportionally as fallback
    if (!parsedSections.some(s => s.content.length > 10)) {
      parsedSections[0].content = text;
      parsedSections[0].completed = text.length > 10;
    }

    return parsedSections;
  };

  const handleGeneratePlan = async () => {
    if (!planTitle.trim() || !industry.trim()) {
      showToast('error', 'Please fill in the Plan Title and Industry sector.', 'Form Incomplete');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTitle,
          industry,
          targetAudience,
          budget,
          usp
        })
      });

      const data = await handleApiResponse(response);
      const parsed = parseGeminiPlan(data.text);
      setSections(parsed);
      showToast('success', 'Your comprehensive 7-section business plan has been compiled!', 'Generation Succeeded');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Check your Gemini Secrets variable.', 'AI Error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    // Compile all sections into one markdown document
    const fullText = sections.map(s => `## ${s.title}\n\n${s.content || '(Section empty)'}`).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    showToast('success', 'Copied full compiled plan to clipboard.', 'Copied');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToDb = async () => {
    setIsSaving(true);
    const fullText = sections.map(s => `## ${s.title}\n\n${s.content || ''}`).join('\n\n');
    const docId = 'plan-' + Math.random().toString(36).substring(2, 9);
    const payload = {
      id: docId,
      title: `${planTitle} - Business Plan`,
      category: 'plan' as const,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      details: fullText,
      size: `${Math.ceil(fullText.length / 1024)} KB`
    };

    if (user && auth.currentUser) {
      const path = `users/${user.id}/documents/${docId}`;
      try {
        const docRef = doc(db, 'users', user.id, 'documents', docId);
        await setDoc(docRef, payload);
        showToast('success', 'Strategic Business Plan successfully stored in Firestore!', 'Saved Successfully');
      } catch (err: any) {
        console.error(err);
        if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        showToast('error', 'Failed to store document in cloud database.', 'Save Error');
      }
    } else {
      // Local fallback
      const savedDocs = localStorage.getItem('bizpilot_documents');
      let currentDocs = [];
      if (savedDocs) {
        try {
          currentDocs = JSON.parse(savedDocs);
        } catch (e) {
          console.error(e);
        }
      }
      currentDocs.unshift(payload);
      localStorage.setItem('bizpilot_documents', JSON.stringify(currentDocs));
      showToast('success', 'Business Plan saved to local Document History!', 'Saved Globally');
    }
    setIsSaving(false);
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.text(planTitle.toUpperCase(), 15, 25);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Sector: ${industry} | Compiled: ${new Date().toLocaleDateString()}`, 15, 32);
      
      doc.setDrawColor(220, 220, 220);
      doc.line(15, 36, 195, 36);
      
      let y = 46;
      sections.forEach((sec) => {
        if (y > 270) {
          doc.addPage();
          y = 25;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text(sec.title, 15, y);
        y += 8;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85); // Slate-700
        
        const textToSplit = sec.content || "Operational details for this section have not been generated yet. Please configure the strategic input form and click 'Generate Strategic Plan'.";
        const splitText = doc.splitTextToSize(textToSplit, 175);
        
        splitText.forEach((line: string) => {
          if (y > 275) {
            doc.addPage();
            y = 25;
          }
          doc.text(line, 15, y);
          y += 5.5;
        });
        
        y += 10; // spacing between sections
      });
      
      doc.save(`${planTitle.toLowerCase().replace(/\s+/g, '_')}_business_plan.pdf`);
      showToast('success', 'Business Plan PDF downloaded successfully!', 'PDF Generated');
    } catch (e: any) {
      console.error(e);
      showToast('error', 'Could not compile PDF locally.', 'PDF Error');
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to clear this business plan? All text will be reset.')) {
      setSections(defaultSections);
      setActiveSectionId('exec');
    }
  };

  const completedCount = sections.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / sections.length) * 100);

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-10">
      
      {/* SECTION 1: Professional Input Form & Globals */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
          <div>
            <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">Business Configuration Details</h3>
            <p className="text-[10px] text-gray-400">Configure parameters for the AI model to generate strategic roadmaps</p>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
            title="Reset form"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company/Project Name</label>
            <input
              type="text"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Industry Sector</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Eco-Friendly Car Wash, EdTech App"
              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target Market Audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Busy urban car owners, Gen Z students"
              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Starting Capital/Budget</label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. $15,000, $500/mo self-funded"
              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unique Selling Proposition (USP)</label>
            <input
              type="text"
              value={usp}
              onChange={(e) => setUsp(e.target.value)}
              placeholder="e.g. Waterless steam technology, custom dynamic algorithms"
              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating Comprehensive 7-Section Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Complete Plan with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 2: Progress Completeness indicator */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-gray-700">Plan Content Completeness</span>
          <span className="text-xs font-mono font-bold text-blue-600">{progressPercent}% ({completedCount}/{sections.length} sections draft ready)</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
          />
        </div>
      </div>

      {/* SECTION 3: Main Split Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sections Selection Column */}
        <div className="space-y-2 lg:col-span-1">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                sec.id === activeSectionId
                  ? 'bg-blue-50/50 border-blue-400 shadow-xs'
                  : 'bg-white border-gray-200 hover:bg-gray-50/80'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {sec.completed ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-gray-900">{sec.title}</h4>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed truncate">{sec.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Editing Column with editable textarea result */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs lg:col-span-2 flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 mb-4 gap-2">
              <div>
                <h3 className="font-display font-bold text-sm text-gray-900 tracking-tight">{activeSection.title}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{activeSection.desc}</p>
              </div>
            </div>

            {isGenerating ? (
              <div className="space-y-4 animate-pulse-slow py-4">
                <div className="h-4 bg-gray-100 rounded-sm w-1/3" />
                <div className="h-3 bg-gray-100 rounded-sm w-full" />
                <div className="h-3 bg-gray-100 rounded-sm w-5/6" />
                <div className="h-3 bg-gray-100 rounded-sm w-3/4" />
                <div className="h-3 bg-gray-100 rounded-sm w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Section Sandbox Editor (Fully Editable)</label>
                <textarea
                  id={`textarea-section-${activeSectionId}`}
                  value={activeSection.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={`Strategic guidelines for ${activeSection.title} will appear here. Refine details, write notes, or run the AI builder above to populate a comprehensive baseline plan.`}
                  className="w-full h-80 p-3 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 leading-relaxed font-mono resize-none"
                />
              </div>
            )}
          </div>

          {/* Floating actions */}
          <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-gray-100 gap-3">
            <span className="text-[10px] text-gray-400 font-mono">
              Words in section: {activeSection.content ? activeSection.content.split(/\s+/).filter(Boolean).length : 0}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={isGenerating}
                className="p-2 border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-xl transition-colors cursor-pointer"
                title="Copy entire compiled plan text"
              >
                {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
              
              <button
                onClick={handleSaveToDb}
                disabled={isSaving || isGenerating}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-250 rounded-xl transition-all cursor-pointer"
              >
                {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Store in Cloud
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer animate-pulse-slow"
              >
                <FileDown className="h-3.5 w-3.5" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
