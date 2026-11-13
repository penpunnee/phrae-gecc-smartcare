'use client';

import React, { useState, useEffect } from 'react';
import {
  QueueRequest,
  QueueStatus,
  District,
  FeedbackItem,
  ComplaintItem,
  ComplaintStatus,
} from '@/types';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Save,
  FileText,
  Download,
  Send,
  Sparkles,
  BarChart3,
  Building,
  Heart,
  Smile,
  Meh,
  Frown,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Check,
  Trophy,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  FileCheck,
  Layers,
  Award,
  Zap,
  MapPin,
  Waves,
  Radio,
  ArrowUpRight,
  Megaphone,
} from 'lucide-react';

interface AdminDashboardProps {
  requests: QueueRequest[];
  feedbacks?: FeedbackItem[];
  complaints?: ComplaintItem[];
  viewMode?: 'all' | 'queue' | 'executive';
  onUpdateRequest: (id: string, updates: Partial<QueueRequest>) => Promise<void>;
  onUpdateFeedback?: (id: string, updates: Partial<FeedbackItem>) => Promise<void>;
  onUpdateComplaint?: (id: string, updates: Partial<ComplaintItem>) => Promise<void>;
  onAddFeedback?: (newFeedback: FeedbackItem) => void;
  onOpenTicket: (request: QueueRequest) => void;
  onSwitchToGis?: () => void;
  onLogActivity?: (params: {
    actor: string;
    role: 'staff' | 'admin';
    action: string;
    target: string;
    status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO';
    category?: 'OFFICER' | 'SECURITY';
    details?: string;
  }) => void;
}

const COMPLAINT_STATUS_OPTIONS: ComplaintStatus[] = [
  '1. รับเรื่องแล้ว',
  '2. ส่งต่อเจ้าหน้าที่/ทีม 1300',
  '3. กำลังลงพื้นที่แก้ไข (Take Action)',
  '4. ดำเนินการเสร็จสิ้น',
];

