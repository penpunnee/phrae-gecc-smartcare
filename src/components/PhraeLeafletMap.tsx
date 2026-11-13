'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  VulnerablePerson,
  RiverGaugeStation,
  District,
  VulnerableCategory,
} from '@/types';
import { Layers, RotateCcw, MapPin, Waves, AlertTriangle } from 'lucide-react';

interface PhraeLeafletMapProps {
  vulnerableList: VulnerablePerson[];
  riverGauges: RiverGaugeStation[];
  selectedDistrict: string;
  selectedCategory: string;
  floodEmergencyMode: boolean;
  isDemoMode: boolean;
  isOfficerUnmasked: boolean;
  selectedPerson: VulnerablePerson | null;
  onSelectPerson: (person: VulnerablePerson) => void;
  onSelectDistrict: (district: string) => void;
  onSelectGauge?: (gauge: RiverGaugeStation) => void;
}

const DISTRICT_COORDS: Record<District, [number, number]> = {
  'สอง': [18.3845, 100.2012],
  'ร้องกวาง': [18.2612, 100.3125],
  'หนองม่วงไข่': [18.2251, 100.1985],
  'เมืองแพร่': [18.1446, 100.1403],
  'สูงเม่น': [18.0682, 100.1189],
  'เด่นชัย': [17.9785, 100.0542],
  'ลอง': [18.0954, 99.8321],
  'วังชิ้น': [17.8921, 99.6105],
};

const CATEGORY_COLORS: Record<VulnerableCategory, { pin: string; text: string; bg: string }> = {
  'ผู้พิการติดเตียง': { pin: '#ef4444', text: 'text-rose-700', bg: 'bg-rose-50' },
  'ผู้สูงอายุอยู่ลำพัง': { pin: '#f97316', text: 'text-amber-700', bg: 'bg-amber-50' },
  'ครอบครัวเปราะบาง': { pin: '#2563eb', text: 'text-blue-700', bg: 'bg-blue-50' },
};

// District name normalization helper
function normalizeDistrictName(rawName: string): District | null {
  if (!rawName) return null;
  const clean = rawName.replace('อำเภอ', '').trim();
  const validDistricts: District[] = [
    'เมืองแพร่',
    'ร้องกวาง',
    'ลอง',
    'สูงเม่น',
    'เด่นชัย',
    'สอง',
    'วังชิ้น',
    'หนองม่วงไข่',
  ];
  return validDistricts.find((d) => clean === d || clean.includes(d)) || null;
}

