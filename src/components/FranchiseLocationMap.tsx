/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { FranchiseeProfile } from '../types.ts';
import { 
  MapPin, 
  Store, 
  Search, 
  ShieldCheck, 
  Layers, 
  ThermometerSnowflake, 
  Phone, 
  Calendar,
  Compass,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

interface FranchiseLocationMapProps {
  franchisees: FranchiseeProfile[];
  onSelectFranchisee?: (franchise: FranchiseeProfile) => void;
  height?: string;
  selectedFranchiseeId?: string | null;
}

export const FranchiseLocationMap: React.FC<FranchiseLocationMapProps> = ({
  franchisees,
  onSelectFranchisee,
  height = '540px',
  selectedFranchiseeId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const bufferLayerRef = useRef<L.LayerGroup | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string>('ALL');
  const [showBuffers, setShowBuffers] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState<FranchiseeProfile | null>(null);
  const [activeRegion, setActiveRegion] = useState<'ALL' | 'NCR' | 'CEBU' | 'DAVAO'>('ALL');

  // Filter outlets with valid coordinates
  const mappedFranchisees = franchisees.filter(f => f.latitude && f.longitude);

  const filteredOutlets = mappedFranchisees.filter(f => {
    const matchesSearch = 
      f.franchiseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.representativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPackage = selectedPackage === 'ALL' || f.franchiseType === selectedPackage;
    return matchesSearch && matchesPackage;
  });

  // Package colors & badge helpers
  const getPackageBadgeColor = (type: string) => {
    switch (type) {
      case 'Commercial Parlor':
        return { bg: '#E52320', text: '#FFFFFF', border: '#b91c1c' };
      case 'Standard Kiosk':
        return { bg: '#F59E0B', text: '#FFFFFF', border: '#d97706' };
      case 'Pocket Store':
        return { bg: '#10B981', text: '#FFFFFF', border: '#059669' };
      default:
        return { bg: '#6366F1', text: '#FFFFFF', border: '#4f46e5' };
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on the Philippines (default Luzon / Visayas / Mindanao view)
    const map = L.map(mapContainerRef.current, {
      center: [14.5995, 121.0360], // Metro Manila default center
      zoom: 11,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Aice Franchise Hub',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const bufferGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersGroup;
    bufferLayerRef.current = bufferGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Buffer Radius
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const bufferGroup = bufferLayerRef.current;

    if (!map || !markersGroup || !bufferGroup) return;

    markersGroup.clearLayers();
    bufferGroup.clearLayers();

    filteredOutlets.forEach((franchise) => {
      if (!franchise.latitude || !franchise.longitude) return;

      const colors = getPackageBadgeColor(franchise.franchiseType);
      const isSelected = selectedOutlet?.id === franchise.id || selectedFranchiseeId === franchise.id;

      // Custom HTML Marker using L.divIcon
      const markerHtml = `
        <div style="position: relative; cursor: pointer; transform: translate(-50%, -50%);">
          ${isSelected ? `
            <div style="position: absolute; top: -6px; left: -6px; width: 44px; height: 44px; border-radius: 50%; background: ${colors.bg}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          ` : ''}
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${colors.bg};
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 14px;
            font-weight: 800;
          ">
            🍦
          </div>
          <div style="
            position: absolute;
            bottom: -18px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            background: rgba(15, 23, 42, 0.85);
            color: #ffffff;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid rgba(255,255,255,0.2);
            pointer-events: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            ${franchise.city}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-aice-pin',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([franchise.latitude, franchise.longitude], { icon: customIcon });

      // Click on marker
      marker.on('click', () => {
        setSelectedOutlet(franchise);
        map.flyTo([franchise.latitude!, franchise.longitude!], 14, { duration: 0.8 });
        if (onSelectFranchisee) onSelectFranchisee(franchise);
      });

      markersGroup.addLayer(marker);

      // 300-meter territory buffer circle (Aice official non-compete perimeter)
      if (showBuffers) {
        const circle = L.circle([franchise.latitude, franchise.longitude], {
          radius: 300, // 300 meters
          color: colors.bg,
          weight: 1.5,
          fillColor: colors.bg,
          fillOpacity: 0.12,
          dashArray: '4, 6',
        });
        bufferGroup.addLayer(circle);
      }
    });

    // If there's an active selected franchisee, pan to it
    if (selectedOutlet?.latitude && selectedOutlet?.longitude) {
      map.panTo([selectedOutlet.latitude, selectedOutlet.longitude]);
    }
  }, [filteredOutlets, showBuffers, selectedOutlet, selectedFranchiseeId]);

  // Auto-focus on selected franchisee when ID is provided via navigation
  useEffect(() => {
    if (selectedFranchiseeId && franchisees.length > 0) {
      const match = franchisees.find(f => f.id === selectedFranchiseeId);
      if (match && match.latitude && match.longitude) {
        setSelectedOutlet(match);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([match.latitude, match.longitude], 15, { duration: 1.2 });
        }
      }
    }
  }, [selectedFranchiseeId, franchisees]);

  // Handle region jump buttons
  const handleRegionChange = (region: 'ALL' | 'NCR' | 'CEBU' | 'DAVAO') => {
    setActiveRegion(region);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (region === 'ALL') {
      map.flyTo([12.8797, 121.7740], 6, { duration: 1.2 });
    } else if (region === 'NCR') {
      map.flyTo([14.5995, 121.0360], 11, { duration: 1 });
    } else if (region === 'CEBU') {
      map.flyTo([10.3157, 123.8854], 12, { duration: 1 });
    } else if (region === 'DAVAO') {
      map.flyTo([7.0736, 125.6128], 12, { duration: 1 });
    }
  };

  const handleFlyToStore = (franchise: FranchiseeProfile) => {
    if (!franchise.latitude || !franchise.longitude) return;
    setSelectedOutlet(franchise);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([franchise.latitude, franchise.longitude], 15, { duration: 1 });
    }
    if (onSelectFranchisee) onSelectFranchisee(franchise);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Map Control Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E52320] text-white">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Registered Franchisee Business Locations Map
            </h3>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {mappedFranchisees.length} Active Stores Mapped
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time geographical tracker of officially approved and onboarded Aice store outlets & protected perimeters
          </p>
        </div>

        {/* Quick Map Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Territory Buffer Toggle */}
          <button
            type="button"
            onClick={() => setShowBuffers(!showBuffers)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showBuffers
                ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle 300m non-compete territory buffer around each store"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#E52320]" />
            {showBuffers ? '300m Buffer: ON' : '300m Buffer: OFF'}
          </button>

          {/* Region Quick Selectors */}
          <div className="flex items-center p-0.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold">
            <button
              onClick={() => handleRegionChange('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeRegion === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All PH
            </button>
            <button
              onClick={() => handleRegionChange('NCR')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeRegion === 'NCR' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Metro Manila
            </button>
            <button
              onClick={() => handleRegionChange('CEBU')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeRegion === 'CEBU' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cebu
            </button>
            <button
              onClick={() => handleRegionChange('DAVAO')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeRegion === 'DAVAO' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Davao
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Body: Left Interactive Map, Right Store List & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 relative">
        {/* Map Container */}
        <div className="lg:col-span-3 relative bg-slate-100">
          <div 
            ref={mapContainerRef} 
            style={{ height, width: '100%' }} 
            className="z-10 focus:outline-hidden"
          />

          {/* Map Package Legend floating overlay */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 text-xs hidden sm:block">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Franchise Outlet Types
            </span>
            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E52320]"></span>
                <span className="font-semibold text-slate-800">Commercial Parlor (4+ Freezers)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                <span className="font-semibold text-slate-800">Standard Kiosk (2-3 Freezers)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                <span className="font-semibold text-slate-800">Pocket Store (1 Freezer)</span>
              </div>
            </div>
            {showBuffers && (
              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-red-500 border-dashed bg-red-100"></span>
                <span>Protected 300m Territory Buffer</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Stores Drawer */}
        <div className="lg:col-span-1 flex flex-col bg-slate-50/40 p-4 max-h-[540px] overflow-hidden">
          {/* Search Outlets */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Find outlet on map..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-[#E52320]"
              />
            </div>

            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Franchise Packages</option>
              <option value="Commercial Parlor">Commercial Parlor</option>
              <option value="Standard Kiosk">Standard Kiosk</option>
              <option value="Pocket Store">Pocket Store</option>
            </select>
          </div>

          {/* Outlets List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredOutlets.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No mapped stores match query.
              </div>
            ) : (
              filteredOutlets.map((franchise) => {
                const isSelected = selectedOutlet?.id === franchise.id;
                const colors = getPackageBadgeColor(franchise.franchiseType);

                return (
                  <div
                    key={franchise.id}
                    onClick={() => handleFlyToStore(franchise)}
                    className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#E52320] shadow-md ring-1 ring-[#E52320]'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span 
                        style={{ backgroundColor: colors.bg, color: colors.text }} 
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      >
                        {franchise.franchiseType}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {franchise.freezerUnitsCount} Freezers
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 leading-tight">
                      {franchise.franchiseName}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Rep: {franchise.representativeName}
                    </div>

                    <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between pt-1.5 border-t border-slate-100">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{franchise.city}</span>
                      </span>
                      <span className="text-[#E52320] font-bold">Pan to pin →</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Outlet Quick Card */}
          {selectedOutlet && (
            <div className="mt-3 p-3 bg-white border border-[#E52320]/40 rounded-xl shadow-xs text-xs space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#E52320]">Selected Store</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {selectedOutlet.latitude?.toFixed(4)}, {selectedOutlet.longitude?.toFixed(4)}
                </span>
              </div>
              <div className="font-black text-slate-900 text-xs leading-snug">
                {selectedOutlet.franchiseName}
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2">
                {selectedOutlet.businessAddress}
              </p>
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="font-mono">{selectedOutlet.contactNumber}</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active Outlet
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
