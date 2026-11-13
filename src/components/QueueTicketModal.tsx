'use client';

import React, { useRef } from 'react';
import { QueueRequest } from '@/types';
import {
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  Phone,
  FileText,
  Search,
  X,
  Sparkles,
} from 'lucide-react';

interface QueueTicketModalProps {
  request: QueueRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackQueue: (id: string) => void;
  onOpenESlip?: (request: QueueRequest) => void;
}

export default function QueueTicketModal({
  request,
  isOpen,
  onClose,
  onTrackQueue,
  onOpenESlip,
}: QueueTicketModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !request) return null;

  // Function to generate and download PNG image using HTML5 Canvas
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 900, 1180);
    grad.addColorStop(0, '#1a237e');
    grad.addColorStop(0.35, '#283593');
    grad.addColorStop(1, '#ad1457');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 1180);

    // Inner White Card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(40, 40, 820, 1100, 24);
    ctx.fill();

    // Card Header Bar (Pink to Navy)
    const headerGrad = ctx.createLinearGradient(40, 40, 860, 40);
    headerGrad.addColorStop(0, '#d81b60');
    headerGrad.addColorStop(1, '#1a237e');
    ctx.fillStyle = headerGrad;
    ctx.beginPath();
    ctx.roundRect(40, 40, 820, 160, [24, 24, 0, 0]);
    ctx.fill();

    // Header Text
    ctx.fillStyle = '#fce4ec';
    ctx.font = 'bold 22px Prompt, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ศูนย์บริการร่วม พมจ.แพร่ (GECC Smart Care)', 450, 85);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Prompt, Sarabun, sans-serif';
    ctx.fillText('บัตรคิว Fast Track ตรวจเอกสารล่วงหน้า', 450, 130);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 18px Sarabun, sans-serif';
    ctx.fillText('มาตรฐานศูนย์ราชการสะดวก (GECC) สะดวก รวดเร็ว เข้าถึงง่าย', 450, 165);

    // Gold decorative stripe
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(40, 200, 820, 8);

    // Queue Number Box
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 235, 740, 180, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px Sarabun, sans-serif';
    ctx.fillText('หมายเลขคิวของคุณ (QUEUE NUMBER)', 450, 275);

    ctx.fillStyle = '#d81b60';
    ctx.font = 'bold 64px Prompt, Sarabun, sans-serif';
    ctx.fillText(request.id, 450, 350);

    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 20px Sarabun, sans-serif';
    ctx.fillText('✓ ช่องบริการ Fast Track เคาน์เตอร์ 1 พมจ.แพร่', 450, 390);

    // Details Section
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px Prompt, Sarabun, sans-serif';
    ctx.fillText('ข้อมูลการยื่นคำร้องและนัดหมาย', 80, 460);

    // Details Grid Items
    const items = [
      { label: 'ชื่อ-นามสกุล:', value: request.citizenName },
      { label: 'เบอร์โทรศัพท์:', value: request.phone },
      { label: 'ภูมิลำเนา:', value: `อำเภอ${request.district} จังหวัดแพร่` },
      { label: 'ประเภทบริการ:', value: request.serviceType },
      { label: 'วันนัดหมาย:', value: `${request.appointmentDate} (${request.appointmentTimeSlot})` },
      { label: 'ผู้ยื่นเรื่อง:', value: `${request.submitterRole} ${request.submitterName ? `(${request.submitterName})` : ''}` },
      { label: 'สถานะปัจจุบัน:', value: request.status },
    ];

    let startY = 510;
    items.forEach((item, index) => {
      // Row background zebra
      if (index % 2 === 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(80, startY - 26, 740, 42, 8);
        ctx.fill();
      }

      ctx.fillStyle = '#64748b';
      ctx.font = '20px Sarabun, sans-serif';
      ctx.fillText(item.label, 100, startY);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px Sarabun, sans-serif';
      ctx.fillText(item.value, 300, startY);

      startY += 50;
    });

    // Barcode Mockup Box
    startY += 10;
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(80, startY, 740, 110, 12);
    ctx.fill();

    // Draw simulated barcode lines
    ctx.fillStyle = '#1e293b';
    const barcodeX = 140;
    const barcodeWidths = [3, 1, 4, 2, 5, 1, 3, 2, 6, 2, 4, 1, 5, 2, 3, 1, 4, 2, 5, 3, 2, 6, 1, 3, 4, 2, 5, 1, 3, 2, 6, 2, 4, 1, 5, 2, 3, 1, 4, 2];
    let curX = barcodeX;
    barcodeWidths.forEach((w) => {
      ctx.fillRect(curX, startY + 20, w * 3, 45);
      curX += (w * 3) + 8;
    });

    ctx.textAlign = 'center';
    ctx.font = '16px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`* ${request.id} *`, 450, startY + 92);

    // Footer notice
    startY += 140;
    ctx.fillStyle = '#d81b60';
    ctx.font = 'bold 18px Sarabun, sans-serif';
    ctx.fillText('💡 กรุณาบันทึกภาพหน้าจอนี้ หรือนำรหัสคิวมาแสดง ณ จุดบริการ', 450, startY);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px Sarabun, sans-serif';
    ctx.fillText('สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ ศาลากลาง จ.แพร่ โทร 054-511-572', 450, startY + 30);

    // Download trigger
    const link = document.createElement('a');
    link.download = `บัตรคิว-พมจแพร่-${request.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="no-print absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Ticket Card Area */}
        <div id="queue-ticket-print" ref={cardRef}>
          {/* Card Banner Header */}
          <div className="bg-gradient-to-r from-[#d81b60] via-[#c2185b] to-[#1a237e] text-white p-6 sm:p-7 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow">
                <Sparkles className="w-3 h-3" />
                GECC Fast Track
              </span>
              <span className="text-pink-100 text-xs">ศูนย์บริการร่วม พมจ.แพร่</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading">
              บัตรคิวตรวจเอกสารล่วงหน้า
            </h2>
            <p className="text-pink-100 text-xs sm:text-sm mt-0.5">
              ระบบนัดหมายด่วน ศูนย์ราชการสะดวก จ.แพร่
            </p>
          </div>

          {/* Ticket Body */}
          <div className="p-6 sm:p-7 space-y-6">
            {/* Queue Number Callout */}
            <div className="text-center bg-gradient-to-b from-pink-50/70 to-slate-50 border-2 border-dashed border-pink-300 rounded-2xl p-5 shadow-inner">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">
                หมายเลขคิวของคุณ (QUEUE NUMBER)
              </div>
              <div className="text-4xl sm:text-5xl font-black text-[#d81b60] tracking-wider py-1 font-heading">
                {request.id}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mt-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ช่องบริการ Fast Track เคาน์เตอร์ 1
              </div>
            </div>

            {/* Information List */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-200">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-pink-600" />
                  ผู้ยื่นเรื่อง:
                </span>
                <span className="font-bold text-slate-900 text-right">
                  {request.citizenName}
                  {request.submitterRole !== 'ประชาชนทั่วไป' && (
                    <span className="block text-xs text-indigo-600 font-normal">
                      ({request.submitterRole})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-pink-600" />
                  เบอร์โทรศัพท์:
                </span>
                <span className="font-semibold text-slate-900">{request.phone}</span>
              </div>

              <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-pink-600" />
                  พื้นที่ภูมิลำเนา:
                </span>
                <span className="font-semibold text-indigo-900">
                  อ.{request.district} จ.แพร่
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-200">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-pink-600" />
                  ประเภทบริการ:
                </span>
                <span className="font-bold text-[#d81b60] text-right">
                  {request.serviceType}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-pink-600" />
                  วัน-เวลานัดหมาย:
                </span>
                <span className="font-bold text-[#1a237e] text-right">
                  {request.appointmentDate}
                  <span className="block text-xs font-normal text-slate-600">
                    {request.appointmentTimeSlot}
                  </span>
                </span>
              </div>
            </div>

            {/* Simulated barcode */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
              <div className="h-10 flex items-center justify-center gap-1">
                <div className="w-1 h-8 bg-slate-800"></div>
                <div className="w-2 h-8 bg-slate-800"></div>
                <div className="w-0.5 h-8 bg-slate-800"></div>
                <div className="w-1.5 h-8 bg-slate-800"></div>
                <div className="w-2 h-8 bg-slate-800"></div>
                <div className="w-1 h-8 bg-slate-800"></div>
                <div className="w-0.5 h-8 bg-slate-800"></div>
                <div className="w-3 h-8 bg-slate-800"></div>
                <div className="w-1.5 h-8 bg-slate-800"></div>
                <div className="w-0.5 h-8 bg-slate-800"></div>
                <div className="w-2 h-8 bg-slate-800"></div>
                <div className="w-1 h-8 bg-slate-800"></div>
                <div className="w-3 h-8 bg-slate-800"></div>
                <div className="w-1.5 h-8 bg-slate-800"></div>
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-1">
                SCAN-FASTTRACK-{request.id}
              </p>
            </div>

            {/* Helpful Notice */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <span className="text-base">📌</span>
              <div>
                <p className="font-bold">คำแนะนำสำหรับผู้รับบริการ:</p>
                <p className="text-amber-800 mt-0.5">
                  กรุณาบันทึกภาพหน้าจอบัตรคิวนี้ไว้ และแสดงต่อเจ้าหน้าที่ ณ ช่อง Fast Track 1 สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ ชั้น 1 ศาลากลางจังหวัดแพร่
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Excluded from Print) */}
        <div className="no-print bg-slate-100 p-4 sm:p-5 border-t border-slate-200 space-y-2.5">
          {onOpenESlip && (
            <button
              onClick={() => onOpenESlip(request)}
              className="w-full bg-gradient-to-r from-[#1a237e] via-[#283593] to-indigo-800 hover:from-[#121858] hover:to-indigo-900 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer text-sm"
            >
              <span>📄 ดาวน์โหลด/พิมพ์ใบรับคำขออิเล็กทรอนิกส์ (e-Slip)</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleDownloadImage}
              className="flex-1 bg-gradient-to-r from-[#d81b60] to-[#ad1457] hover:from-[#c2185b] hover:to-[#880e4f] text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>บันทึกภาพบัตรคิว (Download)</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onTrackQueue(request.id);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>เช็กสถานะ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

