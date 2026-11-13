'use client';

import React from 'react';
import { StaffUser } from '@/types';
import {
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Building2,
  Eye,
  Lock,
  LogOut,
  UserCheck,
  LayoutDashboard,
  Users,
} from 'lucide-react';

interface HeaderProps {
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  highContrast: boolean;
  setHighContrast: (contrast: boolean) => void;
  staffUser: StaffUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  isStaffMode: boolean;
  onToggleStaffMode: (enable: boolean) => void;
}

export default function Header({
  fontSize,
  setFontSize,
  highContrast,
  setHighContrast,
  staffUser,
  onOpenLogin,
  onLogout,
  isStaffMode,
  onToggleStaffMode,
}: HeaderProps) {
  return (
    <header className="relative bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#ad1457] text-white shadow-xl">
      {/* Top emergency & accessibility bar */}
      <div className="border-b border-white/15 bg-black/20 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Hotline contact */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-amber-300">
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span>สายด่วน พม. 1300 (ฟรี 24 ชม.)</span>
            </span>
            <span className="hidden md:inline text-white/40">|</span>
            <span className="hidden md:inline text-white/80">
              โทรศัพท์ พมจ.แพร่: 054-511-572, 054-511-209
            </span>
          </div>

          {/* Accessibility tools */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {/* High Contrast */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                highContrast
                  ? 'bg-yellow-400 text-slate-950 font-bold shadow'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="สลับโหมดคอนทราสต์สูงเพื่อการอ่านที่ชัดเจน"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">คอนทราสต์สูง</span>
            </button>

            {/* Font size toggle for elderly */}
            <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/20">
              <span className="text-[11px] text-white/70 px-2 hidden sm:inline">ขนาดอักษร:</span>
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded-full text-xs transition ${
                  fontSize === 'normal'
                    ? 'bg-white text-[#1a237e] font-bold shadow-sm'
                    : 'text-white hover:text-amber-200'
                }`}
                title="ขนาดตัวอักษรปกติ"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2.5 py-0.5 rounded-full text-sm font-semibold transition ${
                  fontSize === 'large'
                    ? 'bg-white text-[#1a237e] font-bold shadow-sm'
                    : 'text-white hover:text-amber-200'
                }`}
                title="ขนาดตัวอักษรใหญ่ (แนะนำสำหรับผู้สูงอายุ)"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2.5 py-0.5 rounded-full text-base font-bold transition ${
                  fontSize === 'xlarge'
                    ? 'bg-white text-[#1a237e] font-bold shadow-sm'
                    : 'text-white hover:text-amber-200'
                }`}
                title="ขนาดตัวอักษรใหญ่พิเศษ"
              >
                A++
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main branding hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Logo & Org Titles */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Phrae & MSD Emblem Seal */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-600 to-indigo-900 p-1 shadow-2xl ring-4 ring-white/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#1a237e] rounded-xl flex flex-col items-center justify-center text-center p-1">
                  <Building2 className="w-7 h-7 sm:w-9 sm:h-9 text-pink-300" />
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-tight text-white leading-none mt-1">
                    พมจ.แพร่
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-1 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-400/90 text-slate-950 text-xs font-bold tracking-wide shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ศูนย์ราชการสะดวก (GECC)
                </span>
                <span className="text-pink-200 text-xs font-medium bg-pink-900/60 border border-pink-400/30 px-2 py-0.5 rounded">
                  Fast Track บริการด่วน
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm font-heading">
                ศูนย์บริการร่วม พมจ.แพร่{' '}
                <span className="text-pink-300 font-light block sm:inline">
                  (GECC Smart Care)
                </span>
              </h1>
              <p className="text-white/80 text-sm sm:text-base mt-1 flex items-center gap-1.5 flex-wrap">
                <span>สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่</span>
                <span className="hidden sm:inline text-white/40">•</span>
                <span className="text-amber-200 font-medium">
                  “สะดวก รวดเร็ว เข้าถึงง่าย ใส่ใจประชาชน”
                </span>
              </p>
            </div>
          </div>

            {/* Quick Fast Track highlights badge & Staff Auth Box */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {!staffUser ? (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl hover:shadow-2xl transition transform hover:-translate-y-0.5 cursor-pointer ring-2 ring-white/30"
                >
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>🔐 เข้าสู่ระบบเจ้าหน้าที่ พมจ.แพร่</span>
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-black/30 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-white/25 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow">
                      {staffUser.role === 'admin' ? 'A' : 'S'}
                    </div>
                    <div className="text-left text-xs leading-tight">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{staffUser.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400 text-slate-950 font-black">
                          {staffUser.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-pink-200 text-[11px] mt-0.5 max-w-[220px] truncate">
                        {staffUser.roleLabel}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 sm:pt-0 sm:border-l sm:border-white/20 sm:pl-2.5 w-full sm:w-auto justify-between sm:justify-start">
                    <button
                      type="button"
                      onClick={() => onToggleStaffMode(!isStaffMode)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isStaffMode
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : 'bg-white/20 hover:bg-white/30 text-white'
                      }`}
                      title={isStaffMode ? 'สลับไปยังมุมมองประชาชน' : 'เข้าสู่ระบบหลังบ้านเจ้าหน้าที่'}
                    >
                      {isStaffMode ? (
                        <>
                          <Users className="w-3.5 h-3.5" />
                          <span>ดูหน้าประชาชน</span>
                        </>
                      ) : (
                        <>
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>ระบบหลังบ้าน</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={onLogout}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-100 hover:text-white transition text-xs font-bold cursor-pointer"
                      title="ออกจากระบบเจ้าหน้าที่"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>ออก</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/20">
                <div className="text-right border-r border-white/20 pr-2.5">
                  <div className="text-[10px] text-pink-200">เป้าหมายเวลาบริการ GECC</div>
                  <div className="text-base font-bold text-amber-300">≤ 15 นาที</div>
                </div>
                <div className="text-left pl-0.5">
                  <div className="text-[10px] text-white/80">ครอบคลุม 8 อำเภอ</div>
                  <div className="text-[11px] font-semibold text-white">จังหวัดแพร่</div>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Decorative ribbon divider */}
      <div className="h-1.5 bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-300"></div>
    </header>
  );
}

