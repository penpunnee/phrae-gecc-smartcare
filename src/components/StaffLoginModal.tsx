'use client';

import React, { useState } from 'react';
import { StaffUser } from '@/types';
import { TEST_STAFF_ACCOUNTS } from '@/lib/auditLogger';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  X,
  AlertCircle,
  LogIn,
  CheckCircle2,
  Sparkles,
  Building2,
  ShieldAlert,
} from 'lucide-react';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: StaffUser) => void;
  onLogSecurityEvent: (params: {
    actor: string;
    action: string;
    target: string;
    status: 'SUCCESS' | 'FAILED';
    details: string;
  }) => void;
}

export default function StaffLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onLogSecurityEvent,
}: StaffLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickFill = (accUsername: string, accPass: string) => {
    setUsername(accUsername);
    setPassword(accPass);
    setErrorMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน');
      setIsSubmitting(false);
      return;
    }

    // 1. Try server API authentication (queries Supabase gecc_staff_users)
    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const staff = json.data as StaffUser;
        setSuccessToast(`ยินดีต้อนรับ ${staff.name}`);
        onLogSecurityEvent({
          actor: `${staff.username} (${staff.name})`,
          action: 'STAFF_LOGIN_SUCCESS',
          target: 'ระบบบริหารจัดการศูนย์บริการร่วม พมจ.แพร่',
          status: 'SUCCESS',
          details: `เข้าสู่ระบบสำเร็จ สิทธิ์: ${staff.roleLabel} (${staff.department})`,
        });

        setTimeout(() => {
          setIsSubmitting(false);
          setSuccessToast(null);
          onLoginSuccess(staff);
          onClose();
        }, 600);
        return;
      }
    } catch {
      // ignore network errors and fallback to local accounts check
    }

    // 2. Client fallback check
    const matched = TEST_STAFF_ACCOUNTS.find(
      (acc) =>
        acc.user.username.toLowerCase() === cleanUser.toLowerCase() &&
        acc.pass === cleanPass
    );

    if (matched) {
      setSuccessToast(`ยินดีต้อนรับ ${matched.user.name}`);
      onLogSecurityEvent({
        actor: `${matched.user.username} (${matched.user.name})`,
        action: 'STAFF_LOGIN_SUCCESS',
        target: 'ระบบบริหารจัดการศูนย์บริการร่วม พมจ.แพร่',
        status: 'SUCCESS',
        details: `เข้าสู่ระบบสำเร็จ สิทธิ์: ${matched.user.roleLabel} (${matched.user.department})`,
      });

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessToast(null);
        onLoginSuccess({
          ...matched.user,
          loginTime: new Date().toISOString(),
        });
        onClose();
      }, 600);
    } else {
      setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบหรือกดคลิกบัญชีทดสอบด้านล่าง');
      setIsSubmitting(false);

      onLogSecurityEvent({
        actor: cleanUser ? `ผู้พยายามเข้าสู่ระบบ (${cleanUser})` : 'ไม่ระบุชื่อ',
        action: 'STAFF_LOGIN_FAILED',
        target: 'Staff Authentication Endpoint',
        status: 'FAILED',
        details: `พยายามเข้าสู่ระบบไม่สำเร็จด้วยชื่อผู้ใช้: "${cleanUser}" (รหัสผ่านไม่ถูกต้อง)`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#ad1457] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
                  GECC หมวด 8: ความมั่นคงปลอดภัยสารสนเทศ
                </span>
              </div>
              <h3 className="text-xl font-black font-heading mt-0.5">
                เข้าสู่ระบบเจ้าหน้าที่ พมจ.แพร่
              </h3>
              <p className="text-xs text-white/80">
                Staff Authentication & Role-Based Access Control (RBAC)
              </p>
            </div>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">เข้าสู่ระบบไม่สำเร็จ:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {successToast && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successToast} กำลังเข้าสู่ระบบ...</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin หรือ staff01"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:border-transparent bg-slate-50/50"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเข้าใช้งาน"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:border-transparent bg-slate-50/50"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#ad1457] hover:opacity-95 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบเจ้าหน้าที่'}</span>
            </button>
          </form>

          {/* Quick Auto-Fill Test Accounts for GECC Evaluators */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>คลิกบัญชีทดสอบเพื่อกรอกอัตโนมัติ (1-Click Demo)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">กดปุ่มเพื่อทดสอบ</span>
            </div>

            <div className="space-y-2">
              {TEST_STAFF_ACCOUNTS.map((acc) => (
                <button
                  key={acc.user.username}
                  type="button"
                  onClick={() => handleQuickFill(acc.user.username, acc.pass)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-[#1a237e] hover:bg-indigo-50/40 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 group-hover:bg-[#1a237e] group-hover:text-white text-[#1a237e] flex items-center justify-center font-bold text-xs shrink-0 transition">
                      {acc.user.role === 'admin' ? 'A' : acc.user.role === 'staff' ? 'S' : 'M'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#1a237e] transition">
                        {acc.user.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {acc.user.roleLabel}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded group-hover:bg-indigo-100 transition">
                      {acc.user.username} / {acc.pass}
                    </span>
                    <span className="text-[10px] text-indigo-600 block mt-0.5 font-medium">
                      คลิกกรอกทันที →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Security & PDPA Statement */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-tight">
              <strong>ความปลอดภัยตามเกณฑ์ GECC หมวด 8:</strong> ทุกครั้งที่มีการเข้าสู่ระบบ ระบบจะบันทึก Timestamp, IP Address และประเภทอุปกรณ์ลงใน Audit Log อย่างอัตโนมัติเพื่อตรวจสอบย้อนหลัง
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

