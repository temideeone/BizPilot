/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  FileDown, 
  CheckSquare, 
  RefreshCw, 
  Calculator, 
  Sparkles, 
  Copy, 
  Save, 
  Check, 
  Undo 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { jsPDF } from 'jspdf';
import { handleApiResponse } from '../lib/api';

interface QuoteItem {
  id: string;
  desc: string;
  quantity: number;
  price: number;
}

export default function QuotationGenerator() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [clientName, setClientName] = useState('Acme Retail Ltd');
  const [clientEmail, setClientEmail] = useState('billing@acmeretail.com');
  const [quoteNo, setQuoteNo] = useState('QT-2026-009');
  const [validUntil, setValidUntil] = useState('2026-07-27');
  const [projectDescription, setProjectDescription] = useState('Brand identity package and complete operational ecommerce setup.');
  const [budgetConstraint, setBudgetConstraint] = useState('$2,500');

  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', desc: 'Brand Identity Strategy & Assets', quantity: 1, price: 1500 },
    { id: '2', desc: 'SME Operations Platform Setup', quantity: 2, price: 400 }
  ]);
  const [taxRate, setTaxRate] = useState(10);
  const [discount, setDiscount] = useState(100);
  const [status, setStatus] = useState<'draft' | 'approved'>('draft');

  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleAddItem = () => {
    const newId = (items.length + 1).toString() + '-' + Math.random().toString(36).substring(2, 5);
    setItems(prev => [
      ...prev,
      {
        id: newId,
        desc: 'Custom consulting service line',
        quantity: 1,
        price: 250
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      showToast('warning', 'Quotation must contain at least one line item.', 'Action Blocked');
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, key: keyof QuoteItem, value: string | number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [key]: value } : item
      )
    );
  };

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const taxAmount = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);

  // Gemini compilation integration
  const handleAiGenerate = async () => {
    if (!clientName.trim()) {
      showToast('error', 'Please input a Client Business Name.', 'Validation Error');
      return;
    }

    setIsCompiling(true);
    try {
      const response = await fetch('/api/generate-quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          description: projectDescription,
          budget: budgetConstraint
        })
      });

      const data = await handleApiResponse(response);
      
      // Update states reactively based on AI structured response
      if (data.clientName) setClientName(data.clientName);
      if (data.clientEmail) setClientEmail(data.clientEmail);
      if (data.quoteNo) setQuoteNo(data.quoteNo);
      if (data.validUntil) setValidUntil(data.validUntil);
      if (data.taxRate !== undefined) setTaxRate(data.taxRate);
      if (data.discount !== undefined) setDiscount(data.discount);
      
      if (data.items && Array.isArray(data.items)) {
        const mappedItems = data.items.map((it: any, idx: number) => ({
          id: (idx + 1).toString() + '-' + Math.random().toString(36).substring(2, 5),
          desc: it.desc || 'Service Item',
          quantity: parseInt(it.quantity) || 1,
          price: parseFloat(it.price) || 0
        }));
        setItems(mappedItems);
      }

      showToast('success', 'Quotation compiled and structured by Gemini AI!', 'Model Compiled');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Check your system secret keys.', 'Compilation Failed');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCopyText = () => {
    const itemsText = items.map(it => `* ${it.desc} (Qty: ${it.quantity} @ $${it.price}/ea) - Total: $${(it.quantity * it.price).toFixed(2)}`).join('\n');
    const quoteSummary = `=== QUOTATION ${quoteNo} ===\nPrepared For: ${clientName} (${clientEmail})\nValid Until: ${validUntil}\n\nLine Items:\n${itemsText}\n\nSubtotal: $${subtotal.toFixed(2)}\nTax (${taxRate}%): $${taxAmount.toFixed(2)}\nDiscount: -$${discount.toFixed(2)}\nGrand Total: $${grandTotal.toFixed(2)}\n=========================`;
    
    navigator.clipboard.writeText(quoteSummary);
    setIsCopied(true);
    showToast('success', 'Quotation summary text copied to clipboard.', 'Copied');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToDb = async () => {
    setIsSaving(true);
    const docId = 'quote-' + Math.random().toString(36).substring(2, 9);
    
    const itemsText = items.map(it => `* ${it.desc} (Qty: ${it.quantity} @ $${it.price}/ea) - Total: $${(it.quantity * it.price).toFixed(2)}`).join('\n');
    const fullText = `=== QUOTATION ${quoteNo} ===\nClient: ${clientName}\nClient Email: ${clientEmail}\nValid Until: ${validUntil}\n\nLine Items:\n${itemsText}\n\nSubtotal: $${subtotal.toFixed(2)}\nTax (${taxRate}%): $${taxAmount.toFixed(2)}\nDiscount: -$${discount.toFixed(2)}\nGrand Total: $${grandTotal.toFixed(2)}`;

    const payload = {
      id: docId,
      title: `Quotation ${quoteNo} - ${clientName}`,
      category: 'marketing' as const, // Categorized under generic marketing / docs
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      details: fullText,
      size: `${Math.ceil(fullText.length / 1024)} KB`
    };

    if (user && auth.currentUser) {
      const path = `users/${user.id}/documents/${docId}`;
      try {
        const docRef = doc(db, 'users', user.id, 'documents', docId);
        await setDoc(docRef, payload);
        showToast('success', 'Quotation estimate saved to your Document History!', 'Saved');
      } catch (err: any) {
        console.error(err);
        if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        showToast('error', 'Firestore connection failed.', 'Save Error');
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
      currentDocs.unshift(payload);
      localStorage.setItem('bizpilot_documents', JSON.stringify(currentDocs));
      showToast('success', 'Quotation saved locally!', 'Saved');
    }
    setIsSaving(false);
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.text("QUOTATION ESTIMATE", 15, 25);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Quote No: ${quoteNo}`, 15, 32);
      doc.text(`Valid Until: ${validUntil}`, 15, 37);
      
      // Company Info (Right-aligned)
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");
      doc.text("BizPilot AI Inc.", 140, 25);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("3000 Ingress Row", 140, 30);
      doc.text("billing@bizpilot.ai", 140, 35);
      
      doc.setDrawColor(220, 220, 220);
      doc.line(15, 42, 195, 42);
      
      // Client Details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("PREPARED FOR:", 15, 52);
      doc.setFont("helvetica", "normal");
      doc.text(clientName, 15, 57);
      doc.text(clientEmail, 15, 62);
      
      // Table Header
      doc.setFillColor(245, 247, 250);
      doc.rect(15, 72, 180, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Description", 18, 77);
      doc.text("Qty", 120, 77);
      doc.text("Price ($)", 145, 77);
      doc.text("Total ($)", 175, 77);
      
      doc.line(15, 80, 195, 80);
      
      let y = 86;
      doc.setFont("helvetica", "normal");
      items.forEach((item) => {
        if (y > 270) {
          doc.addPage();
          y = 25;
        }
        // text wrapping for description if long
        const descText = doc.splitTextToSize(item.desc, 90);
        doc.text(descText, 18, y);
        doc.text(item.quantity.toString(), 122, y);
        doc.text(item.price.toFixed(2), 147, y);
        doc.text((item.quantity * item.price).toFixed(2), 177, y);
        y += 8 * descText.length;
      });
      
      doc.line(15, y - 4, 195, y - 4);
      
      if (y > 240) {
        doc.addPage();
        y = 25;
      }

      // Summary calculations
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", 135, y + 4);
      doc.text(`$${subtotal.toFixed(2)}`, 175, y + 4);
      
      doc.text(`Tax (${taxRate}%):`, 135, y + 10);
      doc.text(`$${taxAmount.toFixed(2)}`, 175, y + 10);
      
      doc.text("Discount:", 135, y + 16);
      doc.text(`-$${discount.toFixed(2)}`, 175, y + 16);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.text("Grand Total:", 135, y + 24);
      doc.text(`$${grandTotal.toFixed(2)}`, 175, y + 24);
      
      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Acceptance of this quotation implies compliance with standard corporate service metrics.", 15, y + 42);
      
      doc.save(`${quoteNo}_quotation.pdf`);
      showToast('success', 'Quotation PDF successfully saved to downloads.', 'PDF Dispatched');
    } catch (e: any) {
      console.error(e);
      showToast('error', 'PDF compiler suffered an error.', 'PDF Error');
    }
  };

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-10">
      
      {/* 1. AI COPILOT DESCRIPTIVE FORM BLOCK */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs space-y-4">
        <div className="border-b border-gray-100 pb-2 flex items-center gap-1.5">
          <Sparkles className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
          <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">AI Quotation Compilation Engine</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Project Brief / Service Requirements</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe the client's project in plain language... (e.g. 'Build a React Native app with 4 core views, standard payment portal and simple database setup')"
              className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 h-20 resize-none font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Approximate Budget (Optional)</label>
            <input
              type="text"
              value={budgetConstraint}
              onChange={(e) => setBudgetConstraint(e.target.value)}
              placeholder="e.g. $4000, market rates"
              className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-mono mb-2"
            />
            <button
              onClick={handleAiGenerate}
              disabled={isCompiling}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isCompiling ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Compiling estimate...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Quote with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. THREE-PANEL CORE SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Editor Block */}
        <div className="lg:col-span-3 space-y-5">
          {/* Core Fields */}
          <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">Interactive Form Sandbox</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono ${
                  status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Client Business Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Client Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Quotation Number</label>
                <input
                  type="text"
                  value={quoteNo}
                  onChange={(e) => setQuoteNo(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Dynamic line items editor */}
          <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">Services & Pricing Breakdown</h3>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 border border-gray-150 rounded-xl">
                  <div className="flex-1 w-full">
                    <label className="block sm:hidden text-[9px] font-bold text-gray-400 uppercase">Description</label>
                    <input
                      type="text"
                      value={item.desc}
                      onChange={(e) => handleItemChange(item.id, 'desc', e.target.value)}
                      className="w-full text-xs px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-hidden focus:border-blue-400 text-gray-800 font-semibold"
                    />
                  </div>
                  <div className="w-20 shrink-0">
                    <label className="block sm:hidden text-[9px] font-bold text-gray-400 uppercase">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full text-xs px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-hidden focus:border-blue-400 text-center font-mono text-gray-800"
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <label className="block sm:hidden text-[9px] font-bold text-gray-400 uppercase">Rate ($)</label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-hidden focus:border-blue-400 text-right font-mono text-gray-800"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors self-end sm:self-center cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Tax rate / discount sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tax rate ({taxRate}%)</label>
                  <span className="text-xs font-mono font-semibold text-gray-600">${taxAmount.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flat Discount ($)</label>
                  <span className="text-xs font-mono font-semibold text-gray-600">-${discount.toFixed(2)}</span>
                </div>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-400 font-mono text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sheet Preview Column representing physical output */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-250 p-5 rounded-2xl shadow-sm text-gray-800 flex flex-col justify-between min-h-[460px]">
            <div>
              {/* Header info */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">Quotation Estimate</span>
                  <h4 className="text-sm font-black text-gray-900 mt-0.5">{quoteNo}</h4>
                </div>
                <div className="text-right">
                  <h5 className="text-xs font-bold text-gray-900">BizPilot AI Inc.</h5>
                  <p className="text-[9px] text-gray-400">3000 Ingress Row</p>
                  <p className="text-[9px] text-gray-400">support@bizpilot.ai</p>
                </div>
              </div>

              {/* Client address details */}
              <div className="grid grid-cols-2 gap-4 py-3 text-[11px]">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Prepared For:</span>
                  <p className="font-bold text-gray-900 mt-0.5 truncate">{clientName || 'Unnamed Client'}</p>
                  <p className="text-gray-500 truncate">{clientEmail || 'no-email@company.com'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Details:</span>
                  <p className="text-gray-500 mt-0.5">Date: Jun 27, 2026</p>
                  <p className="text-gray-500">Valid: {validUntil || 'Not Set'}</p>
                </div>
              </div>

              {/* Invoice lines visual list */}
              <div className="border-y border-gray-100 py-3 mt-1.5">
                <div className="flex text-[9px] font-bold text-gray-400 uppercase mb-2">
                  <span className="flex-1">Description</span>
                  <span className="w-8 text-center">Qty</span>
                  <span className="w-16 text-right">Rate</span>
                  <span className="w-16 text-right">Total</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {items.map((line, idx) => (
                    <div key={idx} className="flex text-[11px] text-gray-700">
                      <span className="flex-1 truncate font-medium">{line.desc}</span>
                      <span className="w-8 text-center font-mono">{line.quantity}</span>
                      <span className="w-16 text-right font-mono">${line.price.toFixed(2)}</span>
                      <span className="w-16 text-right font-mono">${(line.quantity * line.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand calculation rows */}
              <div className="pt-3 flex flex-col items-end text-[11px] space-y-1">
                <div className="flex justify-between w-40 text-gray-400">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-40 text-gray-400">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-mono font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-40 text-gray-400">
                  <span>Discount:</span>
                  <span className="font-mono font-medium">-${discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-40 text-xs font-black text-gray-900 border-t border-gray-100 pt-1.5">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer note inside preview */}
            <div className="border-t border-gray-100 pt-3 text-center">
              <p className="text-[9px] text-gray-400 leading-relaxed">
                Acceptance of this quotation estimate implies compliance with standard service coordinates.
              </p>
            </div>
          </div>

          {/* Floating actions below sheet */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatus('approved');
                showToast('success', 'Quotation approved successfully!', 'Status Updated');
              }}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-150 transition-colors cursor-pointer"
            >
              <CheckSquare className="h-4.5 w-4.5" />
              Approve Quotation
            </button>
            <button
              onClick={handleCopyText}
              className="p-2 border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-xl transition-colors cursor-pointer"
              title="Copy Quotation details to clipboard"
            >
              {isCopied ? <Check className="h-4.5 w-4.5 text-emerald-600" /> : <Copy className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={handleSaveToDb}
              disabled={isSaving}
              className="p-2 border border-gray-250 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors cursor-pointer"
              title="Store estimate in Cloud Documents"
            >
              {isSaving ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer animate-pulse-slow"
            >
              <FileDown className="h-4.5 w-4.5" />
              Download PDF
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
