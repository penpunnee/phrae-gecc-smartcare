'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PdpaConsentBox from '@/components/PdpaConsentBox';
import {
  VulnerablePerson,
  VulnerableCategory,
  District,
  RiverGaugeStation,
} from '@/types';
import { getFallbackRiverGauges } from '@/lib/gisFallbackData';
import {
  MapPin,
  AlertTriangle,
  Radio,
  Send,
  Navigation,
  Phone,
  User,
  Heart,
  PlusCircle,
  Building,
  CheckCircle2,
  Waves,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Activity,
  Zap,
  Info,
  Layers,
  Flame,
  ArrowUpRight,
  RefreshCw,
  Compass,
} from 'lucide-react';

// Dynamic import for Leaflet map to guarantee no SSR window errors
const PhraeLeafletMap = dynamic(() => import('@/components/PhraeLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-slate-900 rounded-2xl flex items-center justify-center text-white border border-slate-700">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-bold text-slate-200">
          กำลังโหลดแผนที่ GIS จังหวัดแพร่ (Leaflet Engine)...
        </span>
      </div>
    </div>
  ),
});

interface GisProactiveMapProps {
  vulnerableList: VulnerablePerson[];
  onAddVulnerable: (newPerson: VulnerablePerson) => void;
  onDispatchEmergency: () => Promise<void>;
  onOpenPrivacyPolicy?: () => void;
}

const DISTRICT_COORDS: Record<District, { x: number; y: number; lat: number; lng: number }> = {
  'สอง': { x: 380, y: 70, lat: 18.3845, lng: 100.2012 },
  'ร้องกวาง': { x: 500, y: 150, lat: 18.2612, lng: 100.3125 },
  'หนองม่วงไข่': { x: 420, y: 170, lat: 18.2251, lng: 100.1985 },
  'เมืองแพร่': { x: 390, y: 250, lat: 18.1446, lng: 100.1403 },
  'สูงเม่น': { x: 370, y: 340, lat: 18.0682, lng: 100.1189 },
  'เด่นชัย': { x: 410, y: 420, lat: 17.9785, lng: 100.0542 },
  'ลอง': { x: 230, y: 280, lat: 18.0954, lng: 99.8321 },
  'วังชิ้น': { x: 190, y: 460, lat: 17.8921, lng: 99.6105 },
};

const CATEGORY_COLORS: Record<VulnerableCategory, { bg: string; text: string; pin: string; border: string }> = {
  'ผู้พิการติดเตียง': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    pin: '#ef4444',
    border: 'border-rose-500',
  },
  'ผู้สูงอายุอยู่ลำพัง': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    pin: '#f97316',
    border: 'border-amber-500',
  },
  'ครอบครัวเปราะบาง': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    pin: '#2563eb',
    border: 'border-blue-500',
  },
};

// Guarantee strict order: Y.20 (Upstream Song) -> Y.1C (Mueang) -> Y.37 (Wang Chin) -> Y.31 (Den Chai)
const sortGaugesOrder = (gauges: RiverGaugeStation[]): RiverGaugeStation[] => {
  const ORDER: Record<string, number> = {
    'Y.20': 1,
    'Y.1C': 2,
    'Y.37': 3,
    'Y.31': 4,
  };
  return [...gauges].sort((a, b) => (ORDER[a.code] || 99) - (ORDER[b.code] || 99));
};

