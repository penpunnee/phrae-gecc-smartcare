'use client';

import React, { useState, useEffect } from 'react';
import { QueueRequest } from '@/types';
import {
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface StatusTrackerProps {
  initialSearchQuery?: string;
  allRequests: QueueRequest[];
  onOpenTicket: (request: QueueRequest) => void;
  onOpenESlip?: (request: QueueRequest) => void;
  onLogSearch?: (query: string, found: boolean) => void;
}

const STEPS = [
  { step: 1, title: '1. รับเรื่องแล้ว', desc: 'ลงทะเบียนคำร้องในระบบศูนย์บริการร่วม GECC' },
  { step: 2, title: '2. ตรวจเอกสารผ่าน', desc: 'เจ้าหน้าที่ตรวจสอบความครบถ้วนถูกต้องแล้ว' },
  { step: 3, title: '3. รออนุมัติ/ลงพื้นที่', desc: 'เสนอผู้มีอำนาจลงนาม หรือประสาน อพม. ลงพื้นที่' },
  { step: 4, title: '4. ดำเนินการสำเร็จ', desc: 'ออกบัตร/อนุมัติสิทธิ์/รับบริการเสร็จสิ้น' },
];

export default function StatusTracker({
  initialSearchQuery = '',
  allRequests,
  onOpenTicket,
  onOpenESlip,
  onLogSearch,
}: StatusTrackerProps) {
  const [query, setQuery] = useState(initialSearchQuery);
  const [searchResult, setSearchResult] = useState<QueueRequest | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-search if initialSearchQuery is provided
  useEffect(() => {
    if (initialSearchQuery) {
      setQuery(initialSearchQuery);
      performSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const performSearch = (searchTerm: string) => {
    const clean = searchTerm.trim().toLowerCase();
    if (!clean) {
      setSearchResult(null);
      setHasSearched(false);
      return;
    }

    const cleanDigits = clean.replace(/\D/g, '');

    const found = allRequests.find((r) => {
      const matchId = r.id.toLowerCase() === clean;
      const matchPhone = cleanDigits && r.phone.replace(/\D/g, '').includes(cleanDigits);
      const matchName = r.citizenName.toLowerCase().includes(clean);
      return matchId || matchPhone || matchName;
    });

    setSearchResult(found || null);
    setHasSearched(true);
    onLogSearch?.(clean, Boolean(found));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="space-y-6">
      {/* Search Header Box */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[#1a237e] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            โหมดที่ 2: ติดตามความคืบหน้าแบบ Real-time
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a237e] font-heading">
            เช็กสถานะคำร้อง & บัตรคิว (Status Tracker)
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            พิมพ์ <strong>เบอร์โทรศัพท์</strong> หรือ <strong>รหัสคิว (เช่น PRE-2026-001)</strong> เพื่อดูความคืบหน้า 4 ขั้นตอน
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="กรอกเบอร์โทรศัพท์ หรือ รหัสคิว..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-[#d81b60] focus:outline-none focus:ring-4 focus:ring-pink-500/10 text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400"
              />
              <Search className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-[#d81b60] to-[#1a237e] hover:from-[#c2185b] hover:to-[#121858] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2 text-base transition transform active:scale-95"
            >
              <span>ค้นหาสถานะ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Search Chips */}
        <div className="max-w-2xl mx-auto mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">ตัวอย่างค้นหาด่วน:</span>
          {allRequests.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setQuery(item.id);
                performSearch(item.id);
              }}
              className="text-xs bg-slate-100 hover:bg-pink-50 hover:text-[#d81b60] text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition font-mono"
            >
              {item.id} ({item.citizenName.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Search Result Display */}
      {hasSearched && (
        <div className="animate-in fade-in duration-300">
          {searchResult ? (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
              {/* Header result banner */}
              <div className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#ad1457] text-white p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        GECC Fast Track
                      </span>
                      <span className="text-pink-200 text-xs">
                        อัพเดตล่าสุด: {new Date(searchResult.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold font-heading">
                      รหัสคิว: {searchResult.id}
                    </h3>
                    <p className="text-white/80 text-sm mt-0.5">
                      ผู้ขอรับบริการ: <strong className="text-white">{searchResult.citizenName}</strong> | ภูมิลำเนา: อ.{searchResult.district} จ.แพร่
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {onOpenESlip && (
                      <button
                        onClick={() => onOpenESlip(searchResult)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <span>📄 ดาวน์โหลด/พิมพ์ใบรับคำขออิเล็กทรอนิกส์ (e-Slip)</span>
                      </button>
                    )}
                    <button
                      onClick={() => onOpenTicket(searchResult)}
                      className="bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>ดูบัตรคิว Fast Track</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Stepper & Details */}
              <div className="p-6 sm:p-8 space-y-8">
                {/* Notice banner if action needed */}
                {searchResult.status === 'เอกสารไม่ครบถ้วนให้แก้ไข' ? (
                  <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-900 text-base">
                        สถานะ: เอกสารไม่ครบถ้วน (ต้องแก้ไขเพิ่มเติม)
                      </h4>
                      <p className="text-rose-800 text-sm mt-1">
                        {searchResult.officerNotes || 'กรุณาติดต่อเจ้าหน้าที่ หรือนำเอกสารเพิ่มเติมมาแสดงในวันนัดหมาย'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* 4-Step Progress Flow */
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-slate-900 flex items-center justify-between">
                      <span>สถานะการดำเนินงาน (4 ขั้นตอน GECC)</span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {searchResult.status}
                      </span>
                    </h4>

                    {/* Step Bar Responsive */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                      {STEPS.map((s) => {
                        const isCompleted = searchResult.statusStep > s.step || searchResult.statusStep === 4;
                        const isCurrent = searchResult.statusStep === s.step && searchResult.statusStep !== 4;
                        const isPending = searchResult.statusStep < s.step;

                        return (
                          <div
                            key={s.step}
                            className={`p-4 rounded-2xl border-2 transition relative flex flex-col justify-between ${
                              isCompleted
                                ? 'bg-emerald-50/70 border-emerald-500 text-slate-800'
                                : isCurrent
                                ? 'bg-pink-50/70 border-[#d81b60] shadow-md ring-2 ring-pink-500/20 text-slate-900'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    isCompleted
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : isCurrent
                                      ? 'bg-[#d81b60] text-white shadow-sm animate-pulse'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                                </div>

                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    isCompleted
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isCurrent
                                      ? 'bg-pink-100 text-pink-800'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {isCompleted ? 'สำเร็จ' : isCurrent ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                                </span>
                              </div>

                              <div className="font-bold text-base mt-1">{s.title}</div>
                              <p className="text-xs mt-1 text-slate-600 leading-relaxed">
                                {s.desc}
                              </p>
                            </div>

                            {isCurrent && (
                              <div className="mt-3 pt-2 border-t border-pink-200 flex items-center gap-1.5 text-xs text-[#d81b60] font-semibold">
                                <Clock className="w-3.5 h-3.5 animate-spin" />
                                <span>อยู่ในขั้นตอนนี้</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Official Staff Remarks Box */}
                <div className="bg-gradient-to-br from-indigo-50/80 via-white to-pink-50/50 rounded-2xl p-5 sm:p-6 border-2 border-indigo-100/90 shadow-sm space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-[#1a237e] font-bold text-base">
                      <MessageSquare className="w-5 h-5 text-[#d81b60]" />
                      <span>หมายเหตุและการประสานงานจากเจ้าหน้าที่ พมจ.แพร่</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      เจ้าหน้าที่ผู้รับผิดชอบ: <strong>{searchResult.officerName}</strong>
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-inner text-sm text-slate-800 leading-relaxed">
                    &ldquo;{searchResult.officerNotes}&rdquo;
                  </div>
                </div>

                {/* Details Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-4 h-4 text-pink-600 shrink-0" />
                      <span>ผู้ยื่นเรื่อง:</span>
                      <strong className="text-slate-900">{searchResult.citizenName}</strong>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-pink-600 shrink-0" />
                      <span>เบอร์ติดต่อ:</span>
                      <strong className="text-slate-900">{searchResult.phone}</strong>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-pink-600 shrink-0" />
                      <span>พื้นที่บริการ:</span>
                      <strong className="text-indigo-900">อำเภอ{searchResult.district} จังหวัดแพร่</strong>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText className="w-4 h-4 text-pink-600 shrink-0" />
                      <span>ประเภทบริการ:</span>
                      <strong className="text-[#d81b60]">{searchResult.serviceType}</strong>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-pink-600 shrink-0" />
                      <span>วันนัดหมาย:</span>
                      <strong className="text-[#1a237e]">
                        {searchResult.appointmentDate} ({searchResult.appointmentTimeSlot})
                      </strong>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>ช่องบริการ:</span>
                      <strong className="text-emerald-700">เคาน์เตอร์ 1 Fast Track พมจ.แพร่</strong>
                    </div>
                  </div>
                </div>

                {/* Location guidance */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                  <div>
                    <strong className="text-slate-900 block text-sm">
                      สถานที่ติดต่อในวันนัดหมาย:
                    </strong>
                    ศูนย์บริการร่วม สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ ชั้น 1 ศาลากลางจังหวัดแพร่
                  </div>
                  <a
                    href="tel:054511572"
                    className="bg-indigo-50 hover:bg-indigo-100 text-[#1a237e] font-bold px-4 py-2 rounded-xl transition shrink-0"
                  >
                    โทรสอบถาม 054-511-572
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                ไม่พบข้อมูลคำร้องจาก &ldquo;{query}&rdquo;
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                โปรดตรวจสอบความถูกต้องของเบอร์โทรศัพท์ หรือรหัสคิว เช่น <code>PRE-2026-001</code> หรือโทรสอบถามได้ที่ศูนย์บริการร่วม พมจ.แพร่ 054-511-572
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

