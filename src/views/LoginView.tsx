/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, FranchiseeProfile, AgentProfile } from '../types.ts';
import { 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  UserCheck, 
  Briefcase, 
  Lock, 
  User as UserIcon, 
  AlertCircle,
  MapPin,
  Store,
  CheckCircle2,
  Sparkles,
  Navigation,
  Phone,
  Mail,
  Building,
  FileText,
  ArrowRight,
  Check,
  Compass
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (
    user: User, 
    agentProfile?: AgentProfile, 
    franchiseProfile?: FranchiseeProfile, 
    targetTab?: string,
    mapFranchiseeId?: string
  ) => void;
  onDataChange?: () => void;
}

// Popular Philippine cities with preset baseline coordinates
const PRESET_CITIES = [
  { city: 'Quezon City', province: 'Metro Manila', lat: 14.6760, lng: 121.0437 },
  { city: 'Manila', province: 'Metro Manila', lat: 14.5995, lng: 120.9842 },
  { city: 'Makati', province: 'Metro Manila', lat: 14.5547, lng: 121.0244 },
  { city: 'Pasig', province: 'Metro Manila', lat: 14.5764, lng: 121.0851 },
  { city: 'Taguig', province: 'Metro Manila', lat: 14.5176, lng: 121.0509 },
  { city: 'Cebu City', province: 'Cebu', lat: 10.3157, lng: 123.8854 },
  { city: 'Davao City', province: 'Davao del Sur', lat: 7.1907, lng: 125.4553 },
  { city: 'Iloilo City', province: 'Iloilo', lat: 10.7202, lng: 122.5621 },
  { city: 'Baguio City', province: 'Benguet', lat: 16.4023, lng: 120.5960 },
  { city: 'Calamba City', province: 'Laguna', lat: 14.2117, lng: 121.1656 },
  { city: 'Bacoor City', province: 'Cavite', lat: 14.4624, lng: 120.9645 },
  { city: 'San Fernando', province: 'Pampanga', lat: 15.0298, lng: 120.6897 },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onDataChange }) => {
  // Navigation tab between Login and Sign-Up
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Franchisee Sign-Up form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [franchiseType, setFranchiseType] = useState<'Commercial Parlor' | 'Standard Kiosk' | 'Pocket Store'>('Standard Kiosk');
  const [city, setCity] = useState('Quezon City');
  const [province, setProvince] = useState('Metro Manila');
  const [businessAddress, setBusinessAddress] = useState('');
  const [landmarkNotes, setLandmarkNotes] = useState('');
  const [latitude, setLatitude] = useState('14.6760');
  const [longitude, setLongitude] = useState('121.0437');
  const [preferredContact, setPreferredContact] = useState<'Phone Call' | 'WhatsApp/Viber' | 'Email' | 'In-Person'>('Phone Call');
  const [consentDataPrivacy, setConsentDataPrivacy] = useState(true);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Sign-Up submission result screen
  const [signupSuccessData, setSignupSuccessData] = useState<{
    referenceNumber: string;
    storeName: string;
    city: string;
    province: string;
    businessAddress: string;
    franchiseType: string;
    latitude: number;
    longitude: number;
    user: User;
    recruitId: string;
    franchiseeId?: string;
  } | null>(null);

  // Update default coordinates when city changes
  const handleCitySelect = (cityName: string) => {
    setCity(cityName);
    const found = PRESET_CITIES.find(c => c.city.toLowerCase() === cityName.toLowerCase());
    if (found) {
      setProvince(found.province);
      // Small jitter so pins in same city don't completely overlap
      const jitterLat = (Math.random() - 0.5) * 0.008;
      const jitterLng = (Math.random() - 0.5) * 0.008;
      setLatitude((found.lat + jitterLat).toFixed(6));
      setLongitude((found.lng + jitterLng).toFixed(6));
    }
  };

  // Device GPS Location Handler
  const handleUseDeviceGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setIsLocatingGps(false);
      },
      (err) => {
        console.warn('GPS location error:', err);
        setIsLocatingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Auto-generate store name if user hasn't typed one
  useEffect(() => {
    if (fullName && !storeName) {
      const firstName = fullName.split(' ')[0];
      setStoreName(`Aice Hub - ${city} (${firstName})`);
    }
  }, [fullName, city]);

  // Auto-generate suggested username
  useEffect(() => {
    if (fullName && !signupUsername) {
      const clean = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
      setSignupUsername(`franchise.${clean.slice(0, 8)}`);
    }
  }, [fullName]);

  // Handle standard login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.agentProfile, data.franchiseProfile);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Franchisee Sign-Up
  const handleSignupSubmit = async (e: React.FormEvent, autoApproveNow = false) => {
    e.preventDefault();
    setSignupError(null);

    if (!consentDataPrivacy) {
      setSignupError('Please confirm consent under the Philippine Data Privacy Act (RA 10173).');
      return;
    }

    if (!storeName.trim()) {
      setSignupError('Please provide your proposed Store or Business Name.');
      return;
    }

    if (!businessAddress.trim()) {
      setSignupError('Please provide the physical street address of your proposed store.');
      return;
    }

    setIsSubmittingSignup(true);

    try {
      const res = await fetch('/api/auth/franchisee-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          username: signupUsername || undefined,
          password: signupPassword || 'franchise123',
          storeName,
          franchiseType,
          city,
          province,
          businessAddress,
          landmarkOrNotes: landmarkNotes,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          preferredContactMethod: preferredContact,
          autoApprove: autoApproveNow,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (onDataChange) {
        onDataChange();
      }

      if (autoApproveNow && data.franchisee) {
        // Immediate launch to Franchise Network Map!
        onLoginSuccess(data.user, undefined, data.franchisee, 'franchise-map', data.franchisee.id);
        return;
      }

      setSignupSuccessData({
        referenceNumber: data.recruit.referenceNumber,
        storeName: data.recruit.storeName || storeName,
        city: data.recruit.city,
        province: data.recruit.province,
        businessAddress: data.recruit.businessAddress || businessAddress,
        franchiseType: data.recruit.businessInterest,
        latitude: data.recruit.latitude || parseFloat(latitude),
        longitude: data.recruit.longitude || parseFloat(longitude),
        user: data.user,
        recruitId: data.recruit.id,
        franchiseeId: data.franchisee?.id,
      });
    } catch (err: any) {
      setSignupError(err.message || 'Failed to submit application. Please check your entries.');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  // Instant Approval Simulator from Success Screen
  const handleSimulateInstantApproval = async () => {
    if (!signupSuccessData) return;
    setIsSubmittingSignup(true);

    try {
      const res = await fetch(`/api/recruits/${signupSuccessData.recruitId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: 'Approved',
          comment: 'Approved via online franchisee onboarding simulation. Store location registered on live map tracker.',
          storeName: signupSuccessData.storeName,
          businessAddress: signupSuccessData.businessAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      if (onDataChange) onDataChange();

      // Log in as this newly approved franchisee and view store on map!
      const userRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupSuccessData.user.username,
          password: signupPassword || 'franchise123',
        }),
      });

      const loginData = await userRes.json();
      if (userRes.ok) {
        onLoginSuccess(
          loginData.user, 
          undefined, 
          loginData.franchiseProfile, 
          'franchise-map', 
          loginData.franchiseProfile?.id
        );
      }
    } catch (err: any) {
      alert(err.message || 'Approval simulation failed');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const setQuickCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Brand Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#E52320]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className={`mx-auto w-full transition-all duration-300 relative z-10 px-4 ${
        activeTab === 'SIGNUP' && !signupSuccessData ? 'sm:max-w-2xl' : 'sm:max-w-md'
      }`}>
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E52320] to-[#FF5252] shadow-xl shadow-red-500/30 text-white font-extrabold text-3xl mb-3">
            A
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Aice Philippines
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium">
            Franchise Management & Store Location Tracker Portal
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-Time Certified Franchisee Business Locations
          </div>
        </div>

        {/* Card Container (Focused UI element) */}
        <div className="mt-6 bg-white/95 backdrop-blur-md py-6 px-5 sm:px-8 shadow-2xl rounded-2xl border border-slate-200">
          {/* Top Switcher: Sign In vs Franchisee Sign-Up */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setSignupSuccessData(null);
                setLoginError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'LOGIN'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              Sign In to Portal
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('SIGNUP');
                setLoginError(null);
                setSignupError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                activeTab === 'SIGNUP'
                  ? 'bg-[#E52320] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Franchisee Sign-Up
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-amber-400 text-slate-950">
                New
              </span>
            </button>
          </div>

          {/* =========================================
              VIEW 1: SIGN IN TAB
             ========================================= */}
          {activeTab === 'LOGIN' && (
            <div>
              <form className="space-y-4" onSubmit={handleLogin}>
                {loginError && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username or Official Email
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or franchise.valenzuela"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:border-transparent focus:bg-white text-slate-900 placeholder-slate-400 outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:border-transparent focus:bg-white text-slate-900 placeholder-slate-400 outline-hidden transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs sm:text-sm font-bold text-white bg-[#E52320] hover:bg-[#c91d1a] focus:outline-hidden focus:ring-2 focus:ring-[#E52320] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? 'Authenticating...' : 'Sign In to Portal'}
                </button>
              </form>

              {/* Quick switch to Sign Up link */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  New franchise business applicant?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('SIGNUP')}
                    className="text-[#E52320] font-bold hover:underline cursor-pointer"
                  >
                    Apply & Register Business Location →
                  </button>
                </p>
              </div>

              {/* Quick Demo Login Pre-sets */}
              <div className="mt-5 pt-4 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
                  One-Click Demo Account Login
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickCredentials('admin', 'admin123')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-rose-600" />
                      Admin Account
                    </span>
                    <span className="text-[10px] text-rose-600 font-mono">admin / admin123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickCredentials('agent.reyes', 'agent123')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      Agent (Maria Reyes - Manila)
                    </span>
                    <span className="text-[10px] text-blue-600 font-mono">agent.reyes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickCredentials('franchise.valenzuela', 'franchise123')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      Franchisee (Elena Valenzuela - Fairview)
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono">franchise.valenzuela</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              VIEW 2: FRANCHISEE SIGN-UP FORM
             ========================================= */}
          {activeTab === 'SIGNUP' && !signupSuccessData && (
            <form onSubmit={(e) => handleSignupSubmit(e, false)} className="space-y-4">
              {/* Notification Banner explaining location registration & map tracking */}
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Business Location Tracker Registration</span>
                  <span className="text-[11px] text-emerald-800">
                    Provide your proposed storefront details below. Once approved by the administration, your registered business location will automatically be pinned on the live Franchise Locations Map Tracker with protected territory radius!
                  </span>
                </div>
              </div>

              {signupError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{signupError}</span>
                </div>
              )}

              {/* SECTION 1: APPLICANT & LOGIN CREDENTIALS */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  1. Franchisee Representative & Login Info
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Roberto Dimagiba"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Contact Mobile (+63) *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +63 917 888 1234"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. roberto@gmail.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Desired Username
                    </label>
                    <input
                      type="text"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="e.g. franchise.roberto"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Account Password
                    </label>
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: BUSINESS LOCATION INFORMATION (MANDATORY FOR MAP) */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#E52320] flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" />
                    2. Business Location Information (For Map Tracker)
                  </h4>
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                    Mandatory for Map Pin
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Proposed Store / Outlet Name *
                    </label>
                    <div className="relative">
                      <Store className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="e.g. Aice Frozen Hub - Katipunan QC"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Franchise Package Model *
                    </label>
                    <select
                      value={franchiseType}
                      onChange={(e) => setFranchiseType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden font-semibold"
                    >
                      <option value="Commercial Parlor">Commercial Parlor (4 Freezers • Flagship Outlet • 300m Territory)</option>
                      <option value="Standard Kiosk">Standard Kiosk (2 Freezers • Mall / Arcade Kiosk)</option>
                      <option value="Pocket Store">Pocket Store (1 Freezer • Neighborhood & Sari-Sari)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      City / Municipality *
                    </label>
                    <select
                      value={city}
                      onChange={(e) => handleCitySelect(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden font-medium"
                    >
                      {PRESET_CITIES.map(c => (
                        <option key={c.city} value={c.city}>{c.city} ({c.province})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Province / Region *
                    </label>
                    <input
                      type="text"
                      required
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="e.g. Metro Manila, Cebu, Davao"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Exact Physical Store Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="e.g. Unit 102, Ground Floor, Katipunan Commercial Strip, Loyola Heights"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nearest Landmark & Territory Notes
                  </label>
                  <input
                    type="text"
                    value={landmarkNotes}
                    onChange={(e) => setLandmarkNotes(e.target.value)}
                    placeholder="e.g. Across Ateneo gate 3, beside 7-Eleven, high pedestrian foot traffic"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] focus:bg-white text-slate-900 outline-hidden"
                  />
                </div>

                {/* COORDINATE PICKER & MAP GEOCODING PREVIEW */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#E52320]" />
                      <span className="text-xs font-bold text-slate-900">
                        Geographic Pinpoint Coordinates (GPS)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseDeviceGps}
                      disabled={isLocatingGps}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      {isLocatingGps ? 'Detecting GPS...' : 'Use My Device GPS Coordinates'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Latitude</span>
                      <input
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="14.6760"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Longitude</span>
                      <input
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="121.0437"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Coordinates auto-resolved for <strong>{city}</strong>. When approved, this exact point will be marked on the national map.</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PREFERENCES & CONSENT */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Preferred Verification Contact
                    </label>
                    <select
                      value={preferredContact}
                      onChange={(e) => setPreferredContact(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E52320] text-slate-900 outline-hidden"
                    >
                      <option value="Phone Call">Direct Phone Call</option>
                      <option value="WhatsApp/Viber">WhatsApp / Viber</option>
                      <option value="Email">Official Email</option>
                      <option value="In-Person">In-Person Site Visit</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600">
                      <input
                        type="checkbox"
                        checked={consentDataPrivacy}
                        onChange={(e) => setConsentDataPrivacy(e.target.checked)}
                        className="mt-0.5 text-[#E52320] focus:ring-[#E52320] rounded"
                      />
                      <span>I agree to RA 10173 (Data Privacy Act) for business franchise verification.</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons: Standard Submit vs 1-Click Instant Demo Map Activation */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingSignup}
                    className="flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-[#E52320] hover:bg-[#c91d1a] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingSignup ? 'Submitting Application...' : 'Submit Franchise Application & Register Location'}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSignupSubmit(e, true)}
                    disabled={isSubmittingSignup}
                    className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="Simulate instant application approval and view your store pin on the live map tracker right away"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Instant Demo: Approve & Show on Map ⚡
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* =========================================
              VIEW 3: SIGN-UP SUBMITTED CONFIRMATION
             ========================================= */}
          {activeTab === 'SIGNUP' && signupSuccessData && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Franchise Application Registered
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Business Location Submitted!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reference: <strong className="font-mono text-slate-800">{signupSuccessData.referenceNumber}</strong>
                </p>
              </div>

              {/* Registered Store Location Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#E52320] text-white">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{signupSuccessData.storeName}</h4>
                      <span className="text-[11px] text-slate-500">{signupSuccessData.franchiseType}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Pending Verification
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{signupSuccessData.businessAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                    <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Coordinates: [{signupSuccessData.latitude}, {signupSuccessData.longitude}]</span>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>When an admin approves this application, this store will appear as a live pin on the <strong>Store Locations Map Tracker</strong>!</span>
                </div>
              </div>

              {/* Actions for the user */}
              <div className="space-y-2 pt-2">
                {/* 1-Click Simulation Button */}
                <button
                  type="button"
                  onClick={handleSimulateInstantApproval}
                  disabled={isSubmittingSignup}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmittingSignup ? 'Activating Store on Map...' : 'Simulate Instant Admin Approval & View on Map Tracker →'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsername(signupSuccessData.user.username);
                    setPassword(signupPassword || 'franchise123');
                    setActiveTab('LOGIN');
                    setSignupSuccessData(null);
                  }}
                  className="w-full py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Go to Sign In (Using {signupSuccessData.user.username})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Philippine Data Privacy Act (RA 10173) Compliant. Unofficial access is strictly logged and audited.
        </p>
      </div>
    </div>
  );
};
