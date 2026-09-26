/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building, 
  Landmark, 
  Mail, 
  Briefcase, 
  MapPin, 
  Save, 
  BadgeCheck, 
  Upload, 
  Trash2, 
  Users, 
  ShieldCheck,
  Building2,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export default function Profile() {
  const { user, session, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('Founder & Managing Director');

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Technology & SaaS');
  const [orgSize, setOrgSize] = useState('1-10 Employees');
  const [address, setAddress] = useState('3000 Ingress Row, Silicon Valley, CA');

  const [routing, setRouting] = useState('121000248');
  const [account, setAccount] = useState('11002495648');
  const [bankName, setBankName] = useState('Silicon Valley Bank');

  // New Upload states
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync state with current authenticated user and load remaining metadata from Firestore
  useEffect(() => {
    if (user) {
      setUserName(user.full_name || '');
      setUserEmail(user.email || '');
      setCompanyName(user.business_name || '');
      setAvatarBase64(user.avatar || null);
      
      // Load extended profile data directly from Firestore
      const loadProfileData = async () => {
        if (!auth.currentUser) return;
        const path = `users/${user.id}`;
        try {
          const docRef = doc(db, 'users', user.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.userRole) setUserRole(data.userRole);
            if (data.industry) setIndustry(data.industry);
            if (data.orgSize) setOrgSize(data.orgSize);
            if (data.address) setAddress(data.address);
            if (data.routing) setRouting(data.routing);
            if (data.account) setAccount(data.account);
            if (data.bankName) setBankName(data.bankName);
            if (data.businessLogo) setLogoBase64(data.businessLogo);
          }
        } catch (err: any) {
          console.error('Error loading extended profile fields:', err);
          if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
            handleFirestoreError(err, OperationType.GET, path);
          }
        }
      };

      loadProfileData();
    }
  }, [user]);

  // Client-side image compression to guarantee payloads fit within Firestore limits
  const compressImage = (file: File, maxWidth = 256, maxHeight = 256, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select an image file (PNG, JPG, WebP, etc.).'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed reading image file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed decoding image data.'));
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Avatar image with client-side compression
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Avatar file exceeds 10MB limit.', 'File Too Large');
      return;
    }

    try {
      showToast('info', 'Optimizing and resizing avatar...', 'Processing');
      const compressed = await compressImage(file, 256, 256, 0.75);
      setAvatarBase64(compressed);
      showToast('success', 'Profile avatar optimized & staged. Remember to save changes!', 'Avatar Ready');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed processing avatar.', 'Upload Error');
    }
  };

  // Handle Logo image with client-side compression
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Logo file exceeds 10MB limit.', 'File Too Large');
      return;
    }

    try {
      showToast('info', 'Optimizing and resizing corporate logo...', 'Processing');
      const compressed = await compressImage(file, 300, 150, 0.75);
      setLogoBase64(compressed);
      showToast('success', 'Business logo optimized & staged. Remember to save changes!', 'Logo Ready');
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed processing logo.', 'Upload Error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);

    try {
      if (avatarBase64 && avatarBase64.length > 65000) {
        showToast('error', 'Avatar image is too large. Please select a smaller photo.', 'Size Limit');
        setIsSaving(false);
        return;
      }
      if (logoBase64 && logoBase64.length > 65000) {
        showToast('error', 'Business logo is too large. Please select a smaller image.', 'Size Limit');
        setIsSaving(false);
        return;
      }

      // 1. Update Core Auth Profile
      const result = await updateProfile({
        full_name: userName,
        business_name: companyName,
        avatar: avatarBase64,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed updating profile.');
      }

      // 2. Sync all advanced metadata in Firestore
      if (user && auth.currentUser) {
        const path = `users/${user.id}`;
        try {
          const userRef = doc(db, 'users', user.id);
          await setDoc(userRef, {
            userRole,
            industry,
            orgSize,
            address,
            routing,
            account,
            bankName,
            businessLogo: logoBase64
          }, { merge: true });
        } catch (err: any) {
          if (err?.code === 'permission-denied' || String(err?.message || err).includes('Missing or insufficient permissions')) {
            handleFirestoreError(err, OperationType.UPDATE, path);
          }
          throw err;
        }
      }

      setIsSaving(false);
      setSuccess(true);
      showToast('success', 'Your corporate profile and business logo have been synchronized successfully.', 'Profile Sync');
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      console.error(err);
      setIsSaving(false);
      showToast('error', err.message || 'Could not synchronize profile metadata. Please check connection.', 'Sync Failed');
    }
  };

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-12">
      {/* Top Banner stats */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-5 justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar Area */}
          <div className="relative group">
            <div className="h-20 w-20 bg-blue-600 text-white font-black text-2xl rounded-full flex items-center justify-center border-4 border-blue-100 shadow-md overflow-hidden relative">
              {avatarBase64 ? (
                <img src={avatarBase64} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                userName ? userName.slice(0, 2).toUpperCase() : 'DS'
              )}
              
              {/* Overlay upload trigger */}
              <label htmlFor="avatar-file-input" className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[9.5px] font-bold">
                <Upload className="h-3.5 w-3.5 mr-0.5" />
                Change
              </label>
              <input 
                id="avatar-file-input" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarChange} 
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
              <h3 className="font-display font-black text-lg text-gray-900 tracking-tight">{userName || 'Dayo Samuel'}</h3>
              <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-100">
                <BadgeCheck className="h-3.5 w-3.5 text-blue-600" />
                Verified Pro Plan
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{userRole} at {companyName || 'Unregistered Enterprise'}</p>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Member Session: #{session?.uid ? session.uid.slice(0, 8).toUpperCase() : 'MEM-2026-9042'}</p>
          </div>
        </div>

        {/* Business Logo Section */}
        <div className="flex items-center gap-4 bg-slate-50 border border-gray-150 p-3.5 rounded-xl text-center md:text-left shrink-0">
          <div className="h-14 w-14 border border-gray-200 rounded-lg flex items-center justify-center bg-white relative overflow-hidden group">
            {logoBase64 ? (
              <img src={logoBase64} alt="Corporate Logo" className="h-full w-full object-contain p-1" />
            ) : (
              <Building2 className="h-6 w-6 text-slate-300" />
            )}
            <label htmlFor="logo-file-input" className="absolute inset-0 bg-slate-900/65 text-white text-[8px] font-bold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Upload className="h-3 w-3" />
              Upload
            </label>
            <input 
              id="logo-file-input" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleLogoChange} 
            />
          </div>
          <div>
            <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-widest font-mono">Corporate Brand Mark</span>
            <p className="text-[10.5px] text-gray-600 font-medium leading-normal">
              Used inside generated Invoices,<br />Quotations, and Roadmaps.
            </p>
          </div>
        </div>
      </div>

      {/* Main Forms Layout */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-2">
            <User className="h-4.5 w-4.5 text-blue-600" />
            <h4 className="font-display font-bold text-sm text-gray-800 tracking-tight">Personal Details</h4>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Member Name</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="email"
                  required
                  disabled
                  value={userEmail}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-100 border border-gray-200 rounded-xl text-gray-400 font-mono cursor-not-allowed select-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Corporate Job Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  required
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Corporate Profile details */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-2">
            <Building className="h-4.5 w-4.5 text-blue-600" />
            <h4 className="font-display font-bold text-sm text-gray-800 tracking-tight">Corporate Profile details</h4>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registered Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Industry sector</label>
                <input
                  type="text"
                  required
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Organization headcount</label>
              <select
                value={orgSize}
                onChange={(e) => setOrgSize(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden text-gray-700 font-semibold"
              >
                <option value="1-10 Employees">1-10 Employees (Micro Startup)</option>
                <option value="11-50 Employees">11-50 Employees (SME)</option>
                <option value="51-200 Employees">51-200 Employees (Mid-Market)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registered Corporate Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank transfer coordinates */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-2">
            <Landmark className="h-4.5 w-4.5 text-blue-600" />
            <h4 className="font-display font-bold text-sm text-gray-800 tracking-tight">Bank transfer coordinates (For Invoice templates)</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Recipient Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Routing / ABA Transit Code</label>
              <input
                type="text"
                value={routing}
                onChange={(e) => setRouting(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Account Number</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-mono"
              />
            </div>
          </div>

          {/* Form Actions footer */}
          <div className="flex justify-end items-center gap-4 border-t border-gray-100 pt-4 mt-6">
            {success && (
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded animate-fade-in">
                Profile updated successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Profile changes'}
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
