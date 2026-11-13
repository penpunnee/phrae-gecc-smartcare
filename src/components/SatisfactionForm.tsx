'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import PdpaConsentBox from '@/components/PdpaConsentBox';
import {
  SatisfactionRating,
  ServiceCategory,
  District,
  FeedbackItem,
} from '@/types';
import {
  Smile,
  Meh,
  Frown,
  Send,
  Sparkles,
  Heart,
  CheckCircle,
  MessageSquare,
  User,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface SatisfactionFormProps {
  onFeedbackSubmitted: (feedback: FeedbackItem) => void;
  onOpenPrivacyPolicy?: () => void;
}

const SERVICES: ServiceCategory[] = [
  'ทำบัตรคนพิการ/ต่ออายุบัตร',
  'กู้ยืมเงินทุนประกอบอาชีพผู้สูงอายุ',
  'กองทุนเด็กแรกเกิด',
  'กู้ยืมเงินทุนประกอบอาชีพคนพิการ',
  'เงินสงเคราะห์การจัดการศพผู้สูงอายุ',
  'คำร้องทั่วไป',
];

const DISTRICTS: District[] = [
  'เมืองแพร่',
  'ร้องกวาง',
  'ลอง',
  'สูงเม่น',
  'เด่นชัย',
  'สอง',
  'วังชิ้น',
  'หนองม่วงไข่',
];

export default function SatisfactionForm({
  onFeedbackSubmitted,
  onOpenPrivacyPolicy,
}: SatisfactionFormProps) {
  const [rating, setRating] = useState<SatisfactionRating>('ประทับใจมาก');
  const [serviceType, setServiceType] = useState<ServiceCategory>('ทำบัตรคนพิการ/ต่ออายุบัตร');
  const [district, setDistrict] = useState<District>('เมืองแพร่');
  const [citizenName, setCitizenName] = useState('');
  const [phone, setPhone] = useState('');
  const [queueId, setQueueId] = useState('');
  const [comment, setComment] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<FeedbackItem | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!pdpaConsent) {
      setErrorMsg('กรุณาติ๊กยินยอมตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ก่อนส่งผลการประเมิน');
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          serviceType,
          district,
          citizenName: citizenName.trim() || undefined,
          phone: phone.trim() || undefined,
          queueId: queueId.trim() || undefined,
          comment: comment.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ไม่สามารถบันทึกการประเมินได้');
      }

      // Confetti burst for positive or standard feedback
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#d81b60', '#1a237e'],
        });
      } catch {
        // ignore
      }

      setSubmittedItem(json.data);
      onFeedbackSubmitted(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedItem(null);
    setRating('ประทับใจมาก');
    setComment('');
  };

  if (submittedItem) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-lg bg-emerald-100 text-emerald-600">
          <Heart className="w-12 h-12 fill-emerald-600 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            บันทึกการประเมินเรียบร้อยแล้ว
          </div>
          <h2 className="text-3xl font-extrabold text-[#1a237e] font-heading">
            ขอบพระคุณสำหรับความคิดเห็น
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto">
            ความคิดเห็นของท่านมีค่ายิ่งต่อการพัฒนาคุณภาพบริการของศูนย์ราชการสะดวก พมจ.แพร่ (GECC) ให้ดียิ่งขึ้นไป
          </p>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm text-left space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">ผลการประเมิน:</span>
            <span
              className={`font-bold px-3 py-1 rounded-full text-xs ${
                submittedItem.rating === 'ประทับใจมาก'
                  ? 'bg-emerald-100 text-emerald-800'
                  : submittedItem.rating === 'ปานกลาง'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {submittedItem.rating}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">เรื่องที่ติดต่อ:</span>
            <span className="font-semibold text-slate-800">{submittedItem.serviceType}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">พื้นที่:</span>
            <span className="font-semibold text-slate-800">อ.{submittedItem.district} จ.แพร่</span>
          </div>

          {submittedItem.rating === 'ควรปรับปรุง' && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                เจ้าหน้าที่ศูนย์บริการร่วม พมจ.แพร่ ได้รับข้อมูลแล้วและจะนำเข้าสู่กระบวนการ <strong>Service Recovery</strong> เพื่อแก้ไขปรับปรุงทันที
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleReset}
          className="bg-gradient-to-r from-[#d81b60] to-[#1a237e] hover:from-[#c2185b] hover:to-[#121858] text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-pink-600/20 transition cursor-pointer"
        >
          ทำแบบประเมินรายการอื่น
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-b border-emerald-100 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              โหมดที่ 4: เสียงสะท้อนจากประชาชนเพื่อการบริการที่เป็นเลิศ
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a237e] tracking-tight font-heading">
              ประเมินความพึงพอใจ (GECC Satisfaction)
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              แตะเลือกระดับความพึงพอใจด้วยปุ่มขนาดใหญ่ ตัวหนังสือชัดเจน เพื่อช่วยให้ศูนย์บริการร่วม พมจ.แพร่ พัฒนาการบริการให้ดียิ่งขึ้น
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-200/80 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              GECC
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">มาตรฐานการประเมินผล</span>
              <span className="text-emerald-700 font-semibold">Service Recovery ทันใจ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        {errorMsg && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">กรุณาตรวจสอบข้อมูล:</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Section 1: 3 Big Icon Buttons for Elderly */}
        <div className="space-y-4">
          <label className="block text-lg font-extrabold text-slate-900 text-center sm:text-left">
            1. ท่านพึงพอใจการให้บริการของศูนย์บริการร่วม พมจ.แพร่ ในระดับใด?{' '}
            <span className="text-rose-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Level 1: ประทับใจมาก (Green Smile) */}
            <button
              type="button"
              onClick={() => setRating('ประทับใจมาก')}
              className={`p-6 sm:p-8 rounded-3xl border-3 text-center transition flex flex-col items-center justify-center cursor-pointer group transform hover:scale-[1.02] ${
                rating === 'ประทับใจมาก'
                  ? 'border-emerald-500 bg-emerald-50/80 shadow-xl ring-4 ring-emerald-500/20 scale-[1.02]'
                  : 'border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/30'
              }`}
            >
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition shadow-md mb-3 ${
                  rating === 'ประทับใจมาก'
                    ? 'bg-emerald-500 text-white animate-bounce'
                    : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200'
                }`}
              >
                <Smile className="w-12 h-12 sm:w-16 sm:h-16 stroke-[2.2]" />
              </div>
              <div className="font-black text-xl sm:text-2xl text-emerald-800 font-heading">
                ประทับใจมาก
              </div>
              <div className="text-xs sm:text-sm text-emerald-700 font-medium mt-1">
                (บริการสะดวกรวดเร็ว ยิ้มแย้มใส่ใจ)
              </div>
              {rating === 'ประทับใจมาก' && (
                <span className="mt-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
                  ✓ เลือกแล้ว
                </span>
              )}
            </button>

            {/* Level 2: ปานกลาง (Yellow Neutral Face) */}
            <button
              type="button"
              onClick={() => setRating('ปานกลาง')}
              className={`p-6 sm:p-8 rounded-3xl border-3 text-center transition flex flex-col items-center justify-center cursor-pointer group transform hover:scale-[1.02] ${
                rating === 'ปานกลาง'
                  ? 'border-amber-500 bg-amber-50/80 shadow-xl ring-4 ring-amber-500/20 scale-[1.02]'
                  : 'border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/30'
              }`}
            >
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition shadow-md mb-3 ${
                  rating === 'ปานกลาง'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-100 text-amber-600 group-hover:bg-amber-200'
                }`}
              >
                <Meh className="w-12 h-12 sm:w-16 sm:h-16 stroke-[2.2]" />
              </div>
              <div className="font-black text-xl sm:text-2xl text-amber-800 font-heading">
                ปานกลาง
              </div>
              <div className="text-xs sm:text-sm text-amber-700 font-medium mt-1">
                (บริการเป็นไปตามมาตรฐาน)
              </div>
              {rating === 'ปานกลาง' && (
                <span className="mt-3 px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-bold shadow-sm">
                  ✓ เลือกแล้ว
                </span>
              )}
            </button>

            {/* Level 3: ควรปรับปรุง (Red Frown Face) */}
            <button
              type="button"
              onClick={() => setRating('ควรปรับปรุง')}
              className={`p-6 sm:p-8 rounded-3xl border-3 text-center transition flex flex-col items-center justify-center cursor-pointer group transform hover:scale-[1.02] ${
                rating === 'ควรปรับปรุง'
                  ? 'border-rose-500 bg-rose-50/80 shadow-xl ring-4 ring-rose-500/20 scale-[1.02]'
                  : 'border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50/30'
              }`}
            >
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition shadow-md mb-3 ${
                  rating === 'ควรปรับปรุง'
                    ? 'bg-rose-500 text-white'
                    : 'bg-rose-100 text-rose-600 group-hover:bg-rose-200'
                }`}
              >
                <Frown className="w-12 h-12 sm:w-16 sm:h-16 stroke-[2.2]" />
              </div>
              <div className="font-black text-xl sm:text-2xl text-rose-800 font-heading">
                ควรปรับปรุง
              </div>
              <div className="text-xs sm:text-sm text-rose-700 font-medium mt-1">
                (พบปัญหา / ต้องการให้แก้ไข)
              </div>
              {rating === 'ควรปรับปรุง' && (
                <span className="mt-3 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold shadow-sm">
                  ✓ เลือกแล้ว
                </span>
              )}
            </button>
          </div>

          {rating === 'ควรปรับปรุง' && (
            <div className="p-4 bg-rose-50 rounded-2xl border-2 border-rose-200 flex items-start gap-3 animate-in fade-in duration-200">
              <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-rose-950">
                <strong className="block font-bold mb-0.5">
                  ระบบแจ้งเตือน Service Recovery ตามเกณฑ์ GECC:
                </strong>
                เมื่อท่านส่งข้อคิดเห็นนี้ ข้อมูลจะถูกส่งตรงไปยังห้องควบคุมของหัวหน้าศูนย์บริการร่วม พมจ.แพร่ ทันทีเพื่อประสานงานแก้ไขปัญหาอย่างเร่งด่วน
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Service & District Selection */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>2. เรื่องที่มาติดต่อและพื้นที่</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#d81b60]" />
                เรื่องที่มาติดต่อรับบริการ <span className="text-rose-500">*</span>
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceCategory)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#d81b60] text-base font-medium"
              >
                {SERVICES.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            </div>

            {/* District Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#d81b60]" />
                อำเภอใน จ.แพร่ <span className="text-rose-500">*</span>
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

        {/* Section 3: Feedback & Suggestions */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <label className="block text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#1a237e]" />
            <span>3. ข้อเสนอแนะ หรือ ความคิดเห็นเพิ่มเติม</span>
            <span className="text-xs font-normal text-slate-500">(พิมพ์ความรู้สึกหรือสิ่งที่ต้องการให้ปรับปรุง)</span>
          </label>
          <textarea
            rows={3}
            placeholder="เช่น เจ้าหน้าที่บริการดีมาก พูดจาไพเราะ หรือ อยากให้เพิ่มที่นั่งรอ..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d81b60] text-base"
          />
        </div>

        {/* Section 4: Contact Info (Optional / For Service Recovery) */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              <span>ข้อมูลติดต่อกลับ (ไม่บังคับระบุ)</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              เพื่อให้เจ้าหน้าที่ติดต่อกลับกรณีต้องการความช่วยเหลือเร่งด่วน
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อผู้ประเมิน</label>
              <input
                type="text"
                placeholder="เช่น นายบุญมี เมืองแพร่"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81b60]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>เบอร์โทรศัพท์</span>
              </label>
              <input
                type="tel"
                placeholder="เช่น 081-xxx-xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81b60]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสคิว (ถ้ามี)</label>
              <input
                type="text"
                placeholder="เช่น PRE-2026-001"
                value={queueId}
                onChange={(e) => setQueueId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81b60] font-mono"
              />
            </div>
          </div>
        </div>

        {/* PDPA Consent & Submit Button */}
        <div className="pt-4 border-t border-slate-200 space-y-5">
          <PdpaConsentBox
            id="pdpa-satisfaction"
            checked={pdpaConsent}
            onChange={setPdpaConsent}
            onOpenPrivacyPolicy={onOpenPrivacyPolicy}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-700 to-[#1a237e] hover:from-emerald-700 hover:to-[#0f144a] text-white font-extrabold text-lg sm:text-xl py-4 px-6 rounded-2xl shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-3 transition transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>กำลังบันทึกความคิดเห็น...</span>
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                <span>ส่งผลการประเมินความพึงพอใจ</span>
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-500 mt-2.5">
            🙏 ศูนย์บริการร่วม พมจ.แพร่ ยินดีรับฟังทุกเสียงสะท้อนเพื่อพัฒนาคุณภาพชีวิตประชาชนอย่างยั่งยืน
          </p>
        </div>
      </form>
    </div>
  );
}

