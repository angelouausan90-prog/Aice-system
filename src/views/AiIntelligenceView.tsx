/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Search, 
  Brain, 
  MessageSquare, 
  Send, 
  ExternalLink, 
  Compass, 
  Coins, 
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const AiIntelligenceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MAPS' | 'SEARCH' | 'THINKING' | 'CHAT'>('MAPS');

  // 1. Google Maps Grounding State
  const [mapsLocationQuery, setMapsLocationQuery] = useState('SM City Fairview, Quirino Highway, Quezon City');
  const [isMapsLoading, setIsMapsLoading] = useState(false);
  const [mapsAnalysis, setMapsAnalysis] = useState<string | null>(null);
  const [mapsGroundingChunks, setMapsGroundingChunks] = useState<any[]>([]);

  // 2. Google Search Grounding State
  const [searchTopic, setSearchTopic] = useState('Philippine ice cream franchise market demand 2025 2026 Aice electricity inverter');
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchSummary, setSearchSummary] = useState<string | null>(null);
  const [searchGroundingChunks, setSearchGroundingChunks] = useState<any[]>([]);

  // 3. High Thinking Mode State
  const [thinkingPackage, setThinkingPackage] = useState('Standard Kiosk');
  const [thinkingCity, setThinkingCity] = useState('Quezon City, Metro Manila');
  const [thinkingDailyUnits, setThinkingDailyUnits] = useState(180);
  const [thinkingFreezers, setThinkingFreezers] = useState(2);
  const [isThinkingLoading, setIsThinkingLoading] = useState(false);
  const [thinkingReport, setThinkingReport] = useState<string | null>(null);

  // 4. Chatbot State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Mabuhay! I am Aice Mentor, your AI Franchise Operations & Field Recruitment Advisor. Ask me anything about standard package tiers (Pocket Store, Kiosk, Parlor), commercial freezer sub-zero SOPs, minimum territory buffer radius, or how to address prospect objections regarding electricity costs.'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Run Maps Grounding
  const handleRunMapsGrounding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMapsLoading(true);

    try {
      const res = await fetch('/api/gemini/location-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationQuery: mapsLocationQuery }),
      });

      const data = await res.json();
      setMapsAnalysis(data.analysis);
      setMapsGroundingChunks(data.groundingChunks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMapsLoading(false);
    }
  };

  // Run Search Grounding
  const handleRunSearchGrounding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchLoading(true);

    try {
      const res = await fetch('/api/gemini/search-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: searchTopic }),
      });

      const data = await res.json();
      setSearchSummary(data.summary);
      setSearchGroundingChunks(data.groundingChunks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Run High Thinking Mode
  const handleRunThinkingMode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsThinkingLoading(true);

    try {
      const res = await fetch('/api/gemini/thinking-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchiseType: thinkingPackage,
          city: thinkingCity,
          dailyTargetUnits: thinkingDailyUnits,
          freezerCount: thinkingFreezers,
        }),
      });

      const data = await res.json();
      setThinkingReport(data.report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinkingLoading(false);
    }
  };

  // Send Chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const userText = inputMessage;
    setInputMessage('');
    const newHistory = [...chatMessages, { role: 'user' as const, content: userText }];
    setChatMessages(newHistory);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: newHistory,
        }),
      });

      const data = await res.json();
      setChatMessages([...newHistory, { role: 'assistant', content: data.reply || 'No response.' }]);
    } catch (err) {
      console.error(err);
      setChatMessages([...newHistory, { role: 'assistant', content: 'Connection issue. Please retry.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950">
                Gemini 3.8 & 4 Intelligence
              </span>
              <span className="text-xs text-indigo-200">
                Live Google Grounding & Deep Thinking Suite
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Aice Enterprise AI Advisory & Territory Analytics
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Equip operations with real-time Google Maps place density analysis, live Search market intelligence, Thinking Mode 5-year break-even projections, and multi-turn franchise coaching.
            </p>
          </div>

          {/* Module Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-800/90 rounded-xl border border-indigo-900">
            <button
              onClick={() => setActiveTab('MAPS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'MAPS' ? 'bg-[#E52320] text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Maps Grounding
            </button>
            <button
              onClick={() => setActiveTab('SEARCH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SEARCH' ? 'bg-[#E52320] text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Search Grounding
            </button>
            <button
              onClick={() => setActiveTab('THINKING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'THINKING' ? 'bg-[#E52320] text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Thinking Mode
            </button>
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'CHAT' ? 'bg-[#E52320] text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Aice Mentor Chat
            </button>
          </div>
        </div>
      </div>

      {/* 1. GOOGLE MAPS GROUNDING TAB */}
      {activeTab === 'MAPS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-5 h-5 text-[#E52320]" />
              <h3 className="text-sm font-bold text-slate-900">
                Google Maps Grounding: Candidate Location Density & Foot Traffic Check
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Grounds the model in real geographic place data to discover surrounding shopping malls, transit terminals, public markets, and schools.
            </p>

            <form onSubmit={handleRunMapsGrounding} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={mapsLocationQuery}
                onChange={(e) => setMapsLocationQuery(e.target.value)}
                placeholder="Enter candidate target location (e.g. IT Park, Cebu City or Alabang-Zapote Rd)..."
                className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
              <button
                type="submit"
                disabled={isMapsLoading}
                className="px-5 py-2.5 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                {isMapsLoading ? 'Analyzing Location...' : 'Analyze Territory'}
              </button>
            </form>
          </div>

          {mapsAnalysis && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Territory Assessment for: {mapsLocationQuery}
              </h4>
              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                {mapsAnalysis}
              </div>

              {/* MUST ALWAYS EXTRACT URLS FROM GROUNDING CHUNKS */}
              {mapsGroundingChunks.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2">
                    Verified Google Maps Locations & Sources:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mapsGroundingChunks.map((chunk, idx) => {
                      const mapUri = chunk.maps?.uri || chunk.web?.uri;
                      const title = chunk.maps?.title || chunk.web?.title || `Google Maps Place ${idx + 1}`;
                      if (!mapUri) return null;
                      return (
                        <a
                          key={idx}
                          href={mapUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs text-blue-600 transition-colors"
                        >
                          <span className="truncate font-semibold">{title}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. GOOGLE SEARCH GROUNDING TAB */}
      {activeTab === 'SEARCH' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Google Search Grounding: Live Philippine Market Intelligence
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Grounds queries in up-to-date web search data covering recent Philippine retail trends, electricity rates, and ice cream competitor movements.
            </p>

            <form onSubmit={handleRunSearchGrounding} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                placeholder="e.g. Aice ice cream wholesale pricing Philippines 2026..."
                className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
              />
              <button
                type="submit"
                disabled={isSearchLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                {isSearchLoading ? 'Searching Web...' : 'Ground with Search'}
              </button>
            </form>
          </div>

          {searchSummary && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Grounding Results: {searchTopic}
              </h4>
              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                {searchSummary}
              </div>

              {/* Search Grounding Citations */}
              {searchGroundingChunks.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2">
                    Referenced Live Web Sources:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchGroundingChunks.map((chunk, idx) => {
                      const uri = chunk.web?.uri;
                      const title = chunk.web?.title || `Web Citation ${idx + 1}`;
                      if (!uri) return null;
                      return (
                        <a
                          key={idx}
                          href={uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs text-blue-600 transition-colors"
                        >
                          <span className="truncate font-semibold">{title}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. HIGH THINKING MODE TAB */}
      {activeTab === 'THINKING' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                High Thinking Mode: 5-Year Break-Even & Operational Audit
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Runs Gemini with <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded font-mono">ThinkingLevel.HIGH</code> for deep step-by-step mathematical reasoning, Meralco electricity calculations, and seasonal sales sensitivity.
            </p>

            <form onSubmit={handleRunThinkingMode} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Franchise Package
                </label>
                <select
                  value={thinkingPackage}
                  onChange={(e) => setThinkingPackage(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                >
                  <option value="Pocket Store">Pocket Store (1 Freezer)</option>
                  <option value="Standard Kiosk">Standard Kiosk (2-3 Freezers)</option>
                  <option value="Commercial Parlor">Commercial Parlor (4+ Freezers)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Target Territory
                </label>
                <input
                  type="text"
                  value={thinkingCity}
                  onChange={(e) => setThinkingCity(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Target Daily Stick Sales
                </label>
                <input
                  type="number"
                  min={30}
                  max={2000}
                  value={thinkingDailyUnits}
                  onChange={(e) => setThinkingDailyUnits(parseInt(e.target.value || '100', 10))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Commercial Freezers
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={thinkingFreezers}
                  onChange={(e) => setThinkingFreezers(parseInt(e.target.value || '1', 10))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isThinkingLoading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  {isThinkingLoading ? 'Synthesizing High Thinking Model...' : 'Calculate Deep Financial Model'}
                </button>
              </div>
            </form>
          </div>

          {thinkingReport && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  5-Year Strategic Audit & Payback Model
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
                  ThinkingLevel.HIGH Verified
                </span>
              </div>
              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
                {thinkingReport}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. CHATBOT TAB */}
      {activeTab === 'CHAT' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[580px] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E52320] to-[#FF5252] text-white font-extrabold flex items-center justify-center shadow-xs">
                A
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Aice Mentor</h3>
                <p className="text-[11px] text-slate-500">Franchise Operations, Cold Chain SOPs & Recruitment Coach</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Gemini 3.8 Flash
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#E52320] text-white rounded-br-xs shadow-xs'
                      : 'bg-slate-100 text-slate-900 rounded-bl-xs border border-slate-200/60'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-3 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
                  Aice Mentor is preparing answer...
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about freezer maintenance, sari-sari objections, commission structure..."
              className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#E52320]"
            />
            <button
              type="submit"
              disabled={isChatLoading || !inputMessage.trim()}
              className="p-2.5 bg-[#E52320] hover:bg-[#c91d1a] text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
