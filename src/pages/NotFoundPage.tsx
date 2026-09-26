/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Route } from '../types';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface NotFoundProps {
  setCurrentRoute: (route: Route) => void;
}

export default function NotFoundPage({ setCurrentRoute }: NotFoundProps) {
  return (
    <div className="min-h-[60vh] flex flex-col justify-center items-center text-center font-sans select-none animate-fade-in p-6">
      <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100 mb-6 animate-pulse-slow">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h3 className="font-display font-black text-2xl text-gray-900 tracking-tight">404: Operational Link Broken</h3>
      <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
        The corporate sub-route you are trying to access does not exist or has been relocated by the workspace moderator.
      </p>

      <button
        onClick={() => setCurrentRoute('dashboard')}
        className="mt-8 flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard Overview
      </button>
    </div>
  );
}