export default function GisProactiveMap({
  vulnerableList,
  onAddVulnerable,
  onDispatchEmergency,
  onOpenPrivacyPolicy,
}: GisProactiveMapProps) {
  // Flood warning mode and Demo Mode
  const [floodEmergencyMode, setFloodEmergencyMode] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isOfficerUnmasked, setIsOfficerUnmasked] = useState(false); // PDPA toggle

  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPerson, setSelectedPerson] = useState<VulnerablePerson | null>(null);
  const [selectedGauge, setSelectedGauge] = useState<RiverGaugeStation | null>(null);

  // River Gauges from API - Initialized with Y.20 in 1st position
  const [riverGauges, setRiverGauges] = useState<RiverGaugeStation[]>(() =>
    sortGaugesOrder(getFallbackRiverGauges(false))
  );
  const [isLoadingGauges, setIsLoadingGauges] = useState(false);

  // Form modal for APAM
  const [isPinningModalOpen, setIsPinningModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('65');
  const [newCategory, setNewCategory] = useState<VulnerableCategory>('ผู้พิการติดเตียง');
  const [newDistrict, setNewDistrict] = useState<District>('เมืองแพร่');
  const [newSubDistrict, setNewSubDistrict] = useState('');
  const [newVillage, setNewVillage] = useState('');
  const [newLat, setNewLat] = useState('18.1446');
  const [newLng, setNewLng] = useState('100.1403');
  const [newInFloodArea, setNewInFloodArea] = useState(true);
  const [newAssistance, setNewAssistance] = useState('');
  const [newApamName, setNewApamName] = useState('');
  const [newApamPhone, setNewApamPhone] = useState('');
  const [pinPdpaConsent, setPinPdpaConsent] = useState(false);
  const [pinErrorMsg, setPinErrorMsg] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchAlert, setDispatchAlert] = useState<string | null>(null);

  // Load River Gauges from API and sort strictly with Y.20 first
  const fetchRiverGauges = async (simulateCritical = false) => {
    setIsLoadingGauges(true);
    try {
      const url = simulateCritical
        ? '/api/gis/river-gauges?simulateCritical=true'
        : '/api/gis/river-gauges';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRiverGauges(sortGaugesOrder(json.data));
      }
    } catch (err) {
      console.error('Failed to load river gauges:', err);
      setRiverGauges(sortGaugesOrder(getFallbackRiverGauges(simulateCritical)));
    } finally {
      setIsLoadingGauges(false);
    }
  };

  useEffect(() => {
    fetchRiverGauges(isDemoMode);
  }, [isDemoMode]);

  // Toggle Special Demo Mode for GECC Committee Presentation
  const handleToggleDemoMode = async () => {
    const nextDemoState = !isDemoMode;
    setIsDemoMode(nextDemoState);
    if (nextDemoState) {
      setFloodEmergencyMode(true);
      await fetchRiverGauges(true);
      setDispatchAlert(
        '⚡ [โหมดจำลองสถานการณ์น้ำยมวิกฤต (Demo Mode)]: จำลองสถานี Y.20 (อ.สอง) และ Y.1C (อ.เมือง) เข้าสู่ภาวะวิกฤตล้นตลิ่ง พร้อมคัดกรองกลุ่มเปราะบางริมน้ำยมทันที'
      );
    } else {
      setFloodEmergencyMode(false);
      await fetchRiverGauges(false);
      setDispatchAlert(null);
    }
  };

  // Toggle Standard Flood Emergency Mode
  const handleToggleFloodMode = async () => {
    const nextFlood = !floodEmergencyMode;
    setFloodEmergencyMode(nextFlood);
    if (!nextFlood && isDemoMode) {
      setIsDemoMode(false);
      await fetchRiverGauges(false);
    }
  };

  // Dispatch SOS Emergency to APAM Network
  const handleDispatch = async () => {
    setIsDispatching(true);
    await onDispatchEmergency();
    setIsDispatching(false);
    setDispatchAlert(
      `✓ ส่งพิกัดและสัญญาณ SOS ไปยังเครือข่าย อพม. จ.แพร่ (${floodRiskTotal} ราย) เรียบร้อยแล้ว ทีมกู้ชีพ-กู้ภัยและ อพม. เตรียมพร้อมอพยพทันที`
    );
    setTimeout(() => setDispatchAlert(null), 8000);
  };

  // Create new Pin from APAM
  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinErrorMsg('');
    if (!newName.trim()) return;
    if (!pinPdpaConsent) {
      setPinErrorMsg('กรุณาติ๊กยินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ก่อนบันทึกหมุด');
      return;
    }
    setIsSubmittingPin(true);

    try {
      const res = await fetch('/api/gis/vulnerable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          age: Number(newAge) || 60,
          category: newCategory,
          district: newDistrict,
          subDistrict: newSubDistrict.trim() || 'ต.ในเวียง',
          village: newVillage.trim() || 'ม.1',
          lat: Number(newLat) || 18.1446,
          lng: Number(newLng) || 100.1403,
          inFloodRiskArea: newInFloodArea,
          assistanceNeeded: newAssistance.trim() || 'ขอรับการตรวจเยี่ยมและช่วยเหลือสวัสดิการ',
          apamName: newApamName.trim() || 'อพม.จิตอาสา จ.แพร่',
          apamPhone: newApamPhone.trim(),
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        onAddVulnerable(json.data);
        setSelectedPerson(json.data);
        setIsPinningModalOpen(false);
        setNewName('');
        setNewAssistance('');
        setPinPdpaConsent(false);
      }
    } catch (err) {
      console.error('Error pinning:', err);
    } finally {
      setIsSubmittingPin(false);
    }
  };

  // Filter list
  const filteredList = vulnerableList.filter((p) => {
    if (floodEmergencyMode && !p.inFloodRiskArea) return false;
    if (selectedDistrict !== 'all' && p.district !== selectedDistrict) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    return true;
  });

  const floodRiskTotal = vulnerableList.filter((p) => p.inFloodRiskArea).length;

  // Extract display values respecting PDPA
  const getDisplayName = (person: VulnerablePerson) => {
    if (isOfficerUnmasked) return person.name;
    return person.maskedName || person.name;
  };

  const getDisplayApamPhone = (person: VulnerablePerson) => {
    if (isOfficerUnmasked) return person.apamPhone;
    return person.maskedApamPhone || person.apamPhone;
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* TOP COMMAND BANNER: CRISIS BUTTONS & TELEMETRY CONTROLS */}
      {/* ============================================================== */}
      <div
        className={`rounded-3xl p-6 sm:p-8 shadow-xl border-2 transition-all duration-300 ${
          floodEmergencyMode
            ? 'bg-gradient-to-r from-red-950 via-rose-900 to-indigo-950 text-white border-red-500 shadow-red-500/20'
            : 'bg-white text-slate-800 border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm ${
                  floodEmergencyMode
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-pink-100 text-[#d81b60]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Smart GIS Command Center • พมจ.แพร่</span>
              </span>

              {isDemoMode && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-md animate-bounce">
                  <Zap className="w-3.5 h-3.5" />
                  <span>DEMO Y.20 & Y.1C CRITICAL MODE</span>
                </span>
              )}

              <span
                className={`text-xs font-semibold ${
                  floodEmergencyMode ? 'text-red-200' : 'text-slate-500'
                }`}
              >
                ศูนย์บริการร่วม พมจ.แพร่ x อพม. 8 อำเภอ • พิกัดศูนย์กลาง 18.1446° N, 100.1403° E
              </span>
            </div>

            <h2
              className={`text-2xl sm:text-3xl font-black font-heading tracking-tight ${
                floodEmergencyMode ? 'text-white' : 'text-[#1a237e]'
              }`}
            >
              แผนที่เชิงรุก GIS บริการกลุ่มเปราะบาง (Proactive Care)
            </h2>
            <p
              className={`text-xs sm:text-sm max-w-2xl ${
                floodEmergencyMode ? 'text-rose-100' : 'text-slate-600'
              }`}
            >
              ระบบสารสนเทศภูมิศาสตร์ชี้เป้าบ้านกลุ่มเปราะบาง เชื่อมโยงแนวแม่น้ำยมจาก อ.สอง ผ่าน อ.เมือง สู่ อ.วังชิ้น เพื่อเฝ้าระวังภัยพิบัติและสั่งการช่วยเหลือทันท่วงที
            </p>
          </div>

          {/* ACTION CONTROLS: DEMO BUTTON, FLOOD SWITCH, APAM PINNING */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* SPECIAL GECC DEMO BUTTON */}
            <button
              onClick={handleToggleDemoMode}
              className={`px-4 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer transform active:scale-95 border-2 ${
                isDemoMode
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 ring-4 ring-amber-300/40 animate-pulse'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
              title="สำหรับวันตรวจประเมินของคณะกรรมการ GECC"
            >
              <Zap className={`w-4 h-4 ${isDemoMode ? 'text-slate-950 fill-current' : 'text-amber-600'}`} />
              <span>
                {isDemoMode
                  ? '⚡ ปิดโหมดจำลองสถานการณ์'
                  : '⚡ จำลองสถานการณ์น้ำยมวิกฤต (Demo Mode)'}
              </span>
            </button>

            {/* Standard Flood Emergency Switch */}
            <button
              onClick={handleToggleFloodMode}
              className={`px-4 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer transform active:scale-95 ${
                floodEmergencyMode
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-red-600/40 ring-4 ring-red-400/30'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 animate-pulse text-amber-300" />
              <span>
                {floodEmergencyMode
                  ? '🚨 ปิดโหมดเฝ้าระวังน้ำท่วม'
                  : '🚨 โหมดเฝ้าระวังน้ำท่วมแม่น้ำยม'}
              </span>
            </button>

            {/* APAM Pinning Button */}
            <button
              onClick={() => setIsPinningModalOpen(true)}
              className="px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#1a237e] to-[#283593] hover:from-[#121858] hover:to-[#1a237e] text-white flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-pink-300" />
              <span>อพม. ปักหมุดรายใหม่</span>
            </button>
          </div>
        </div>

        {/* Flood Alert Dispatch Ribbon (When Flood or Demo Mode is ON) */}
        {floodEmergencyMode && (
          <div className="mt-6 pt-5 border-t border-red-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 animate-bounce shadow-lg">
                <Waves className="w-6 h-6" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-extrabold text-amber-300 block text-sm">
                  {isDemoMode
                    ? '⚡ [จำลองสถานการณ์วิกฤต] ระดับน้ำสถานี Y.20 (12.80 ม.) และ Y.1C (9.85 ม.) เข้าขั้นวิกฤตล้นตลิ่ง!'
                    : `เฝ้าระวังระดับน้ำแม่น้ำยม: กรองกลุ่มเปราะบางในพื้นที่เสี่ยงภัยริมน้ำยม ${floodRiskTotal} ราย`}
                </span>
                <span className="text-rose-200 text-xs">
                  ครอบคลุมแนวลุ่มน้ำยม อ.สอง (ตอนบน), อ.เมืองแพร่ (ตอนกลาง), อ.สูงเม่น, และ อ.วังชิ้น (ตอนล่าง) พร้อมสั่งการช่วยเหลือฉุกเฉินทันที
                </span>
              </div>
            </div>

            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>
                {isDispatching
                  ? 'กำลังส่งพิกัด SOS...'
                  : 'ส่งพิกัดแจ้ง อพม. เข้าช่วยเหลือฉุกเฉิน'}
              </span>
            </button>
          </div>
        )}

        {/* Dispatch Alert Banner */}
        {dispatchAlert && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-between animate-in zoom-in-95 shadow-md">
            <span>{dispatchAlert}</span>
            <button
              onClick={() => setDispatchAlert(null)}
              className="text-slate-900 font-bold px-2 py-0.5 rounded hover:bg-emerald-600 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* RIVER GAUGE LIVE TELEMETRY STRIP (Y.20 FIRST -> Y.1C -> Y.37 -> Y.31) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {riverGauges.map((gauge) => {
          const isCritical = gauge.status === 'critical';
          const isWarning = gauge.status === 'warning';
          const percentToCritical = Math.min(
            100,
            Math.round((gauge.waterLevelMeters / gauge.criticalLevelMeters) * 100)
          );

          return (
            <div
              key={gauge.id}
              onClick={() => setSelectedGauge(gauge)}
              className={`rounded-2xl p-4 border transition-all cursor-pointer shadow-md ${
                isCritical
                  ? 'bg-gradient-to-br from-rose-950/90 to-red-900/90 text-white border-red-500 ring-2 ring-red-500/50'
                  : isWarning
                  ? 'bg-amber-50/90 text-slate-900 border-amber-300'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                  สถานี {gauge.code}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isCritical
                      ? 'bg-red-500 text-white animate-pulse'
                      : isWarning
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <Waves className="w-3 h-3" />
                  <span>
                    {isCritical ? 'วิกฤตล้นตลิ่ง' : isWarning ? 'เฝ้าระวัง' : 'ระดับปกติ'}
                  </span>
                </span>
              </div>

              <h4 className="text-xs font-bold truncate mb-1">
                {gauge.name}
              </h4>
              <p className={`text-[11px] mb-3 ${isCritical ? 'text-rose-200' : 'text-slate-500'}`}>
                อ.{gauge.district} ({gauge.subDistrict})
              </p>

              {/* Water level value & gauge */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className={`text-[11px] font-semibold ${isCritical ? 'text-rose-200' : 'text-slate-500'}`}>
                    ระดับน้ำปัจจุบัน:
                  </span>
                  <span
                    className={`font-mono text-lg font-black ${
                      isCritical ? 'text-amber-300' : isWarning ? 'text-amber-600' : 'text-indigo-600'
                    }`}
                  >
                    {gauge.waterLevelMeters.toFixed(2)}{' '}
                    <span className="text-xs font-normal">ม.</span>
                  </span>
                </div>

                {/* Progress bar towards critical */}
                <div className="w-full h-2 rounded-full bg-slate-200/50 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCritical
                        ? 'bg-red-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${percentToCritical}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>เตือนภัย: {gauge.warningLevelMeters.toFixed(2)}ม.</span>
                  <span className={isCritical ? 'text-amber-300 font-bold' : ''}>
                    วิกฤต: {gauge.criticalLevelMeters.toFixed(2)}ม.
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* MAIN MAP VIEW & CONTROLS GRID */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real Interactive Leaflet GIS Map of Phrae (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800 text-white flex flex-col">
          {/* Map Controls Toolbar with District Filter & PDPA Switch */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800 text-xs">
            {/* Left Controls: District & Category Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-300">อำเภอ:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                >
                  <option value="all">ทั้ง 8 อำเภอใน จ.แพร่</option>
                  {Object.keys(DISTRICT_COORDS).map((d) => (
                    <option key={d} value={d}>
                      อ.{d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-300">กลุ่มเปราะบาง:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                >
                  <option value="all">ทุกกลุ่มเปราะบาง</option>
                  <option value="ผู้พิการติดเตียง">ผู้พิการติดเตียง (สีแดง)</option>
                  <option value="ผู้สูงอายุอยู่ลำพัง">ผู้สูงอายุอยู่ลำพัง (สีส้ม)</option>
                  <option value="ครอบครัวเปราะบาง">ครอบครัวเปราะบาง (สีน้ำเงิน)</option>
                </select>
              </div>
            </div>

            {/* Right Controls: PDPA Privacy Mode Switch */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOfficerUnmasked(!isOfficerUnmasked)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs cursor-pointer ${
                  isOfficerUnmasked
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="คลิกเพื่อสลับโหมดการแสดงผลข้อมูลส่วนบุคคลตามมาตรฐาน PDPA"
              >
                {isOfficerUnmasked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-950" />
                    <span>🔓 โหมดเจ้าหน้าที่ พมจ. (ดูข้อมูลเต็ม)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>🔒 โหมด PDPA (ปิดบังข้อมูลส่วนบุคคล)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* REAL LEAFLET INTERACTIVE MAP (Directly integrated from phrae-data-map-dev assets) */}
          <PhraeLeafletMap
            vulnerableList={vulnerableList}
            riverGauges={riverGauges}
            selectedDistrict={selectedDistrict}
            selectedCategory={selectedCategory}
            floodEmergencyMode={floodEmergencyMode}
            isDemoMode={isDemoMode}
            isOfficerUnmasked={isOfficerUnmasked}
            selectedPerson={selectedPerson}
            onSelectPerson={(p) => setSelectedPerson(p)}
            onSelectDistrict={(d) => setSelectedDistrict(d)}
            onSelectGauge={(g) => setSelectedGauge(g)}
          />

          {/* Sub-bar notice */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                แผนที่ฐานภูมิสารสนเทศจังหวัดแพร่ • รองรับการซูม ขยาย และคลิกดูรายละเอียดรายอำเภอ
              </span>
            </span>
            <span className="text-[11px] text-slate-500">
              แสดงผล {filteredList.length} รายการ
            </span>
          </div>
        </div>

        {/* Right Column: Selected Person Details / Telemetry (1 Col) */}
        <div className="space-y-4">
          {selectedPerson ? (
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3 border-b pb-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        CATEGORY_COLORS[selectedPerson.category].bg
                      } ${CATEGORY_COLORS[selectedPerson.category].text}`}
                    >
                      {selectedPerson.category}
                    </span>
                    {isOfficerUnmasked ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 flex items-center gap-0.5">
                        <Unlock className="w-2.5 h-2.5" />
                        <span>ข้อมูลจริง</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        <span>PDPA Masked</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 font-heading">
                    {getDisplayName(selectedPerson)}
                  </h3>
                  <p className="text-xs text-slate-500">
                    อายุ {selectedPerson.age} ปี • {selectedPerson.village} {selectedPerson.subDistrict} อ.{selectedPerson.district} จ.แพร่
                  </p>
                </div>

                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow"
                  style={{ backgroundColor: CATEGORY_COLORS[selectedPerson.category].pin }}
                >
                  📍
                </div>
              </div>

              {/* Flood Risk Status Callout */}
              {selectedPerson.inFloodRiskArea ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <strong className="block font-bold">
                      อยู่ในพื้นที่เสี่ยงภัยน้ำท่วมริมแม่น้ำยม
                    </strong>
                    <span className="text-[11px] text-rose-700">
                      ต้องได้รับการเฝ้าระวังระดับน้ำและเตรียมแผนอพยพฉุกเฉิน
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>อยู่นอกเขตพื้นที่น้ำท่วมริมแม่น้ำยม (ปลอดภัย)</span>
                </div>
              )}

              {/* Needs & Assistance Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">ความต้องการเร่งด่วน:</span>
                  <span className="text-slate-800 font-bold text-sm block mt-0.5">
                    {selectedPerson.assistanceNeeded}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block">อพม. ผู้ดูแลรับผิดชอบ:</span>
                    <span className="font-bold text-slate-900">
                      {isOfficerUnmasked ? selectedPerson.apamName : selectedPerson.apamName.split(' ')[0] + ' (อพม.)'}
                    </span>
                    <span className="block text-[11px] text-slate-600 font-mono">
                      {getDisplayApamPhone(selectedPerson)}
                    </span>
                  </div>
                  {isOfficerUnmasked && selectedPerson.apamPhone && (
                    <a
                      href={`tel:${selectedPerson.apamPhone}`}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-bold text-xs shadow"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>โทร อพม.</span>
                    </a>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 text-slate-500 flex justify-between items-center">
                  <span>พิกัด GPS:</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {selectedPerson.lat.toFixed(4)}, {selectedPerson.lng.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPerson.lat},${selectedPerson.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#1a237e] hover:bg-[#121858] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition shadow-md"
                >
                  <Navigation className="w-4 h-4" />
                  <span>นำทางด้วย Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-white/70" />
                </a>

                <button
                  onClick={() => setSelectedPerson(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  ปิดรายละเอียด
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#1a237e] mx-auto flex items-center justify-center shadow-inner">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">
                แตะที่หมุดบนแผนที่เพื่อดูข้อมูล
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                ระบบแสดงพิกัดบ้านกลุ่มเปราะบางจำลองในจังหวัดแพร่ พร้อมระบุความต้องการและเบอร์ติดต่อ อพม. ประจำหมู่บ้าน
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  ระบบปิดบังชื่อ-สกุล และเบอร์โทรศัพท์ของประชาชนไว้ หากเจ้าหน้าที่ พมจ. ต้องการลงพื้นที่ สามารถกดปุ่ม &quot;โหมดเจ้าหน้าที่ พมจ.&quot; ด้านบนเพื่อปลดล็อก
                </p>
              </div>
            </div>
          )}

          {/* District Summary Card */}
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-pink-600" />
              <span>สรุปกลุ่มเปราะบางแยกตามอำเภอ ({vulnerableList.length} ราย):</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.keys(DISTRICT_COORDS).map((d) => {
                const count = vulnerableList.filter((p) => p.district === d).length;
                return (
                  <div
                    key={d}
                    onClick={() => setSelectedDistrict(selectedDistrict === d ? 'all' : d)}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      selectedDistrict === d
                        ? 'bg-pink-100 border-[#d81b60] text-[#d81b60] font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-pink-50 hover:border-pink-300 text-slate-700'
                    }`}
                  >
                    <span>อ.{d}</span>
                    <span className="font-bold text-slate-900">{count} ราย</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* APAM PINNING MODAL FORM */}
      {/* ============================================================== */}
      {isPinningModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-[#d81b60] flex items-center justify-center font-bold">
                  GIS
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    อพม. ปักหมุดชี้เป้ากลุ่มเปราะบางรายใหม่
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    ส่งพิกัดเข้าศูนย์บริการร่วม พมจ.แพร่ จากโทรศัพท์มือถือ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPinningModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล ผู้เปราะบาง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ยายบุญมี มั่นคง"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81b60]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อายุ (ปี)</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">กลุ่มเปราะบาง</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as VulnerableCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="ผู้พิการติดเตียง">ผู้พิการติดเตียง (สีแดง)</option>
                    <option value="ผู้สูงอายุอยู่ลำพัง">ผู้สูงอายุอยู่ลำพัง (สีส้ม)</option>
                    <option value="ครอบครัวเปราะบาง">ครอบครัวเปราะบาง (สีน้ำเงิน)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อำเภอ</label>
                  <select
                    value={newDistrict}
                    onChange={(e) => {
                      const d = e.target.value as District;
                      setNewDistrict(d);
                      setNewLat(DISTRICT_COORDS[d].lat.toString());
                      setNewLng(DISTRICT_COORDS[d].lng.toString());
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    {Object.keys(DISTRICT_COORDS).map((d) => (
                      <option key={d} value={d}>
                        อ.{d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตำบล</label>
                  <input
                    type="text"
                    placeholder="เช่น ต.ป่าแมต"
                    value={newSubDistrict}
                    onChange={(e) => setNewSubDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมู่บ้าน / ชุมชน</label>
                <input
                  type="text"
                  placeholder="เช่น ม.3 บ้านร่องฟอง"
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              {/* Lat / Lng inputs with GPS Simulator button */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ละติจูด (Latitude)</label>
                  <input
                    type="text"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ลองจิจูด (Longitude)</label>
                  <input
                    type="text"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Flood Risk Checkbox */}
              <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <input
                  type="checkbox"
                  id="floodCheck"
                  checked={newInFloodArea}
                  onChange={(e) => setNewInFloodArea(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <label htmlFor="floodCheck" className="text-xs font-bold text-rose-900 cursor-pointer">
                  อยู่ในพื้นที่เสี่ยงภัยน้ำท่วมริมแม่น้ำยม
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ความต้องการเร่งด่วน</label>
                <input
                  type="text"
                  placeholder="เช่น ต้องการเตียงพยาบาล, ข้าวสารอาหารแห้ง"
                  value={newAssistance}
                  onChange={(e) => setNewAssistance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ อพม. ผู้ปักหมุด</label>
                  <input
                    type="text"
                    placeholder="เช่น นายประสิทธิ์ (อพม.)"
                    value={newApamName}
                    onChange={(e) => setNewApamName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เบอร์โทร อพม.</label>
                  <input
                    type="tel"
                    placeholder="เช่น 081-xxx-xxxx"
                    value={newApamPhone}
                    onChange={(e) => setNewApamPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <PdpaConsentBox
                id="pdpa-gis-pin"
                checked={pinPdpaConsent}
                onChange={setPinPdpaConsent}
                onOpenPrivacyPolicy={onOpenPrivacyPolicy}
                compact
              />

              {pinErrorMsg && (
                <p className="text-xs font-bold text-rose-600">{pinErrorMsg}</p>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinningModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPin}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#d81b60] to-[#1a237e] text-white font-bold shadow-md hover:from-[#c2185b] hover:to-[#121858] transition cursor-pointer"
                >
                  {isSubmittingPin ? 'กำลังบันทึก...' : 'บันทึกหมุด GIS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