export default function PhraeLeafletMap({
  vulnerableList,
  riverGauges,
  selectedDistrict,
  selectedCategory,
  floodEmergencyMode,
  isDemoMode,
  isOfficerUnmasked,
  selectedPerson,
  onSelectPerson,
  onSelectDistrict,
  onSelectGauge,
}: PhraeLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const baseLayersRef = useRef<{ street: L.TileLayer; satellite: L.TileLayer } | null>(null);
  const districtLayerRef = useRef<L.GeoJSON | null>(null);
  const riverLayerRef = useRef<L.GeoJSON | null>(null);
  const floodLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const gaugeMarkersRef = useRef<L.LayerGroup | null>(null);

  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [geoJsonData, setGeoJsonData] = useState<{
    districts: any;
    river: any;
    flood: any;
  } | null>(null);
  const [isLoadingLayers, setIsLoadingLayers] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center coordinates of Phrae Province
    const phraeCenter: L.LatLngExpression = [18.1446, 100.1403];

    const map = L.map(mapContainerRef.current, {
      center: phraeCenter,
      zoom: 9.5,
      minZoom: 8,
      maxZoom: 18,
      zoomControl: false,
    });

    // Add Zoom Control to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create Base Layers
    const street = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }
    );

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri &copy; Earthstar Geographics',
        maxZoom: 18,
      }
    );

    street.addTo(map);
    baseLayersRef.current = { street, satellite };

    // Initialize Layer Groups
    markersLayerRef.current = L.layerGroup().addTo(map);
    gaugeMarkersRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Load GeoJSON datasets
    Promise.all([
      fetch('/phrae-districts.geojson').then((r) => r.json()).catch(() => null),
      fetch('/yom-river.geojson').then((r) => r.json()).catch(() => null),
      fetch('/flood_mueang_phrae_v2.geojson').then((r) => r.json()).catch(() => null),
    ])
      .then(([districts, river, flood]) => {
        setGeoJsonData({ districts, river, flood });
      })
      .finally(() => {
        setIsLoadingLayers(false);
      });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Base Map switch (Street vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const baseLayers = baseLayersRef.current;
    if (!map || !baseLayers) return;

    if (mapType === 'satellite') {
      map.removeLayer(baseLayers.street);
      map.addLayer(baseLayers.satellite);
    } else {
      map.removeLayer(baseLayers.satellite);
      map.addLayer(baseLayers.street);
    }
  }, [mapType]);

  // Render & Update District Boundaries
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonData?.districts) return;

    if (districtLayerRef.current) {
      map.removeLayer(districtLayerRef.current);
    }

    const layer = L.geoJSON(geoJsonData.districts, {
      style: (feature) => {
        const rawName = feature?.properties?.name || '';
        const districtName = normalizeDistrictName(rawName);
        const isSelected = selectedDistrict !== 'all' && districtName === selectedDistrict;

        return {
          color: isSelected ? '#d81b60' : '#475569',
          weight: isSelected ? 3.5 : 1.5,
          opacity: isSelected ? 1 : 0.6,
          fillColor: isSelected ? '#f472b6' : feature?.properties?.color || '#3b82f6',
          fillOpacity: isSelected ? 0.35 : 0.12,
          dashArray: isSelected ? undefined : '3 3',
        };
      },
      onEachFeature: (feature, l) => {
        const rawName = feature?.properties?.name || '';
        const districtName = normalizeDistrictName(rawName);
        if (districtName) {
          l.bindTooltip(`<b>อ.${districtName}</b>`, {
            permanent: false,
            direction: 'center',
            className: 'district-map-tooltip',
          });

          l.on({
            click: () => {
              onSelectDistrict(selectedDistrict === districtName ? 'all' : districtName);
            },
            mouseover: (e) => {
              const target = e.target;
              if (selectedDistrict !== districtName) {
                target.setStyle({ fillOpacity: 0.28, weight: 2.5, color: '#ec4899' });
              }
            },
            mouseout: (e) => {
              const target = e.target;
              if (selectedDistrict !== districtName) {
                target.setStyle({
                  fillOpacity: 0.12,
                  weight: 1.5,
                  color: '#475569',
                });
              }
            },
          });
        }
      },
    });

    layer.addTo(map);
    districtLayerRef.current = layer;
  }, [geoJsonData?.districts, selectedDistrict, onSelectDistrict]);

  // Render & Update Yom River Path
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonData?.river) return;

    if (riverLayerRef.current) {
      map.removeLayer(riverLayerRef.current);
    }

    const isRiverAlert = floodEmergencyMode || isDemoMode;

    const layer = L.geoJSON(geoJsonData.river, {
      style: {
        color: isRiverAlert ? '#ef4444' : '#0284c7',
        weight: isRiverAlert ? 5.5 : 3.5,
        opacity: isRiverAlert ? 0.95 : 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      },
    });

    layer.bindTooltip(
      isRiverAlert
        ? '⚠️ แม่น้ำยม (สภาวะเฝ้าระวังภัยพิบัติน้ำท่วม)'
        : '🌊 แม่น้ำยม (Yom River)',
      { sticky: true }
    );

    layer.addTo(map);
    riverLayerRef.current = layer;
  }, [geoJsonData?.river, floodEmergencyMode, isDemoMode]);

  // Render & Update Flood Hazard Polygon
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonData?.flood) return;

    if (floodLayerRef.current) {
      map.removeLayer(floodLayerRef.current);
      floodLayerRef.current = null;
    }

    if (floodEmergencyMode || isDemoMode) {
      const layer = L.geoJSON(geoJsonData.flood, {
        style: {
          color: '#dc2626',
          weight: 2,
          opacity: 0.85,
          fillColor: '#ef4444',
          fillOpacity: 0.45,
          dashArray: '5 5',
        },
      });

      layer.bindTooltip('🚨 บริเวณพื้นที่น้ำท่วมขังริมแม่น้ำยม (GISTDA Satellite Extent)', {
        sticky: true,
      });

      layer.addTo(map);
      floodLayerRef.current = layer;
    }
  }, [geoJsonData?.flood, floodEmergencyMode, isDemoMode]);

  // Render River Gauge Stations (Sorted: Y.20 -> Y.1C -> Y.37 -> Y.31)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = gaugeMarkersRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Priority sort order: Y.20 (Song) -> Y.1C (Mueang) -> Y.37 (Wang Chin) -> Y.31 (Den Chai)
    const ORDER_MAP: Record<string, number> = {
      'Y.20': 1,
      'Y.1C': 2,
      'Y.37': 3,
      'Y.31': 4,
    };

    const sortedGauges = [...riverGauges].sort(
      (a, b) => (ORDER_MAP[a.code] || 99) - (ORDER_MAP[b.code] || 99)
    );

    sortedGauges.forEach((gauge) => {
      const isCritical = gauge.status === 'critical';
      const isWarning = gauge.status === 'warning';
      const badgeBg = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#0284c7';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${
            isCritical
              ? '<div class="absolute -inset-2.5 rounded-full bg-red-500/50 animate-ping"></div>'
              : ''
          }
          <div class="w-9 h-9 rounded-xl shadow-xl flex flex-col items-center justify-center text-white font-bold border-2 border-white transition-transform duration-200 hover:scale-125" style="background-color: ${badgeBg};">
            <span class="text-[9px] leading-tight font-black">${gauge.code}</span>
            <span class="text-[8px] opacity-90">${gauge.waterLevelMeters.toFixed(1)}m</span>
          </div>
        </div>
      `;

      const divIcon = L.divIcon({
        className: 'custom-gauge-icon',
        html: iconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([gauge.lat, gauge.lng], { icon: divIcon });

      const popupHtml = `
        <div class="p-2 space-y-1 text-slate-800">
          <div class="flex items-center justify-between gap-2 border-b pb-1">
            <span class="font-bold text-xs font-mono text-indigo-700">สถานี ${gauge.code}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-black text-white" style="background-color: ${badgeBg}">
              ${gauge.statusText}
            </span>
          </div>
          <div class="font-bold text-sm text-slate-900">${gauge.name}</div>
          <div class="text-[11px] text-slate-600">อ.${gauge.district} (${gauge.subDistrict})</div>
          <div class="pt-1 text-xs">
            <div>ระดับน้ำ: <b class="text-indigo-600">${gauge.waterLevelMeters.toFixed(2)} ม.</b></div>
            <div>ระดับวิกฤต: <b>${gauge.criticalLevelMeters.toFixed(2)} ม.</b></div>
            <div>อัตราการไหล: <b>${gauge.currentFlowM3s || '-'} ลบ.ม./วินาที</b></div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (onSelectGauge) onSelectGauge(gauge);
      });

      marker.addTo(group);
    });
  }, [riverGauges, onSelectGauge]);

  // Render Vulnerable Person Markers (with PDPA masking)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Filter vulnerable list based on active filters
    const filtered = vulnerableList.filter((p) => {
      if (floodEmergencyMode && !p.inFloodRiskArea) return false;
      if (selectedDistrict !== 'all' && p.district !== selectedDistrict) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      return true;
    });

    filtered.forEach((person) => {
      const colors = CATEGORY_COLORS[person.category];
      const isSelected = selectedPerson?.id === person.id;
      const displayName = isOfficerUnmasked
        ? person.name
        : person.maskedName || person.name;

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${
            person.inFloodRiskArea || isSelected
              ? `<div class="absolute -inset-2 rounded-full ${
                  person.inFloodRiskArea ? 'bg-red-500/50' : 'bg-cyan-500/50'
                } animate-ping"></div>`
              : ''
          }
          <div class="w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-white font-black border-2 border-white transition-transform duration-200 hover:scale-125 ${
            isSelected ? 'ring-4 ring-pink-400' : ''
          }" style="background-color: ${colors.pin};">
            <span class="text-[11px]">📍</span>
          </div>
        </div>
      `;

      const divIcon = L.divIcon({
        className: 'custom-person-pin',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([person.lat, person.lng], { icon: divIcon });

      const popupHtml = `
        <div class="p-2 space-y-1.5 text-slate-800 max-w-[220px]">
          <div class="flex items-center justify-between gap-1 border-b pb-1">
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style="background-color: ${colors.pin}">
              ${person.category}
            </span>
            ${
              person.inFloodRiskArea
                ? '<span class="text-[9px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded">⚠️ เสี่ยงน้ำท่วม</span>'
                : ''
            }
          </div>
          <div class="font-bold text-sm text-slate-900">${displayName}</div>
          <div class="text-[11px] text-slate-600">
            อายุ ${person.age} ปี • ${person.village} ${person.subDistrict} อ.${person.district}
          </div>
          <div class="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded">
            <b>ความต้องการ:</b> ${person.assistanceNeeded}
          </div>
          <div class="pt-1 flex gap-1">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${person.lat},${person.lng}"
               target="_blank" rel="noopener noreferrer"
               class="w-full text-center py-1 rounded bg-[#1a237e] text-white text-[10px] font-bold hover:bg-[#121858]">
              นำทาง (Google Maps)
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectPerson(person);
      });

      marker.addTo(group);
    });
  }, [
    vulnerableList,
    selectedDistrict,
    selectedCategory,
    floodEmergencyMode,
    selectedPerson,
    isOfficerUnmasked,
    onSelectPerson,
  ]);

  // Center on selected district or person
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedPerson) {
      map.setView([selectedPerson.lat, selectedPerson.lng], 14, { animate: true });
    } else if (selectedDistrict !== 'all' && DISTRICT_COORDS[selectedDistrict as District]) {
      const coords = DISTRICT_COORDS[selectedDistrict as District];
      map.setView(coords, 11, { animate: true });
    }
  }, [selectedPerson, selectedDistrict]);

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([18.1446, 100.1403], 9.5, { animate: true });
    onSelectDistrict('all');
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Controls: Switch Base Map & Reset Zoom */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Street vs Satellite toggle */}
        <button
          onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold shadow-lg border border-slate-700 backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          title="สลับแผนที่ถนน / ภาพถ่ายดาวเทียม"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{mapType === 'street' ? '🛰️ แผนที่ดาวเทียม' : '🗺️ แผนที่ถนน'}</span>
        </button>

        {/* Reset Zoom to Phrae Province */}
        <button
          onClick={handleResetView}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold shadow-lg border border-slate-700 backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          title="กลับสู่มุมมองรวมจังหวัดแพร่"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>รีเซ็ตมุมมอง (จ.แพร่)</span>
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoadingLayers && (
        <div className="absolute inset-0 z-[1001] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-200">
              กำลังโหลดข้อมูลแผนที่ GIS และแม่น้ำยม...
            </span>
          </div>
        </div>
      )}

      {/* Live Hydrologic & GIS Legend Footer */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-700 px-3 py-2 rounded-xl text-[11px] text-white flex flex-wrap items-center gap-3 shadow-lg">
        <span className="font-bold text-slate-300 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-pink-500" />
          <span>GIS จ.แพร่</span>
        </span>
        <div className="h-3 w-px bg-slate-700"></div>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>ติดเตียง</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span>สูงอายุลำพัง</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>ครอบครัวเปราะบาง</span>
        </span>
        <div className="h-3 w-px bg-slate-700"></div>
        <span className="flex items-center gap-1">
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span>แม่น้ำยม (Y.20 &rarr; Y.1C &rarr; Y.37)</span>
        </span>
      </div>
    </div>
  );
}

