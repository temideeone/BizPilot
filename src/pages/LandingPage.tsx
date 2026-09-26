/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Route } from '../types';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  Mail,
  Shield,
  Zap,
  Check,
  ChevronDown,
  Building,
  Star,
  Users,
  Compass,
  FileText
} from 'lucide-react';

interface LandingPageProps {
  setCurrentRoute: (route: Route) => void;
}

export default function LandingPage({ setCurrentRoute }: LandingPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      icon: Sparkles,
      title: 'Ask Pilot AI Assistant',
      desc: 'Expert business consultancy inside a sleek chat panel. Draft proposals, brainstorm ideas, and analyze legal issues in seconds.'
    },
    {
      icon: FileText,
      title: 'Business Plan Builder',
      desc: 'Create highly professional, investor-ready business plans with auto-formatted sections, executive summaries, and market forecasts.'
    },
    {
      icon: Receipt,
      title: 'Quotation & Invoice Suite',
      desc: 'Generate, manage, and dispatch gorgeous, branded client estimates and invoices with auto-taxation and payment details built-in.'
    },
    {
      icon: Mail,
      title: 'AI Marketing & Social Suite',
      desc: 'Instantly compose converting social media copy, draft high-open-rate newsletters, and auto-generate newsletters with key templates.'
    },
    {
      icon: Compass,
      title: 'Business Name Generator',
      desc: 'Find unique, punchy, unregistered brand names along with matching domain names, slogan suggestions, and strategic rationales.'
    },
    {
      icon: TrendingUp,
      title: 'Business Health Auditor',
      desc: 'Conduct detailed operational and financial checks. Get a comprehensive scorecard, categorized insights, and real action items.'
    }
  ];

  const benefits = [
    {
      title: '10x Speed to Execution',
      desc: 'Draft comprehensive agreements, send client documents, and research markets in minutes rather than spending thousands of dollars on agency resources.',
      metric: '85%'
    },
    {
      title: 'Fully Compliant Outputs',
      desc: 'Every layout is designed with professional accounting guidelines and beautiful branding rules so you can confidently pitch clients.',
      metric: '100%'
    },
    {
      title: 'Absolute Cloud Security',
      desc: 'All enterprise-grade data structures and personal documentation is safely encrypted and kept confidential under private keys.',
      metric: 'AES-256'
    }
  ];

  const testimonials = [
    {
      text: "BizPilot completely changed how we handle our early agency. Generating a custom business plan and our initial quotations took less than 20 minutes.",
      author: "Marcus Chen",
      role: "CEO, Spark Agency",
      avatarBg: "bg-blue-100 text-blue-700"
    },
    {
      text: "The Business Health Auditor pointed out several critical licensing and financial metrics that we had overlooked. Truly a brilliant, intuitive SaaS tool.",
      author: "Sarah Jenkins",
      role: "Co-Founder, Peak Wellness",
      avatarBg: "bg-emerald-100 text-emerald-700"
    }
  ];

  const faqs = [
    {
      q: 'Do I need a credit card to get started?',
      a: 'Absolutely not. You can register for a Free Plan and test our core tools like the Business Name Generator and Invoice Suite without entering billing information.'
    },
    {
      q: 'Are the documents generated legally binding?',
      a: 'Our Business Plans, Quotations, and Invoices follow standard professional conventions. However, for specialized regional contracts, we suggest having an attorney inspect the final drafts.'
    },
    {
      q: 'Can I cancel or change plans anytime?',
      a: 'Yes, you can upgrade, downgrade, or cancel your active subscription directly from your Profile settings at any time.'
    },
    {
      q: 'How does the AI work under the hood?',
      a: 'BizPilot utilizes Gemini models customized with precise system instructions to ensure generated financial and executive texts represent premium business advisory standards.'
    }
  ];

  return (
    <div className="bg-white min-h-screen font-sans selection:bg-blue-500 selection:text-white">
      {/* Landing Navigation Header */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-gray-900">
              Biz<span className="text-blue-600">Pilot</span>
              <span className="text-xs font-mono font-medium ml-1 text-emerald-500">AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#benefits" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Benefits</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentRoute('login')}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={() => setCurrentRoute('register')}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg shadow-sm"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-radial from-blue-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Version Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/50 rounded-full text-blue-700 text-xs font-medium mb-6 animate-pulse-slow">
              <span className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
              <span>Announcing BizPilot AI v2.0 dashboard</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
              The premium <span className="text-blue-600 relative">AI Co-Pilot</span> for your business growth & operations
            </h1>

            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Automate business plans, compose proposals, build branded quotations and invoices, and audit your financial wellness in one integrated, high-performance suite.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => setCurrentRoute('register')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all group"
              >
                Launch your business with AI
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => setCurrentRoute('login')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all"
              >
                Explore Live Demo
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 md:gap-16 text-gray-500 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-blue-500" />
                <span>Trusted by 10,000+ Founders</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-emerald-500" />
                <span>GDPR & CCPA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                <span>4.9/5 Rating on G2</span>
              </div>
            </div>
          </div>

          {/* Visual Product Mockup Area */}
          <div className="mt-16 relative rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-2xl max-w-5xl mx-auto">
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs">
              <div className="bg-gray-100 h-9 px-4 flex items-center gap-1.5 border-b border-gray-200">
                <div className="h-3 w-3 bg-red-400 rounded-full" />
                <div className="h-3 w-3 bg-yellow-400 rounded-full" />
                <div className="h-3 w-3 bg-emerald-400 rounded-full" />
                <span className="text-[11px] font-mono text-gray-500 ml-4 select-none">bizpilot.ai/dashboard</span>
              </div>
              <div className="bg-white p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Visual Cards representing mock features */}
                <div className="border border-gray-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-gray-800">Business Growth</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2">Automated operational analytics</p>
                  <div className="h-2 bg-blue-100 rounded-full w-3/4 mb-1" />
                  <div className="h-2 bg-blue-100 rounded-full w-1/2" />
                </div>
                <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-gray-800">Ask Pilot AI</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2">"Write a newsletter proposal for..."</p>
                  <div className="text-[11px] font-mono text-emerald-700 bg-white p-2 rounded-lg border border-emerald-100">
                    Drafting social sequence... ⚡
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-md bg-amber-50 flex items-center justify-center text-amber-600">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-gray-800">Invoices Generated</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2">Invoice #INV-2026-04</p>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-800 border-t border-gray-100 pt-2">
                    <span>Total Amount</span>
                    <span className="text-emerald-600">$2,450.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-28 bg-gray-50/50 border-y border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-xs font-bold text-blue-600 uppercase tracking-widest">Core Capabilities</h2>
            <p className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              A comprehensive toolkit for ambitious entrepreneurs
            </p>
            <p className="mt-4 text-gray-600">
              Stop context switching between multiple disconnected services. BizPilot brings critical documents, business audits, and creative suites under one gorgeous roof.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 border border-blue-100/50">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-gray-900 tracking-tight">{feat.title}</h3>
                    <p className="mt-2.5 text-gray-600 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => setCurrentRoute('login')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 group"
                    >
                      Try it out
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="font-display text-xs font-bold text-blue-600 uppercase tracking-widest">Platform Strengths</h2>
              <p className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Designed for founders who value speed and clarity
              </p>
              <p className="mt-5 text-gray-600 leading-relaxed">
                We believe that early-stage businesses shouldn't waste their small budget on overpriced copywriters, legal researchers, or visual consultants. BizPilot packages structural precision and dynamic AI to give you a pristine corporate identity.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Beautiful Presentation Out of the Box</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Perfect column systems and layouts prevent confusing, overlapping document pages.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Privacy & Isolation Built-in</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Your financial records are strictly isolated. We do not sell or analyze your documents.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {benefits.map((b, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-100 p-6 rounded-2xl text-center flex flex-col justify-center">
                  <span className="font-display text-4xl font-black text-blue-600">{b.metric}</span>
                  <h4 className="text-sm font-bold text-gray-900 mt-3">{b.title}</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 border-t border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">Testimonials</h2>
            <p className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              What other ambitious operators say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs relative flex flex-col justify-between">
                <p className="text-gray-600 text-sm italic leading-relaxed">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                  <div className={`h-8 w-8 rounded-full ${t.avatarBg} flex items-center justify-center text-xs font-bold`}>
                    {t.author.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{t.author}</h4>
                    <p className="text-[10px] text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-xs font-bold text-blue-600 uppercase tracking-widest">Flexible Plans</h2>
            <p className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Sized for any step of your journey
            </p>
            <p className="mt-4 text-gray-600">
              Get started with our free tools or upgrade to Pro for unrestricted AI creation, smart templates, and comprehensive audits.
            </p>

            {/* Toggle Switch */}
            <div className="mt-8 inline-flex items-center gap-3 bg-gray-100 p-1 rounded-full border border-gray-200">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  billingPeriod === 'monthly' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Monthly billing
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'annual' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Annual billing
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">Free Pilot</h3>
                <p className="text-xs text-gray-500 mt-1">Core utilities to test the platform.</p>
                <div className="mt-4">
                  <span className="font-display text-3xl font-black text-gray-900">$0</span>
                  <span className="text-xs text-gray-500"> / month</span>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Basic Invoice Builder (3 / mo)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Business Name Generator</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Basic AI chat credits</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentRoute('register')}
                className="mt-8 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition-colors"
              >
                Sign Up Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 shadow-md flex flex-col justify-between relative">
              <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">Pro Pilot</h3>
                <p className="text-xs text-gray-500 mt-1">Everything an growing business needs.</p>
                <div className="mt-4">
                  <span className="font-display text-3xl font-black text-gray-900">
                    {billingPeriod === 'annual' ? '$19' : '$24'}
                  </span>
                  <span className="text-xs text-gray-500"> / month</span>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-gray-800">Unrestricted Invoicing & Quotations</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>High-priority Business Plans</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Business Health Score Auditor</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>AI Social Post & Email composer</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentRoute('register')}
                className="mt-8 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Start 7-Day Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">Enterprise</h3>
                <p className="text-xs text-gray-500 mt-1">For multi-operator organizations.</p>
                <div className="mt-4">
                  <span className="font-display text-3xl font-black text-gray-900">Custom</span>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Dedicated API Access</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Custom model training datasets</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Custom domain billing integration</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentRoute('login')}
                className="mt-8 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50 border-t border-gray-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">FAQ</h2>
            <p className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-800">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-3 bg-gray-50/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 relative overflow-hidden">
        {/* Glow decorative overlays */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-radial-gradient from-blue-400 to-transparent opacity-20 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
            Stop overcomplicating. Let BizPilot handle the weight.
          </h2>
          <p className="mt-4 text-blue-100 max-w-xl mx-auto text-sm leading-relaxed">
            Ready to design beautiful proposals, invoice instantly, and audit your organization with premium AI guidance? Create your account today.
          </p>
          <div className="mt-8">
            <button
              onClick={() => setCurrentRoute('register')}
              className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm rounded-xl shadow-md transition-all inline-flex items-center gap-2 group"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="font-display font-bold text-base tracking-tight text-white">BizPilot AI</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                Premium operations hub designed specifically for small businesses, founders, and consultants.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">Invoices</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Business Plans</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Financial Scorecard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ask Pilot Chat</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Integrations</h4>
              <ul className="space-y-2 text-xs">
                <li><span className="text-gray-600">Stripe Dashboard (Coming Soon)</span></li>
                <li><span className="text-gray-600">Quickbooks (Coming Soon)</span></li>
                <li><span className="text-gray-600">Workspace Gmail (Coming Soon)</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legals</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie settings</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
            <p>© 2026 BizPilot AI. Built with premium design layouts. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Timezone: UTC</span>
              <span>Platform Version: v2.0-stable</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
