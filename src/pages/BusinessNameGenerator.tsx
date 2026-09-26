/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Lightbulb, Sparkles, Check, Globe, Star, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { BusinessNameIdea } from '../types';

export default function BusinessNameGenerator() {
  const [keywords, setKeywords] = useState('cloud automation operations');
  const [industry, setIndustry] = useState('technology');
  const [style, setStyle] = useState('compound');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<BusinessNameIdea[]>([]);

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      let mockIdeas: BusinessNameIdea[] = [];

      if (style === 'compound') {
        mockIdeas = [
          {
            name: 'CloudPilot',
            slogan: 'Autopilot your organizational growth.',
            domainAvailable: true,
            domainName: 'cloudpilotai.com',
            suitabilityScore: 94,
            reasoning: 'Combines the operational flexibility of cloud services with the authoritative guidance of a pilot. Highly memorable and brandable for modern technical consulting.'
          },
          {
            name: 'OpsCraft',
            slogan: 'Precision-tailored infrastructure workflows.',
            domainAvailable: true,
            domainName: 'opscrafthq.com',
            suitabilityScore: 89,
            reasoning: 'Implies extreme care, design craft, and expertise in managing complex developer or enterprise operations pipelines.'
          },
          {
            name: 'AutoScribe',
            slogan: 'AI-first billing & document builders.',
            domainAvailable: false,
            domainName: 'autoscribe.com',
            suitabilityScore: 82,
            reasoning: 'Directly relates to automated writing, document processing, and rapid invoicing operations. Highly descriptive.'
          }
        ];
      } else if (style === 'futuristic') {
        mockIdeas = [
          {
            name: 'Vortexa AI',
            slogan: 'Accelerating operational flow loops.',
            domainAvailable: true,
            domainName: 'vortexa.io',
            suitabilityScore: 92,
            reasoning: 'A sleek, abstract futuristic moniker that sounds fast and agile. Ideal for high-growth tech start-ups looking to disrupt legacy markets.'
          },
          {
            name: 'KoreStack',
            slogan: 'The foundational pillar of SME backoffices.',
            domainAvailable: true,
            domainName: 'korestack.com',
            suitabilityScore: 87,
            reasoning: 'Utilizes strong consonants (K, S) to evoke safety, structural stability, and core infrastructure values.'
          }
        ];
      } else {
        mockIdeas = [
          {
            name: 'Aero',
            slogan: 'Frictionless business operations.',
            domainAvailable: false,
            domainName: 'aero.com',
            suitabilityScore: 95,
            reasoning: 'An elegant, single-syllable minimalist name representing lightness, speed, and seamless integration.'
          },
          {
            name: 'NovaHQ',
            slogan: 'Bright operational metrics.',
            domainAvailable: true,
            domainName: 'novahq.co',
            suitabilityScore: 88,
            reasoning: 'Short, clean, and optimistic. Nova means new star, representing the launch phase of early stage organizations.'
          }
        ];
      }

      setResults(mockIdeas);
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Configuration Form card */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Core keywords or concepts (comma separated)</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-800 font-semibold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Naming Aesthetic Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden text-gray-700 font-semibold"
          >
            <option value="compound">Compound Words (CloudPilot)</option>
            <option value="futuristic">Futuristic / Techy (Vortexa)</option>
            <option value="minimalist">Minimalist / Clean (Aero)</option>
          </select>
        </div>
        <div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !keywords.trim()}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 animate-pulse-slow" />
            Generate Strategic Names
          </button>
        </div>
      </div>

      {/* Grid of Results */}
      {isGenerating ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse-slow">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="h-4 bg-gray-100 rounded-sm w-1/3" />
              <div className="h-3 bg-gray-100 rounded-sm w-3/4" />
              <div className="h-2 bg-gray-100 rounded-sm w-full" />
              <div className="h-2 bg-gray-100 rounded-sm w-5/6" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((idea, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
              <div>
                {/* Score badge & Name header */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <h4 className="font-display font-black text-xl text-gray-900 tracking-tight">{idea.name}</h4>
                    <p className="text-[11px] text-gray-500 italic mt-0.5">"{idea.slogan}"</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {idea.suitabilityScore}% Match
                  </span>
                </div>

                {/* Domain lookup simulation */}
                <div className="flex items-center gap-2 text-xs mb-4">
                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-mono text-[11px] text-gray-600 font-medium">{idea.domainName}</span>
                  {idea.domainAvailable ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Available</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">Taken / Premium</span>
                  )}
                </div>

                {/* Strategic AI rationale */}
                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-150">
                  {idea.reasoning}
                </p>
              </div>

              {/* Action row */}
              <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-100 text-xs">
                <button
                  onClick={() => alert(`Saved '${idea.name}' to your Business Profile details.`)}
                  className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-lg border border-gray-200 transition-colors"
                >
                  Adopt Name
                </button>
                <a
                  href={`https://domains.google/`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  Buy Domain
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 p-12 rounded-2xl text-center text-xs text-gray-400 max-w-lg mx-auto">
          <Lightbulb className="h-8 w-8 text-gray-300 mx-auto mb-4" />
          <p className="leading-relaxed">
            Configure your keywords above (e.g. 'operations', 'marketing', 'fintech') and hit **Generate Strategic Names** to see creative options!
          </p>
        </div>
      )}
    </div>
  );
}
