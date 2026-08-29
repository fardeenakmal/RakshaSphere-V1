'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Alert } from '@/types';
import { Globe, MapPin } from 'lucide-react';

// Dynamic import with ssr: false for Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface GeoThreatMapProps {
  alerts: Alert[];
}

// Major Indian cities for deterministic threat origin mapping
const INDIA_CITIES: [number, number][] = [
  [28.6139, 77.2090],   // New Delhi
  [19.0760, 72.8777],   // Mumbai
  [12.9716, 77.5946],   // Bangalore
  [22.5726, 88.3639],   // Kolkata
  [17.3850, 78.4867],   // Hyderabad
  [13.0827, 80.2707],   // Chennai
  [23.0225, 72.5714],   // Ahmedabad
  [18.5204, 73.8567],   // Pune
  [26.9124, 75.7873],   // Jaipur
  [21.1702, 72.8311],   // Surat
  [22.7196, 75.8577],   // Indore
  [25.3176, 82.9739],   // Varanasi
  [11.0168, 76.9558],   // Coimbatore
  [15.3173, 75.7139],   // Hubli
  [26.4499, 80.3319],   // Kanpur
  [30.7333, 76.7794],   // Chandigarh
  [21.2514, 81.6296],   // Raipur
  [20.2961, 85.8245],   // Bhubaneswar
  [26.8467, 80.9462],   // Lucknow
  [23.2599, 77.4126],   // Bhopal
];

const getDeterministicCoord = (ip: string): [number, number] => {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash * 31 + ip.charCodeAt(i)) & 0xffff;
  }
  const city = INDIA_CITIES[hash % INDIA_CITIES.length];
  // Small deterministic jitter within ~40km
  const latOffset = ((hash % 100) - 50) * 0.004;
  const lngOffset = (((hash >> 4) % 100) - 50) * 0.004;
  return [city[0] + latOffset, city[1] + lngOffset];
};

export const GeoThreatMap: React.FC<GeoThreatMapProps> = ({ alerts }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="soc-card p-5 h-full min-h-[380px] flex items-center justify-center font-mono text-xs text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Globe className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="tracking-wider text-[11px]">INITIALIZING INDIA THREAT MAP...</span>
        </div>
      </div>
    );
  }

  const recentAlerts = [...alerts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  // India bounds: roughly SW(6.5, 68) to NE(37.5, 97.5)
  const indiaBounds: [[number, number], [number, number]] = [
    [6.5, 68.0],
    [37.5, 97.5]
  ];

  return (
    <div className="soc-card flex flex-col justify-between h-full min-h-[380px] overflow-hidden">
      {/* Header */}
      <div className="soc-card-header">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs md:text-sm text-slate-100 font-mono tracking-wide truncate">
              INDIA THREAT ORIGINS
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              Deterministic Alert Ingress · Indian Network Nodes
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-white/10 shrink-0 ml-2">
          <strong className="text-slate-200 tabular-nums">{recentAlerts.length}</strong> Nodes
        </span>
      </div>

      {/* Map Surface */}
      <div className="flex-1 relative w-full overflow-hidden" style={{ minHeight: '260px' }}>
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={4.5}
          minZoom={4}
          maxZoom={8}
          maxBounds={indiaBounds}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%', background: '#030712' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {recentAlerts.map(alert => {
            const coords = getDeterministicCoord(alert.sourceIp || alert.id);
            const isCritical = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';

            return (
              <CircleMarker
                key={alert.id}
                center={coords}
                radius={isCritical ? 8 : isHigh ? 6 : 4}
                pathOptions={{
                  color: isCritical ? '#f43f5e' : isHigh ? '#f59e0b' : '#38bdf8',
                  fillColor: isCritical ? '#f43f5e' : isHigh ? '#f59e0b' : '#38bdf8',
                  fillOpacity: 0.75,
                  weight: 1.5
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 font-mono text-xs">
                    <strong className="text-rose-400 block text-xs">{alert.sourceIp}</strong>
                    <span className="text-slate-700 block">{alert.attackType}</span>
                    <span className="text-slate-500 block text-[10px]">
                      Severity: <span className={`font-bold ${isCritical ? 'text-red-600' : isHigh ? 'text-amber-600' : 'text-sky-600'}`}>{alert.severity}</span>
                    </span>
                    <span className="text-slate-500 block text-[10px]">Risk: {alert.riskScore}</span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend overlay */}
        <div className="absolute bottom-2 left-2 z-[1000] flex flex-col gap-1 bg-slate-950/80 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-2 font-mono text-[9px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
            <span>Medium / Low</span>
          </div>
        </div>
      </div>
    </div>
  );
};
