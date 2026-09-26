/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  FileText, 
  Receipt, 
  Mail, 
  Sparkles, 
  Trash2, 
  Filter, 
  FileDown, 
  Eye, 
  Megaphone, 
  RefreshCw, 
  Copy, 
  Edit3, 
  Save, 
  X, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  addDoc, 
  setDoc,
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';

interface SavedDocument {
  id: string;
  title: string;
  category: 'invoice' | 'plan' | 'marketing' | 'email' | 'name' | 'health_score' | 'all';
  content: string;
  createdAt: any;
  details: string;
  size: string;
}

export default function HistoryPage() {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingDoc, setEditingDoc] = useState<SavedDocument | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<SavedDocument | null>(null);

  useEffect(() => {
    if (session && auth.currentUser) {
      fetchDocuments();
    } else {
      // Load offline fallback documents if present in localStorage
      const savedDocs = localStorage.getItem('bizpilot_documents');
      if (savedDocs) {
        try {
          const parsed = JSON.parse(savedDocs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDocuments(parsed.map((d: any) => ({
              id: d.id || 'local-' + Math.random().toString(36).substring(2, 7),
              title: d.title || 'Local Document',
              category: d.category || 'marketing',
              content: d.details || d.content || '',
              createdAt: new Date(),
              details: d.details || 'Local storage copy',
              size: d.size || '2 KB'
            })));
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setIsLoading(false);
    }
  }, [session]);

  const fetchDocuments = async () => {
    if (!session || !auth.currentUser) return;
    setIsLoading(true);
    const path = `users/${session.uid}/documents`;
    try {
      const q = query(
        collection(db, path),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const docsList: SavedDocument[] = snap.docs.map(doc => {
        const data = doc.data();
        let cat = data.category || 'marketing';
        // Normalize categories
        if (cat === 'health_score' || data.title?.toLowerCase().includes('roadmap') || data.title?.toLowerCase().includes('health')) {
          cat = 'health_score';
        }
        
        return {
          id: doc.id,
          title: data.title || 'Untitled Document',
          category: cat,
          content: data.content || data.details || '',
          createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date(data.createdAt.seconds * 1000)) : new Date(),
          details: data.details || 'No details provided',
          size: data.size || `${Math.round(((data.content || data.details || '').length) / 1024 * 10) / 10} KB`
        };
      });
      setDocuments(docsList);
    } catch (err: any) {
      console.warn('History list fetch fallback with unindexed query: ', err);
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
      // Fallback query without orderBy to bypass index requirement if necessary
      try {
        const snap = await getDocs(collection(db, path));
        const docsList: SavedDocument[] = snap.docs.map(doc => {
          const data = doc.data();
          let cat = data.category || 'marketing';
          if (cat === 'health_score' || data.title?.toLowerCase().includes('roadmap') || data.title?.toLowerCase().includes('health')) {
            cat = 'health_score';
          }
          return {
            id: doc.id,
            title: data.title || 'Untitled Document',
            category: cat,
            content: data.content || data.details || '',
            createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date(data.createdAt.seconds * 1000)) : new Date(),
            details: data.details || 'No details provided',
            size: data.size || `${Math.round(((data.content || data.details || '').length) / 1024 * 10) / 10} KB`
          };
        });
        setDocuments(docsList);
      } catch (innerErr: any) {
        console.error('History fetch completely failed:', innerErr);
        if (innerErr?.code === 'permission-denied' || String(innerErr?.message || innerErr).includes('Missing or insufficient permissions')) {
          handleFirestoreError(innerErr, OperationType.LIST, path);
        }
        // Load offline default templates
        setDocuments([
          { 
            id: 'mock-1', 
            title: 'Invoice #INV-2026-004', 
            category: 'invoice', 
            content: 'Client: Acme Corp\nAmount Due: $1,250.00\nPayment Terms: Net-15', 
            createdAt: new Date(), 
            details: 'Acme Corp ($1,250.00) • Paid', 
            size: '2 KB' 
          },
          { 
            id: 'mock-2', 
            title: 'Strategic Growth Initiative Plan', 
            category: 'plan', 
            content: '# Executive Strategy Plan\n- Expand marketing outreach\n- Solidify cash reserves', 
            createdAt: new Date(), 
            details: 'Pioneer Consulting Plan • Comprehensive Strategic Draft', 
            size: '5 KB' 
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!session || !auth.currentUser) return;
    if (!confirm(`Are you sure you want to permanently delete "${title}" from your cloud history?`)) return;

    const path = `users/${session.uid}/documents/${id}`;
    try {
      await deleteDoc(doc(db, `users/${session.uid}/documents`, id));
      showToast('success', `"${title}" has been deleted.`, 'Document Removed');
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err: any) {
      console.error('Error deleting document:', err);
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      showToast('error', 'Failed to remove document from database.', 'Delete Failed');
    }
  };

  const handleDuplicate = async (document: SavedDocument) => {
    if (!session || !auth.currentUser) return;
    const path = `users/${session.uid}/documents`;
    const newTitle = `${document.title} (Copy)`;
    try {
      await addDoc(collection(db, path), {
        title: newTitle,
        category: document.category,
        content: document.content,
        createdAt: new Date().toISOString(),
        details: `${document.details} (Duplicated)`,
        size: document.size
      });

      showToast('success', `Duplicated as "${newTitle}" successfully!`, 'Cloned');
      fetchDocuments();
    } catch (err: any) {
      console.error('Error duplicating document:', err);
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      showToast('error', 'Could not clone document in database.', 'Duplicate Failed');
    }
  };

  const handleEditClick = (doc: SavedDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.content);
  };

  const handleSaveEdit = async () => {
    if (!session || !auth.currentUser || !editingDoc) return;
    setIsSavingEdit(true);
    const path = `users/${session.uid}/documents/${editingDoc.id}`;
    try {
      const docRef = doc(db, `users/${session.uid}/documents`, editingDoc.id);
      await setDoc(docRef, {
        title: editTitle,
        content: editContent,
        size: `${Math.round(editContent.length / 1024 * 10) / 10} KB`
      }, { merge: true });

      showToast('success', 'Document modifications synchronized.', 'Updated Successfully');
      setEditingDoc(null);
      fetchDocuments();
    } catch (err: any) {
      console.error('Failed to save edited document:', err);
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      showToast('error', 'Database synchronization failed.', 'Save Error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDownloadPDF = (document: SavedDocument) => {
    const docPdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 20;
    const pageWidth = docPdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    let y = 25;

    // Header graphics block
    docPdf.setFillColor(30, 41, 59); // slate-800
    docPdf.rect(0, 0, pageWidth, 35, 'F');

    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('Helvetica', 'bold');
    docPdf.setFontSize(14);
    docPdf.text(document.title.toUpperCase(), margin, 15);

    docPdf.setFont('Helvetica', 'normal');
    docPdf.setFontSize(9);
    docPdf.text(`Category: ${document.category.toUpperCase()}`, margin, 22);
    docPdf.text(`Exported on: ${new Date().toLocaleDateString()} | Size: ${document.size}`, margin, 27);

    y = 48;
    docPdf.setTextColor(51, 65, 85); // slate-700
    docPdf.setFontSize(10.5);

    const cleanLines = document.content.split('\n');
    cleanLines.forEach((line) => {
      const cleaned = line.replace(/#+/g, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
      if (cleaned === '' && line === '') {
        y += 5;
        return;
      }

      const isHeader = line.startsWith('#');
      if (isHeader) {
        docPdf.setFont('Helvetica', 'bold');
        docPdf.setFontSize(11.5);
        docPdf.setTextColor(15, 23, 42); // slate-900
        y += 2.5;
      } else {
        docPdf.setFont('Helvetica', 'normal');
        docPdf.setFontSize(10);
        docPdf.setTextColor(51, 65, 85); // slate-700
      }

      const split = docPdf.splitTextToSize(cleaned, contentWidth);
      split.forEach((sLine: string) => {
        if (y > docPdf.internal.pageSize.getHeight() - margin) {
          docPdf.addPage();
          y = 20;
        }
        docPdf.text(sLine, margin, y);
        y += 6;
      });

      if (isHeader) y += 1;
    });

    // Signature footer
    docPdf.setFont('Helvetica', 'italic');
    docPdf.setFontSize(8);
    docPdf.setTextColor(148, 163, 184);
    docPdf.text('Exported via BizPilot AI History Vault. All Rights Reserved.', margin, docPdf.internal.pageSize.getHeight() - 10);

    docPdf.save(`bizpilot-${document.category}-${document.id}.pdf`);
    showToast('success', 'PDF compiled and downloaded successfully.', 'PDF Exported');
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
                          doc.details.toLowerCase().includes(search.toLowerCase()) ||
                          doc.content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'all' || doc.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-5 font-sans select-none animate-fade-in space-y-6">
      
      {/* Search and Filters row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-2">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search saved documents & roadmaps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold"
          />
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'invoice', label: 'Invoices' },
            { id: 'plan', label: 'Plans & Proposals' },
            { id: 'marketing', label: 'Marketing Copy' },
            { id: 'email', label: 'Emails' },
            { id: 'name', label: 'Name Sheets' },
            { id: 'health_score', label: 'Health Audits' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-gray-400 font-mono flex flex-col items-center justify-center gap-2">
          <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
          Synchronizing Cloud Vault History...
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {filteredDocs.map((docItem) => (
            <div key={docItem.id} className="py-3.5 flex items-center justify-between group hover:bg-gray-50/60 px-3 rounded-xl transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9.5 w-9.5 rounded-xl flex items-center justify-center shrink-0 ${
                  docItem.category === 'invoice' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  docItem.category === 'plan' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                  docItem.category === 'marketing' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                  docItem.category === 'email' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                  docItem.category === 'health_score' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                  'bg-gray-50 text-gray-500 border border-gray-100'
                }`}>
                  {docItem.category === 'invoice' ? <Receipt className="h-4.5 w-4.5" /> :
                   docItem.category === 'plan' ? <FileText className="h-4.5 w-4.5" /> :
                   docItem.category === 'marketing' ? <Megaphone className="h-4.5 w-4.5" /> :
                   docItem.category === 'health_score' ? <TrendingUp className="h-4.5 w-4.5" /> :
                   <Mail className="h-4.5 w-4.5" />}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-600">{docItem.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-md font-medium" dangerouslySetInnerHTML={{ __html: docItem.details }} />
                </div>
              </div>

              {/* Date, Size and Actions */}
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 font-mono shrink-0">
                <span className="hidden md:inline">{docItem.createdAt.toLocaleDateString()}</span>
                <span className="hidden md:inline text-gray-200">|</span>
                <span className="hidden sm:inline">{docItem.size}</span>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPreviewDoc(docItem)}
                    className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
                    title="Preview Document Content"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(docItem)}
                    className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                    title="Edit Title & Content"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(docItem)}
                    className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                    title="Duplicate Document"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(docItem)}
                    className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
                    title="Download Report PDF"
                  >
                    <FileDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(docItem.id, docItem.title)}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                    title="Delete Permanently"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 text-xs text-gray-400">
          <History className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          No saved cloud files match your current search or filter. Try a different query!
        </div>
      )}

      {/* Edit Content Modal */}
      {editingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm select-text">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-150 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-display font-black text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
                <Edit3 className="h-4.5 w-4.5 text-blue-600" />
                Edit Saved Document Content
              </h4>
              <button 
                onClick={() => setEditingDoc(null)} 
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-mono">Document Title</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white text-gray-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-mono">Markdown Content Editor</label>
                <textarea 
                  rows={12}
                  value={editContent} 
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white text-gray-800 font-mono leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4">
              <button
                onClick={() => setEditingDoc(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-[10px] font-bold text-gray-500 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                {isSavingEdit ? 'Syncing...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Content Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm select-text">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-150 shadow-2xl animate-scale-in flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 shrink-0">
              <div>
                <h4 className="font-display font-black text-sm text-slate-800 tracking-tight">
                  {previewDoc.title}
                </h4>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                  Category: {previewDoc.category.toUpperCase()} | Created: {previewDoc.createdAt.toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable Markdown Viewer */}
            <div className="flex-1 overflow-y-auto pr-2 bg-slate-50/50 p-4 rounded-xl border border-gray-150/80 min-h-[250px]">
              <div className="prose prose-slate prose-xs max-w-none text-xs text-slate-700 leading-relaxed">
                <ReactMarkdown>{previewDoc.content}</ReactMarkdown>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 pt-4 shrink-0">
              <span className="text-[9px] font-mono text-gray-400 font-semibold uppercase">
                Size: {previewDoc.size}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(previewDoc.content);
                    showToast('success', 'Document content copied to clipboard.', 'Copied!');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                >
                  Copy Raw Text
                </button>
                <button
                  onClick={() => {
                    handleDownloadPDF(previewDoc);
                    setPreviewDoc(null);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
