'use client';

import React, { useState, useMemo } from 'react';
import { AuditLogEntry, AuditLogCategory, AuditLogStatus } from '@/types';
import { exportAuditLogsToCsv } from '@/lib/auditLogger';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Download,
  Users,
  UserCheck,
  Activity,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Laptop,
  Globe,
  RefreshCw,
  Sparkles,
  Database,
  FileCheck2,
} from 'lucide-react';

interface AuditLogViewerProps {
  logs: AuditLogEntry[];
  onRefresh?: () => void;
  onSimulateEvent?: (category: AuditLogCategory) => void;
}

export default function AuditLogViewer({
  logs,
  onRefresh,
  onSimulateEvent,
}: AuditLogViewerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<AuditLogEntry | null>(null);

  // Statistics
  const totalCount = logs.length;
  const citizenCount = logs.filter((l) => l.category === 'CITIZEN').length;
  const officerCount = logs.filter((l) => l.category === 'OFFICER').length;
  const securityCount = logs.filter((l) => l.category === 'SECURITY').length;
  const failedSecurityCount = logs.filter(
    (l) => l.category === 'SECURITY' && l.status === 'FAILED'
  ).length;

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchActor = item.actor.toLowerCase().includes(q);
        const matchAction = item.action.toLowerCase().includes(q);
        const matchTarget = item.target.toLowerCase().includes(q);
        const matchIp = (item.ipAddress || '').toLowerCase().includes(q);
        const matchDetails = (item.details || '').toLowerCase().includes(q);
        return matchId || matchActor || matchAction || matchTarget || matchIp || matchDetails;
      }
      return true;
    });
  }, [logs, selectedCategory, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* GECC Standard Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-950 via-[#1a237e] to-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-indigo-400/40 text-white overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md">
                <ShieldCheck className="w-4 h-4" />
                <span>GECC หมวด 8: ความมั่นคงปลอดภัยสารสนเทศ</span>
              </span>
              <span className="text-xs text-indigo-200 font-medium">
                มาตรฐานศูนย์ราชการสะดวกระดับก้าวหน้า • พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white">
              ระบบบันทึกประวัติการใช้งานและตรวจสอบความปลอดภัย (Audit Logs)
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              จัดเก็บประวัติการกระทำทุกขั้นตอนแบบอัตโนมัติ (Activity Logging & Immutable Audit Trail) ตาม พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ฯ มาตรา 26 (เก็บรักษาไม่น้อยกว่า 90 วัน) บันทึก Timestamp, หมายเลข IP Address, อุปกรณ์ และผลลัพธ์เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้ 100%
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => exportAuditLogsToCsv(filteredLogs)}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs py-3 px-4 rounded-xl flex items-center gap-2 shadow-lg transition cursor-pointer"
              title="ส่งออกรายงานเป็นไฟล์ CSV เพื่อใช้เป็นหลักฐานในการตรวจประเมิน GECC"
            >
              <Download className="w-4 h-4" />
              <span>📥 ส่งออกไฟล์ประวัติการใช้งาน (Export Audit Log CSV)</span>
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-3 px-3.5 rounded-xl flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
                title="รีเฟรชข้อมูล Log ล่าสุด"
              >
                <RefreshCw className="w-4 h-4" />
                <span>รีเฟรช</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>ประวัติการใช้งานทั้งหมด (Total)</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-heading">
            {totalCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">บันทึกทุกกิจกรรมอัตโนมัติ</p>
        </div>

        {/* Card 2: Citizen */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>กิจกรรมประชาชน (Citizen Activity)</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 font-heading">
            {citizenCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">ยื่นแบบฟอร์ม, เช็กคิว, Chatbot</p>
        </div>

        {/* Card 3: Officer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>การปฏิบัติงานเจ้าหน้าที่ (Officer Actions)</span>
            <UserCheck className="w-4 h-4 text-[#1a237e]" />
          </div>
          <div className="text-3xl font-black text-[#1a237e] font-heading">
            {officerCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">ตรวจเอกสาร, อนุมัติ, แจ้งเตือน LINE</p>
        </div>

        {/* Card 4: Security */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>เหตุการณ์ความมั่นคง (Security & Auth)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-heading">
              {securityCount.toLocaleString()}
            </span>
            {failedSecurityCount > 0 && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                {failedSecurityCount} ผิดพลาด
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">ล็อกอิน, ตรวจสอบสิทธิ์ RBAC, TLS</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>หมวดหมู่:</span>
            </span>

            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({totalCount})
            </button>

            <button
              onClick={() => setSelectedCategory('CITIZEN')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'CITIZEN'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>ประชาชนทั่วไป ({citizenCount})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('OFFICER')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'OFFICER'
                  ? 'bg-[#1a237e] text-white shadow'
                  : 'bg-indigo-50 text-[#1a237e] hover:bg-indigo-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>เจ้าหน้าที่ พมจ. ({officerCount})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('SECURITY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'SECURITY'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>เหตุการณ์ความปลอดภัย ({securityCount})</span>
            </button>
          </div>

          {/* Quick Simulation Buttons for Evaluator Demonstration */}
          {onSimulateEvent && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                ทดสอบบันทึก Log:
              </span>
              <button
                type="button"
                onClick={() => onSimulateEvent('CITIZEN')}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold transition cursor-pointer"
                title="จำลองประชาชนเข้ามาใช้งาน"
              >
                + ประชาชน
              </button>
              <button
                type="button"
                onClick={() => onSimulateEvent('OFFICER')}
                className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded-lg text-xs font-semibold transition cursor-pointer"
                title="จำลองเจ้าหน้าที่เปลี่ยนสถานะ"
              >
                + เจ้าหน้าที่
              </button>
              <button
                type="button"
                onClick={() => onSimulateEvent('SECURITY')}
                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg text-xs font-semibold transition cursor-pointer"
                title="จำลองตรวจพบเหตุการณ์ความปลอดภัย"
              >
                + ความปลอดภัย
              </button>
            </div>
          )}
        </div>

        {/* Search input & Status dropdown */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="ค้นหา Log: ผู้ดำเนินการ, คำร้อง, กิจกรรม, หมายเลข IP, รายละเอียด..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e] bg-slate-50/50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">สถานะ:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
            >
              <option value="ALL">ทุกผลลัพธ์</option>
              <option value="SUCCESS">SUCCESS (สำเร็จ)</option>
              <option value="FAILED">FAILED (ผิดพลาด/เตือน)</option>
              <option value="WARNING">WARNING (เตือน)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 ml-auto">
            แสดง <strong className="text-slate-900 font-bold">{filteredLogs.length}</strong> จาก {totalCount} รายการ
          </div>
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-100 text-[11px] sm:text-xs uppercase text-slate-600 tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">เวลาที่เกิดเหตุ (Timestamp)</th>
                <th className="py-3 px-4 font-bold">ผู้ดำเนินการ (Actor / Role)</th>
                <th className="py-3 px-4 font-bold">การกระทำ & เป้าหมาย (Action / Target)</th>
                <th className="py-3 px-4 font-bold">หมวดหมู่</th>
                <th className="py-3 px-4 font-bold">ผลลัพธ์</th>
                <th className="py-3 px-4 font-bold">IP & อุปกรณ์</th>
                <th className="py-3 px-4 font-bold text-center">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const thaiDateStr = dateObj.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                });
                const thaiTimeStr = dateObj.toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-indigo-50/20 transition cursor-pointer"
                    onClick={() => setSelectedLogForDetails(log)}
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="font-bold text-slate-900 font-mono text-xs">
                        {thaiDateStr} {thaiTimeStr}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {log.id}
                      </div>
                    </td>

                    {/* Actor & Role */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-slate-900 leading-snug">
                        {log.actor}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.role === 'admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : log.role === 'staff'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : log.role === 'citizen'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-purple-100 text-purple-900 border border-purple-300'
                          }`}
                        >
                          {log.role.toUpperCase()}
                        </span>
                      </div>
                    </td>

                    {/* Action & Target */}
                    <td className="py-3.5 px-4 align-top max-w-xs sm:max-w-md">
                      <div className="font-mono font-bold text-indigo-900 text-xs">
                        {log.action}
                      </div>
                      <div className="text-xs text-slate-700 mt-0.5 font-medium">
                        {log.target}
                      </div>
                      {log.details && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {log.details}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                          log.category === 'CITIZEN'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : log.category === 'OFFICER'
                            ? 'bg-indigo-50 text-[#1a237e] border border-indigo-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {log.category === 'CITIZEN' && <Users className="w-3 h-3" />}
                        {log.category === 'OFFICER' && <UserCheck className="w-3 h-3" />}
                        {log.category === 'SECURITY' && <ShieldAlert className="w-3 h-3" />}
                        <span>{log.category}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : log.status === 'FAILED' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Info className="w-3 h-3" />
                        )}
                        <span>{log.status}</span>
                      </span>
                    </td>

                    {/* IP & Device */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1 font-mono text-xs text-slate-700">
                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{log.ipAddress || '192.168.10.x'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <Laptop className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[140px]">{log.device || 'Desktop Client'}</span>
                      </div>
                    </td>

                    {/* Details button */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogForDetails(log);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 text-xs font-semibold transition cursor-pointer"
                      >
                        ดูข้อมูล
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-sm">
            ไม่พบบันทึกประวัติการใช้งานที่ตรงกับเงื่อนไขการค้นหา
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[11px] font-mono text-indigo-700 font-bold block">
                  {selectedLogForDetails.id}
                </span>
                <h4 className="font-bold text-slate-900 text-lg">
                  รายละเอียดประวัติการใช้งาน (Audit Record)
                </h4>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">วันเวลา:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedLogForDetails.timestamp).toLocaleString('th-TH')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ผู้ดำเนินการ:</span>
                  <span className="font-bold text-indigo-950">
                    {selectedLogForDetails.actor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">บทบาท (Role):</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedLogForDetails.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">หมวดหมู่:</span>
                  <span className="font-bold">{selectedLogForDetails.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ผลลัพธ์ (Status):</span>
                  <span
                    className={`font-bold ${
                      selectedLogForDetails.status === 'SUCCESS'
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {selectedLogForDetails.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">การกระทำ (Action):</span>
                <p className="font-mono bg-slate-100 p-2.5 rounded-xl text-slate-800 text-xs">
                  {selectedLogForDetails.action}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">เป้าหมาย (Target):</span>
                <p className="bg-slate-100 p-2.5 rounded-xl text-slate-800 text-xs font-medium">
                  {selectedLogForDetails.target}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">รายละเอียดเพิ่มเติม:</span>
                <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 text-xs border border-slate-200">
                  {selectedLogForDetails.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">หมายเลข IP:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedLogForDetails.ipAddress || '-'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">อุปกรณ์/เบราว์เซอร์:</span>
                  <span className="font-medium text-slate-800 truncate block">
                    {selectedLogForDetails.device || '-'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedLogForDetails(null)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 transition text-xs cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

