/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Route =
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'dashboard'
  | 'ask-pilot'
  | 'business-plan'
  | 'quotation-gen'
  | 'invoice-gen'
  | 'marketing-suite'
  | 'email-writer'
  | 'name-gen'
  | 'health-score'
  | 'history'
  | 'pricing'
  | 'profile'
  | 'settings';

export interface UserProfile {
  name: string;
  email: string;
  businessName: string;
  industry: string;
  role: string;
  logoUrl?: string;
  onboardingCompleted: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  type: 'document' | 'ai' | 'finance' | 'marketing' | 'system';
  target: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'draft';
  paymentDetails?: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  validUntil: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  discount: number;
  total: number;
  status: 'approved' | 'pending' | 'expired' | 'draft';
}

export interface BusinessPlanSection {
  id: string;
  title: string;
  completed: boolean;
  content: string;
  placeholder: string;
}

export interface BusinessPlan {
  id: string;
  title: string;
  industry: string;
  sections: BusinessPlanSection[];
  createdAt: string;
  progress: number;
}

export interface MarketingCampaign {
  id: string;
  title: string;
  channel: 'social' | 'email' | 'ad' | 'seo';
  status: 'active' | 'scheduled' | 'paused' | 'draft';
  budget: number;
  roi: string;
  content: string;
  engagement: string;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  tone: 'professional' | 'persuasive' | 'casual' | 'assertive';
  type: 'outreach' | 'followup' | 'support' | 'promotional';
}

export interface BusinessNameIdea {
  name: string;
  slogan: string;
  domainAvailable: boolean;
  domainName: string;
  suitabilityScore: number; // out of 100
  reasoning: string;
}

export interface HealthMetric {
  name: string;
  score: number; // 0 - 100
  category: 'financial' | 'operational' | 'market' | 'legal';
  status: 'excellent' | 'good' | 'fair' | 'critical';
  details: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'pilot';
  text: string;
  timestamp: string;
}
