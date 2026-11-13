'use client';

import React from 'react';
import {
  ShieldCheck,
  PhoneCall,
  Mail,
  Clock,
  MapPin,
  Building2,
  Heart,
  Database,
  Lock,
} from 'lucide-react';

interface FooterProps {
  onOpenDataPdpa?: (section?: 'opendata' | 'pdpa') => void;
}

export default function Footer({ onOpenDataPdpa }: FooterProps) {
  return (
    <footer className="no-print mt-16 bg-[#0f144a] text-white/80 text-sm border-t-4 border-[#d81b60]">
      {/* Open Data & PDPA Action Strip */}
      <div className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#880e4f] border-b border-white/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base font-heading">
                ความโปร่งใสภาครัฐ (Open Government Data) & การคุ้มครองข้อมูลส่วนบุคคล (PDPA)
              </h3>
              <p className="text-xs text-pink-100 mt-0.5">
                ตรวจสอบสถิติกลุ่มเปราะบาง 8 อำเภอ จ.แพร่ ดาวน์โหลดไฟล์ .CSV / .JSON และอ่านประกาศความเป็นส่วนตัว
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenDataPdpa?.('opendata')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <span>📊 ฐานข้อมูลเปิดภาครัฐ (Open Data) & ประกาศ PDPA</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenDataPdpa?.('pdpa')}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-pink-200" />
              <span>นโยบาย PDPA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upper footer info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-white text-base">พมจ.แพร่</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ มุ่งมั่นให้บริการด้วยมาตรฐานศูนย์ราชการสะดวก (GECC) สะดวก รวดเร็ว เข้าถึงง่าย
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-bold text-xs shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>ศูนย์ราชการสะดวก GECC รับรองแล้ว</span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider text-pink-300">
              บริการด่วน Fast Track
            </h4>
            <ul className="text-xs space-y-2 text-white/70">
              <li>• ออกบัตรและต่ออายุบัตรประจำตัวคนพิการ</li>
              <li>• กู้ยืมเงินทุนประกอบอาชีพผู้สูงอายุ (กองทุนผู้สูงอายุ)</li>
              <li>• เงินอุดหนุนเพื่อการเลี้ยงดูเด็กแรกเกิด (กองทุนเด็ก)</li>
              <li>• กู้ยืมเงินทุนประกอบอาชีพคนพิการ (กองทุนคนพิการ)</li>
              <li>• เงินสงเคราะห์การจัดการศพผู้สูงอายุตามประเพณี</li>
              <li>• คำร้องทั่วไปและรับปรึกษาปัญหาทางสังคม</li>
            </ul>
          </div>

          {/* Col 3: Contact & Hours */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider text-pink-300">
              เวลาทำการ & จุดบริการ
            </h4>
            <div className="text-xs space-y-2 text-white/70">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  วันจันทร์ - วันศุกร์: 08.30 - 16.30 น.
                  <br />
                  <strong className="text-amber-200">
                    (เปิดให้บริการต่อเนื่องช่วงพักกลางวัน 12.00 - 13.00 น.)
                  </strong>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <span>ชั้น 1 อาคาร 2 ศาลากลางจังหวัดแพร่ ถ.ไชยบูรณ์ ต.ในเวียง อ.เมือง จ.แพร่ 54000</span>
              </div>
            </div>
          </div>

          {/* Col 4: Hotlines */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider text-pink-300">
              ติดต่อสอบถาม
            </h4>
            <div className="text-xs space-y-2 text-white/70">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-amber-300 shrink-0" />
                <span>สายด่วน พม. 1300 (โทรฟรี 24 ชม.)</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-amber-300 shrink-0" />
                <span>โทรศัพท์: 054-511-572, 054-511-209</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                <span>อีเมล: phrae@m-society.go.th</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-black/30 py-4 text-xs text-center text-white/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ (พมจ.แพร่)
          </span>
          <span className="flex items-center gap-1">
            ขับเคลื่อนระบบด้วยความห่วงใยเพื่อชาวแพร่ <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
          </span>
        </div>
      </div>
    </footer>
  );
}

