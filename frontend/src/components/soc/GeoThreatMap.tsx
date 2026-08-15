'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Alert } from '@/types';
import { Map, Globe } from 'lucide-react';

// Leaflet relies on window, so we must dynamically import it with ssr: false
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface GeoThreatMapProps {
  alerts: Alert[];
}

const getCoordinatesForCountry = (country: string | undefined): [number, number] => {
  if (!country) return [20.0, 0.0];
  const map: Record<string, [number, number]> = {
    'US (United States)': [37.0902, -95.7129],
    'CN (China)': [35.8617, 104.1954],
    'RU (Russian Federation)': [61.524, 105.3188],
    'DE (Germany)': [51.1657, 10.4515],
    'NL (Netherlands)': [52.1326, 5.2913],
    'BR (Brazil)': [-14.235, -51.9253],
    'IN (India)': [20.5937, 78.9629],
    'FR (France)': [46.2276, 2.2137],
    'UA (Ukraine)': [48.3794, 31.1656]
  };
  
  // Find key substring match if full string isn't exact
  for (const [key, coords] of Object.entries(map)) {
    if (country.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
      return coords;
    }
  }
  return [20.0, 0.0];
};

const getDeterministicOffset = (ip: string): [number, number] => {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash * 31 + ip.charCodeAt(i)) & 0xffff;
  }
  const latOffset = ((hash % 15) - 7) * 0.15;
  const lngOffset = (((hash >> 4) % 15) - 7) * 0.15;
  return [latOffset, lngOffset];
};

export const GeoThreatMap: React.FC<GeoThreatMapProps> = ({ alerts }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-80 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center">
        <div className="animate-spin text-cyan-500">
          <Globe className="w-8 h-8" />
        </div>
      </div>
    );
  }

  // Get only the 50 most recent alerts to avoid cluttering the map
  const recentAlerts = [...alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);

  return (
    <div className="rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/10 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-sm text-slate-100 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">GLOBAL THREAT ORIGINS</h3>
        </div>
      </div>
      <div className="flex-1 relative w-full h-[400px]">
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {recentAlerts.map(alert => {
            const coords = getCoordinatesForCountry(alert.threatIntel?.country);
            const offset = getDeterministicOffset(alert.sourceIp || alert.id);
            const offsetCoords: [number, number] = [
              coords[0] + offset[0],
              coords[1] + offset[1]
            ];

            return (
              <CircleMarker
                key={alert.id}
                center={offsetCoords}
                radius={alert.severity === 'CRITICAL' ? 8 : 5}
                pathOptions={{
                  color: alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                  fillColor: alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                  fillOpacity: 0.6,
                }}
              >
                <Popup className="bg-slate-900 border border-slate-800 text-slate-200">
                  <div className="p-1">
                    <strong className="text-red-400 block">{alert.sourceIp}</strong>
                    <span className="text-xs text-slate-400 block mt-1">{alert.attackType}</span>
                    <span className="text-xs text-slate-500 block">{alert.threatIntel?.country}</span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
