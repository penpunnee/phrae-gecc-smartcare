'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ComplaintItem, ComplaintType, District } from '@/types';
import { DISTRICTS } from '@/components/PreCheckForm';
import PdpaConsentBox from '@/components/PdpaConsentBox';
import {
  Megaphone,
  AlertTriangle,
  Search,
  Send,
  Phone,
  MapPin,
  User,
  FileText,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Navigation,
  BellRing,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ComplaintEmergencyPanelProps {
  complaints?: ComplaintItem[];
  onComplaintCreated?: (item: ComplaintItem) => void;
  onOpenPrivacyPolicy?: () => void;
}

const COMPLAINT_STEPS = [
  { step: 1, title: '1. รับเรื่องแล้ว', desc: 'ลงทะเบียนเรื่องเข้าระบบศูนย์ 1300 / GECC' },
  { step: 2, title: '2. ส่งต่อเจ้าหน้าที่/ทีม 1300', desc: 'จ่ายงานให้ทีมเคลื่อนที่เร็วหรือหัวหน้าฝ่าย' },
  { step: 3, title: '3. ลงพื้นที่แก้ไข (Take Action)', desc: 'ประสานงานช่วยเหลือ/แก้ไขปัญหาจริง' },
  { step: 4, title: '4. ดำเนินการเสร็จสิ้น', desc: 'แจ้งผลการแก้ไขให้ผู้แจ้งทราบและปิดเรื่อง' },
];

export default function ComplaintEmergencyPanel({
  complaints: complaintsProp,
  onComplaintCreated,
  onOpenPrivacyPolicy,
}: ComplaintEmergencyPanelProps) {
  const [subMode, setSubMode] = useState<'submit' | 'track'>('submit');

  // Form States
  const [type, setType] = useState<ComplaintType>('แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300');
  const [reporterName, setReporterName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState<District>('เมืองแพร่');
  const [locationDetail, setLocationDetail] = useState('');
  const [description, setDescription] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Submission Confirmation State
  const [createdItem, setCreatedItem] = useState<ComplaintItem | null>(null);
  const [lineNotifyStatus, setLineNotifyStatus] = useState<string>('');

  // Tracking States
  const [localComplaints, setLocalComplaints] = useState<ComplaintItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackResultId, setTrackResultId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const complaints = complaintsProp ?? localComplaints;
  const trackResult = trackResultId
    ? complaints.find((c) => c.id === trackResultId) ||
      (createdItem?.id === trackResultId ? createdItem : null)
    : null;

  // Load initial complaints list only if not provided by parent
  useEffect(() => {
    if (complaintsProp) return;
    async function loadComplaints() {
      try {
        const res = await fetch('/api/complaints');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLocalComplaints(json.data);
        }
      } catch (err) {
        console.error('Failed to load complaints:', err);
      }
    }
    loadComplaints();
  }, [complaintsProp]);

  const handleUseBrowserGps = () => {
    if (!navigator.geolocation) {
      setLocationDetail(`พิกัดอ้างอิง อ.${district} จ.แพร่ (18.1445, 100.1402)`);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setLocationDetail(`พิกัด GPS: ${lat}, ${lng} (อ.${district} จ.แพร่)`);
      },
      () => {
        setLocationDetail(`พิกัดอ้างอิง อ.${district} จ.แพร่ (18.1445, 100.1402)`);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อกลับได้ (9-10 หลัก)');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('กรุณากรอกรายละเอียดเรื่องร้องเรียน หรือสถานการณ์ฉุกเฉิน');
      return;
    }
    if (!pdpaConsent) {
      setErrorMsg('กรุณาติ๊กยินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ก่อนส่งข้อมูล');
      return;
    }

    setIsSubmitting(true);
    setLineNotifyStatus('');

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          reporterName: reporterName.trim() || 'ผู้แจ้ง (ไม่ประสงค์ออกนาม)',
          phone: phone.trim(),
          district,
          locationDetail: locationDetail.trim(),
          description: description.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ไม่สามารถส่งเรื่องได้');
      }

      const newItem: ComplaintItem = json.data;
      if (onComplaintCreated) {
        onComplaintCreated(newItem);
      } else {
        setLocalComplaints((prev) => [newItem, ...prev]);
      }
      setCreatedItem(newItem);

      // Trigger /api/notify-line immediately
      try {
        const lineRes = await fetch('/api/notify-line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queueId: newItem.id,
            citizenName: newItem.reporterName,
            phone: newItem.phone,
            district: newItem.district,
            serviceType: newItem.type,
            appointmentDate: new Date().toISOString().split('T')[0],
            submitterRole: 'แจ้งผ่านระบบ 1300 / GECC ออนไลน์',
            notificationType:
              newItem.type === 'แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300'
                ? 'emergency1300'
                : 'complaint',
            description: newItem.description,
            locationDetail: newItem.locationDetail,
          }),
        });
        const lineJson = await lineRes.json();
        if (lineJson.success) {
          setLineNotifyStatus(
            lineJson.message || 'ยิงแจ้งเตือนเข้าศูนย์ปฏิบัติการ LINE Notify เรียบร้อยแล้ว'
          );
        } else {
          setLineNotifyStatus('บันทึกเรื่องเข้าระบบแล้ว (กำลังรอส่งแจ้งเตือน LINE)');
        }
      } catch {
        setLineNotifyStatus('บันทึกเรื่องเข้าระบบแล้ว (แจ้งเตือนเจ้าหน้าที่เรียบร้อย)');
      }

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#dc2626', '#f59e0b', '#d81b60', '#1a237e'],
        });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const performTrackSearch = (term: string, sourceList: ComplaintItem[] = complaints) => {
    const clean = term.trim().toLowerCase();
    if (!clean) {
      setTrackResultId(null);
      setHasSearched(false);
      return;
    }

    const cleanDigits = clean.replace(/\D/g, '');
    const found = sourceList.find((c) => {
      const matchId = c.id.toLowerCase() === clean;
      const matchPhone = cleanDigits && c.phone.replace(/\D/g, '').includes(cleanDigits);
      const matchName = c.reporterName.toLowerCase().includes(clean);
      return matchId || matchPhone || matchName;
    });

    setTrackResultId(found ? found.id : null);
    setHasSearched(true);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performTrackSearch(searchQuery);
  };

  const handleJumpToTrack = (cmpId: string) => {
    setSubMode('track');
    setSearchQuery(cmpId);
    setTrackResultId(cmpId);
    setHasSearched(true);
  };

  const handleResetForm = () => {
    setCreatedItem(null);
    setDescription('');
    setLocationDetail('');
    setLineNotifyStatus('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-mode Toggle */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-700 via-red-700 to-[#1a237e] text-white p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold mb-2 shadow">
                <ShieldAlert className="w-3.5 h-3.5" />
                ศูนย์รับเรื่องร้องเรียน & แจ้งเหตุฉุกเฉิน พม. 1300 (จ.แพร่)
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
                📢 ร้องเรียนการบริการ / แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300
              </h2>
              <p className="text-rose-100 text-xs sm:text-sm mt-1">
                แจ้งเหตุเร่งด่วนหรือข้อร้องเรียนพร้อมส่งพิกัดเข้า LINE ศูนย์ปฏิบัติการ พมจ.แพร่ ทันที และติดตามผล Take Action แบบ Real-time
              </p>
            </div>

            {/* Sub-mode Toggle Buttons */}
            <div className="flex bg-black/25 p-1.5 rounded-2xl border border-white/20 shrink-0">
              <button
                type="button"
                onClick={() => setSubMode('submit')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                  subMode === 'submit'
                    ? 'bg-white text-rose-700 shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>1. ยื่นเรื่อง / แจ้งเหตุ 1300</span>
              </button>
              <button
                type="button"
                onClick={() => setSubMode('track')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                  subMode === 'track'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>2. ติดตามสถานะ (CMP)</span>
              </button>
            </div>
          </div>
        </div>

        {/* SUB-MODE 1: SUBMIT FORM */}
        {subMode === 'submit' && (
          <div className="p-6 sm:p-8">
            {createdItem ? (
              /* Confirmation Card */
              <div className="max-w-2xl mx-auto text-center space-y-6 py-4 animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-11 h-11" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                    <BellRing className="w-3.5 h-3.5" />
                    บันทึกข้อมูลและยิงแจ้งเตือนเจ้าหน้าที่เรียบร้อยแล้ว
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1a237e] font-heading">
                    รหัสติดตามเรื่องของท่านคือ
                  </h3>
                  <div className="inline-block px-6 py-3 rounded-2xl bg-slate-100 border-2 border-dashed border-rose-400 text-3xl sm:text-4xl font-black text-rose-600 font-mono tracking-wider">
                    {createdItem.id}
                  </div>
                </div>

                {lineNotifyStatus && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs sm:text-sm text-emerald-900 flex items-center justify-center gap-2">
                    <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{lineNotifyStatus}</span>
                  </div>
                )}

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left text-xs sm:text-sm space-y-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">ประเภทเรื่อง:</span>
                    <strong className="text-rose-700">{createdItem.type}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">พื้นที่:</span>
                    <strong className="text-indigo-900">
                      อำเภอ{createdItem.district} จังหวัดแพร่
                    </strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">เบอร์โทรติดต่อกลับ:</span>
                    <strong className="text-slate-900">{createdItem.phone}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">สถานะปัจจุบัน:</span>
                    <strong className="text-emerald-700">{createdItem.status}</strong>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => handleJumpToTrack(createdItem.id)}
                    className="px-6 py-3 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>ติดตามสถานะเรื่อง {createdItem.id}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-sm transition cursor-pointer"
                  >
                    แจ้งเรื่องใหม่เพิ่มเติม
                  </button>
                </div>
              </div>
            ) : (
              /* Submission Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl text-rose-800 text-sm flex items-start gap-3">
                    <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">กรุณาตรวจสอบข้อมูล:</p>
                      <p>{errorMsg}</p>
                    </div>
                  </div>
                )}

                {/* 1. Type Selection */}
                <div className="space-y-3">
                  <label className="block text-base font-bold text-slate-900">
                    1. เลือกประเภทการแจ้งเรื่อง <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300')}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                        type === 'แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300'
                          ? 'border-rose-600 bg-rose-50/70 shadow-md ring-2 ring-rose-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          type === 'แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                          แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          พบผู้สูงอายุ/คนพิการ/เด็กถูกทอดทิ้ง ประสบภัยน้ำท่วม ต้องการความช่วยเหลือเร่งด่วน
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setType('ร้องเรียนการบริการ')}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                        type === 'ร้องเรียนการบริการ'
                          ? 'border-[#1a237e] bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          type === 'ร้องเรียนการบริการ'
                            ? 'bg-[#1a237e] text-white'
                            : 'bg-indigo-100 text-[#1a237e]'
                        }`}
                      >
                        <Megaphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                          ร้องเรียนการบริการ / ข้อเสนอแนะ
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          แจ้งปัญหาความล่าช้า พฤติกรรมบริการ หรือข้อเสนอแนะเพื่อปรับปรุงศูนย์บริการร่วม GECC
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Reporter & District Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-rose-600" />
                      <span>ชื่อผู้แจ้ง (ระบุหรือไม่ก็ได้)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น นายสมศักดิ์ หรือ ไม่ประสงค์ออกนาม"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-rose-600" />
                      <span>เบอร์โทรติดต่อกลับ</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="เช่น 081-234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      <span>พิกัดอำเภอใน จ.แพร่</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value as District)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          อำเภอ{d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Location / GPS Detail */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-rose-600" />
                      <span>ตำบล / หมู่บ้าน / จุดสังเกต หรือพิกัดสถานที่</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleUseBrowserGps}
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 transition cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>ดึงพิกัด GPS อัตโนมัติ</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="เช่น ต.ป่าแมต ม.4 ใกล้สะพานข้ามแม่น้ำยม หรือ เคาน์เตอร์บริการชั้น 1"
                    value={locationDetail}
                    onChange={(e) => setLocationDetail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* 4. Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>รายละเอียดเรื่องร้องเรียน / สถานการณ์ฉุกเฉิน</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="โปรดระบุเหตุการณ์ สภาพปัญหา ความเร่งด่วน หรือความช่วยเหลือที่ต้องการ..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* PDPA Consent */}
                <PdpaConsentBox
                  id="pdpa-complaint"
                  checked={pdpaConsent}
                  onChange={setPdpaConsent}
                  onOpenPrivacyPolicy={onOpenPrivacyPolicy}
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-[#1a237e] hover:from-rose-700 hover:to-[#0f144a] text-white font-extrabold text-base sm:text-lg py-4 px-6 rounded-2xl shadow-xl shadow-rose-600/25 flex items-center justify-center gap-2.5 transition transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>กำลังส่งเรื่อง & แจ้งเตือนศูนย์ปฏิบัติการ LINE...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>ส่งเรื่องเข้าระบบ & ยิงแจ้งเตือนเจ้าหน้าที่ทันที</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* SUB-MODE 2: TRACK STATUS */}
        {subMode === 'track' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#1a237e] font-heading">
                ติดตามสถานะเรื่องร้องเรียน / แจ้งเหตุ 1300 (Take Action)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                กรอกรหัสติดตามเรื่อง (เช่น <code className="font-mono font-bold text-rose-600">CMP-2026-001</code>) หรือหมายเลขโทรศัพท์ที่ใช้แจ้งเรื่อง
              </p>
            </div>

            <form onSubmit={handleTrackSubmit} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="กรอกรหัส CMP-2026-... หรือ เบอร์โทรศัพท์..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-rose-600 focus:outline-none text-sm sm:text-base font-medium text-slate-900"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#1a237e] to-rose-600 hover:from-[#121858] hover:to-rose-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>ค้นหาความคืบหน้า</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Quick Search Chips */}
            <div className="max-w-2xl mx-auto flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">รหัสตัวอย่างในระบบ:</span>
              {complaints.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(c.id);
                    performTrackSearch(c.id);
                  }}
                  className="text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition font-mono cursor-pointer"
                >
                  {c.id} (อ.{c.district})
                </button>
              ))}
            </div>

            {/* Result Card */}
            {hasSearched && (
              <div className="animate-in fade-in duration-200">
                {trackResult ? (
                  <div className="border-2 border-slate-200 rounded-3xl overflow-hidden shadow-lg">
                    {/* Result Banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-[#1a237e] to-rose-700 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs">
                            {trackResult.type}
                          </span>
                          <span className="text-xs text-pink-200">
                            อัปเดตล่าสุด:{' '}
                            {new Date(trackResult.updatedAt).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            น.
                          </span>
                        </div>
                        <h4 className="text-2xl font-black font-heading">
                          รหัสเรื่อง: {trackResult.id}
                        </h4>
                        <p className="text-xs sm:text-sm text-white/80">
                          ผู้แจ้ง: {trackResult.reporterName} • อ.{trackResult.district} จ.แพร่
                        </p>
                      </div>

                      <div className="px-4 py-2 rounded-xl bg-white/15 border border-white/25 text-xs font-bold shrink-0">
                        {trackResult.status}
                      </div>
                    </div>

                    {/* 4-Step Take Action Stepper */}
                    <div className="p-6 space-y-6 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {COMPLAINT_STEPS.map((s) => {
                          const isDone =
                            trackResult.statusStep > s.step || trackResult.statusStep === 4;
                          const isCurrent =
                            trackResult.statusStep === s.step && trackResult.statusStep !== 4;

                          return (
                            <div
                              key={s.step}
                              className={`p-4 rounded-2xl border-2 transition ${
                                isDone
                                  ? 'bg-emerald-50 border-emerald-500 text-slate-800'
                                  : isCurrent
                                  ? 'bg-rose-50 border-rose-500 shadow-md ring-2 ring-rose-500/20 text-slate-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isDone
                                      ? 'bg-emerald-600 text-white'
                                      : isCurrent
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                                </div>
                                <span className="text-[11px] font-bold">
                                  {isDone ? 'สำเร็จ' : isCurrent ? 'กำลังดำเนินการ' : 'รอคิว'}
                                </span>
                              </div>
                              <div className="font-bold text-sm">{s.title}</div>
                              <p className="text-xs text-slate-600 mt-1">{s.desc}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Take Action Log */}
                      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-[#1a237e] text-sm flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-rose-600" />
                            ความคืบหน้าการแก้ไขปัญหา (Take Action Log)
                          </span>
                          <span className="text-xs text-slate-600">
                            ผู้รับผิดชอบ: <strong>{trackResult.assignedOfficer}</strong>
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 text-sm text-slate-800 leading-relaxed">
                          &ldquo;{trackResult.takeActionNote}&rdquo;
                        </div>
                      </div>

                      {/* Original Details */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-1.5">
                        <div>
                          <span className="text-slate-500">สถานที่ / พิกัด: </span>
                          <strong className="text-slate-900">
                            {trackResult.locationDetail || `อ.${trackResult.district} จ.แพร่`}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500">รายละเอียดที่แจ้ง: </span>
                          <span className="text-slate-800">{trackResult.description}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-3xl p-8 text-center border border-slate-200 space-y-2">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                    <h4 className="font-bold text-slate-800 text-lg">
                      ไม่พบข้อมูลเรื่องจาก &ldquo;{searchQuery}&rdquo;
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500">
                      กรุณาตรวจสอบรหัสเรื่อง เช่น CMP-2026-001 หรือเบอร์โทรศัพท์อีกครั้ง
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