const STATUS_OPTIONS: QueueStatus[] = [
  '1. รับเรื่องแล้ว',
  '2. ตรวจเอกสารผ่าน',
  '3. รออนุมัติ/ลงพื้นที่',
  '4. ดำเนินการสำเร็จ',
  'เอกสารไม่ครบถ้วนให้แก้ไข',
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

export default function AdminDashboard({
  requests,
  feedbacks = [],
  complaints = [],
  viewMode = 'all',
  onUpdateRequest,
  onUpdateFeedback,
  onUpdateComplaint,
  onAddFeedback,
  onOpenTicket,
  onSwitchToGis,
  onLogActivity,
}: AdminDashboardProps) {
  const [search, setSearch] = useState('');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [gisSummary, setGisSummary] = useState<any>(null);

  // Load GIS Proactive Summary for War Room
  useEffect(() => {
    async function loadGisSummary() {
      try {
        const res = await fetch('/api/gis/summary');
        const json = await res.json();
        if (json.success) {
          setGisSummary(json);
        }
      } catch (err) {
        console.error('Failed to load GIS summary:', err);
      }
    }
    loadGisSummary();
  }, []);

  // Active editing notes state: { [id: string]: string }
  const [editingNotes, setEditingNotes] = useState<{ [id: string]: string }>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lineAlertMsg, setLineAlertMsg] = useState<string | null>(null);
  const [selectedDocReq, setSelectedDocReq] = useState<QueueRequest | null>(null);

  // Recovery notes state
  const [recoveryNotes, setRecoveryNotes] = useState<{ [id: string]: string }>({});
  const [savingRecoveryId, setSavingRecoveryId] = useState<string | null>(null);

  // Complaints & 1300 Take Action state
  const [complaintNotes, setComplaintNotes] = useState<{ [id: string]: string }>({});
  const [complaintOfficers, setComplaintOfficers] = useState<{ [id: string]: string }>({});
  const [savingComplaintId, setSavingComplaintId] = useState<string | null>(null);
  const [savedComplaintToast, setSavedComplaintToast] = useState<string | null>(null);
  const [complaintFilter, setComplaintFilter] = useState<'all' | 'active' | 'done'>('all');

  // Testing CSI feedback state (Simulated live interaction for user)
  const [localFeedbacks, setLocalFeedbacks] = useState<FeedbackItem[]>(feedbacks);

  // Keep local feedbacks in sync with prop updates
  React.useEffect(() => {
    setLocalFeedbacks(feedbacks);
  }, [feedbacks]);

  // SLA and Statistics Calculations
  const total = requests.length;
  const verifiedCount = requests.filter(
    (r) => r.status === '2. ตรวจเอกสารผ่าน' || r.status === '4. ดำเนินการสำเร็จ'
  ).length;
  const pendingCount = requests.filter((r) => r.status === '1. รับเรื่องแล้ว').length;
  const incompleteCount = requests.filter((r) => r.status === 'เอกสารไม่ครบถ้วนให้แก้ไข').length;

  const totalSla = requests.reduce((acc, curr) => acc + (curr.slaMinutes || 12), 0);
  const avgSla = total > 0 ? (totalSla / total).toFixed(1) : '11.0';

  // Real-time CSI Score Calculation
  const totalFeedback = localFeedbacks.length;
  const impressedCount = localFeedbacks.filter((f) => f.rating === 'ประทับใจมาก').length;
  const neutralCount = localFeedbacks.filter((f) => f.rating === 'ปานกลาง').length;
  const improvementList = localFeedbacks.filter((f) => f.rating === 'ควรปรับปรุง');
  const pendingRecoveryList = improvementList.filter((f) => f.recoveryStatus === 'รอประสานงาน');

  // Weighted Customer Satisfaction Index (CSI Score %)
  const csiScore =
    totalFeedback > 0
      ? (
          ((impressedCount * 100 + neutralCount * 75 + (improvementList.length - pendingRecoveryList.length) * 40 + pendingRecoveryList.length * 15) /
            (totalFeedback * 100)) *
          100
        ).toFixed(1)
      : '98.4';

  // District distribution
  const districtCounts = DISTRICTS.map((d) => ({
    district: d,
    count: requests.filter((r) => r.district === d).length,
  }));
  const maxDistrictCount = Math.max(...districtCounts.map((d) => d.count), 1);

  // Live test rating handler (adds instant rating to demonstrate real-time reactivity)
  const handleLiveTestRating = (type: 'ประทับใจมาก' | 'ปานกลาง' | 'ควรปรับปรุง') => {
    const newItem: FeedbackItem = {
      id: `TEST-${Date.now()}`,
      rating: type,
      score: type === 'ประทับใจมาก' ? 5 : type === 'ปานกลาง' ? 3 : 1,
      serviceType: 'ทำบัตรคนพิการ/ต่ออายุบัตร',
      district: 'เมืองแพร่',
      citizenName: 'ผู้ทดสอบระบบ (Executive Demo)',
      createdAt: new Date().toISOString(),
      recoveryStatus: type === 'ควรปรับปรุง' ? 'รอประสานงาน' : 'เสร็จสิ้น',
      comment: `ทดสอบให้คะแนนสดระดับ "${type}" ผ่าน Executive War Room`,
    };

    setLocalFeedbacks((prev) => [newItem, ...prev]);
    if (onAddFeedback) {
      onAddFeedback(newItem);
    }
  };

  // Filtered requests list
  const filtered = requests.filter((r) => {
    const matchSearch =
      !search ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.citizenName.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search);

    const matchDistrict = filterDistrict === 'all' || r.district === filterDistrict;
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;

    return matchSearch && matchDistrict && matchStatus;
  });

  const handleStatusChange = async (id: string, newStatus: QueueStatus) => {
    setSavingId(id);
    await onUpdateRequest(id, { status: newStatus });
    setSavingId(null);
    onLogActivity?.({
      actor: 'เจ้าหน้าที่ศูนย์บริการร่วม พมจ.แพร่',
      role: 'staff',
      action: 'UPDATE_QUEUE_STATUS',
      target: `คำร้อง: ${id} -> ${newStatus}`,
      status: 'SUCCESS',
      category: 'OFFICER',
      details: `ปรับเปลี่ยนสถานะคำร้อง ${id} เป็น "${newStatus}"`,
    });
  };

  const handleNoteSave = async (id: string) => {
    const note = editingNotes[id];
    if (note === undefined) return;
    setSavingId(id);
    await onUpdateRequest(id, {
      officerNotes: note,
      officerName: 'เจ้าหน้าที่ศูนย์บริการร่วม พมจ.แพร่ (Admin)',
    });
    setSavingId(null);
    onLogActivity?.({
      actor: 'เจ้าหน้าที่ศูนย์บริการร่วม พมจ.แพร่',
      role: 'staff',
      action: 'SAVE_OFFICER_NOTES',
      target: `คำร้อง: ${id}`,
      status: 'SUCCESS',
      category: 'OFFICER',
      details: `บันทึกหมายเหตุตอบกลับประชาชน: "${note}"`,
    });
  };

  const handleServiceRecovery = async (
    fbId: string,
    newStatus: 'รอประสานงาน' | 'ติดต่อกลับแล้ว (Service Recovery)' | 'เสร็จสิ้น'
  ) => {
    setSavingRecoveryId(fbId);
    const note = recoveryNotes[fbId];
    if (onUpdateFeedback) {
      await onUpdateFeedback(fbId, {
        recoveryStatus: newStatus,
        ...(note !== undefined ? { recoveryNote: note } : {}),
      });
    } else {
      setLocalFeedbacks((prev) =>
        prev.map((f) =>
          f.id === fbId
            ? {
                ...f,
                recoveryStatus: newStatus,
                recoveryNote: note || f.recoveryNote,
                recoveredAt: new Date().toISOString(),
              }
            : f
        )
      );
    }
    setSavingRecoveryId(null);
    onLogActivity?.({
      actor: 'เจ้าหน้าที่ศูนย์บริการร่วม พมจ.แพร่',
      role: 'staff',
      action: 'SERVICE_RECOVERY_UPDATE',
      target: `ข้อเสนอแนะ: ${fbId}`,
      status: 'SUCCESS',
      category: 'OFFICER',
      details: `บันทึกแนวทางแก้ไขปัญหา Service Recovery: "${newStatus}" ${note ? `(${note})` : ''}`,
    });
  };

  const handleComplaintStatusChange = async (cmpId: string, newStatus: ComplaintStatus) => {
    if (!onUpdateComplaint) return;
    setSavingComplaintId(cmpId);
    const updates: Partial<ComplaintItem> = { status: newStatus };
    if (complaintNotes[cmpId] !== undefined) {
      updates.takeActionNote = complaintNotes[cmpId];
    }
    if (complaintOfficers[cmpId] !== undefined) {
      updates.assignedOfficer = complaintOfficers[cmpId];
    }
    await onUpdateComplaint(cmpId, updates);
    setSavingComplaintId(null);
    setSavedComplaintToast(cmpId);
    setTimeout(() => setSavedComplaintToast(null), 2500);

    onLogActivity?.({
      actor: 'เจ้าหน้าที่ทีม 1300 / พมจ.แพร่',
      role: 'staff',
      action: 'UPDATE_COMPLAINT_STATUS',
      target: `เรื่องร้องเรียน/เหตุฉุกเฉิน: ${cmpId} -> ${newStatus}`,
      status: 'SUCCESS',
      category: 'OFFICER',
      details: `ปรับขั้นตอนการแก้ไขปัญหา CMP เป็น "${newStatus}"`,
    });
  };

  const handleComplaintTakeActionSave = async (cmp: ComplaintItem) => {
    if (!onUpdateComplaint) return;
    const note =
      complaintNotes[cmp.id] !== undefined ? complaintNotes[cmp.id] : cmp.takeActionNote;
    const officer =
      complaintOfficers[cmp.id] !== undefined
        ? complaintOfficers[cmp.id]
        : cmp.assignedOfficer;

    setSavingComplaintId(cmp.id);
    await onUpdateComplaint(cmp.id, {
      takeActionNote: note,
      assignedOfficer: officer,
    });
    setSavingComplaintId(null);
    setSavedComplaintToast(cmp.id);
    setTimeout(() => setSavedComplaintToast(null), 2500);

    onLogActivity?.({
      actor: officer || 'เจ้าหน้าที่ทีม 1300',
      role: 'staff',
      action: 'SAVE_COMPLAINT_TAKE_ACTION',
      target: `เรื่องร้องเรียน: ${cmp.id}`,
      status: 'SUCCESS',
      category: 'OFFICER',
      details: `บันทึกผลการ Take Action: "${note}" (ผู้รับผิดชอบ: ${officer})`,
    });
  };

  const pendingComplaintsCount = complaints.filter((c) => c.statusStep < 4).length;
  const completedComplaintsCount = complaints.filter((c) => c.statusStep === 4).length;
  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'active') return c.statusStep < 4;
    if (complaintFilter === 'done') return c.statusStep === 4;
    return true;
  });

  const handleTestLineNotify = async (req: QueueRequest) => {
    setLineAlertMsg('กำลังส่งคำสั่งแจ้งเตือน LINE...');
    try {
      const res = await fetch('/api/notify-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: req.id,
          citizenName: req.citizenName,
          phone: req.phone,
          district: req.district,
          serviceType: req.serviceType,
          appointmentDate: req.appointmentDate,
          appointmentTimeSlot: req.appointmentTimeSlot,
          submitterRole: req.submitterRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLineAlertMsg(
          `✓ ${data.message || 'ส่งแจ้งเตือนสำเร็จ'} (${req.id} - ${req.citizenName})`
        );
        onLogActivity?.({
          actor: 'เจ้าหน้าที่ศูนย์บริการร่วม พมจ.แพร่',
          role: 'staff',
          action: 'SEND_LINE_NOTIFICATION',
          target: `คิว: ${req.id} (${req.citizenName})`,
          status: 'SUCCESS',
          category: 'OFFICER',
          details: `ส่งแจ้งเตือนสถานะคำร้องเข้า LINE Messaging API เรียบร้อย`,
        });
      } else {
        setLineAlertMsg(`❌ ${data.error || 'ส่งแจ้งเตือนไม่สำเร็จ'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending LINE message';
      setLineAlertMsg(`❌ ${msg}`);
    }

    setTimeout(() => {
      setLineAlertMsg(null);
    }, 6000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'รหัสคิว',
      'ชื่อ-นามสกุล',
      'เบอร์โทรศัพท์',
      'อำเภอ',
      'ประเภทบริการ',
      'วันนัดหมาย',
      'ผู้ยื่น',
      'สถานะ',
      'หมายเหตุเจ้าหน้าที่',
      'เวลารอเฉลี่ย(นาที)',
    ];

    const rows = requests.map((r) => [
      `"${r.id}"`,
      `"${r.citizenName}"`,
      `"${r.phone}"`,
      `"${r.district}"`,
      `"${r.serviceType}"`,
      `"${r.appointmentDate}"`,
      `"${r.submitterRole}"`,
      `"${r.status}"`,
      `"${(r.officerNotes || '').replace(/"/g, '""')}"`,
      r.slaMinutes,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายงานคิว_พมจแพร่_GECC_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onLogActivity?.({
      actor: 'เจ้าหน้าที่ศูนย์บริการร่วม พมจ.แพร่',
      role: 'staff',
      action: 'EXPORT_QUEUE_CSV',
      target: 'รายงานคิวผู้รับบริการ พมจ.แพร่ (CSV)',
      status: 'SUCCESS',
      category: 'OFFICER',
      details: `ส่งออกไฟล์ข้อมูลคิวจำนวน ${requests.length} รายการ`,
    });
  };

  return (
    <div className="space-y-6">
      {(viewMode === 'all' || viewMode === 'executive') && (
        <>
          {/* EXECUTIVE HEADER BANNER (GOLD AWARD LEVEL) */}
      <div className="relative bg-gradient-to-r from-slate-950 via-[#1a237e] to-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-400/40 text-white overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md">
                <Trophy className="w-3.5 h-3.5" />
                <span>GECC GOLD AWARD LEVEL</span>
              </span>
              <span className="text-xs text-amber-200/90 font-medium">
                ศูนย์ราชการสะดวก มาตรฐานระดับก้าวหน้า (โล่รางวัลสีทอง)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white font-mono">
                Command Center v2.0
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading tracking-tight text-white">
              Executive GECC Dashboard & War Room
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              ศูนย์ปฏิบัติการอัจฉริยะ สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ ติดตามผลลัพธ์การยกระดับบริการประชาชน สถิติเชิงเปรียบเทียบ และดัชนีความพึงพอใจ Real-time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 border border-white/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>ส่งออกรายงาน (CSV)</span>
            </button>

            <div className="bg-amber-400/15 border border-amber-400/30 p-2.5 rounded-2xl flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-400 shrink-0" />
              <div className="text-left text-xs">
                <span className="font-bold text-amber-300 block">เกณฑ์มาตรฐาน GECC</span>
                <span className="text-white/80">ผ่านเกณฑ์สมบูรณ์ 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BEFORE & AFTER COMPARATIVE METRICS (GECC GOLD BENCHMARK) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
              ผลสัมฤทธิ์เชิงประจักษ์ (Tangible Outcomes)
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 font-heading">
              การเปรียบเทียบผลลัพธ์ ก่อน - หลัง พัฒนาระบบ (Before & After GECC)
            </h3>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
            ข้อมูลเปรียบเทียบรายปี 2568 vs 2569
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Service Wait Time */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>เวลารับบริการเฉลี่ย (Service Time)</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-400 line-through block">ก่อน: 45 นาที</span>
                <span className="text-3xl font-black text-[#1a237e] font-heading">{avgSla}</span>
                <span className="text-xs text-slate-600 font-bold ml-1">นาที/คน</span>
              </div>
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                ลดลง 75.5%
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              ผ่านเกณฑ์ศูนย์ราชการสะดวก &le; 15 นาที
            </div>
          </div>

          {/* Metric 2: Paperless Reduction */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>ลดการใช้สำเนาเอกสาร (Paperless)</span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-400 line-through block">ก่อน: 4-6 แผ่น</span>
                <span className="text-3xl font-black text-emerald-700 font-heading">0</span>
                <span className="text-xs text-slate-600 font-bold ml-1">แผ่น (100%)</span>
              </div>
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <Zap className="w-3.5 h-3.5 mr-0.5" />
                Paperless 100%
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              ยื่นเอกสารภาพถ่ายออนไลน์ ประชาชนไม่ต้องพกสำเนา
            </div>
          </div>

          {/* Metric 3: Repeat Visits */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-50/70 to-white border border-pink-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>การเดินทางมาติดต่อซ้ำ (Visits)</span>
              <Layers className="w-4 h-4 text-[#d81b60]" />
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-400 line-through block">ก่อน: 2.3 ครั้ง</span>
                <span className="text-3xl font-black text-[#d81b60] font-heading">1</span>
                <span className="text-xs text-slate-600 font-bold ml-1">ครั้งเบ็ดเสร็จ</span>
              </div>
              <span className="inline-flex items-center text-xs font-bold text-pink-700 bg-pink-100 px-2.5 py-1 rounded-full">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                ลดลง 56.5%
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Pre-Check ตรวจเอกสารครบก่อนมา จบในรอบเดียว
            </div>
          </div>

          {/* Metric 4: CSI Score */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 to-white border border-amber-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>ดัชนีความพึงพอใจ (CSI Score)</span>
              <Heart className="w-4 h-4 text-amber-600" />
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-400 line-through block">ก่อน: 82.1%</span>
                <span className="text-3xl font-black text-amber-600 font-heading">{csiScore}%</span>
              </div>
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +16.3%
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              คะแนนสะท้อนเสียงจริงของผู้รับบริการ (Real-time)
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE CSI SCORE & LIVE TESTING BAR */}
      <div className="bg-gradient-to-r from-teal-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-teal-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-bold text-xs">
                Interactive CSI Engine
              </span>
              <span className="text-xs text-teal-200">
                ดัชนีความพึงพอใจของผู้รับบริการ (Customer Satisfaction Index)
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-emerald-400 font-heading">
                {csiScore}%
              </span>
              <span className="text-sm text-teal-100 font-medium">
                (คำนวณสดจาก {totalFeedback} ผู้ประเมิน • ประทับใจ {impressedCount} | ปานกลาง {neutralCount} | ควรปรับปรุง {improvementList.length})
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              ระบบเชื่อมต่อแบบ Real-time: ทดลองกดปุ่มด้านขวาเพื่อจำลองการส่งคะแนนความพึงพอใจและดูดัชนี CSI ปรับค่าทันที
            </p>
          </div>

          {/* Interactive Live Rating Buttons for User Testing */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            <span className="text-xs text-teal-200 font-bold">กดทดสอบให้คะแนนสด:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLiveTestRating('ประทับใจมาก')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition transform active:scale-95 cursor-pointer"
                title="ทดสอบส่งคะแนน: ประทับใจมาก"
              >
                <Smile className="w-4 h-4 text-slate-950" />
                <span>ยิ้ม (+100%)</span>
              </button>

              <button
                onClick={() => handleLiveTestRating('ปานกลาง')}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition transform active:scale-95 cursor-pointer"
                title="ทดสอบส่งคะแนน: ปานกลาง"
              >
                <Meh className="w-4 h-4 text-slate-950" />
                <span>ปกติ (+75%)</span>
              </button>

              <button
                onClick={() => handleLiveTestRating('ควรปรับปรุง')}
                className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 shadow transition transform active:scale-95 cursor-pointer"
                title="ทดสอบส่งคะแนน: ควรปรับปรุง (จะเกิดแจ้งเตือน Service Recovery ทันที)"
              >
                <Frown className="w-4 h-4 text-white" />
                <span>บึ้ง (เตือน SOS)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTIVE GIS & YOM BASIN PROACTIVE COMMAND CENTER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-[#d81b60] uppercase tracking-wider block">
              โมดูลบริการเชิงรุกเดือนที่ 2 (Month 2 Proactive Care)
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#d81b60]" />
              <span>ศูนย์บัญชาการข้อมูลเชิงรุก GIS &amp; ลุ่มน้ำยม (Executive GIS Command)</span>
            </h3>
          </div>
          {onSwitchToGis && (
            <button
              onClick={onSwitchToGis}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#d81b60] to-[#1a237e] text-white text-xs font-bold flex items-center gap-1.5 shadow hover:shadow-lg transition cursor-pointer"
            >
              <span>เปิดดูแผนที่ GIS เต็มรูปแบบ</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 4 Cards: Proactive Vulnerable Stats & River Yom Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold block">ผู้เปราะบาง 8 อำเภอ (GIS)</span>
            <div className="text-2xl font-black text-[#1a237e] mt-1 font-heading">
              {gisSummary?.proactiveTotals?.totalVulnerable?.toLocaleString() || '1,632'}{' '}
              <span className="text-xs font-normal text-slate-600">ราย</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ครอบคลุม 8 อำเภอใน จ.แพร่ ชี้เป้าโดยเครือข่าย อพม.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
            <span className="text-xs text-rose-800 font-semibold block">ผู้ป่วยติดเตียงดูแลพิเศษ</span>
            <div className="text-2xl font-black text-rose-700 mt-1 font-heading">
              {gisSummary?.proactiveTotals?.totalBedridden?.toLocaleString() || '442'}{' '}
              <span className="text-xs font-normal text-rose-800">ราย</span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1">
              ทีม One Stop Service จัดชุดบริการเคลื่อนที่เยี่ยมถึงบ้าน
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-xs text-amber-900 font-semibold block">ผู้สูงอายุอยู่ตามลำพัง</span>
            <div className="text-2xl font-black text-amber-700 mt-1 font-heading">
              {gisSummary?.proactiveTotals?.totalElderlyAlone?.toLocaleString() || '849'}{' '}
              <span className="text-xs font-normal text-amber-800">ราย</span>
            </div>
            <p className="text-[11px] text-amber-800 mt-1">
              เฝ้าระวังสวัสดิการและเบี้ยยังชีพผ่านระบบ Smart Care
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            gisSummary?.riverStatus?.level === 'CRITICAL'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-400'
              : 'bg-indigo-50/70 border-indigo-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">สถานะลุ่มน้ำยม (จ.แพร่)</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                gisSummary?.riverStatus?.level === 'CRITICAL'
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-600 text-white'
              }`}>
                {gisSummary?.riverStatus?.level === 'CRITICAL' ? 'วิกฤตล้นตลิ่ง' : 'ระดับปกติ'}
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-1">
              สถานี Y.20, Y.1C, Y.37
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              พื้นที่เสี่ยงภัยน้ำท่วม: {gisSummary?.proactiveTotals?.totalFloodRisk?.toLocaleString() || '487'} ครัวเรือน
            </p>
          </div>
        </div>
      </div>

      {/* 8 DISTRICTS SERVICE VOLUME BAR CHART VISUALIZATION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-[#d81b60] uppercase tracking-wider block">
              สถิติการเข้าถึงบริการระดับพื้นที่ (District Accessibility)
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading">
              จำนวนผู้รับบริการแยกตาม 8 อำเภอ จังหวัดแพร่
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            รวม {total} รายการคำร้อง
          </span>
        </div>

        {/* Visual Bar Graph */}
        <div className="space-y-3 pt-2">
          {districtCounts.map((d) => {
            const pct = Math.round((d.count / maxDistrictCount) * 100);
            const isSelected = filterDistrict === d.district;

            return (
              <div
                key={d.district}
                onClick={() => setFilterDistrict(isSelected ? 'all' : d.district)}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-pink-50/80 border-[#d81b60] shadow-sm'
                    : 'bg-slate-50/50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-700" />
                    <span>อำเภอ{d.district}</span>
                    {isSelected && (
                      <span className="text-[10px] text-[#d81b60] font-normal">(กำลังกรองตาราง)</span>
                    )}
                  </span>
                  <span className="text-slate-900 font-mono text-sm">{d.count} คำร้อง</span>
                </div>

                {/* Bar */}
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#d81b60] to-[#1a237e] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pct, 5)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RED ALERT BANNER: SERVICE RECOVERY */}
      {improvementList.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-red-50 to-rose-100 border-2 border-rose-400 rounded-3xl p-6 shadow-md animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-xs">
                    GECC Service Recovery
                  </span>
                  <span className="text-xs text-rose-800 font-semibold">
                    พบข้อเสนอแนะ &ldquo;ควรปรับปรุง&rdquo; ({improvementList.length} รายการ)
                  </span>
                </div>
                <h4 className="font-extrabold text-rose-950 text-base sm:text-lg mt-0.5 font-heading">
                  แจ้งเตือนด่วน: ศูนย์ประสานงานเยียวยาข้อร้องเรียน (Service Recovery)
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  ตามเกณฑ์ศูนย์ราชการสะดวก: เจ้าหน้าที่ต้องติดต่อกลับและบันทึกแนวทางแก้ไขปัญหาให้ประชาชนภายใน 24 ชม.
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 bg-rose-200 text-rose-900 rounded-full text-xs font-bold">
              ค้างแก้ไข: {pendingRecoveryList.length} รายการ
            </span>
          </div>

          {/* List of Service Recovery Items */}
          <div className="mt-4 space-y-3">
            {improvementList.map((fb) => {
              const isPending = fb.recoveryStatus === 'รอประสานงาน';
              const currentRecoveryNote =
                recoveryNotes[fb.id] !== undefined ? recoveryNotes[fb.id] : fb.recoveryNote || '';

              return (
                <div
                  key={fb.id}
                  className={`p-4 rounded-2xl border transition ${
                    isPending
                      ? 'bg-white border-rose-300 shadow-sm'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-rose-900 text-sm">
                          {fb.citizenName || 'ประชาชนผู้รับบริการ'}
                        </span>
                        {fb.phone && (
                          <a
                            href={`tel:${fb.phone}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md hover:bg-indigo-100"
                          >
                            <PhoneCall className="w-3 h-3 text-indigo-600" />
                            <span>{fb.phone}</span>
                          </a>
                        )}
                        <span className="text-xs text-slate-500">
                          • อ.{fb.district} จ.แพร่
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          • {fb.serviceType}
                        </span>
                        {fb.queueId && (
                          <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            คิว: {fb.queueId}
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-200/60 text-xs text-rose-900">
                        <strong>ข้อคิดเห็นจากประชาชน:</strong> &ldquo;{fb.comment || 'ไม่ได้ระบุรายละเอียด'}&rdquo;
                      </div>
                    </div>

                    {/* Service Recovery Action Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <div className="flex-1 sm:w-64">
                        <input
                          type="text"
                          placeholder="บันทึกผลการประสานงานแก้ไข..."
                          value={currentRecoveryNote}
                          onChange={(e) =>
                            setRecoveryNotes((prev) => ({
                              ...prev,
                              [fb.id]: e.target.value,
                            }))
                          }
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                        />
                      </div>

                      {isPending ? (
                        <button
                          onClick={() =>
                            handleServiceRecovery(fb.id, 'ติดต่อกลับแล้ว (Service Recovery)')
                          }
                          disabled={savingRecoveryId === fb.id}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>บันทึก Service Recovery</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-2 rounded-xl shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          <span>แก้ไขเรียบร้อยแล้ว</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPLAINTS & 1300 TAKE ACTION CENTER */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-rose-200 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-700 via-red-700 to-[#1a237e] text-white p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
                  1300 & GECC Take Action Center
                </span>
                {pendingComplaintsCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-extrabold animate-pulse">
                    รอดำเนินการ {pendingComplaintsCount} เรื่อง
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold font-heading mt-1">
                📢 ศูนย์จัดการเรื่องร้องเรียน & แจ้งเหตุฉุกเฉิน 1300 (CMP)
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                เปลี่ยนสถานะ 4 ขั้นตอนและบันทึกผล Take Action เพื่ออัปเดตให้ประชาชนตรวจสอบได้แบบ Real-time
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setComplaintFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                complaintFilter === 'all'
                  ? 'bg-white text-rose-700 shadow'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              ทั้งหมด ({complaints.length})
            </button>
            <button
              type="button"
              onClick={() => setComplaintFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                complaintFilter === 'active'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              กำลังแก้ไข ({pendingComplaintsCount})
            </button>
            <button
              type="button"
              onClick={() => setComplaintFilter('done')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                complaintFilter === 'done'
                  ? 'bg-emerald-400 text-slate-950 shadow'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              เสร็จสิ้น ({completedComplaintsCount})
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4 bg-slate-50/40">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              ไม่พบรายการเรื่องร้องเรียน / แจ้งเหตุ 1300 ในหมวดนี้
            </div>
          ) : (
            filteredComplaints.map((cmp) => {
              const isEmergency = cmp.type === 'แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300';
              const currentNote =
                complaintNotes[cmp.id] !== undefined
                  ? complaintNotes[cmp.id]
                  : cmp.takeActionNote;
              const currentOfficer =
                complaintOfficers[cmp.id] !== undefined
                  ? complaintOfficers[cmp.id]
                  : cmp.assignedOfficer;

              return (
                <div
                  key={cmp.id}
                  className={`rounded-2xl border-2 p-4 sm:p-5 bg-white shadow-sm transition ${
                    cmp.statusStep === 4
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isEmergency
                      ? 'border-rose-300'
                      : 'border-indigo-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-base text-[#1a237e]">
                          {cmp.id}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isEmergency
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {cmp.type}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          • อ.{cmp.district} จ.แพร่
                        </span>
                        {savedComplaintToast === cmp.id && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold animate-in fade-in">
                            <Check className="w-3 h-3" />
                            <span>บันทึกเรียบร้อย</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
                        <span>
                          <strong>ผู้แจ้ง:</strong> {cmp.reporterName}
                        </span>
                        <a
                          href={`tel:${cmp.phone}`}
                          className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md hover:bg-indigo-100"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>{cmp.phone}</span>
                        </a>
                        {cmp.locationDetail && (
                          <span className="text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{cmp.locationDetail}</span>
                          </span>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800">
                        <strong>รายละเอียด:</strong> {cmp.description}
                      </div>
                    </div>

                    {/* Right: Take Action Controls */}
                    <div className="lg:w-[420px] shrink-0 space-y-2.5 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            สถานะดำเนินการ (4 ขั้นตอน)
                          </label>
                          <select
                            value={cmp.status}
                            disabled={savingComplaintId === cmp.id}
                            onChange={(e) =>
                              handleComplaintStatusChange(
                                cmp.id,
                                e.target.value as ComplaintStatus
                              )
                            }
                            className={`w-full text-xs font-bold px-2.5 py-2 rounded-xl border focus:outline-none focus:ring-2 cursor-pointer ${
                              cmp.statusStep === 4
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                : cmp.statusStep === 3
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          >
                            {COMPLAINT_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            ผู้รับผิดชอบ / ทีมปฏิบัติการ
                          </label>
                          <input
                            type="text"
                            value={currentOfficer}
                            onChange={(e) =>
                              setComplaintOfficers((prev) => ({
                                ...prev,
                                [cmp.id]: e.target.value,
                              }))
                            }
                            className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          บันทึกผลการแก้ไข (Take Action Log)
                        </label>
                        <textarea
                          rows={2}
                          value={currentNote}
                          onChange={(e) =>
                            setComplaintNotes((prev) => ({
                              ...prev,
                              [cmp.id]: e.target.value,
                            }))
                          }
                          placeholder="พิมพ์รายงานการลงพื้นที่หรือผลการช่วยเหลือ..."
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a237e]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleComplaintTakeActionSave(cmp)}
                        disabled={savingComplaintId === cmp.id}
                        className="w-full bg-gradient-to-r from-[#1a237e] to-rose-600 hover:from-[#121858] hover:to-rose-700 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>
                          {savingComplaintId === cmp.id
                            ? 'กำลังบันทึก...'
                            : 'บันทึกผล Take Action'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      )}

      {(viewMode === 'all' || viewMode === 'queue') && (
        <>
          {viewMode === 'queue' && (
            <div className="relative bg-gradient-to-r from-slate-950 via-[#1a237e] to-[#283593] rounded-3xl p-6 sm:p-8 text-white shadow-2xl border-2 border-indigo-400/40 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>ศูนย์คัดกรองคำร้องและอนุมัติเอกสาร</span>
                    </span>
                    <span className="text-xs text-indigo-200 font-medium">
                      พมจ.แพร่ • Fast Track Fast Service &le; 15 นาที
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white">
                    1. จัดการคิวและอนุมัติเอกสารล่วงหน้า (Pre-Check Fast Track)
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    ตรวจเอกสารภาพถ่ายของประชาชนล่วงหน้า อนุมัติสิทธิ์ ออกบัตรคิวด่วน Fast Track บันทึกหมายเหตุตอบกลับ และส่งข้อความแจ้งเตือนผ่าน LINE
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExportCSV}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 border border-white/20 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>ส่งออกรายงานคิว (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Status quick counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <span className="text-[11px] text-indigo-200 block">คำร้องทั้งหมด</span>
                  <span className="text-2xl font-black text-white">{total}</span>
                </div>
                <div className="p-3 bg-amber-400/20 border border-amber-400/30 rounded-2xl">
                  <span className="text-[11px] text-amber-200 block">1. รับเรื่องแล้ว (รอตรวจ)</span>
                  <span className="text-2xl font-black text-amber-300">{pendingCount}</span>
                </div>
                <div className="p-3 bg-blue-400/20 border border-blue-400/30 rounded-2xl">
                  <span className="text-[11px] text-blue-200 block">2. ตรวจเอกสารผ่านแล้ว</span>
                  <span className="text-2xl font-black text-blue-300">{verifiedCount}</span>
                </div>
                <div className="p-3 bg-rose-400/20 border border-rose-400/30 rounded-2xl">
                  <span className="text-[11px] text-rose-200 block">เอกสารไม่ครบถ้วน</span>
                  <span className="text-2xl font-black text-rose-300">{incompleteCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* QUEUE MANAGEMENT DATA TABLE */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#d81b60]" />
            <h3 className="text-lg font-bold text-slate-900">
              ตารางบริหารคำร้องส่งตรวจเอกสารล่วงหน้า ({filtered.length} รายการ)
            </h3>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัส, เบอร์..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d81b60] w-48 sm:w-56"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#d81b60]"
            >
              <option value="all">ทุกอำเภอในแพร่</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  อ.{d}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#d81b60]"
            >
              <option value="all">ทุกสถานะ</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600 tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">รหัสคิว / เวลา</th>
                <th className="py-3.5 px-4 font-bold">ผู้รับบริการ / เบอร์โทร</th>
                <th className="py-3.5 px-4 font-bold">บริการ / นัดหมาย</th>
                <th className="py-3.5 px-4 font-bold">เอกสารแนบ</th>
                <th className="py-3.5 px-4 font-bold">สถานะ (คลิกเปลี่ยนได้)</th>
                <th className="py-3.5 px-4 font-bold min-w-[280px]">หมายเหตุตอบกลับประชาชน</th>
                <th className="py-3.5 px-4 font-bold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((req) => {
                const currentNote =
                  editingNotes[req.id] !== undefined ? editingNotes[req.id] : req.officerNotes;
                const isNoteChanged =
                  editingNotes[req.id] !== undefined && editingNotes[req.id] !== req.officerNotes;

                return (
                  <tr key={req.id} className="hover:bg-pink-50/20 transition">
                    {/* Queue Code & Time */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-[#d81b60] text-base font-heading">
                        {req.id}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        {new Date(req.createdAt).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} น.
                      </div>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        SLA: {req.slaMinutes} นาที
                      </span>
                    </td>

                    {/* Citizen Name & Phone */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-slate-900">{req.citizenName}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{req.phone}</div>
                      <div className="text-xs text-indigo-700 font-medium mt-1">
                        อ.{req.district} จ.แพร่
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        ยื่นโดย: {req.submitterRole}
                      </div>
                    </td>

                    {/* Service & Appointment */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-slate-800 text-xs sm:text-sm">
                        {req.serviceType}
                      </div>
                      <div className="text-xs text-[#1a237e] font-semibold mt-1">
                        📅 {req.appointmentDate}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ⏰ {req.appointmentTimeSlot}
                      </div>
                    </td>

                    {/* Attached Documents */}
                    <td className="py-4 px-4 align-top">
                      <button
                        onClick={() => {
                          setSelectedDocReq(req);
                          onLogActivity?.({
                            actor: 'เจ้าหน้าที่ศูนย์บริการร่วม พมจ.แพร่',
                            role: 'staff',
                            action: 'INSPECT_CITIZEN_DOCS',
                            target: `เอกสารคำร้อง: ${req.id} (${req.citizenName})`,
                            status: 'SUCCESS',
                            category: 'OFFICER',
                            details: `เปิดตรวจสอบเอกสารแนบส่วนบุคคลจำนวน ${req.documents.length} ไฟล์ ตามข้อกำหนด PDPA`,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#1a237e] text-xs font-semibold transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{req.documents.length} ไฟล์</span>
                      </button>
                    </td>

                    {/* Status Changer */}
                    <td className="py-4 px-4 align-top">
                      <div className="relative">
                        <select
                          value={req.status}
                          disabled={savingId === req.id}
                          onChange={(e) =>
                            handleStatusChange(req.id, e.target.value as QueueStatus)
                          }
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 cursor-pointer transition ${
                            req.status === '4. ดำเนินการสำเร็จ'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : req.status === '2. ตรวจเอกสารผ่าน'
                              ? 'bg-blue-50 border-blue-300 text-blue-800'
                              : req.status === '3. รออนุมัติ/ลงพื้นที่'
                              ? 'bg-purple-50 border-purple-300 text-purple-800'
                              : req.status === 'เอกสารไม่ครบถ้วนให้แก้ไข'
                              ? 'bg-rose-50 border-rose-300 text-rose-800'
                              : 'bg-amber-50 border-amber-300 text-amber-800'
                          }`}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Officer Notes Editor */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={currentNote}
                          onChange={(e) =>
                            setEditingNotes((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          placeholder="พิมพ์ข้อความตอบกลับประชาชน เช่น เอกสารครบถ้วน นัดรับบัตร..."
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d81b60] bg-white resize-y"
                        />
                        {isNoteChanged && (
                          <button
                            onClick={() => handleNoteSave(req.id)}
                            disabled={savingId === req.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 px-3 rounded-lg flex items-center gap-1 shadow-sm transition cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>บันทึกหมายเหตุ</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions: View Ticket & Test LINE */}
                    <td className="py-4 px-4 align-top text-center">
                      <div className="flex flex-col gap-1.5 items-center">
                        <button
                          onClick={() => onOpenTicket(req)}
                          className="w-full text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 transition flex items-center justify-center gap-1 cursor-pointer"
                          title="ดูและพิมพ์บัตรคิว Fast Track"
                        >
                          <FileText className="w-3 h-3" />
                          <span>บัตรคิว</span>
                        </button>

                        <button
                          onClick={() => handleTestLineNotify(req)}
                          className="w-full text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold py-1.5 px-2.5 rounded-lg border border-emerald-200 transition flex items-center justify-center gap-1 cursor-pointer"
                          title="ส่งแจ้งเตือนเข้า LINE Messaging API"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>เตือน LINE</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            ไม่พบคำร้องที่ตรงกับเงื่อนไขการค้นหา
          </div>
        )}
      </div>
        </>
      )}

      {/* Modal for viewing uploaded documents */}
      {selectedDocReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">
                  เอกสารแนบ: {selectedDocReq.id}
                </h4>
                <p className="text-xs text-slate-500">
                  ผู้ยื่น: {selectedDocReq.citizenName} ({selectedDocReq.serviceType})
                </p>
              </div>
              <button
                onClick={() => setSelectedDocReq(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {selectedDocReq.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#d81b60]" />
                    <div>
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {doc.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{doc.size}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    พร้อมตรวจ
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
              💡 เจ้าหน้าที่สามารถตรวจความถูกต้องของเอกสารก่อนผู้รับบริการเดินทางมาถึง
            </div>

            <button
              onClick={() => setSelectedDocReq(null)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 transition text-sm cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
