'use client';

import React, { useState, useEffect } from 'react';
import { GisSummaryDistrict, QueueRequest } from '@/types';
import { FALLBACK_DISTRICT_SUMMARIES } from '@/lib/gisFallbackData';
import {
  Database,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  FileJson,
  X,
  Lock,
  EyeOff,
  CheckCircle2,
  Building2,
  PhoneCall,
  Mail,
} from 'lucide-react';

interface OpenDataPdpaModalProps {
  isOpen: boolean;
  initialSection?: 'opendata' | 'pdpa';
  requests?: QueueRequest[];
  onClose: () => void;
}

export default function OpenDataPdpaModal({
  isOpen,
  initialSection = 'opendata',
  requests = [],
  onClose,
}: OpenDataPdpaModalProps) {
  const [activeSection, setActiveSection] = useState<'opendata' | 'pdpa'>(initialSection);
  const [districtsData, setDistrictsData] = useState<GisSummaryDistrict[]>(
    FALLBACK_DISTRICT_SUMMARIES
  );
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toISOString());
  const [downloadToast, setDownloadToast] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    async function fetchSummary() {
      try {
        const res = await fetch('/api/gis/summary');
        const json = await res.json();
        if (json.success && Array.isArray(json.districts)) {
          setDistrictsData(json.districts);
          if (json.timestamp) setLastUpdated(json.timestamp);
        }
      } catch {
        // Keep fallback summaries
      }
    }
    fetchSummary();
  }, [isOpen]);

  if (!isOpen) return null;

  const getQueueCountByDistrict = (districtName: string) =>
    requests.filter((r) => r.district === districtName).length;

  const totals = districtsData.reduce(
    (acc, d) => ({
      totalVulnerable: acc.totalVulnerable + d.totalVulnerable,
      bedridden: acc.bedridden + d.bedridden,
      elderlyAlone: acc.elderlyAlone + d.elderlyAlone,
      vulnerableFamily: acc.vulnerableFamily + d.vulnerableFamily,
      inFloodRiskArea: acc.inFloodRiskArea + d.inFloodRiskArea,
      urgentAssistanceNeeded: acc.urgentAssistanceNeeded + d.urgentAssistanceNeeded,
      resolvedAssistance: acc.resolvedAssistance + d.resolvedAssistance,
      queueRequests: acc.queueRequests + getQueueCountByDistrict(d.district),
    }),
    {
      totalVulnerable: 0,
      bedridden: 0,
      elderlyAlone: 0,
      vulnerableFamily: 0,
      inFloodRiskArea: 0,
      urgentAssistanceNeeded: 0,
      resolvedAssistance: 0,
      queueRequests: 0,
    }
  );

  const showToast = (msg: string) => {
    setDownloadToast(msg);
    setTimeout(() => setDownloadToast(''), 3500);
  };

  const handleDownloadCsv = () => {
    const headers = [
      'อำเภอ',
      'กลุ่มเปราะบางรวม (ราย)',
      'ผู้พิการติดเตียง (ราย)',
      'ผู้สูงอายุอยู่ลำพัง (ราย)',
      'ครอบครัวเปราะบาง (ราย)',
      'อยู่ในพื้นที่เสี่ยงน้ำท่วม (ราย)',
      'ต้องการความช่วยเหลือเร่งด่วน (ราย)',
      'ช่วยเหลือสำเร็จแล้ว (ราย)',
      'คำขอรับบริการออนไลน์ GECC (ราย)',
    ];

    const rows = districtsData.map((d) => [
      `อำเภอ${d.district}`,
      d.totalVulnerable,
      d.bedridden,
      d.elderlyAlone,
      d.vulnerableFamily,
      d.inFloodRiskArea,
      d.urgentAssistanceNeeded,
      d.resolvedAssistance,
      getQueueCountByDistrict(d.district),
    ]);

    rows.push([
      'รวมทั้งจังหวัดแพร่ (8 อำเภอ)',
      totals.totalVulnerable,
      totals.bedridden,
      totals.elderlyAlone,
      totals.vulnerableFamily,
      totals.inFloodRiskArea,
      totals.urgentAssistanceNeeded,
      totals.resolvedAssistance,
      totals.queueRequests,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `phrae-gecc-opendata-8districts-${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลดไฟล์ข้อมูลเปิด .CSV สำเร็จแล้ว');
  };

  const handleDownloadJson = () => {
    const payload = {
      metadata: {
        title: 'สถิติข้อมูลสวัสดิการสังคมและกลุ่มเปราะบาง 8 อำเภอ จังหวัดแพร่ (Open Data)',
        publisher: 'สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ (พมจ.แพร่)',
        standard: 'Open Government Data Thailand / GECC 2570',
        license: 'Creative Commons Attribution 4.0 (CC BY 4.0)',
        privacyCompliance: 'ข้อมูลสังเคราะห์เชิงสถิติ ไม่เปิดเผยข้อมูลส่วนบุคคลตาม PDPA',
        province: 'แพร่',
        updatedAt: lastUpdated,
      },
      summary: totals,
      districts: districtsData.map((d) => ({
        ...d,
        geccOnlineRequests: getQueueCountByDistrict(d.district),
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `phrae-gecc-opendata-8districts-${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลดไฟล์ข้อมูลเปิด .JSON สำเร็จแล้ว');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f144a] via-[#1a237e] to-[#ad1457] text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow">
                <Database className="w-3.5 h-3.5" />
                Open Government Data & PDPA
              </span>
              <span className="text-pink-200 text-xs">มาตรฐานศูนย์ราชการสะดวก (GECC 2570)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-heading">
              📊 ฐานข้อมูลเปิดภาครัฐ (Open Data) & ประกาศ PDPA พมจ.แพร่
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm mt-0.5">
              เปิดเผยข้อมูลสถิติสวัสดิการสังคมอย่างโปร่งใส ตรวจสอบได้ ควบคู่การคุ้มครองข้อมูลส่วนบุคคลตามมาตรฐาน PDPA
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition shrink-0 cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Switcher Tabs */}
        <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('opendata')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeSection === 'opendata'
                  ? 'bg-[#1a237e] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>1. ข้อมูลเปิดภาครัฐ (Open Data 8 อำเภอ)</span>
            </button>
            <button
              onClick={() => setActiveSection('pdpa')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeSection === 'pdpa'
                  ? 'bg-[#d81b60] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>2. นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
            </button>
          </div>

          {downloadToast && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{downloadToast}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeSection === 'opendata' ? (
            <div className="space-y-5">
              {/* Open Data Summary Cards & Export Buttons */}
              <div className="bg-gradient-to-r from-indigo-50 via-white to-pink-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-[#1a237e] text-base sm:text-lg">
                    ชุดข้อมูลเปิดสถิติสวัสดิการสังคมและกลุ่มเปราะบาง จ.แพร่ (8 อำเภอ)
                  </h3>
                  <p className="text-xs text-slate-600">
                    เผยแพร่ในรูปแบบที่เครื่องอ่านได้ (Machine-Readable) ปราศจากข้อมูลระบุตัวบุคคล (Anonymized Data) • อัปเดตล่าสุด:{' '}
                    {new Date(lastUpdated).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={handleDownloadCsv}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>ดาวน์โหลด .CSV</span>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a237e] hover:bg-[#0f144a] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-95"
                  >
                    <FileJson className="w-4 h-4" />
                    <span>ดาวน์โหลด .JSON</span>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <div className="text-xs text-slate-500">กลุ่มเปราะบางทั้งจังหวัด</div>
                  <div className="text-2xl font-black text-[#1a237e] mt-0.5">
                    {totals.totalVulnerable.toLocaleString()} <span className="text-xs font-normal">ราย</span>
                  </div>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5">
                  <div className="text-xs text-rose-700">ผู้พิการติดเตียง</div>
                  <div className="text-2xl font-black text-rose-700 mt-0.5">
                    {totals.bedridden.toLocaleString()} <span className="text-xs font-normal">ราย</span>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
                  <div className="text-xs text-amber-800">พื้นที่เสี่ยงภัยน้ำท่วม</div>
                  <div className="text-2xl font-black text-amber-700 mt-0.5">
                    {totals.inFloodRiskArea.toLocaleString()} <span className="text-xs font-normal">ราย</span>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
                  <div className="text-xs text-emerald-700">ช่วยเหลือสำเร็จแล้ว</div>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">
                    {totals.resolvedAssistance.toLocaleString()} <span className="text-xs font-normal">ราย</span>
                  </div>
                </div>
              </div>

              {/* 8 Districts Open Data Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="bg-[#1a237e] text-white">
                      <tr>
                        <th className="px-4 py-3 font-bold">อำเภอ (จ.แพร่)</th>
                        <th className="px-3 py-3 font-bold text-right">เปราะบางรวม</th>
                        <th className="px-3 py-3 font-bold text-right">พิการติดเตียง</th>
                        <th className="px-3 py-3 font-bold text-right">ผู้สูงอายุลำพัง</th>
                        <th className="px-3 py-3 font-bold text-right">ครอบครัวเปราะบาง</th>
                        <th className="px-3 py-3 font-bold text-right">เสี่ยงน้ำท่วม</th>
                        <th className="px-3 py-3 font-bold text-right">ช่วยเหลือแล้ว</th>
                        <th className="px-3 py-3 font-bold text-right">คำขอ GECC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {districtsData.map((d, idx) => (
                        <tr key={d.district} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="px-4 py-3 font-bold text-slate-900">อ.{d.district}</td>
                          <td className="px-3 py-3 text-right font-bold text-[#1a237e]">
                            {d.totalVulnerable.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right text-rose-700 font-semibold">
                            {d.bedridden.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right text-amber-700 font-semibold">
                            {d.elderlyAlone.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right text-indigo-700">
                            {d.vulnerableFamily.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right text-cyan-700 font-semibold">
                            {d.inFloodRiskArea.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right text-emerald-700 font-semibold">
                            {d.resolvedAssistance.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-[#d81b60]">
                            {getQueueCountByDistrict(d.district)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-extrabold text-slate-900">
                      <tr>
                        <td className="px-4 py-3">รวมทั้งจังหวัด (8 อำเภอ)</td>
                        <td className="px-3 py-3 text-right text-[#1a237e]">
                          {totals.totalVulnerable.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-rose-700">
                          {totals.bedridden.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-amber-700">
                          {totals.elderlyAlone.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-indigo-700">
                          {totals.vulnerableFamily.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-cyan-700">
                          {totals.inFloodRiskArea.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-emerald-700">
                          {totals.resolvedAssistance.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-[#d81b60]">
                          {totals.queueRequests}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
                <EyeOff className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>หมายเหตุด้านธรรมาภิบาลข้อมูล:</strong> ชุดข้อมูลเปิดภาครัฐ (Open Data) ชุดนี้ผ่านกระบวนการสังเคราะห์และปกปิดข้อมูลส่วนบุคคล (Data Anonymization) เรียบร้อยแล้ว เพื่อสนับสนุนการวิจัย การจัดทำแผนพัฒนาสังคมระดับจังหวัด และการใช้ประโยชน์สาธารณะภายใต้สัญญาอนุญาต CC BY 4.0
                </span>
              </div>
            </div>
          ) : (
            /* PDPA Privacy Notice Section */
            <div className="space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <div className="bg-gradient-to-r from-pink-50 via-white to-indigo-50 border border-pink-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#d81b60] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#1a237e] font-heading">
                    คำชี้แจงการคุ้มครองข้อมูลส่วนบุคคล (Privacy Notice)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ (สนง.พมจ.แพร่)
                    ปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) อย่างเคร่งครัด
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <h4 className="font-bold text-[#1a237e] text-sm">
                    1. ข้อมูลส่วนบุคคลที่เก็บรวบรวม
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li>ข้อมูลระบุตัวตน: ชื่อ-นามสกุล, เลขประจำตัวประชาชน 13 หลัก (ถ้ามี)</li>
                    <li>ข้อมูลการติดต่อ: หมายเลขโทรศัพท์, ที่อยู่, อำเภอ/ตำบล/หมู่บ้าน</li>
                    <li>เอกสารประกอบคำขอสวัสดิการสังคม และพิกัดภูมิศาสตร์สำหรับช่วยเหลือผู้ประสบภัย/กลุ่มเปราะบาง</li>
                    <li>ข้อมูลการประเมินความพึงพอใจและข้อร้องเรียน</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <h4 className="font-bold text-[#1a237e] text-sm">
                    2. วัตถุประสงค์และฐานกฎหมาย
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li>เพื่อตรวจสอบคุณสมบัติและอำนวยความสะดวกล่วงหน้า ณ ศูนย์บริการร่วม GECC</li>
                    <li>เพื่อการช่วยเหลือสงเคราะห์ คุ้มครองสวัสดิภาพ และระงับเหตุฉุกเฉิน 1300 (ฐานภารกิจเพื่อประโยชน์สาธารณะและฐานความยินยอม)</li>
                    <li>เพื่อติดตามสถานะการให้บริการและปรับปรุงคุณภาพบริการ (Service Recovery)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <h4 className="font-bold text-[#1a237e] text-sm">
                    3. มาตรการความปลอดภัยและการปกปิดข้อมูล (Data Masking)
                  </h4>
                  <p className="text-xs text-slate-600">
                    ระบบใช้การปกปิดข้อมูลส่วนบุคคลอัตโนมัติ (Data Masking) ในส่วนที่แสดงต่อสาธารณะหรือแผนที่ GIS เช่น การแสดงชื่อย่อและปิดบังเลขโทรศัพท์/เลขบัตรประชาชน รวมถึงจำกัดสิทธิ์การเข้าถึงข้อมูลเฉพาะเจ้าหน้าที่ผู้ได้รับมอบหมาย
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <h4 className="font-bold text-[#1a237e] text-sm">
                    4. สิทธิของเจ้าของข้อมูลส่วนบุคคล
                  </h4>
                  <p className="text-xs text-slate-600">
                    ท่านมีสิทธิขอเข้าถึง ขอรับสำเนา ขอแก้ไขข้อมูลให้ถูกต้อง ขอระงับการใช้ หรือขอถอนความยินยอมในการประมวลผลข้อมูลส่วนบุคคลได้ตลอดเวลา เว้นแต่มีข้อจำกัดตามกฎหมายที่เกี่ยวข้องกับการจัดสวัสดิการภาครัฐ
                  </p>
                </div>
              </div>

              {/* DPO Contact */}
              <div className="bg-[#0f144a] text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                    <Building2 className="w-4 h-4" />
                    <span>ช่องทางติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) พมจ.แพร่</span>
                  </div>
                  <p className="text-xs text-white/80">
                    สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ ชั้น 1 อาคาร 2 ศาลากลางจังหวัดแพร่ 54000
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs shrink-0">
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                    <PhoneCall className="w-3.5 h-3.5 text-pink-300" />
                    054-511-572 / 1300
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                    <Mail className="w-3.5 h-3.5 text-pink-300" />
                    phrae@m-society.go.th
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
