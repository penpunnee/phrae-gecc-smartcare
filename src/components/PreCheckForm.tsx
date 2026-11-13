'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import PdpaConsentBox from '@/components/PdpaConsentBox';
import {
  District,
  ServiceCategory,
  SubmitterRole,
  UploadedDoc,
  QueueRequest,
} from '@/types';
import {
  Send,
  Upload,
  Calendar,
  Phone,
  User,
  MapPin,
  Clock,
  FileCheck,
  CheckCircle,
  CreditCard,
  Trash2,
  Sparkles,
  Info,
  HeartHandshake,
  Baby,
  Coins,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';

interface PreCheckFormProps {
  onQueueCreated: (created: QueueRequest) => void;
  onOpenPrivacyPolicy?: () => void;
}

export const DISTRICTS: District[] = [
  'เมืองแพร่',
  'ร้องกวาง',
  'ลอง',
  'สูงเม่น',
  'เด่นชัย',
  'สอง',
  'วังชิ้น',
  'หนองม่วงไข่',
];

export const SERVICES: {
  category: ServiceCategory;
  desc: string;
  docsNeeded: string[];
  fastTrackBadge?: string;
  iconName: string;
}[] = [
  {
    category: 'ทำบัตรคนพิการ/ต่ออายุบัตร',
    desc: 'ออกบัตรใหม่ ต่ออายุบัตรที่หมดอายุ หรือเปลี่ยนข้อมูลผู้ดูแลคนพิการ',
    docsNeeded: [
      'เอกสารรับรองความพิการจากแพทย์ (รพ.รัฐ หรือ รพ.แพร่)',
      'สำเนาบัตรประชาชนคนพิการ / สูติบัตร (กรณีเด็ก)',
      'สำเนาทะเบียนบ้านคนพิการ',
      'รูปถ่าย 1 นิ้ว 2 รูป (ถ่ายไม่เกิน 6 เดือน)',
      'สำเนาบัตรประชาชนและทะเบียนบ้านของผู้ดูแล',
    ],
    fastTrackBadge: 'Fast Track 15 นาที',
    iconName: 'wheelchair',
  },
  {
    category: 'กู้ยืมเงินทุนประกอบอาชีพผู้สูงอายุ',
    desc: 'กองทุนผู้สูงอายุ ปลอดดอกเบี้ย รายบุคคลสูงสุด 30,000 บาท หรือรายกลุ่ม',
    docsNeeded: [
      'สำเนาบัตรประชาชนและทะเบียนบ้านของผู้กู้ (อายุ 60 ปีขึ้นไป)',
      'แผนการประกอบอาชีพและประมาณการค่าใช้จ่าย',
      'สำเนาบัตรประชาชนและทะเบียนบ้านของผู้ค้ำประกัน',
      'ใบรับรองแพทย์แสดงว่ามีสุขภาพแข็งแรงสามารถประกอบอาชีพได้',
      'รูปถ่ายและแผนที่สถานที่ประกอบอาชีพใน จ.แพร่',
    ],
    fastTrackBadge: 'ปลอดดอกเบี้ย',
    iconName: 'elderly-loan',
  },
  {
    category: 'กองทุนเด็กแรกเกิด',
    desc: 'เงินอุดหนุนเพื่อการเลี้ยงดูเด็กแรกเกิด 600 บาทต่อเดือน (แรกเกิด - 6 ปี)',
    docsNeeded: [
      'สูติบัตรเด็กแรกเกิด',
      'สำเนาบัตรประชาชนและทะเบียนบ้านของมารดา/ผู้ปกครอง',
      'สมุดบัญชีเงินฝากธนาคาร (กรุงไทย, ออมสิน หรือ ธ.ก.ส.)',
      'แบบรับรองสถานะของครัวเรือน (แบบ ดร.01 และ ดร.02)',
      'สำเนาสมุดบันทึกสุขภาพแม่และเด็ก (เฉพาะหน้าที่บันทึกการคลอด)',
    ],
    fastTrackBadge: 'ตรวจเอกสารด่วน',
    iconName: 'baby',
  },
  {
    category: 'กู้ยืมเงินทุนประกอบอาชีพคนพิการ',
    desc: 'กองทุนส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ ปลอดดอกเบี้ย ผ่อนชำระ 5 ปี',
    docsNeeded: [
      'สำเนาบัตรประจำตัวคนพิการ',
      'สำเนาบัตรประชาชนและทะเบียนบ้านคนพิการ/ผู้ดูแล',
      'แผนงานโครงการประกอบอาชีพและประมาณการค่าใช้จ่าย',
      'เอกสารผู้ค้ำประกัน (บัตรประชาชน, ทะเบียนบ้าน, หนังสือยินยอมคู่สมรส)',
      'แผนที่แสดงสถานที่ประกอบอาชีพ',
    ],
    fastTrackBadge: 'ปลอดดอกเบี้ย 5 ปี',
    iconName: 'disability-loan',
  },
  {
    category: 'เงินสงเคราะห์การจัดการศพผู้สูงอายุ',
    desc: 'เงินสงเคราะห์ในการจัดการศพผู้สูงอายุตามประเพณี รายละ 3,000 บาท',
    docsNeeded: [
      'ใบมรณบัตรของผู้สูงอายุ (อายุ 60 ปีบริบูรณ์ขึ้นไป)',
      'บัตรสวัสดิการแห่งรัฐของผู้เสียชีวิต (หรือหนังสือรับรองความยากจน)',
      'สำเนาบัตรประชาชนและทะเบียนบ้านของผู้จัดการศพ',
      'หนังสือรับรองการจัดการศพจากวัด/มัสยิด/ผู้นำศาสนา/ผู้ใหญ่บ้าน',
      'สำเนาสมุดบัญชีธนาคารของผู้จัดการศพ',
    ],
    fastTrackBadge: 'สงเคราะห์ 3,000 บาท',
    iconName: 'funeral',
  },
  {
    category: 'คำร้องทั่วไป',
    desc: 'ขอรับคำปรึกษา แนะนำสิทธิสวัสดิการสังคม หรือแจ้งปัญหาความเดือดร้อน',
    docsNeeded: [
      'สำเนาบัตรประจำตัวประชาชนผู้ยื่นคำร้อง',
      'สำเนาทะเบียนบ้าน',
      'รายละเอียดเรื่องที่ต้องการขอความช่วยเหลือ/คำร้อง',
      'ภาพถ่ายสภาพปัญหาหรือหลักฐานประกอบ (ถ้ามี)',
    ],
    iconName: 'general',
  },
];

const TIME_SLOTS = [
  '09:00 - 10:30 น. (ช่วงเช้า 1)',
  '10:30 - 12:00 น. (ช่วงเช้า 2)',
  '13:30 - 15:00 น. (ช่วงบ่าย 1)',
  '15:00 - 16:30 น. (ช่วงบ่าย 2)',
];

// Helper to format Thai Citizen ID (1-2345-67890-12-3)
function formatCitizenId(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 1));
  if (digits.length > 1) parts.push(digits.slice(1, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 10));
  if (digits.length > 10) parts.push(digits.slice(10, 12));
  if (digits.length > 12) parts.push(digits.slice(12, 13));
  return parts.join('-');
}

