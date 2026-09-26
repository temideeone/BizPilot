/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  FileDown, 
  CheckCircle2, 
  RefreshCw, 
  Landmark, 
  Sparkles, 
  Copy, 
  Save, 
  Check 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { jsPDF } from 'jspdf';
import { handleApiResponse } from '../lib/api';

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export default function InvoiceGenerator() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [clientName, setClientName] = useState('Alpha Laboratories LLC');
  const [clientEmail, setClientEmail] = useState('billing@alphalabs.com');
  const [invoiceNo, setInvoiceNo] = useState('INV-2026-042');
  const [dueDate, setDueDate] = useState('2026-07-15');
  const [deliverables, setDeliverables] = useState('Phase 1 React layout design, 40 hours core engineering, and startup consulting support.');
  const [pricingGuidelines, setPricingGuidelines] = useState('$75/hr average standard rate');

  const [lines, setLines] = useState<InvoiceLine[]>([
    { id: '1', description: 'Full-Stack UI Development (Phase 1)', quantity: 40, rate: 75 },
    { id: '2', description: 'Product Design & Prototyping Workshop', quantity: 10, rate: 100 }
  ]);
  const [taxRate, setTaxRate] = useState(15);
  const [discount, setDiscount] = useState(250);
  const [paymentDetails, setPaymentDetails] = useState('Silicon Valley Bank • Routing: 121000248 • Account: •••••564');
  const [invoiceStatus, setInvoiceStatus] = useState<'unpaid' | 'paid'>('unpaid');

  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleAddLine = () => {
    const newId = (lines.length + 1).toString() + '-' + Math.random().toString(36).substring(2, 5);
    setLines(prev => [
      ...prev,
      {
        id: newId,
        description: 'Professional support service hour',
        quantity: 5,
        rate: 80
      }
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length === 1) {
      showToast('warning', 'Invoice must contain at least one line item.', 'Action Blocked');
      return;
    }
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const handleLineChange = (id: string, key: keyof InvoiceLine, val: string | number) => {
    setLines(prev =>
      prev.map(l => (l.id === id ? { ...l, [key]: val } : l))
    );
  };

  const subtotal = lines.reduce((acc, line) => acc + (line.quantity * line.rate), 0);
  const taxAmount = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);

  const handleAiGenerate = async () => {
    if (!clientName.trim()) {
      showToast('error', 'Please enter a Corporate Client Name.', 'Validation Error');
      return;
    }

    setIsCompiling(true);
    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          description: deliverables,
          pricing: pricingGuidelines
        })
      });

      const data = await handleApiResponse(response);

      // Update states reactively based on AI structured response
      if (data.clientName) setClientName(data.clientName);
      if (data.clientEmail) setClientEmail(data.clientEmail);
      if (data.invoiceNo) setInvoiceNo(data.invoiceNo);
      if (data.dueDate) setDueDate(data.dueDate);
      if (data.taxRate !== undefined) setTaxRate(data.taxRate);
      if (data.discount !== undefined) setDiscount(data.discount);
      if (data.paymentDetails) setPaymentDetails(data.paymentDetails);

      if (data.lines && Array.isArray(data.lines)) {
        const mappedLines = data.lines.map((ln: any, idx: number) => ({
          id: (idx + 1).toString() + '-' + Math.random().toString(36).substring(2, 5),
          description: ln.description || 'Deliverable Item',
          quantity: parseInt(ln.quantity) || 1,
          rate: parseFloat(ln.rate) || 0
        }));
        setLines(mappedLines);
      }

      showToast('success', 'Professional invoice compiled and structured by Gemini!', 'Invoice Compiled');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Error communicating with backend service.', 'AI Error');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCopyText = () => {
    const itemsText = lines.map(ln => `* ${ln.description} (${ln.quantity} units @ $${ln.rate}/unit) - Sum: $${(ln.quantity * ln.rate).toFixed(2)}`).join('\n');
    const invoiceSummary = `=== INVOICE ${invoiceNo} ===\nBill To: ${clientName} (${clientEmail})\nDue Date: ${dueDate}\n\nDeliverables:\n${itemsText}\n\nSubtotal: $${subtotal.toFixed(2)}\nSales Tax (${taxRate}%): $${taxAmount.toFixed(2)}\nDiscount: -$${discount.toFixed(2)}\nTotal Due: $${grandTotal.toFixed(2)}\nBank Transfer details: ${paymentDetails}\n=========================`;
    
    navigator.clipboard.writeText(invoiceSummary);
    setIsCopied(true);
    showToast('success', 'Invoice summary copied to clipboard.', 'Copied');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToDb = async () => {
    setIsSaving(true);
    const docId = 'invoice-' + Math.random().toString(36).substring(2, 9);
    
    const itemsText = lines.map(ln => `* ${ln.description} (${ln.quantity} @ $${ln.rate}) - Sum: $${(ln.quantity * ln.rate).toFixed(2)}`).join('\n');
    const fullText = `=== TAX INVOICE ${invoiceNo} ===\nClient Name: ${clientName}\nClient Email: ${clientEmail}\nDue Date: ${dueDate}\n\nLines:\n${itemsText}\n\nSubtotal: $${subtotal.toFixed(2)}\nTax (${taxRate}%): $${taxAmount.toFixed(2)}\nDiscount: -$${discount.toFixed(2)}\nTotal Due: $${grandTotal.toFixed(2)}\n\nBank Transfer Details:\n${paymentDetails}`;

    const payload = {
      id: docId,
      title: `Invoice ${invoiceNo} - ${clientName}`,
      category: 'invoice' as const,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      details: fullText,
      size: `${Math.ceil(fullText.length / 1024)} KB`
    };

    if (user && auth.currentUser) {
      const path = `users/${user.id}/documents/${docId}`;
      try {
        const docRef = doc(db, 'users', user.id, 'documents', docId);
        await setDoc(docRef, payload);
        showToast('success', 'Invoice details stored in cloud database!', 'Saved');
      } catch (err: any) {
        console.error(err);
        if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        showToast('error', 'Cloud database failed to sync.', 'Save Error');
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
      showToast('success', 'Invoice saved to local history!', 'Saved');
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
      doc.text("TAX INVOICE", 15, 25);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Invoice No: ${invoiceNo}`, 15, 32);
      doc.text(`Due Date: ${dueDate}`, 15, 37);
      
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
      doc.text("BILL TO:", 15, 52);
      doc.setFont("helvetica", "normal");
      doc.text(clientName, 15, 57);
      doc.text(clientEmail, 15, 62);
      
      // Table Header
      doc.setFillColor(245, 247, 250);
      doc.rect(15, 72, 180, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Task / Deliverable", 18, 77);
      doc.text("Units", 120, 77);
      doc.text("Rate ($)", 145, 77);
      doc.text("Total ($)", 175, 77);
      
      doc.line(15, 80, 195, 80);
      
      let y = 86;
      doc.setFont("helvetica", "normal");
      lines.forEach((line) => {
        if (y > 270) {
          doc.addPage();
          y = 25;
        }
        const descText = doc.splitTextToSize(line.description, 90);
        doc.text(descText, 18, y);
        doc.text(line.quantity.toString(), 122, y);
        doc.text(line.rate.toFixed(2), 147, y);
        doc.text((line.quantity * line.rate).toFixed(2), 177, y);
        y += 8 * descText.length;
      });
      
      doc.line(15, y - 4, 195, y - 4);
      
      if (y > 230) {
        doc.addPage();
        y = 25;
      }

      // Summary calculations
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", 135, y + 4);
      doc.text(`$${subtotal.toFixed(2)}`, 175, y + 4);
      
      doc.text(`Sales Tax (${taxRate}%):`, 135, y + 10);
      doc.text(`$${taxAmount.toFixed(2)}`, 175, y + 10);
      
      doc.text("Discount:", 135, y + 16);
      doc.text(`-$${discount.toFixed(2)}`, 175, y + 16);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.text("Total Due:", 135, y + 24);
      doc.text(`$${grandTotal.toFixed(2)}`, 175, y + 24);
      
      // Bank details block
      y += 35;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text("TRANSFER COORDINATES:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(paymentDetails || "No bank details provided.", 15, y + 5);
      
      doc.save(`${invoiceNo}_invoice.pdf`);
      showToast('success', 'Invoice PDF downloaded successfully!', 'PDF Generated');
    } catch (e: any) {
      console.error(e);
      showToast('error', 'PDF compilation error.', 'PDF Error');
    }
  };

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-10">
      
      {/* 1. AI DESCRIPTION FORM BLOCK */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs space-y-4">
        <div className="border-b border-gray-100 pb-2 flex items-center gap-1.5">
          <Sparkles className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
          <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">AI Invoice Generation Terminal</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Deliverables & Completed Work Milestones</label>
            <textarea
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="List completed tasks, deliverables, or hours worked... (e.g. 'Finished setting up AWS server, 25 hours backend design, customized Stripe webhook')"
              className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 h-20 resize-none font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pricing guidelines / Hourly Rate</label>
            <input
              type="text"
              value={pricingGuidelines}
              onChange={(e) => setPricingGuidelines(e.target.value)}
              placeholder="e.g. $80/hr, flat rate of $2000"
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
                  <span>Generating line items...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Invoice with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE GRID SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Editor Block */}
        <div className="lg:col-span-3 space-y-5">
          {/* Core fields */}
          <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">Interactive Form Sandbox</h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setInvoiceStatus(invoiceStatus === 'unpaid' ? 'paid' : 'unpaid');
                    showToast('success', `Status set to ${invoiceStatus === 'unpaid' ? 'Paid' : 'Unpaid'}.`, 'Invoice Status Updated');
                  }}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                    invoiceStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {invoiceStatus}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Corporate Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Billing Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
            </div>

            {/* Payment info input */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Corporate Bank Details / Payment Terms</label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder="Bank name, SWIFT, routing information..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Invoice items line editor */}
          <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight">Invoice Line Items</h3>
              <button
                onClick={handleAddLine}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Line
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line) => (
                <div key={line.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 border border-gray-150 rounded-xl">
                  <div className="flex-1 w-full">
                    <label className="block sm:hidden text-[9px] font-bold text-gray-400 uppercase">Item Description</label>
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                      className="w-full text-xs px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-hidden focus:border-blue-400 text-gray-800 font-semibold"
                    />
                  </div>
                  <div className="w-20 shrink-0">
                    <label className="block sm:hidden text-[9px] font-bold text-gray-400 uppercase">Qty / Hrs</label>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(line.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full text-xs px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-hidden focus:border-blue-400 text-center font-mono text-gray-800"
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <label className="block sm:hidden text-[9px] font-bold text-gray-400 uppercase">Rate ($)</label>
                    <input
                      type="number"
                      value={line.rate}
                      onChange={(e) => handleLineChange(line.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-2.5 py-1 bg-white border border-gray-200 rounded focus:outline-hidden focus:border-blue-400 text-right font-mono text-gray-800"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveLine(line.id)}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors self-end sm:self-center cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Tax slide & discount inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">V.A.T / Sales Tax ({taxRate}%)</label>
                  <span className="text-xs font-mono font-semibold text-gray-600">${taxAmount.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Corporate Discount ($)</label>
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

        {/* Sheet view column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-250 p-5 rounded-2xl shadow-sm text-gray-800 flex flex-col justify-between min-h-[460px]">
            <div>
              {/* Logo row */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">Tax Invoice</span>
                  <h4 className="text-sm font-black text-gray-900 mt-0.5">{invoiceNo}</h4>
                </div>
                <div className="text-right">
                  <h5 className="text-xs font-bold text-gray-900">BizPilot AI Inc.</h5>
                  <p className="text-[9px] text-gray-400">3000 Ingress Row</p>
                  <p className="text-[9px] text-gray-400">Dayo Samuel (Accountant)</p>
                </div>
              </div>

              {/* Bill To addresses */}
              <div className="grid grid-cols-2 gap-4 py-3 text-[11px]">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Bill To:</span>
                  <p className="font-bold text-gray-900 mt-0.5 truncate">{clientName || 'Client Name Placeholder'}</p>
                  <p className="text-gray-500 truncate">{clientEmail || 'billing@client.com'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Timeline:</span>
                  <p className="text-gray-500 mt-0.5">Issue Date: Jun 27, 2026</p>
                  <p className="text-gray-500 font-bold text-blue-600">Due Date: {dueDate || 'Not set'}</p>
                </div>
              </div>

              {/* Invoiced lines list */}
              <div className="border-y border-gray-100 py-3 mt-1.5">
                <div className="flex text-[9px] font-bold text-gray-400 uppercase mb-2">
                  <span className="flex-1">Task / Deliverable</span>
                  <span className="w-8 text-center">Hrs</span>
                  <span className="w-16 text-right">Rate</span>
                  <span className="w-16 text-right">Sum</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex text-[11px] text-gray-700">
                      <span className="flex-1 truncate font-medium">{line.description}</span>
                      <span className="w-8 text-center font-mono">{line.quantity}</span>
                      <span className="w-16 text-right font-mono">${line.rate.toFixed(2)}</span>
                      <span className="w-16 text-right font-mono">${(line.quantity * line.rate).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals table */}
              <div className="pt-3 flex flex-col items-end text-[11px] space-y-1">
                <div className="flex justify-between w-40 text-gray-400">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-40 text-gray-400">
                  <span>Sales Tax ({taxRate}%):</span>
                  <span className="font-mono font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-40 text-gray-400">
                  <span>Discount:</span>
                  <span className="font-mono font-medium">-${discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-40 text-xs font-black text-gray-900 border-t border-gray-100 pt-1.5">
                  <span>Total Due:</span>
                  <span className="font-mono text-blue-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Bank coordinates / payment note */}
            <div className="border-t border-gray-100 pt-3 text-[10px] text-gray-500 leading-normal">
              <span className="font-bold text-gray-700 block mb-0.5">Transfer coordinates:</span>
              <p className="font-mono bg-gray-50 p-1.5 rounded-lg border border-gray-150 text-[9px] truncate">
                {paymentDetails || 'No bank information provided.'}
              </p>
            </div>
          </div>

          {/* Floating buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setInvoiceStatus('paid');
                showToast('success', 'Invoice registered as fully paid!', 'Paid Status Saved');
              }}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-150 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-4.5 w-4.5" />
              Mark as Paid
            </button>
            <button
              onClick={handleCopyText}
              className="p-2 border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-xl transition-colors cursor-pointer"
              title="Copy Invoice details to clipboard"
            >
              {isCopied ? <Check className="h-4.5 w-4.5 text-emerald-600" /> : <Copy className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={handleSaveToDb}
              disabled={isSaving}
              className="p-2 border border-gray-250 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors cursor-pointer"
              title="Store invoice in Cloud Documents"
            >
              {isSaving ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer animate-pulse-slow"
            >
              <FileDown className="h-4.5 w-4.5" />
              Download Invoice
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
