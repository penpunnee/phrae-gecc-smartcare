'use client';

import React from 'react';
import { QueueRequest } from '@/types';
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Calendar,
  MapPin,
  User,
  Phone,
  BadgeCheck,
  Building2,
} from 'lucide-react';

interface ESlipModalProps {
  request: QueueRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onLogDownload?: (action: string) => void;
}

export default function ESlipModal({ request, isOpen, onClose, onLogDownload }: ESlipModalProps) {
  if (!isOpen || !request) return null;

  const issuedDateFormatted = new Date(request.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrintPdf = () => {
    onLogDownload?.('PRINT_ESLIP_PDF');
    window.print();
  };

  const handleDownloadPng = () => {
    onLogDownload?.('DOWNLOAD_ESLIP_PNG');
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White official document background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1000, 1320);

    // Outer double border
    ctx.strokeStyle = '#1a237e';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, 952, 1272);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, 932, 1252);

    // Top Header Banner
    const grad = ctx.createLinearGradient(34, 34, 966, 34);
    grad.addColorStop(0, '#1a237e');
    grad.addColorStop(1, '#ad1457');
    ctx.fillStyle = grad;
    ctx.fillRect(34, 34, 932, 175);

    // GECC Seal Circle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(125, 120, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f144a';
    ctx.font = 'bold 22px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GECC', 125, 118);
    ctx.font = 'bold 13px Sarabun, sans-serif';
    ctx.fillText('พมจ.แพร่', 125, 140);

    // Official Title
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 20px Sarabun, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ศูนย์บริการร่วม สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่', 200, 88);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Prompt, Sarabun, sans-serif';
    ctx.fillText('ใบรับคำขอราชการอิเล็กทรอนิกส์ (e-Slip)', 200, 135);

    ctx.fillStyle = '#fce4ec';
    ctx.font = '18px Sarabun, sans-serif';
    ctx.fillText('เอกสารรับรองการยื่นคำขอรับบริการและนัดหมายล่วงหน้า (e-Certificate)', 200, 172);

    // Queue ID & Fee Banner
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(65, 235, 870, 125);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(65, 235, 870, 125);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 18px Sarabun, sans-serif';
    ctx.fillText('เลขที่คำขอ / หมายเลขคิว (Reference No.)', 95, 272);

    ctx.fillStyle = '#d81b60';
    ctx.font = 'bold 44px Prompt, Sarabun, sans-serif';
    ctx.fillText(request.id, 95, 328);

    // Fee 0 Baht Badge
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(580, 255, 330, 85);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(580, 255, 330, 85);

    ctx.fillStyle = '#065f46';
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Prompt, Sarabun, sans-serif';
    ctx.fillText('ค่าธรรมเนียม 0 บาท', 745, 294);
    ctx.font = '16px Sarabun, sans-serif';
    ctx.fillText('(ให้บริการฟรี ไม่มีค่าใช้จ่าย)', 745, 322);

    // Details rows
    ctx.textAlign = 'left';
    const rows = [
      ['ชื่อ-นามสกุล ผู้ยื่นคำขอ:', request.citizenName],
      ['บทบาทผู้ยื่นเรื่อง:', `${request.submitterRole}${request.submitterName ? ` (${request.submitterName})` : ''}`],
      ['หมายเลขโทรศัพท์:', request.phone],
      ['ภูมิลำเนา:', `อำเภอ${request.district} จังหวัดแพร่`],
      ['ประเภทบริการที่ขอรับ:', request.serviceType],
      ['วันที่นัดหมายรับบริการ:', `${request.appointmentDate} (${request.appointmentTimeSlot})`],
      ['สถานที่ติดต่อ:', 'ชั้น 1 อาคาร 2 ศาลากลางจังหวัดแพร่ (ช่อง Fast Track 1)'],
      ['สถานะคำร้องปัจจุบัน:', request.status],
      ['เอกสารที่แนบเบื้องต้น:', `${request.documents.length} รายการ`],
      ['วัน-เวลาที่ออกใบรับคำขอ:', `${issuedDateFormatted} น.`],
    ];

    let y = 415;
    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(65, y - 30, 870, 48);
      }
      ctx.fillStyle = '#475569';
      ctx.font = '20px Sarabun, sans-serif';
      ctx.fillText(label, 85, y);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px Sarabun, sans-serif';
      ctx.fillText(value, 370, y);
      y += 52;
    });

    // Digital Signature Box
    y += 25;
    ctx.fillStyle = '#eef2ff';
    ctx.fillRect(65, y, 870, 155);
    ctx.strokeStyle = '#c7d2fe';
    ctx.lineWidth = 2;
    ctx.strokeRect(65, y, 870, 155);

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 20px Prompt, Sarabun, sans-serif';
    ctx.fillText('การรับรองอิเล็กทรอนิกส์ (Digital Verification)', 95, y + 40);

    ctx.fillStyle = '#334155';
    ctx.font = '18px Sarabun, sans-serif';
    ctx.fillText(
      'เอกสารฉบับนี้จัดทำโดยระบบอัตโนมัติ ศูนย์บริการร่วม พมจ.แพร่ (GECC SmartCare)',
      95,
      y + 76
    );
    ctx.fillText(
      `Digital Hash: GECC-PHRAE-${request.id}-${request.district}`,
      95,
      y + 108
    );
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 18px Sarabun, sans-serif';
    ctx.fillText('✓ ยืนยันตัวตนและบันทึกคิวในระบบราชการเรียบร้อยแล้ว', 95, y + 138);

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.font = '17px Sarabun, sans-serif';
    ctx.fillText(
      'สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ • สายด่วน 1300 (24 ชม.) • โทร 054-511-572',
      500,
      1250
    );

    const link = document.createElement('a');
    link.download = `e-Slip-พมจแพร่-${request.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-indigo-200 my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="no-print absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable e-Slip Area */}
        <div id="eslip-print" className="bg-white">
          {/* Official Header */}
          <div className="bg-gradient-to-r from-[#0f144a] via-[#1a237e] to-[#ad1457] text-white p-6 sm:p-7 border-b-4 border-amber-400">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* GECC Official Emblem Seal */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 p-1 shadow-lg shrink-0 flex items-center justify-center ring-4 ring-white/20">
                <div className="w-full h-full rounded-full bg-[#0f144a] flex flex-col items-center justify-center text-center border border-amber-300/60">
                  <ShieldCheck className="w-6 h-6 text-amber-300" />
                  <span className="text-[10px] font-black text-white leading-none mt-0.5">
                    GECC
                  </span>
                  <span className="text-[9px] text-amber-200 leading-none mt-0.5">พมจ.แพร่</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-extrabold">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  เอกสารราชการอิเล็กทรอนิกส์ (e-Slip / e-Certificate)
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold font-heading tracking-tight">
                  ใบรับคำขอรับบริการศูนย์บริการร่วม พมจ.แพร่
                </h2>
                <p className="text-xs text-pink-100">
                  สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ • มาตรฐานศูนย์ราชการสะดวก (GECC)
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-7 space-y-5">
            {/* Queue Number & 0 Baht Fee Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-4 flex flex-col justify-center">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  เลขที่ใบรับคำขอ / หมายเลขคิว
                </span>
                <div className="text-3xl font-black text-[#d81b60] font-heading tracking-wide mt-0.5">
                  {request.id}
                </div>
                <span className="text-[11px] text-indigo-700 font-semibold mt-1">
                  สถานะ: {request.status}
                </span>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 flex flex-col justify-center text-center">
                <div className="inline-flex items-center justify-center gap-1.5 text-emerald-800 font-extrabold text-lg sm:text-xl font-heading">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>ค่าธรรมเนียม 0 บาท</span>
                </div>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  ให้บริการฟรีทุกขั้นตอน ไม่มีค่าใช้จ่ายใดๆ ทั้งสิ้น
                </p>
                <span className="text-[11px] text-emerald-600 mt-0.5">
                  เปิดให้บริการต่อเนื่องช่วงพักเที่ยง 12.00 - 13.00 น.
                </span>
              </div>
            </div>

            {/* Structured Official Details Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs sm:text-sm">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 font-bold text-[#1a237e] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#d81b60]" />
                <span>รายละเอียดผู้ยื่นคำขอและรายการนัดหมาย</span>
              </div>
              <div className="divide-y divide-slate-200 bg-white">
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                    <User className="w-3.5 h-3.5 text-pink-600" />
                    ชื่อ-นามสกุลผู้ยื่น:
                  </span>
                  <span className="font-bold text-slate-900 text-right">{request.citizenName}</span>
                </div>
                {request.citizenId && (
                  <div className="px-4 py-2.5 flex justify-between gap-4">
                    <span className="text-slate-500 shrink-0">เลขประจำตัวประชาชน:</span>
                    <span className="font-mono font-semibold text-slate-800 text-right">
                      {request.citizenId}
                    </span>
                  </div>
                )}
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                    <Phone className="w-3.5 h-3.5 text-pink-600" />
                    เบอร์โทรศัพท์ติดต่อ:
                  </span>
                  <span className="font-semibold text-slate-900 text-right">{request.phone}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-pink-600" />
                    ภูมิลำเนา:
                  </span>
                  <span className="font-semibold text-indigo-900 text-right">
                    อำเภอ{request.district} จังหวัดแพร่
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">ประเภทบริการ:</span>
                  <span className="font-bold text-[#d81b60] text-right">{request.serviceType}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-pink-600" />
                    วันที่นัดหมายรับบริการ:
                  </span>
                  <span className="font-bold text-[#1a237e] text-right">
                    {request.appointmentDate} ({request.appointmentTimeSlot})
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-pink-600" />
                    จุดให้บริการ:
                  </span>
                  <span className="font-medium text-slate-800 text-right">
                    เคาน์เตอร์ Fast Track 1 ชั้น 1 ศาลากลาง จ.แพร่
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">เอกสารที่ส่งตรวจล่วงหน้า:</span>
                  <span className="font-medium text-slate-800 text-right">
                    {request.documents.length} รายการ (
                    {request.documents.map((d) => d.name).join(', ') || 'ตรวจเบื้องต้น'})
                  </span>
                </div>
              </div>
            </div>

            {/* Digital Signature / Verification Stamp */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#1a237e] flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>รับรองความถูกต้องด้วยระบบอิเล็กทรอนิกส์ (GECC Digital e-Slip)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  ออกเอกสารเมื่อ: {issuedDateFormatted} น. • อ้างอิงระบบ: GECC-PHRAE-{request.id}
                </p>
              </div>
              <div className="text-right shrink-0 border-t sm:border-t-0 sm:border-l border-indigo-200 pt-2 sm:pt-0 sm:pl-4">
                <div className="text-xs font-bold text-indigo-900">ศูนย์บริการร่วม พมจ.แพร่</div>
                <div className="text-[11px] text-slate-500">สายด่วน 1300 • โทร 054-511-572</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Excluded from Print) */}
        <div className="no-print bg-slate-100 p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePrintPdf}
            className="flex-1 bg-gradient-to-r from-[#1a237e] to-[#ad1457] hover:from-[#121858] hover:to-[#880e4f] text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์ / บันทึกเป็น PDF (Print / Save PDF)</span>
          </button>

          <button
            onClick={handleDownloadPng}
            className="bg-white hover:bg-slate-50 text-[#1a237e] font-bold py-3 px-4 rounded-xl border-2 border-indigo-200 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลดรูป e-Slip (.PNG)</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