export default function PreCheckForm({ onQueueCreated, onOpenPrivacyPolicy }: PreCheckFormProps) {
  const [citizenName, setCitizenName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState<District>('เมืองแพร่');
  const [serviceType, setServiceType] = useState<ServiceCategory>('ทำบัตรคนพิการ/ต่ออายุบัตร');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [appointmentTimeSlot, setAppointmentTimeSlot] = useState(TIME_SLOTS[0]);
  const [submitterRole, setSubmitterRole] = useState<SubmitterRole>('ประชาชนทั่วไป');
  const [submitterName, setSubmitterName] = useState('');
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Find currently selected service info
  const selectedServiceInfo = SERVICES.find((s) => s.category === serviceType) || SERVICES[0];

  // Handle citizen ID change with automatic masking
  const handleCitizenIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCitizenId(e.target.value);
    setCitizenId(formatted);
  };

  // Handle file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs: UploadedDoc[] = [];
    Array.from(files).forEach((file, idx) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeText = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${Math.round(file.size / 1024)} KB`;
      newDocs.push({
        id: `doc-${Date.now()}-${idx}`,
        name: file.name,
        size: sizeText,
        type: file.type || 'image/jpeg',
      });
    });

    setDocuments((prev) => [...prev, ...newDocs]);
  };

  const removeDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!citizenName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุลของผู้รับบริการ');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก) เพื่อให้เจ้าหน้าที่ติดต่อกลับได้');
      return;
    }
    if (!appointmentDate) {
      setErrorMsg('กรุณาเลือกวันที่ต้องการนัดหมายเข้ารับบริการ');
      return;
    }
    if (!pdpaConsent) {
      setErrorMsg('กรุณาติ๊กยินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ก่อนส่งข้อมูล');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenName,
          citizenId: citizenId || undefined,
          phone,
          district,
          serviceType,
          appointmentDate,
          appointmentTimeSlot,
          submitterRole,
          submitterName: submitterRole !== 'ประชาชนทั่วไป' ? submitterName : undefined,
          documents:
            documents.length > 0
              ? documents
              : [
                  {
                    id: `doc-${Date.now()}`,
                    name: 'เอกสารตรวจเบื้องต้น.jpg',
                    size: '1.2 MB',
                    type: 'image/jpeg',
                  },
                ],
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ไม่สามารถส่งคำร้องได้');
      }

      // Confetti celebration
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#d81b60', '#1a237e', '#f59e0b', '#10b981'],
        });
      } catch {
        // ignore in unsupported headless environments
      }

      onQueueCreated(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-indigo-50 border-b border-pink-100 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-[#d81b60] text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              โหมดที่ 1: ตรวจเอกสารล่วงหน้า & จองคิวด่วน (Pre-Check Fast Track)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a237e] tracking-tight font-heading">
              ส่งตรวจเอกสารล่วงหน้า & จองคิวด่วน (Pre-Check)
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              เจ้าหน้าที่ศูนย์บริการร่วม พมจ.แพร่ จะตรวจสอบความครบถ้วนของเอกสารก่อนวันนัดหมาย ช่วยให้ท่านได้รับบริการอย่างรวดเร็ว ณ ช่อง Fast Track
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-pink-200/80 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold">
              GECC
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">Fast Track ช่อง 1</span>
              <span className="text-emerald-600 font-semibold">เวลารอเฉลี่ย &le; 15 นาที</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        {errorMsg && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl text-rose-800 text-sm flex items-start gap-3">
            <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">กรุณาตรวจสอบข้อมูล:</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Section 1: Submitter Role */}
        <div className="space-y-3">
          <label className="block text-base font-bold text-slate-900">
            1. ผู้ยื่นเรื่อง <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { role: 'ประชาชนทั่วไป' as SubmitterRole, icon: '👤', label: 'ประชาชนทั่วไป', desc: 'ยื่นด้วยตนเอง หรือญาติผู้ดูแล' },
              { role: 'อพม. (อาสาสมัคร พม.)' as SubmitterRole, icon: '🤝', label: 'อพม.', desc: 'อาสาสมัครพัฒนาสังคมและความมั่นคงของมนุษย์' },
              { role: 'อปท. (อบต./เทศบาล)' as SubmitterRole, icon: '🏛️', label: 'อปท.', desc: 'เจ้าหน้าที่ อบต. หรือ เทศบาลใน จ.แพร่' },
            ].map((item) => (
              <button
                type="button"
                key={item.role}
                onClick={() => setSubmitterRole(item.role)}
                className={`p-4 rounded-2xl border-2 text-left transition relative flex flex-col justify-between cursor-pointer ${
                  submitterRole === item.role
                    ? 'border-[#d81b60] bg-pink-50/60 shadow-md ring-2 ring-pink-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">{item.icon}</span>
                    {submitterRole === item.role && (
                      <CheckCircle className="w-5 h-5 text-[#d81b60]" />
                    )}
                  </div>
                  <div className="font-bold text-slate-900 text-base">{item.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {submitterRole !== 'ประชาชนทั่วไป' && (
            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 mt-2">
              <label className="block text-xs font-bold text-indigo-900 mb-1">
                ชื่อ-นามสกุล / สังกัด ของ {submitterRole} ที่ยื่นเรื่องแทน
              </label>
              <input
                type="text"
                placeholder={`เช่น นายประสิทธิ์ ใจมั่น (${submitterRole})`}
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Section 2: Personal Information */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>2. ข้อมูลผู้ขอรับบริการ</span>
            <span className="text-xs font-normal text-slate-500">(ผู้มีสิทธิรับสวัสดิการสังคม)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Citizen Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#d81b60]" />
                ชื่อ-นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น นายสมชาย คำแปง"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d81b60] text-base"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#d81b60]" />
                เบอร์โทรศัพท์ที่ติดต่อได้ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="เช่น 081-234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d81b60] text-base"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                ใช้สำหรับเช็กสถานะคำร้องและรับการแจ้งเตือนจากเจ้าหน้าที่
              </span>
            </div>

            {/* Citizen ID 13 digits */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#d81b60]" />
                เลขบัตรประชาชน 13 หลัก
              </label>
              <input
                type="text"
                placeholder="x-xxxx-xxxxx-xx-x"
                maxLength={17}
                value={citizenId}
                onChange={handleCitizenIdChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d81b60] text-base font-mono tracking-wider"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                ระบุเพื่อความสะดวกในการตรวจค้นประวัติสิทธิ์ในฐานข้อมูล พม.
              </span>
            </div>

            {/* 8 Districts in Phrae */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#d81b60]" />
                อำเภอใน จ.แพร่ (ภูมิลำเนา) <span className="text-rose-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value as District)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#d81b60] text-base font-medium"
              >
                {DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    อำเภอ{dist}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: 6 Service Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-base font-bold text-slate-900">
              3. เลือกประเภทบริการ 6 ด้านหลักของ พม. <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-pink-700 font-semibold bg-pink-50 px-2.5 py-1 rounded-full">
              เลือกได้ 1 รายการต่อคิว
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICES.map((srv) => {
              const isSelected = serviceType === srv.category;
              return (
                <div
                  key={srv.category}
                  onClick={() => setServiceType(srv.category)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#d81b60] bg-gradient-to-br from-pink-50/70 to-white shadow-md ring-2 ring-pink-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#d81b60] text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {srv.iconName === 'wheelchair' && <CheckCircle className="w-5 h-5" />}
                          {srv.iconName === 'elderly-loan' && <Coins className="w-5 h-5" />}
                          {srv.iconName === 'baby' && <Baby className="w-5 h-5" />}
                          {srv.iconName === 'disability-loan' && <Coins className="w-5 h-5" />}
                          {srv.iconName === 'funeral' && <HeartHandshake className="w-5 h-5" />}
                          {srv.iconName === 'general' && <FileSpreadsheet className="w-5 h-5" />}
                        </div>
                        <span className="font-bold text-slate-900 text-base">{srv.category}</span>
                      </div>

                      {srv.fastTrackBadge && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                          {srv.fastTrackBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{srv.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checklist Guide for Selected Service */}
          {selectedServiceInfo && (
            <div className="bg-amber-50/90 rounded-2xl p-4 sm:p-5 border border-amber-200 mt-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2.5">
                <FileCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  เอกสารที่ต้องใช้สำหรับ &ldquo;{selectedServiceInfo.category}&rdquo;:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-950">
                {selectedServiceInfo.docsNeeded.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/70"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1"></span>
                    <span className="leading-snug">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Appointment Date & Time */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>4. วันที่นัดหมาย & ช่วงเวลาที่สะดวก</span>
            <span className="text-xs font-normal text-slate-500">(ศูนย์บริการร่วม พมจ.แพร่ ศาลากลาง จ.แพร่)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#1a237e]" />
                วันที่นัดหมาย <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={appointmentDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a237e] text-base font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#1a237e]" />
                ช่วงเวลาที่สะดวก
              </label>
              <select
                value={appointmentTimeSlot}
                onChange={(e) => setAppointmentTimeSlot(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a237e] text-base font-medium"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Document Upload */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>5. อัปโหลดรูปเอกสาร</span>
              <span className="text-xs font-normal text-slate-500">(ถ่ายรูปจากโทรศัพท์หรือแนบไฟล์ PDF)</span>
            </h3>
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full">
              แนบแล้ว {documents.length} รายการ
            </span>
          </div>

          <div className="relative border-2 border-dashed border-pink-300 hover:border-[#d81b60] rounded-2xl p-6 sm:p-8 text-center bg-pink-50/20 transition cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 text-[#d81b60] flex items-center justify-center shadow-sm">
                <Upload className="w-7 h-7" />
              </div>
              <div className="font-bold text-slate-800 text-base">
                แตะเพื่อเลือกไฟล์ หรือ ถ่ายรูปเอกสาร
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                รองรับไฟล์ภาพ JPG, PNG หรือไฟล์ PDF (เช่น บัตรประชาชน, ทะเบียนบ้าน, ใบรับรองแพทย์ หรือสมุดบัญชี)
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-pink-200 text-xs font-semibold text-[#d81b60] mt-1 shadow-sm">
                + เพิ่มไฟล์รูปเอกสาร
              </div>
            </div>
          </div>

          {/* Uploaded Documents List */}
          {documents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">{doc.name}</p>
                      <p className="text-slate-400 text-[10px]">{doc.size}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDoc(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                    title="ลบไฟล์นี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PDPA Consent & Submit Button */}
        <div className="pt-4 border-t border-slate-200 space-y-5">
          <PdpaConsentBox
            id="pdpa-precheck"
            checked={pdpaConsent}
            onChange={setPdpaConsent}
            onOpenPrivacyPolicy={onOpenPrivacyPolicy}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#d81b60] via-[#c2185b] to-[#1a237e] hover:from-[#c2185b] hover:to-[#0f144a] text-white font-extrabold text-lg sm:text-xl py-4 px-6 rounded-2xl shadow-xl shadow-pink-600/25 flex items-center justify-center gap-3 transition transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>กำลังบันทึกและส่งตรวจเอกสาร...</span>
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                <span>ส่งตรวจเอกสารล่วงหน้า & รับบัตรคิวด่วน</span>
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-500 mt-2.5">
            🔒 ศูนย์บริการร่วม พมจ.แพร่ (มาตรฐานศูนย์ราชการสะดวก GECC) ให้บริการตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล
          </p>
        </div>
      </form>
    </div>
  );
}
