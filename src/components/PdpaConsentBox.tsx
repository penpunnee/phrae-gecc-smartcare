'use client';

import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';

interface PdpaConsentBoxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onOpenPrivacyPolicy?: () => void;
  id?: string;
  compact?: boolean;
}

export default function PdpaConsentBox({
  checked,
  onChange,
  onOpenPrivacyPolicy,
  id = 'pdpa-consent',
  compact = false,
}: PdpaConsentBoxProps) {
  return (
    <div
      className={`rounded-2xl border-2 transition ${
        checked
          ? 'bg-emerald-50/70 border-emerald-400'
          : 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-300'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-slate-300 text-[#d81b60] focus:ring-[#d81b60] cursor-pointer shrink-0"
        />
        <div className="flex-1 space-y-1">
          <label
            htmlFor={id}
            className={`font-semibold text-slate-800 cursor-pointer leading-relaxed block ${
              compact ? 'text-xs' : 'text-xs sm:text-sm'
            }`}
          >
            <span className="inline-flex items-center gap-1 text-[#1a237e] font-bold mr-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
              ความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA):
            </span>
            ข้าพเจ้ายินยอมให้สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ (พมจ.แพร่)
            เก็บรวบรวม ใช้ และประมวลผลข้อมูลส่วนบุคคลเพื่อการให้บริการตามคำร้องและการจัดสวัสดิการสังคม
            <span className="text-rose-500 ml-1">*</span>
          </label>

          {onOpenPrivacyPolicy && (
            <button
              type="button"
              onClick={onOpenPrivacyPolicy}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#d81b60] hover:text-[#ad1457] underline underline-offset-2 cursor-pointer"
            >
              <span>อ่านคำชี้แจงการคุ้มครองข้อมูลส่วนบุคคล (Privacy Notice)</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

