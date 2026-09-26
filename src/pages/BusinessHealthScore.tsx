/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Info, 
  HelpCircle, 
  CheckSquare, 
  Sparkles, 
  Copy, 
  Save, 
  Download, 
  RefreshCw, 
  FileDown, 
  Building, 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Lock, 
  Eye, 
  ListOrdered,
  Award,
  Zap,
  Briefcase,
  Layers,
  Heart,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { handleApiResponse } from '../lib/api';

// 12 Assessment Questions divided into 4 core pillars
interface AssessmentQuestion {
  id: number;
  pillar: 'Financial' | 'Growth' | 'Compliance' | 'Operations';
  title: string;
  description: string;
  options: {
    points: number;
    label: string;
    detail: string;
  }[];
}

const PILLARS = {
  Financial: { name: 'Financial Operations & Stability', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  Growth: { name: 'Marketing & Brand Growth', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  Compliance: { name: 'Legal Compliance & Security', color: 'text-rose-600 bg-rose-50 border-rose-100' },
  Operations: { name: 'Systems & Operational Scale', color: 'text-purple-600 bg-purple-50 border-purple-100' }
};

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // Financial Pillar
  {
    id: 1,
    pillar: 'Financial',
    title: 'Revenue Predictability & Contract Stability',
    description: 'Do you have predictable, recurring contract revenue, or is it highly volatile and project-dependent?',
    options: [
      { points: 0, label: 'Highly Volatile', detail: 'No predictable revenue; completely project-to-project.' },
      { points: 3, label: 'Basic Tracking', detail: 'Mostly volatile, but we track historical cycles manually.' },
      { points: 7, label: 'Partially Predictable', detail: 'Some ongoing retainers or long-term clients; moderate safety.' },
      { points: 10, label: 'Fully Systematized', detail: '90%+ highly predictable, recurring SaaS, subscription, or retainer contracts.' }
    ]
  },
  {
    id: 2,
    pillar: 'Financial',
    title: 'Invoicing Cycles & Receivables Hygiene',
    description: 'Do you issue professional invoices, track payment due dates, and enforce overdue reminder policies?',
    options: [
      { points: 0, label: 'Unstructured', detail: 'No formal invoicing; clients pay late or via informal transfers.' },
      { points: 3, label: 'Manual Processing', detail: 'Drafted manually in Word/Excel; minimal follow-ups on late payments.' },
      { points: 7, label: 'Consistent Tracking', detail: 'Consistent invoice dispatch with manual follow-ups on overdue balances.' },
      { points: 10, label: 'Fully Automated', detail: 'Automated invoice workflows with scheduled, smart multi-stage late-payment triggers.' }
    ]
  },
  {
    id: 3,
    pillar: 'Financial',
    title: 'Expense Controls & Margin Management',
    description: 'Do you monitor net profit margins consistently and adhere to structured operating budgets?',
    options: [
      { points: 0, label: 'No Tracking', detail: 'Unsure of current margins; expenses paid without structured approval.' },
      { points: 3, label: 'Manual Reviews', detail: 'Profitability calculated at tax-time only; manual checkbook tracking.' },
      { points: 7, label: 'Monthly Reviews', detail: 'Tracked monthly on spreadsheets with decent expense boundaries.' },
      { points: 10, label: 'Automated Dashboard', detail: 'Real-time profit/loss charts with strict budget gates and automated alerts.' }
    ]
  },
  // Growth Pillar
  {
    id: 4,
    pillar: 'Growth',
    title: 'Social & Promotional Post Consistency',
    description: 'How frequently does your brand compose, schedule, and distribute social promotions or newsletters?',
    options: [
      { points: 0, label: 'Dormant Channels', detail: 'No social channels or emails dispatched in the last 6 months.' },
      { points: 3, label: 'Ad-hoc/Manual', detail: 'Sporadic posts when time permits; no content calendar.' },
      { points: 7, label: 'Moderately Scheduled', detail: 'Weekly updates scheduled via tools; decent organic engagement.' },
      { points: 10, label: 'Multi-Channel Calendar', detail: 'Rigorous daily social sequences and highly optimized automated newsletters.' }
    ]
  },
  {
    id: 5,
    pillar: 'Growth',
    title: 'Lead Generation & Acquisition Funnel',
    description: 'Do you actively track Customer Acquisition Cost (CAC) and manage reliable inbound channels?',
    options: [
      { points: 0, label: 'Pure Word-of-Mouth', detail: 'Completely dependent on referrals; no control over pipeline speed.' },
      { points: 3, label: 'Experimental Funnel', detail: 'Some active ads or lead Magnets, but results are inconsistent.' },
      { points: 7, label: 'Systematic Inbound', detail: 'Proven channels (SEO, ads) with somewhat stable weekly inbound leads.' },
      { points: 10, label: 'High-Converting Engine', detail: 'Highly integrated high-traffic pipelines with fully optimized CAC tracking.' }
    ]
  },
  {
    id: 6,
    pillar: 'Growth',
    title: 'Unique Value Proposition & Differentiation',
    description: 'Is your brand’s core differentiation clearly defined and visible on all public pages?',
    options: [
      { points: 0, label: 'Generic Offerings', detail: 'We look exactly like our local competitors; price is our main lever.' },
      { points: 3, label: 'Implicit Differentiation', detail: 'We know we are better, but it is not clearly articulated in copy.' },
      { points: 7, label: 'Clearly Articulated', detail: 'Distinct tagline and unique value proposition prominently displayed.' },
      { points: 10, label: 'Venture Category Leader', detail: 'Uniquely carved brand story with clear, defensible intellectual advantages.' }
    ]
  },
  // Compliance Pillar
  {
    id: 7,
    pillar: 'Compliance',
    title: 'Legal Agreements & Partner Contracts',
    description: 'Do you consistently leverage formal non-disclosure agreements (NDAs) and iron-clad client service contracts?',
    options: [
      { points: 0, label: 'Handshake Deals', detail: 'Operate on trust; no written contracts signed for most projects.' },
      { points: 3, label: 'Basic Templates', detail: 'Downloaded general agreements used without proper customization.' },
      { points: 7, label: 'Standard Protocols', detail: 'Attorney-drafted service contracts and mutual NDAs signed consistently.' },
      { points: 10, label: 'Automated Document Vault', detail: 'Custom dynamic contracts and automated secure e-signatures for all projects.' }
    ]
  },
  {
    id: 8,
    pillar: 'Compliance',
    title: 'Compliance Hygiene & Tax Preparedness',
    description: 'Are you fully prepared for tax filing schedules, regulatory audits, and local operating license requirements?',
    options: [
      { points: 0, label: 'Scrambling Annually', detail: 'Taxes filed late; constantly missing compliance deadlines.' },
      { points: 3, label: 'Manual Reminders', detail: 'Taxes handled on time, but with considerable stress and scrambling.' },
      { points: 7, label: 'Organized Filing', detail: 'Pristine books kept by external accountants; minor regulatory issues.' },
      { points: 10, label: 'Pristine Automation', detail: 'Real-time tax liability estimation and continuous compliance sweeps.' }
    ]
  },
  {
    id: 9,
    pillar: 'Compliance',
    title: 'Data Security, Backups & Privacy Regulations',
    description: 'Do you employ encrypted storage, reliable system backups, and comply with standards like GDPR or CCPA?',
    options: [
      { points: 0, label: 'Vulnerable Systems', detail: 'No secure storage; customer data saved in unencrypted local files.' },
      { points: 3, label: 'Basic Antivirus', detail: 'Standard local storage with occasional manual cloud backups.' },
      { points: 7, label: 'Secure Storage', detail: 'Encrypted databases and daily automated backups; baseline privacy policy.' },
      { points: 10, label: 'Fortified Workspace', detail: 'Full enterprise-grade encryption, zero-trust protocols, and active GDPR/CCPA audits.' }
    ]
  },
  // Operations Pillar
  {
    id: 10,
    pillar: 'Operations',
    title: 'Standard Operating Procedures (SOPs)',
    description: 'Are your daily operations documented as repeatable systems so anyone could run them?',
    options: [
      { points: 0, label: 'Unstructured Memory', detail: 'All knowledge is stored inside the founder’s head; high single-point failure risk.' },
      { points: 3, label: 'Sparse Drafts', detail: 'A few written notes in Google Docs, but rarely updated.' },
      { points: 7, label: 'Structured SOP Library', detail: 'SOPs drafted for core workflows; used for training new team members.' },
      { points: 10, label: 'Living Operational Wiki', detail: 'A searchable, interactive digital wiki updated continuously with automated steps.' }
    ]
  },
  {
    id: 11,
    pillar: 'Operations',
    title: 'Tool Stack & Software Integration',
    description: 'Are your tools (CRM, invoicing, analytics) integrated smoothly, or do you copy-paste data manually?',
    options: [
      { points: 0, label: 'Siloed Tools', detail: 'Tools do not talk to each other; hours spent typing identical data.' },
      { points: 3, label: 'Basic Syncing', detail: 'Some standard tools with partial integrations (e.g., standard Stripe to CRM).' },
      { points: 7, label: 'Central Database', detail: 'Smooth multi-tool sync with automated dashboard feeds.' },
      { points: 10, label: 'Hyper-Automated Workspace', detail: 'Custom server-side connections and auto-trigger workflows requiring zero human interaction.' }
    ]
  },
  {
    id: 12,
    pillar: 'Operations',
    title: 'Scaling Roadmap & Talent Alignment',
    description: 'Do you have a strategic 12-month business model plan with clear roles defined for future hires?',
    options: [
      { points: 0, label: 'No Planning', detail: 'Living week-to-week; hiring decisions made strictly in a panic.' },
      { points: 3, label: 'Informal Target', detail: 'Vague target ideas without matching financial sheets or milestone gates.' },
      { points: 7, label: 'Strategic Plan', detail: 'Custom 12-month plan with clearly defined hiring budgets and metrics.' },
      { points: 10, label: 'Venture Master Plan', detail: 'Dynamic milestones linked with live cash-flow runways and hiring triggers.' }
    ]
  }
];

export default function BusinessHealthScore() {
  const { session, user } = useAuth();
  const { showToast } = useToast();

  // Dynamic state
  const [businessType, setBusinessType] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // Calculation outputs
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [globalScore, setGlobalScore] = useState<number>(0);
  const [pillarScores, setPillarScores] = useState<Record<string, number>>({});
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [riskLevel, setRiskLevel] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<string[]>([]);

  // Roadmap generation
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState<boolean>(false);
  const [roadmapText, setRoadmapText] = useState<string>('');
  const [recentSavedId, setRecentSavedId] = useState<string | null>(null);

  // Set default values from profile
  useEffect(() => {
    if (user && user.business_name) {
      setBusinessType(user.business_name);
    }
  }, [user]);

  // Handle question response select
  const handleSelectOption = (questionId: number, points: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: points
    }));
    // Auto advance if not last question with slight smooth delay
    if (currentStep < ASSESSMENT_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 300);
    }
  };

  const handleNext = () => {
    if (answers[ASSESSMENT_QUESTIONS[currentStep].id] === undefined) {
      showToast('info', 'Please select an answer option to proceed.', 'Selection Required');
      return;
    }
    if (currentStep < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Diagnostic core algorithm
  const calculateAuditResults = () => {
    // Check if all 12 are answered
    const unanswered = ASSESSMENT_QUESTIONS.filter(q => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      showToast('error', `Please complete all 12 questions. (${unanswered.length} unanswered left)`, 'Incomplete Audit');
      return;
    }

    if (!businessType.trim()) {
      showToast('error', 'Please enter your registered Business Type or Company Name to formulate recommendations.', 'Input Required');
      return;
    }

    let totalPoints = 0;
    const pillarPoints: Record<string, number> = { Financial: 0, Growth: 0, Compliance: 0, Operations: 0 };
    const pillarCount = { Financial: 3, Growth: 3, Compliance: 3, Operations: 3 };

    const detectedStrengths: string[] = [];
    const detectedWeaknesses: string[] = [];
    const dynamicRecommendations: string[] = [];
    const dynamicOpportunities: string[] = [];

    ASSESSMENT_QUESTIONS.forEach(q => {
      const pts = answers[q.id];
      totalPoints += pts;
      pillarPoints[q.pillar] += pts;

      const selectedOpt = q.options.find(o => o.points === pts);

      if (pts >= 7) {
        detectedStrengths.push(`${q.title} (${selectedOpt?.label || 'Optimized'})`);
        if (pts === 10) {
          dynamicOpportunities.push(`Leverage ${q.title} to out-market and acquire competitors.`);
        }
      } else {
        detectedWeaknesses.push(`${q.title} (${selectedOpt?.label || 'Vulnerable'})`);
        // Compile logical dynamic tips based on specific question issues
        if (q.id === 1) {
          dynamicRecommendations.push('Stabilize monthly contracts by migrating short-term contracts to a standard 6 or 12-month retainer structure.');
        } else if (q.id === 2) {
          dynamicRecommendations.push('Utilize the BizPilot Invoice Generator to automate collections and trigger gentle late invoice reminders.');
        } else if (q.id === 3) {
          dynamicRecommendations.push('Conduct weekly cash-out reviews to prune redundant software subscriptions and fix leakage.');
        } else if (q.id === 4) {
          dynamicRecommendations.push('Leverage the AI Marketing Suite to generate 3 multi-platform social sequences every Monday.');
        } else if (q.id === 5) {
          dynamicRecommendations.push('Design a high-converting PDF Lead Magnet using BizPilot Document suite to drive inbound emails.');
        } else if (q.id === 6) {
          dynamicRecommendations.push('Write a fully custom, emotionally resonant Brand Story defining your precise category difference.');
        } else if (q.id === 7) {
          dynamicRecommendations.push('Implement a policy where NO client project kicks off without a signed mutual NDA and service contract.');
        } else if (q.id === 8) {
          dynamicRecommendations.push('Integrate automated real-time sales tax estimates to avoid year-end compliance scrambles.');
        } else if (q.id === 9) {
          dynamicRecommendations.push('Activate full 256-bit database encryption and schedule weekly offline security backups.');
        } else if (q.id === 10) {
          dynamicRecommendations.push('Write SOP checklists for client onboarding and invoice processing so these tasks are easily delegable.');
        } else if (q.id === 11) {
          dynamicRecommendations.push('Set up server webhook triggers to auto-sync invoicing data with your core customer CRM.');
        } else if (q.id === 12) {
          dynamicRecommendations.push('Draft a strategic 12-month organizational plan with defined hiring triggers linked to monthly revenue.');
        }
      }
    });

    const calculatedGlobal = Math.round((totalPoints / 120) * 100);
    
    // Calculate percentages for each pillar
    const calculatedPillars: Record<string, number> = {};
    Object.keys(pillarPoints).forEach(p => {
      calculatedPillars[p] = Math.round((pillarPoints[p] / 30) * 100);
    });

    // Assess risk profile
    let calculatedRisk = 'Moderate Risk';
    if (calculatedGlobal >= 80) {
      calculatedRisk = 'Low Risk (Robust Foundation)';
    } else if (calculatedGlobal < 50) {
      calculatedRisk = 'High Risk (Critical Vulnerabilities)';
    }

    setGlobalScore(calculatedGlobal);
    setPillarScores(calculatedPillars);
    setStrengths(detectedStrengths);
    setWeaknesses(detectedWeaknesses);
    setRiskLevel(calculatedRisk);
    setRecommendations(dynamicRecommendations.slice(0, 4));
    setOpportunities(dynamicOpportunities.length > 0 ? dynamicOpportunities : ['Optimize operational tool stack to automate lead-capture sequences.']);
    
    setIsCalculated(true);
    showToast('success', `Business Health Score calculated: ${calculatedGlobal}%`, 'Audit Complete');
    
    // Scroll smoothly to results view
    setTimeout(() => {
      const el = document.getElementById('audit-results-panel');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Call Gemini Roadmap generator
  const handleGenerateRoadmap = async () => {
    if (!isCalculated) return;
    setIsGeneratingRoadmap(true);
    setRoadmapText('');

    try {
      const response = await fetch('/api/generate-health-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType,
          globalScore,
          answers: ASSESSMENT_QUESTIONS.map(q => ({
            pillar: q.pillar,
            question: q.title,
            score: answers[q.id],
            response: q.options.find(o => o.points === answers[q.id])?.label
          })),
          strengths,
          weaknesses,
          riskLevel,
          recommendations,
          opportunities
        })
      });

      const data = await handleApiResponse(response);
      setRoadmapText(data.text);
      showToast('success', 'Personalized strategic roadmap has been generated successfully!', 'Roadmap Compiled');
      
      // Auto save roadmap to user cloud documents
      if (session) {
        saveRoadmapToCloud(data.text);
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Roadmap compilation failed. Please try again.', 'Generation Failed');
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Firestore save
  const saveRoadmapToCloud = async (text: string) => {
    if (!session || !auth.currentUser) return;
    const path = `users/${session.uid}/documents`;
    try {
      const docRef = await addDoc(collection(db, path), {
        title: `Strategic Health Audit Roadmap (${globalScore}%)`,
        category: 'plan',
        content: text,
        createdAt: new Date().toISOString(),
        details: `Business Health Score: ${globalScore}% • Risk: ${riskLevel} • Generated for ${businessType}`,
        size: `${Math.round(text.length / 1024 * 10) / 10} KB`
      });
      setRecentSavedId(docRef.id);
      showToast('success', 'Strategic roadmap automatically synced to your Cloud History.', 'Saved');
    } catch (e: any) {
      console.error('Firestore save failure:', e);
      if (e?.code === 'permission-denied' || String(e?.message || e).includes('Missing or insufficient permissions')) {
        handleFirestoreError(e, OperationType.CREATE, path);
      }
    }
  };

  const handleDownloadPDF = () => {
    if (!isCalculated) return;
    
    const docPdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 20;
    const pageWidth = docPdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    let y = 25;

    // Premium Navy header
    docPdf.setFillColor(30, 41, 59); // slate-800
    docPdf.rect(0, 0, pageWidth, 42, 'F');

    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('Helvetica', 'bold');
    docPdf.setFontSize(18);
    docPdf.text('BIZPILOT AI - COMPREHENSIVE HEALTH REPORT', margin, 18);

    docPdf.setFont('Helvetica', 'normal');
    docPdf.setFontSize(9);
    docPdf.text(`Company Entity: ${businessType.toUpperCase()}`, margin, 26);
    docPdf.text(`Calculated Score: ${globalScore}/100 | Risk Factor: ${riskLevel}`, margin, 31);
    docPdf.text(`Report Compiled: ${new Date().toLocaleDateString()}`, margin, 36);

    y = 52;

    docPdf.setFont('Helvetica', 'bold');
    docPdf.setFontSize(12);
    docPdf.setTextColor(15, 23, 42); // slate-900
    docPdf.text('PILLAR SCORECARD BREAKDOWN', margin, y);
    y += 8;

    docPdf.setFont('Helvetica', 'normal');
    docPdf.setFontSize(10);
    docPdf.setTextColor(51, 65, 85); // slate-700
    
    Object.keys(pillarScores).forEach(pillar => {
      const name = PILLARS[pillar as keyof typeof PILLARS]?.name || pillar;
      docPdf.text(`• ${name}: ${pillarScores[pillar]}%`, margin + 5, y);
      y += 6.5;
    });

    y += 4;
    docPdf.setFont('Helvetica', 'bold');
    docPdf.setFontSize(12);
    docPdf.setTextColor(15, 23, 42);
    docPdf.text('IDENTIFIED CRITICAL WEAKNESSES', margin, y);
    y += 8;

    docPdf.setFont('Helvetica', 'normal');
    docPdf.setFontSize(10);
    docPdf.setTextColor(51, 65, 85);
    weaknesses.forEach(w => {
      if (y > docPdf.internal.pageSize.getHeight() - margin) {
        docPdf.addPage();
        y = 20;
      }
      docPdf.text(`- ${w}`, margin + 5, y);
      y += 6.5;
    });

    y += 4;
    docPdf.setFont('Helvetica', 'bold');
    docPdf.setFontSize(12);
    docPdf.setTextColor(15, 23, 42);
    docPdf.text('CORE STRATEGIC RECOMMENDATIONS', margin, y);
    y += 8;

    docPdf.setFont('Helvetica', 'normal');
    docPdf.setFontSize(10);
    docPdf.setTextColor(51, 65, 85);
    recommendations.forEach(r => {
      const splitLines = docPdf.splitTextToSize(`• ${r}`, contentWidth);
      splitLines.forEach((line: string) => {
        if (y > docPdf.internal.pageSize.getHeight() - margin) {
          docPdf.addPage();
          y = 20;
        }
        docPdf.text(line, margin, y);
        y += 6.5;
      });
    });

    if (roadmapText) {
      docPdf.addPage();
      y = 25;
      
      docPdf.setFillColor(30, 41, 59);
      docPdf.rect(0, 0, pageWidth, 20, 'F');
      
      docPdf.setTextColor(255, 255, 255);
      docPdf.setFont('Helvetica', 'bold');
      docPdf.setFontSize(14);
      docPdf.text('PERSONALIZED BUSINESS IMPROVEMENT ROADMAP', margin, 13);
      
      y = 35;
      docPdf.setTextColor(51, 65, 85);
      
      const roadmapLines = roadmapText.split('\n');
      roadmapLines.forEach(line => {
        const cleaned = line.replace(/#+/g, '').replace(/\*\*/g, '').trim();
        if (cleaned === '') {
          y += 5;
          return;
        }

        const isHeader = line.startsWith('#');
        if (isHeader) {
          docPdf.setFont('Helvetica', 'bold');
          docPdf.setFontSize(11);
          docPdf.setTextColor(15, 23, 42);
          y += 3;
        } else {
          docPdf.setFont('Helvetica', 'normal');
          docPdf.setFontSize(9.5);
          docPdf.setTextColor(51, 65, 85);
        }

        const split = docPdf.splitTextToSize(cleaned, contentWidth);
        split.forEach((sLine: string) => {
          if (y > docPdf.internal.pageSize.getHeight() - margin) {
            docPdf.addPage();
            y = 20;
          }
          docPdf.text(sLine, margin, y);
          y += 5.5;
        });

        if (isHeader) y += 1.5;
      });
    }

    docPdf.setFont('Helvetica', 'italic');
    docPdf.setFontSize(8);
    docPdf.setTextColor(148, 163, 184);
    docPdf.text('Generated with BizPilot AI Business Audit - Confidential and Proprietary.', margin, docPdf.internal.pageSize.getHeight() - 10);

    docPdf.save(`bizpilot-health-report-${globalScore}.pdf`);
    showToast('success', 'PDF compiled and exported successfully.', 'Download Dispatched');
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setIsCalculated(false);
    setRoadmapText('');
    setRecentSavedId(null);
    showToast('info', 'Assessment reset. You can restart the questionnaire.', 'Reset');
  };

  // Get status metadata
  const getStatusMeta = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-50 border-emerald-100', barColor: 'bg-emerald-500' };
    if (score >= 50) return { label: 'Satisfactory', color: 'text-amber-700 bg-amber-50 border-amber-100', barColor: 'bg-amber-500' };
    return { label: 'High Risk / Critical', color: 'text-rose-700 bg-rose-50 border-rose-100', barColor: 'bg-rose-500' };
  };

  const statusMeta = getStatusMeta(globalScore);
  const activeQuestion = ASSESSMENT_QUESTIONS[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / ASSESSMENT_QUESTIONS.length) * 100);

  return (
    <div className="space-y-8 font-sans select-none animate-fade-in pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 rounded-full backdrop-blur-md text-[10px] font-bold tracking-widest text-indigo-200 uppercase border border-white/5 transition-colors">
            <Activity className="h-3 w-3 animate-pulse text-indigo-400" />
            Diagnostic Audit Core
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight leading-tight">
            Business Health Score & Roadmap
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Evaluate your enterprise across 12 high-impact regulatory, financial, operational, and growth markers to calculate a transparent weighted score and compile a customized improvement roadmap.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Dynamic Assessment Wizard (Takes 5/12) */}
        <div className="lg:col-span-5 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-display font-black text-sm text-slate-800 tracking-tight flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-blue-600" />
              12-Step Assessment Wizard
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">
              Complete each diagnostic question. Results will form your custom core report.
            </p>
          </div>

          {/* Business Entity Name config */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-mono">
              Business Entity / Trade Name
            </label>
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g. Acme Agency LLC, Pioneer Retail Hub"
              className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold"
            />
          </div>

          {/* Wizard step panel */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase font-mono">
              <span>Question {currentStep + 1} of {ASSESSMENT_QUESTIONS.length}</span>
              <span className="text-blue-600">{progressPercent}% Completed</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${progressPercent}%` }} 
                className="bg-blue-600 h-full rounded-full transition-all duration-300" 
              />
            </div>

            {/* Current Active Question Display */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-3">
              <div className="flex items-center gap-1.5">
                <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md font-mono ${PILLARS[activeQuestion.pillar].color}`}>
                  {PILLARS[activeQuestion.pillar].name}
                </span>
              </div>
              <h4 className="font-display font-black text-xs text-slate-800 leading-snug">
                {activeQuestion.title}
              </h4>
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                {activeQuestion.description}
              </p>
            </div>

            {/* Answer Selection Grid (Standard 4 Options) */}
            <div className="space-y-2">
              {activeQuestion.options.map((opt) => {
                const isSelected = answers[activeQuestion.id] === opt.points;
                return (
                  <button
                    key={opt.points}
                    onClick={() => handleSelectOption(activeQuestion.id, opt.points)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex justify-between items-start gap-3 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-100' 
                        : 'border-gray-200/70 hover:border-gray-300 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-[10px] font-bold block ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[9.5px] text-gray-400 font-medium leading-relaxed block">
                        {opt.detail}
                      </span>
                    </div>
                    <span className={`text-[9.5px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      +{opt.points}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-[10px] font-bold text-gray-500 flex items-center gap-1 transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>

              {currentStep === ASSESSMENT_QUESTIONS.length - 1 ? (
                <button
                  onClick={calculateAuditResults}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
                >
                  <Award className="h-3.5 w-3.5" />
                  Compile Score
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-[10px] font-bold text-gray-500 flex items-center gap-1 transition-all cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Score Card Summary & Strategic Roadmap (Takes 7/12) */}
        <div id="audit-results-panel" className="lg:col-span-7 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-6 min-h-[500px]">
          {isCalculated ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-display font-black text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Interactive Diagnostic Audit Complete
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    Calculated for: <span className="text-gray-700 font-bold font-mono">{businessType}</span>
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleDownloadPDF}
                    className="p-1.5 bg-gray-50 hover:bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-150 transition-colors cursor-pointer"
                    title="Export Report PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-1.5 bg-gray-50 hover:bg-rose-50 rounded-lg text-rose-500 border border-gray-150 transition-colors cursor-pointer"
                    title="Reset Audit Questionnaire"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Score Visual Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-gray-150/80 items-center">
                <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-3">Enterprise Health Score</p>
                  
                  {/* Gauge Ring */}
                  <div className="relative h-28 w-28 flex items-center justify-center bg-white rounded-full shadow-xs border border-gray-100">
                    <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        className="stroke-gray-100 stroke-6 fill-none"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        style={{ strokeDasharray: `${2 * Math.PI * 48}`, strokeDashoffset: `${2 * Math.PI * 48 * (1 - globalScore / 100)}` }}
                        className="stroke-indigo-600 stroke-6 fill-none transition-all duration-700 stroke-linecap-round"
                      />
                    </svg>
                    <div className="text-center z-10">
                      <span className="font-display font-black text-2xl text-slate-800 tracking-tight">{globalScore}</span>
                      <span className="text-[10px] text-gray-400 block font-semibold">/ 100</span>
                    </div>
                  </div>

                  <div className={`mt-3.5 px-3 py-0.5 rounded-full border text-[10px] font-bold ${statusMeta.color}`}>
                    Risk: {riskLevel}
                  </div>
                </div>

                {/* Score breakdown per category */}
                <div className="space-y-3 border-t md:border-t-0 md:border-l border-gray-200/85 pt-3 md:pt-0 md:pl-5">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Pillar Breakdown</h4>
                  
                  {Object.keys(pillarScores).map(p => {
                    const pct = pillarScores[p];
                    const pMeta = PILLARS[p as keyof typeof PILLARS];
                    return (
                      <div key={p} className="space-y-0.5">
                        <div className="flex justify-between text-[10px] font-bold text-gray-700">
                          <span>{pMeta?.name || p}</span>
                          <span className="font-mono">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-200/60 h-1.5 rounded-full overflow-hidden">
                          <div style={{ width: `${pct}%` }} className="bg-indigo-600 h-full rounded-full transition-all duration-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths and Weaknesses Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-1.5">
                  <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Identified Strengths
                  </h4>
                  {strengths.length > 0 ? (
                    <ul className="text-[10px] text-gray-600 leading-relaxed space-y-1 list-disc pl-3">
                      {strengths.slice(0, 3).map((st, idx) => <li key={idx}>{st}</li>)}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">No significant strengths identified yet. Keep optimizing.</p>
                  )}
                </div>

                <div className="p-3.5 bg-rose-50/20 border border-rose-100 rounded-xl space-y-1.5">
                  <h4 className="text-[10px] font-bold text-rose-800 uppercase tracking-wider font-mono flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    Identified Vulnerabilities
                  </h4>
                  {weaknesses.length > 0 ? (
                    <ul className="text-[10px] text-gray-600 leading-relaxed space-y-1 list-disc pl-3">
                      {weaknesses.slice(0, 3).map((wk, idx) => <li key={idx} className="text-rose-800/90">{wk}</li>)}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-emerald-600 italic">Excellent! No critical structural vulnerabilities detected.</p>
                  )}
                </div>
              </div>

              {/* Quick AI Recommendations Block */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Immediate Core Interventions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-white border border-gray-150 rounded-xl flex gap-2 items-start text-[10.5px] leading-relaxed text-gray-600">
                      <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roadmap Generation Action */}
              <div className="border-t border-gray-100 pt-5 text-center space-y-3">
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Need an Actionable 6-Month Plan?</h4>
                  <p className="text-[10.5px] text-gray-400 leading-relaxed">
                    Tap below to run the Gemini Executive Analyst and build a completely personalized business health improvement roadmap.
                  </p>
                </div>

                <button
                  onClick={handleGenerateRoadmap}
                  disabled={isGeneratingRoadmap}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingRoadmap ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Composing Roadmap...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                      Generate Personalized Roadmap
                    </>
                  )}
                </button>
              </div>

              {/* Roadmap Output */}
              {roadmapText && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 md:p-5 space-y-4 animate-fade-in select-text selection:bg-indigo-100">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                    <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-mono flex items-center gap-1.5 uppercase">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                      Strategic Business Roadmap
                    </span>
                    <button
                      onClick={handleDownloadPDF}
                      className="px-3 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-600 text-[10px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <FileDown className="h-3 w-3" />
                      Download PDF Report
                    </button>
                  </div>

                  <div className="prose prose-slate prose-xs max-w-none text-xs text-slate-700 leading-relaxed prose-p:my-2 prose-headings:font-display prose-headings:font-black prose-headings:text-slate-900">
                    <ReactMarkdown>{roadmapText}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 max-w-sm mx-auto h-full">
              <div className="h-12 w-12 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-gray-400 animate-pulse-slow" />
              </div>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                Health audit analysis scorecard will compile here.
              </p>
              <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                Please complete the 12-step questionnaire on the left to measure your organization's compliance risk, cash hygiene, and scalability rating.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
