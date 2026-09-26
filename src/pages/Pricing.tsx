/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Check, Info, HelpCircle, Star, Zap, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string>('pro');

  const handleCheckout = (planId: string) => {
    if (planId === 'free') {
      setActivePlan('free');
      return;
    }
    setIsCheckingOut(planId);
    setTimeout(() => {
      setIsCheckingOut(null);
      setActivePlan(planId);
      alert(`Subscription successfully configured! Your workspace has been updated to the ${planId.toUpperCase()} Tier.`);
    }, 1200);
  };

  const featureComparison = [
    { name: 'Branded Invoices & Estimates', free: '3 per month', pro: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'Investor-ready Business Plans', free: 'Basic Section Drafts', pro: 'Full Structure + AI Drafts', enterprise: 'Full + Custom Training' },
    { name: 'Social Post Generator (Marketing)', free: '10 generations / mo', pro: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'Business Name Engine', free: 'Yes', pro: 'Yes + Domain Search', enterprise: 'Yes + Strategic Auditing' },
    { name: 'Business Health Score Auditor', free: 'Scorecard Only', pro: 'Scorecard + Smart Recommendations', enterprise: 'Full Audits + CFO Consult' },
    { name: 'Connected API Access', free: 'No', pro: 'No', enterprise: 'Yes (10k requests / min)' },
  ];

  return (
    <div className="space-y-8 font-sans select-none animate-fade-in">
      {/* Header info */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight">Simple, High-Performance Pricing Plans</h2>
        <p className="text-xs text-gray-500 mt-2">Scale your early business without friction or complicated user licensing limits.</p>

        {/* Toggle billing */}
        <div className="mt-5 inline-flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              billingPeriod === 'monthly' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Monthly billing
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              billingPeriod === 'annual' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Annual billing
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plan Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Free Plan */}
        <div className={`bg-white border p-6 rounded-2xl shadow-xs flex flex-col justify-between transition-all ${
          activePlan === 'free' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200'
        }`}>
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-display font-bold text-base text-gray-900">Free Pilot</h3>
                <p className="text-xs text-gray-500 mt-0.5">Core utilities to test the platform.</p>
              </div>
              {activePlan === 'free' && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
              )}
            </div>
            <div className="mt-4">
              <span className="font-display font-black text-3xl text-gray-900">₦0</span>
              <span className="text-xs text-gray-400"> / month</span>
            </div>

            <div className="mt-6 space-y-3">
              {['Basic Invoice Builder (3/mo)', 'Business Name Generator', 'Basic AI Chat consults'].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleCheckout('free')}
            disabled={activePlan === 'free'}
            className="w-full mt-8 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
          >
            {activePlan === 'free' ? 'Currently Active' : 'Switch to Free'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`bg-white border-2 p-6 rounded-2xl shadow-md flex flex-col justify-between relative transition-all ${
          activePlan === 'pro' ? 'border-blue-600 ring-4 ring-blue-50' : 'border-gray-300'
        }`}>
          <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Most Popular
          </span>
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-display font-bold text-base text-gray-900">Pro Pilot</h3>
                <p className="text-xs text-gray-500 mt-0.5">Everything a growing business needs.</p>
              </div>
              {activePlan === 'pro' && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
              )}
            </div>
            <div className="mt-4">
              <span className="font-display font-black text-3xl text-gray-900">
                {billingPeriod === 'annual' ? '₦4,000' : '₦5,000'}
              </span>
              <span className="text-xs text-gray-400"> / month</span>
            </div>

            <div className="mt-6 space-y-3">
              {[
                'Unrestricted Invoices & Quotations',
                'High-priority Business Plans constructor',
                'Social Marketing & Email suite',
                'CFO Business Health scorecard auditor'
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleCheckout('pro')}
            disabled={activePlan === 'pro' || isCheckingOut === 'pro'}
            className="w-full mt-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors disabled:bg-blue-600 disabled:opacity-60 cursor-pointer"
          >
            {isCheckingOut === 'pro' ? (
              <span className="flex items-center justify-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Configuring plan...
              </span>
            ) : activePlan === 'pro' ? (
              'Currently Active'
            ) : (
              'Upgrade to Pro'
            )}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className={`bg-white border p-6 rounded-2xl shadow-xs flex flex-col justify-between transition-all ${
          activePlan === 'enterprise' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200'
        }`}>
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-display font-bold text-base text-gray-900">Enterprise</h3>
                <p className="text-xs text-gray-500 mt-0.5">Custom compliance & API integrations.</p>
              </div>
              {activePlan === 'enterprise' && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
              )}
            </div>
            <div className="mt-4">
              <span className="font-display font-black text-3xl text-gray-900">Custom</span>
            </div>

            <div className="mt-6 space-y-3">
              {['Dedicated developers API key', 'Custom dataset fine-tuning', 'Subdomain branding', 'Dedicated account manager consult'].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleCheckout('enterprise')}
            disabled={activePlan === 'enterprise' || isCheckingOut === 'enterprise'}
            className="w-full mt-8 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isCheckingOut === 'enterprise' ? (
              <span className="flex items-center justify-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Processing request...
              </span>
            ) : activePlan === 'enterprise' ? (
              'Currently Active'
            ) : (
              'Contact Sales Tier'
            )}
          </button>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs max-w-5xl mx-auto">
        <h4 className="font-display font-bold text-sm text-gray-800 tracking-tight mb-4">Deep Tool Specifications</h4>
        <div className="overflow-x-auto text-xs text-gray-500">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 font-bold text-gray-400 text-[10px] uppercase tracking-wider">
                <th className="py-2.5">Feature Column</th>
                <th className="py-2.5">Free Pilot</th>
                <th className="py-2.5">Pro Plan</th>
                <th className="py-2.5">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {featureComparison.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-3 font-semibold text-gray-800">{f.name}</td>
                  <td className="py-3">{f.free}</td>
                  <td className="py-3 font-bold text-blue-600">{f.pro}</td>
                  <td className="py-3 font-semibold text-gray-900">{f.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
