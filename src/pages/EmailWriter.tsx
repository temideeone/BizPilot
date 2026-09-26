/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Mail, Sparkles, Copy, ExternalLink, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function EmailWriter() {
  const [recipient, setRecipient] = useState('Sarah Jenkins');
  const [company, setCompany] = useState('Apex Digital Corp');
  const [context, setContext] = useState('Gentle request for payment regarding Invoice #INV-2026-004');
  const [type, setType] = useState('payment-reminder');
  const [tone, setTone] = useState('professional');
  const [isComposing, setIsComposing] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCompose = () => {
    setIsComposing(true);

    setTimeout(() => {
      let emailSubject = '';
      let emailBody = '';

      if (type === 'payment-reminder') {
        emailSubject = `Invoice Payment Reminder: #INV-2026-004 for ${company}`;
        emailBody = `Hi ${recipient},\n\nI hope this email finds you well.\n\nThis is a gentle reminder that Invoice #INV-2026-004 regarding our recent operations consulting is currently outstanding. The total due is $1,250.00.\n\nYou can review your branded invoice copy and complete the transfer using the coordinates provided on the document.\n\nPlease let me know if you have any questions or require an updated statement.\n\nBest regards,\nDayo Samuel\nBizPilot Co.`;
      } else if (type === 'outreach') {
        emailSubject = `Operational Efficiency Audit Proposal: ${company}`;
        emailBody = `Hi ${recipient},\n\nI have been following ${company}'s impressive growth within the digital sector.\n\nAs founders scale, administrative overhead (such as manual invoicing, proposals, and business tracking) often starts consuming up to 15 hours a week. We specialize in deploying automated frameworks that trim this back to minutes.\n\nWould you be open to a brief, 10-minute introductory call next Tuesday at 2 PM to explore how we can optimize your operations?\n\nBest regards,\nDayo Samuel\nBizPilot Co.`;
      } else {
        emailSubject = `Proposal Follow-up: Partnering with ${company}`;
        emailBody = `Hi ${recipient},\n\nI am following up on the proposal we sent over last week regarding our custom operational suite.\n\nI understand your team is busy coordinating the Q3 roadmap, but I wanted to see if you had any preliminary feedback or questions regarding our pricing breakdown.\n\nLooking forward to hearing from you!\n\nBest regards,\nDayo Samuel\nBizPilot Co.`;
      }

      setSubject(emailSubject);
      setBody(emailBody);
      setIsComposing(false);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 font-sans select-none">
      {/* Parameters column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-display font-bold text-sm text-gray-800 tracking-tight border-b border-gray-100 pb-2">Email Configuration</h3>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Recipient Name</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Recipient Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Type / Template</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden text-gray-700 font-semibold"
            >
              <option value="payment-reminder">Invoice Payment Reminder</option>
              <option value="outreach">Cold Business Outreach</option>
              <option value="follow-up">Proposal Follow-up</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tone of Voice</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden text-gray-700 font-semibold"
            >
              <option value="professional">Polished & Professional</option>
              <option value="persuasive">Persuasive / Pitch</option>
              <option value="warm">Warm & Friendly</option>
              <option value="assertive">Urgent & Assertive</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Context & Core Details</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Provide a brief context or specific bullet points you want the email to address..."
              className="w-full h-24 p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 leading-normal resize-none"
            />
          </div>

          <button
            onClick={handleCompose}
            disabled={isComposing || !context.trim()}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 animate-pulse-slow" />
            Compose Custom Email
          </button>
        </div>
      </div>

      {/* Output Column (Takes 3/5 space) */}
      <div className="lg:col-span-3 space-y-4">
        {isComposing ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 animate-pulse-slow h-full min-h-[350px]">
            <div className="h-4 bg-gray-100 rounded-sm w-1/3" />
            <div className="space-y-2 pt-4">
              <div className="h-3 bg-gray-100 rounded-sm w-full" />
              <div className="h-3 bg-gray-100 rounded-sm w-5/6" />
              <div className="h-3 bg-gray-100 rounded-sm w-4/5" />
              <div className="h-3 bg-gray-100 rounded-sm w-full" />
            </div>
          </div>
        ) : body ? (
          <div className="bg-white border border-gray-250 rounded-2xl shadow-md p-6 space-y-4 flex flex-col justify-between min-h-[380px]">
            <div>
              {/* Fake Email Envelope Header */}
              <div className="border-b border-gray-100 pb-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-semibold text-gray-400 w-12 shrink-0">Subject:</span>
                  <span className="font-bold text-gray-900">{subject}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-semibold text-gray-400 w-12 shrink-0">To:</span>
                  <span className="text-gray-800">{recipient} &lt;{recipient.toLowerCase().replace(/\s+/, '')}@{company.toLowerCase().replace(/\s+/, '')}.com&gt;</span>
                </div>
              </div>

              {/* Email Body Rich Text */}
              <div className="pt-4 text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                {body}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-6">
              <span className="text-[10px] text-gray-400 font-mono">
                Tone: {tone.toUpperCase()}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Text
                    </>
                  )}
                </button>
                <button
                  onClick={() => alert('Simulating workspace API trigger: Email Draft dispatched to your connected Gmail!')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Send in Gmail
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-xs text-gray-400 h-full flex flex-col justify-center items-center gap-4">
            <Mail className="h-8 w-8 text-gray-300" />
            <p className="max-w-xs leading-relaxed">
              No active drafts generated yet. Complete the configuration forms on the left and hit **Compose Custom Email**!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
