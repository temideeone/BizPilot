/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Bell, 
  Key, 
  Sparkles, 
  RefreshCw, 
  Save, 
  Check, 
  Moon, 
  Sun, 
  Lock, 
  Download, 
  AlertTriangle, 
  UserMinus, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export default function SettingsPage() {
  const { user, updatePassword, signOut } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'system' | 'keys' | 'notifications' | 'security' | 'account'>('system');
  
  // System Configs
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [taxPreset, setTaxPreset] = useState(10);
  const [darkMode, setDarkMode] = useState(false);

  // keys
  const [geminiKey, setGeminiKey] = useState('••••••••••••••••••••••••••••••••');
  const [stripeKey, setStripeKey] = useState('sk_test_••••••••••••••••••••••24');

  // notifications
  const [notifyInvoice, setNotifyInvoice] = useState(true);
  const [notifyWeeklyScore, setNotifyWeeklyScore] = useState(true);
  const [notifyAiTip, setNotifyAiTip] = useState(false);

  // Security (Password Change)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load Configurations from Firestore and local storage theme
  useEffect(() => {
    // Check local storage for dark mode
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);

    if (user && auth.currentUser) {
      const loadSettings = async () => {
        const path = `users/${user.id}`;
        try {
          const docRef = doc(db, 'users', user.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.currency) setCurrency(data.currency);
            if (data.timezone) setTimezone(data.timezone);
            if (data.taxPreset !== undefined) setTaxPreset(data.taxPreset);
            if (data.stripeKey) setStripeKey(data.stripeKey);
            if (data.notifyInvoice !== undefined) setNotifyInvoice(data.notifyInvoice);
            if (data.notifyWeeklyScore !== undefined) setNotifyWeeklyScore(data.notifyWeeklyScore);
            if (data.notifyAiTip !== undefined) setNotifyAiTip(data.notifyAiTip);
          }
        } catch (err: any) {
          console.error('Error loading user settings from Firestore:', err);
          if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
            handleFirestoreError(err, OperationType.GET, path);
          }
        }
      };
      loadSettings();
    }
  }, [user]);

  // Dark Mode toggle
  const handleToggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      showToast('success', 'Professional night-mode theme enabled.', 'Dark Theme Activated');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      showToast('info', 'Clean daylight-mode theme activated.', 'Light Theme Restored');
    }
  };

  // Persist settings
  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      if (user && auth.currentUser) {
        const path = `users/${user.id}`;
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, {
          currency,
          timezone,
          taxPreset,
          stripeKey,
          notifyInvoice,
          notifyWeeklyScore,
          notifyAiTip
        }, { merge: true });
      }

      setSaving(false);
      setSuccess(true);
      showToast('success', 'Configurations and notification thresholds persisted successfully.', 'Settings Synced');
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user?.id}`);
      }
      setSaving(false);
      showToast('error', 'Error syncing configurations with Firestore cloud.', 'Sync Error');
    }
  };

  // Change Password form handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      showToast('error', 'Please enter a valid new password.', 'Validation Failed');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Confirm password does not match new password.', 'Mismatch');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters.', 'Too Short');
      return;
    }

    setChangingPass(true);
    const res = await updatePassword(newPassword);
    setChangingPass(false);

    if (res.success) {
      setNewPassword('');
      setConfirmPassword('');
      showToast('success', 'Your account credentials have been updated successfully!', 'Security Updated');
    } else {
      showToast('error', res.error || 'Password update failed.', 'Security Error');
    }
  };

  // Account management: Export User Data (JSON format)
  const handleExportData = async () => {
    if (!user) return;
    try {
      showToast('info', 'Compiling and packing your user files...', 'Exporting');
      let docsList: any[] = [];
      if (auth.currentUser) {
        const path = `users/${user.id}/documents`;
        try {
          const docsRef = collection(db, path);
          const snap = await getDocs(docsRef);
          docsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (fetchErr: any) {
          if (fetchErr?.code === 'permission-denied' || String(fetchErr?.message || fetchErr).includes('Missing or insufficient permissions')) {
            handleFirestoreError(fetchErr, OperationType.LIST, path);
          }
        }
      }

      const exportObj = {
        exportedAt: new Date().toISOString(),
        profile: user,
        settings: { currency, timezone, taxPreset, stripeKey, notifyInvoice, notifyWeeklyScore, notifyAiTip },
        documents: docsList
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `bizpilot-profile-export-${user.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('success', 'Export package download dispatched.', 'Export Complete');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed compiling data export. Please try again.', 'Export Failed');
    }
  };

  // Reset/Delete account sandbox
  const handleDeleteAccount = async () => {
    if (!confirm('CRITICAL WARNING: This will permanently delete your user profile data and all generated documents from the Cloud Firestore database. This action is irreversible. Continue?')) {
      return;
    }

    if (!user) return;
    try {
      if (auth.currentUser) {
        const path = `users/${user.id}/documents`;
        try {
          const docsRef = collection(db, path);
          const snap = await getDocs(docsRef);
          for (const item of snap.docs) {
            await deleteDoc(doc(db, path, item.id));
          }
        } catch (deleteErr: any) {
          if (deleteErr?.code === 'permission-denied' || String(deleteErr?.message || deleteErr).includes('Missing or insufficient permissions')) {
            handleFirestoreError(deleteErr, OperationType.DELETE, path);
          }
        }
      }

      // 2. Clear credentials and sign out
      showToast('success', 'Wiped and cleared your sandbox credentials successfully. Logging out.', 'Workspace Wiped');
      setTimeout(() => {
        signOut();
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast('error', 'Wipe failed. Please check database permissions.', 'Error');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-5 font-sans select-none animate-fade-in space-y-6">
      
      {/* Tab selection row */}
      <div className="flex border-b border-gray-100 pb-4 mb-1 gap-2 overflow-x-auto">
        {[
          { id: 'system', label: 'System Configurations', icon: Settings },
          { id: 'keys', label: 'API Credentials', icon: Key },
          { id: 'notifications', label: 'Notifications Alerts', icon: Bell },
          { id: 'security', label: 'Password & Security', icon: Shield },
          { id: 'account', label: 'Account Management', icon: AlertTriangle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[280px] space-y-4">
        
        {/* System Config */}
        {activeTab === 'system' && (
          <div className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Workspace Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden text-gray-700 font-semibold"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="NGN">NGN (₦) - Nigerian Naira</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound Sterling</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Operational Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden text-gray-700 font-semibold"
                >
                  <option value="UTC">UTC / Greenwich Mean Time (Default)</option>
                  <option value="EST">EST - Eastern Standard Time</option>
                  <option value="PST">PST - Pacific Standard Time</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Standard Tax / V.A.T rate preset (%)</label>
              <input
                type="number"
                min="0"
                max="35"
                value={taxPreset}
                onChange={(e) => setTaxPreset(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-150 font-mono text-gray-800"
              />
            </div>

            {/* Dark mode switch */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-150">
              <div className="flex gap-2.5 items-center">
                {darkMode ? <Moon className="h-5 w-5 text-indigo-600 animate-pulse-slow" /> : <Sun className="h-5 w-5 text-amber-500" />}
                <div>
                  <h5 className="text-xs font-bold text-gray-800">Workspace Night Theme</h5>
                  <p className="text-[10px] text-gray-400 leading-normal">Reduce screen fatigue with an eye-friendly twilight slate canvas.</p>
                </div>
              </div>

              <button
                onClick={() => handleToggleDarkMode(!darkMode)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-hidden cursor-pointer ${
                  darkMode ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-200 ease-in-out ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* API keys */}
        {activeTab === 'keys' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 max-w-2xl">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-800">Injected Runtime Secrets</p>
                  <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                    BizPilot automatically uses the server-side environment `GEMINI_API_KEY` injected by Google AI Studio settings. To configure custom integrations, add third-party variables here.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 max-w-xl">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Google Gemini API key secret</label>
                <input
                  type="text"
                  disabled
                  value={geminiKey}
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl font-mono text-gray-500 select-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Stripe Private developer key (Simulation)</label>
                <input
                  type="text"
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-xl">
            <div className="flex items-start gap-3 p-1">
              <input
                type="checkbox"
                id="noti-invoice"
                checked={notifyInvoice}
                onChange={(e) => setNotifyInvoice(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <label htmlFor="noti-invoice" className="text-xs font-bold text-gray-800 cursor-pointer">Invoicing Dispatched Alerts</label>
                <p className="text-[10px] text-gray-400">Receive system receipts when invoices are created or paid by clients.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-1">
              <input
                type="checkbox"
                id="noti-score"
                checked={notifyWeeklyScore}
                onChange={(e) => setNotifyWeeklyScore(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <label htmlFor="noti-score" className="text-xs font-bold text-gray-800 cursor-pointer">Weekly Operational Health updates</label>
                <p className="text-[10px] text-gray-400">Get a weekly email detailing compliance scores and growth rate forecasts.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-1">
              <input
                type="checkbox"
                id="noti-tip"
                checked={notifyAiTip}
                onChange={(e) => setNotifyAiTip(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <label htmlFor="noti-tip" className="text-xs font-bold text-gray-800 cursor-pointer">Daily AI Tip Digests</label>
                <p className="text-[10px] text-gray-400">Receive strategic micro-tips from BizPilot AI directly in your inbox.</p>
              </div>
            </div>
          </div>
        )}

        {/* Security / Password Change */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex gap-2">
              <Lock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-slate-800">Change Authentication Password</h5>
                <p className="text-[10.5px] text-gray-400 leading-relaxed">Update your login password. Strong passwords contain letters, numbers, and at least 6 characters.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">New Secure Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Shield className="h-4 w-4" />
              {changingPass ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}

        {/* Account Management */}
        {activeTab === 'account' && (
          <div className="space-y-6 max-w-xl">
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/20">
              <div className="flex gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-amber-800">Advanced Account Control Panel</h5>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">
                    Export your custom files or reset/delete your cloud workspace sandbox data permanently. Please execute with high caution.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Export Button */}
              <div className="flex items-center justify-between p-3.5 border border-gray-150 rounded-xl hover:bg-gray-50/50">
                <div>
                  <h6 className="text-xs font-bold text-gray-800">Export All BizPilot Workspace Files</h6>
                  <p className="text-[10px] text-gray-400">Download a full JSON backup including your profile metadata and document history.</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export JSON
                </button>
              </div>

              {/* Reset Sandbox */}
              <div className="flex items-center justify-between p-3.5 border border-rose-100 rounded-xl bg-rose-50/10 hover:bg-rose-50/20">
                <div>
                  <h6 className="text-xs font-bold text-rose-800">Reset Cloud Workspace Database</h6>
                  <p className="text-[10px] text-gray-400">Permanently wipe all generated invoices, roadmaps, and marketing copy.</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                  Wipe Database
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer controls for activeTab 'system', 'keys', 'notifications' */}
      {(activeTab === 'system' || activeTab === 'keys' || activeTab === 'notifications') && (
        <div className="flex justify-end items-center gap-4 border-t border-gray-100 pt-4">
          {success && (
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1 animate-fade-in">
              <Check className="h-3.5 w-3.5" /> Configurations persisted successfully!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Persisting...' : 'Persist System Configurations'}
            <Save className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
