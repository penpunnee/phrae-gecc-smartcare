'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PreCheckForm from '@/components/PreCheckForm';
import StatusTracker from '@/components/StatusTracker';
import AdminDashboard from '@/components/AdminDashboard';
import GisProactiveMap from '@/components/GisProactiveMap';
import SatisfactionForm from '@/components/SatisfactionForm';
import QueueTicketModal from '@/components/QueueTicketModal';
import ESlipModal from '@/components/ESlipModal';
import ChatbotWidget from '@/components/ChatbotWidget';
import ComplaintEmergencyPanel from '@/components/ComplaintEmergencyPanel';
import OpenDataPdpaModal from '@/components/OpenDataPdpaModal';
import StaffLoginModal from '@/components/StaffLoginModal';
import AuditLogViewer from '@/components/AuditLogViewer';
import {
  QueueRequest,
  FeedbackItem,
  VulnerablePerson,
  ComplaintItem,
  StaffUser,
  AuditLogEntry,
  AuditLogCategory,
  AuditLogStatus,
} from '@/types';
import {
  INITIAL_REQUESTS,
  INITIAL_FEEDBACK,
  INITIAL_VULNERABLE,
  INITIAL_COMPLAINTS,
} from '@/lib/mockData';
import { INITIAL_AUDIT_LOGS, createAuditLog } from '@/lib/auditLogger';
import {
  FileCheck,
  Search,
  LayoutDashboard,
  Smile,
  PhoneCall,
  MapPin,
  Trophy,
  Megaphone,
  Database,
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  LogOut,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';

// Citizen Public Tabs (No Login required)
type CitizenTabType = 'precheck' | 'tracker' | 'complaint' | 'satisfaction';

// Staff Backoffice Tabs (Role-Based Access)
type StaffTabType = 'staff-queue' | 'staff-gis' | 'staff-executive' | 'staff-audit';

export default function HomePage() {
  // Staff Auth State
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Active Tab state
  // Requirement 1: Default Landing Page for citizens is Tab 1: 'precheck' ("ส่งตรวจเอกสารล่วงหน้า & จองคิวด่วน")
  const [activeCitizenTab, setActiveCitizenTab] = useState<CitizenTabType>('precheck');
  const [activeStaffTab, setActiveStaffTab] = useState<StaffTabType>('staff-queue');

  // Business Data
  const [requests, setRequests] = useState<QueueRequest[]>(INITIAL_REQUESTS);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(INITIAL_FEEDBACK);
  const [vulnerableList, setVulnerableList] = useState<VulnerablePerson[]>(INITIAL_VULNERABLE);
  const [complaints, setComplaints] = useState<ComplaintItem[]>(INITIAL_COMPLAINTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [isLoading, setIsLoading] = useState(true);

  // Search query to prefill in tracker tab
  const [trackerSearchId, setTrackerSearchId] = useState('');

  // Queue Ticket Modal State
  const [selectedTicket, setSelectedTicket] = useState<QueueRequest | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // e-Slip Modal State
  const [selectedESlip, setSelectedESlip] = useState<QueueRequest | null>(null);
  const [isESlipModalOpen, setIsESlipModalOpen] = useState(false);

  // Open Data & PDPA Modal State
  const [isOpenDataModalOpen, setIsOpenDataModalOpen] = useState(false);
  const [openDataSection, setOpenDataSection] = useState<'opendata' | 'pdpa'>('opendata');

  // Accessibility States
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highContrast, setHighContrast] = useState(false);

  // Central Logging Function (GECC หมวด 8 & PDPA Compliance)
  const logActivity = useCallback(
    (
      actor: string,
      role: 'citizen' | 'staff' | 'admin' | 'system' | 'apam',
      action: string,
      target: string,
      status: AuditLogStatus = 'SUCCESS',
      details?: string,
      category?: AuditLogCategory
    ) => {
      const newEntry = createAuditLog({
        actor,
        role,
        action,
        target,
        status,
        category,
        details,
      });

      setAuditLogs((prev) => [newEntry, ...prev]);

      // Asynchronously sync to backend endpoint
      fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      }).catch((err) => {
        console.error('Failed to sync audit log to server:', err);
      });
    },
    []
  );

  // Adapter for AdminDashboard logging
  const handleAdminDashboardLog = useCallback(
    (params: {
      actor: string;
      role: 'staff' | 'admin';
      action: string;
      target: string;
      status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO';
      category?: 'OFFICER' | 'SECURITY';
      details?: string;
    }) => {
      logActivity(
        params.actor,
        params.role,
        params.action,
        params.target,
        params.status,
        params.details,
        params.category
      );
    },
    [logActivity]
  );

  // Load Initial Data and restore staff session from localStorage if present
  useEffect(() => {
    // Restore staff session
    try {
      const savedUserStr = localStorage.getItem('phrae_gecc_staff_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.username) {
          setStaffUser(parsed);
          setIsStaffMode(true);
        }
      }
    } catch {
      // ignore
    }

    async function loadData() {
      try {
        const [resReq, resFb, resVul, resCmp, resLogs] = await Promise.all([
          fetch('/api/requests'),
          fetch('/api/feedback'),
          fetch('/api/gis/vulnerable'),
          fetch('/api/complaints'),
          fetch('/api/audit-logs'),
        ]);

        const jsonReq = await resReq.json();
        if (jsonReq.success && Array.isArray(jsonReq.data) && jsonReq.data.length > 0) {
          setRequests(jsonReq.data);
        }

        const jsonFb = await resFb.json();
        if (jsonFb.success && Array.isArray(jsonFb.data) && jsonFb.data.length > 0) {
          setFeedbacks(jsonFb.data);
        }

        const jsonVul = await resVul.json();
        if (jsonVul.success && Array.isArray(jsonVul.data) && jsonVul.data.length > 0) {
          setVulnerableList(jsonVul.data);
        }

        const jsonCmp = await resCmp.json();
        if (jsonCmp.success && Array.isArray(jsonCmp.data) && jsonCmp.data.length > 0) {
          setComplaints(jsonCmp.data);
        }

        const jsonLogs = await resLogs.json();
        if (jsonLogs.success && Array.isArray(jsonLogs.data) && jsonLogs.data.length > 0) {
          setAuditLogs(jsonLogs.data);
        }
      } catch (err) {
        console.error('Failed to load initial data from API, using fallback seed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Update HTML data attributes for accessibility
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
  }, [fontSize, highContrast]);

  // Handle Staff Login Success
  const handleLoginSuccess = (user: StaffUser) => {
    setStaffUser(user);
    setIsStaffMode(true);
    setActiveStaffTab('staff-queue');
    try {
      localStorage.setItem('phrae_gecc_staff_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  // Handle Staff Logout
  const handleLogout = () => {
    if (staffUser) {
      logActivity(
        `${staffUser.username} (${staffUser.name})`,
        staffUser.role,
        'STAFF_LOGOUT',
        'ระบบบริหารจัดการศูนย์บริการร่วม พมจ.แพร่',
        'SUCCESS',
        'เจ้าหน้าที่ออกจากระบบเรียบร้อยแล้ว (Session Terminated)',
        'SECURITY'
      );
    }
    setStaffUser(null);
    setIsStaffMode(false);
    setActiveCitizenTab('precheck');
    try {
      localStorage.removeItem('phrae_gecc_staff_user');
    } catch {
      // ignore
    }
  };

  // Citizen Tab Switcher with Audit Logging
  const handleCitizenTabChange = (tab: CitizenTabType) => {
    setActiveCitizenTab(tab);
    const tabLabels: Record<CitizenTabType, string> = {
      precheck: '1. ส่งตรวจเอกสารล่วงหน้า & จองคิวด่วน (Pre-Check Fast Track)',
      tracker: '2. เช็กสถานะคำร้อง & บัตรคิว (Status Tracker)',
      complaint: '3. แจ้งเรื่องร้องเรียน / เหตุฉุกเฉิน 1300 (CMP)',
      satisfaction: '4. ประเมินความพึงพอใจ & Open Data (CSI)',
    };
    logActivity(
      'ประชาชนทั่วไป',
      'citizen',
      'CHANGE_TAB',
      `แท็บประชาชน: ${tabLabels[tab]}`,
      'SUCCESS',
      'ผู้รับบริการเปิดดูเมนูหน้าแรกของประชาชน',
      'CITIZEN'
    );
  };

  // Staff Backoffice Tab Switcher with Audit Logging
  const handleStaffTabChange = (tab: StaffTabType) => {
    setActiveStaffTab(tab);
    const tabLabels: Record<StaffTabType, string> = {
      'staff-queue': '1. จัดการคิวและอนุมัติเอกสารล่วงหน้า (Fast Track Approval)',
      'staff-gis': '2. แผนที่เชิงรุก GIS (War Room กลุ่มเปราะบาง 8 อำเภอ)',
      'staff-executive': '3. Executive Dashboard & ศูนย์จัดการ 1300',
      'staff-audit': '4. ประวัติการใช้งานระบบ (Audit Logs & GECC หมวด 8)',
    };
    if (staffUser) {
      logActivity(
        `${staffUser.username} (${staffUser.name})`,
        staffUser.role,
        'STAFF_NAVIGATE_TAB',
        `เมนูหลังบ้าน: ${tabLabels[tab]}`,
        'SUCCESS',
        `เจ้าหน้าที่เรียกดูระบบ ${tabLabels[tab]}`,
        'OFFICER'
      );
    }
  };

  // Handler when a new queue is created in Tab 1
  const handleQueueCreated = (newReq: QueueRequest) => {
    setRequests((prev) => [newReq, ...prev]);
    setSelectedTicket(newReq);
    setIsTicketModalOpen(true);

    logActivity(
      'ประชาชนทั่วไป',
      'citizen',
      'SUBMIT_PRECHECK_FORM',
      `คำร้อง: ${newReq.id} (${newReq.serviceType})`,
      'SUCCESS',
      `ยื่นเอกสารล่วงหน้า อ.${newReq.district} นัดหมายวันที่ ${newReq.appointmentDate} (${newReq.appointmentTimeSlot}) แนบเอกสาร ${newReq.documents.length} รายการ`,
      'CITIZEN'
    );
  };

  // Handler when a new feedback is submitted
  const handleFeedbackSubmitted = (newFb: FeedbackItem) => {
    setFeedbacks((prev) => [newFb, ...prev]);

    logActivity(
      'ประชาชนทั่วไป',
      'citizen',
      'SUBMIT_SATISFACTION',
      `ประเมินความพึงพอใจ: ระดับ "${newFb.rating}" (${newFb.serviceType})`,
      'SUCCESS',
      `ข้อคิดเห็น: "${newFb.comment || 'ไม่มีข้อความเพิ่มเติม'}" (อ.${newFb.district})`,
      'CITIZEN'
    );
  };

  // Handler when APAM pins a new vulnerable person in GIS
  const handleAddVulnerable = (newPerson: VulnerablePerson) => {
    setVulnerableList((prev) => [newPerson, ...prev]);

    logActivity(
      staffUser ? `${staffUser.username} (${staffUser.name})` : 'อพม. (เจ้าหน้าที่ลงพื้นที่)',
      staffUser ? staffUser.role : 'staff',
      'ADD_VULNERABLE_PIN',
      `กลุ่มเปราะบาง: ${newPerson.maskedName || newPerson.name} (${newPerson.category})`,
      'SUCCESS',
      `ปักหมุดพิกัด ต.${newPerson.subDistrict} อ.${newPerson.district} (ริมแม่น้ำยม: ${newPerson.inFloodRiskArea ? 'ใช่' : 'ไม่ใช่'})`,
      'OFFICER'
    );
  };

  // Emergency dispatch
  const handleDispatchEmergency = async () => {
    try {
      await fetch('/api/gis/vulnerable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyBroadcast: true }),
      });
      setVulnerableList((prev) =>
        prev.map((p) =>
          p.inFloodRiskArea ? { ...p, status: 'ต้องการความช่วยเหลือฉุกเฉิน' } : p
        )
      );

      logActivity(
        staffUser ? `${staffUser.username} (${staffUser.name})` : 'เจ้าหน้าที่ศูนย์สั่งการ War Room',
        staffUser ? staffUser.role : 'staff',
        'BROADCAST_FLOOD_ALERT',
        'ระบบแจ้งเตือนภัยน้ำท่วมลุ่มน้ำยม (ระดับวิกฤต)',
        'WARNING',
        'กดปุ่มส่งสัญญาณเตือนภัยฉุกเฉินไปยังผู้ป่วยติดเตียงและกลุ่มเปราะบางในพื้นที่เสี่ยงริมน้ำยม',
        'OFFICER'
      );
    } catch (err) {
      console.error('Error dispatching SOS:', err);
    }
  };

  // Handler to jump to tracker tab
  const handleTrackQueue = (queueId: string) => {
    setTrackerSearchId(queueId);
    if (isStaffMode) {
      setIsStaffMode(false);
    }
    setActiveCitizenTab('tracker');
    window.scrollTo({ top: 120, behavior: 'smooth' });

    logActivity(
      'ประชาชนทั่วไป',
      'citizen',
      'TRACK_QUEUE_DIRECT',
      `รหัสคิว: ${queueId}`,
      'SUCCESS',
      'กระโดดไปยังหน้าตรวจสอบสถานะคำร้องจากบัตรคิว Fast Track',
      'CITIZEN'
    );
  };

  // Handler for opening ticket modal from any view
  const handleOpenTicket = (req: QueueRequest) => {
    setSelectedTicket(req);
    setIsTicketModalOpen(true);
  };

  // Handler for opening e-Slip modal
  const handleOpenESlip = (req: QueueRequest) => {
    setIsTicketModalOpen(false);
    setSelectedESlip(req);
    setIsESlipModalOpen(true);

    logActivity(
      'ประชาชนทั่วไป',
      'citizen',
      'VIEW_ESLIP',
      `e-Slip คำร้อง: ${req.id} (${req.citizenName})`,
      'SUCCESS',
      'เปิดดูใบรับคำขออิเล็กทรอนิกส์ e-Slip / e-Certificate',
      'CITIZEN'
    );
  };

  // Handler for opening Open Data & PDPA modal
  const handleOpenDataPdpa = (section: 'opendata' | 'pdpa' = 'opendata') => {
    setOpenDataSection(section);
    setIsOpenDataModalOpen(true);

    logActivity(
      'ประชาชนทั่วไป',
      'citizen',
      section === 'pdpa' ? 'VIEW_PDPA_POLICY' : 'VIEW_OPEN_DATA',
      section === 'pdpa' ? 'นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)' : 'ชุดข้อมูลเปิดภาครัฐ (Open Data)',
      'SUCCESS',
      'ประชาชนเปิดดูข้อกำหนดการคุ้มครองข้อมูลส่วนบุคคลและความโปร่งใส',
      'CITIZEN'
    );
  };

  // Handler for chatbot navigation
  const handleNavigateTab = (tab: 'precheck' | 'tracker' | 'gis' | 'complaint') => {
    if (tab === 'gis') {
      if (staffUser) {
        setIsStaffMode(true);
        setActiveStaffTab('staff-gis');
      } else {
        // Protected: prompt staff login
        setIsLoginModalOpen(true);
      }
    } else {
      setIsStaffMode(false);
      setActiveCitizenTab(tab);
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Handler for admin updating a request
  const handleUpdateRequest = async (id: string, updates: Partial<QueueRequest>) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRequests((prev) => prev.map((r) => (r.id === id ? json.data : r)));
      }
    } catch (err) {
      console.error('Error updating request:', err);
    }
  };

  // Handler for admin updating feedback (Service Recovery)
  const handleUpdateFeedback = async (id: string, updates: Partial<FeedbackItem>) => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setFeedbacks((prev) => prev.map((f) => (f.id === id ? json.data : f)));
      }
    } catch (err) {
      console.error('Error updating feedback recovery:', err);
    }
  };

  // Handler when a new complaint / 1300 emergency is created
  const handleComplaintCreated = (newItem: ComplaintItem) => {
    setComplaints((prev) => [newItem, ...prev.filter((c) => c.id !== newItem.id)]);

    logActivity(
      'ประชาชนทั่วไป',
      'citizen',
      'SUBMIT_COMPLAINT_1300',
      `เรื่องร้องเรียน/เหตุ 1300: ${newItem.id} (${newItem.type})`,
      'SUCCESS',
      `แจ้งเหตุพื้นที่ อ.${newItem.district} รายละเอียด: "${newItem.description.slice(0, 60)}..."`,
      'CITIZEN'
    );
  };

  // Handler for admin updating complaint / 1300 emergency (Take Action)
  const handleUpdateComplaint = async (id: string, updates: Partial<ComplaintItem>) => {
    try {
      const res = await fetch('/api/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setComplaints((prev) => prev.map((c) => (c.id === id ? json.data : c)));
      }
    } catch (err) {
      console.error('Error updating complaint take action:', err);
    }
  };

  // Refresh Audit Logs from API
  const handleRefreshAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAuditLogs(json.data);
      }
    } catch (err) {
      console.error('Failed to refresh audit logs:', err);
    }
  };

  // Simulate Event for testing in Audit Log Viewer
  const handleSimulateEvent = (category: AuditLogCategory) => {
    if (category === 'CITIZEN') {
      logActivity(
        'ประชาชนทั่วไป (จำลองทดสอบ)',
        'citizen',
        'SEARCH_QUEUE_STATUS',
        'ค้นหาคิว: PQ-2026-003',
        'SUCCESS',
        'ทดสอบจำลองประชาชนตรวจสอบสถานะคำร้องผ่านมือถือ',
        'CITIZEN'
      );
    } else if (category === 'OFFICER') {
      logActivity(
        staffUser ? `${staffUser.username} (${staffUser.name})` : 'staff01 (ทดสอบ)',
        staffUser ? staffUser.role : 'staff',
        'UPDATE_QUEUE_STATUS',
        'คำร้อง: PQ-2026-003 -> 2. ตรวจเอกสารผ่าน',
        'SUCCESS',
        'ทดสอบจำลองเจ้าหน้าที่อนุมัติเอกสารล่วงหน้า',
        'OFFICER'
      );
    } else {
      logActivity(
        'ระบบป้องกันการโจมตี (Firewall Test)',
        'system',
        'SIMULATED_SECURITY_CHECK',
        'GECC Information Security Suite',
        'SUCCESS',
        'ทดสอบตรวจสอบความถูกต้องของสิทธิ์การเข้าถึงข้อมูลตามมาตรฐาน GECC หมวด 8',
        'SECURITY'
      );
    }
  };

  const floodRiskTotal = vulnerableList.filter((p) => p.inFloodRiskArea).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header with Staff Login button & Active Staff status */}
      <Header
        fontSize={fontSize}
        setFontSize={setFontSize}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        staffUser={staffUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isStaffMode={isStaffMode}
        onToggleStaffMode={(enable) => {
          if (enable && !staffUser) {
            setIsLoginModalOpen(true);
          } else {
            setIsStaffMode(enable);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Quick Highlights Info Strip for Elderly and Visitors */}
        <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#d81b60] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              GECC
            </span>
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-slate-900 block">
                ศูนย์บริการร่วม พมจ.แพร่ • มาตรฐานศูนย์ราชการสะดวกระดับก้าวหน้า (โล่รางวัลสีทอง)
              </span>
              <span className="text-slate-600">
                ส่งตรวจเอกสารล่วงหน้า & จองคิว Fast Track • เกณฑ์ความมั่นคงปลอดภัยสารสนเทศ หมวด 8 • คุ้มครองข้อมูลส่วนบุคคล (PDPA)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isStaffMode) setIsStaffMode(false);
                handleCitizenTabChange('complaint');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition cursor-pointer"
            >
              <span>📢 ร้องเรียน / แจ้งเหตุฉุกเฉิน 1300</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenDataPdpa('opendata')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Open Data & PDPA</span>
            </button>
            <a
              href="tel:1300"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>สายด่วน 1300</span>
            </a>
            <a
              href="tel:054511572"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white text-xs font-bold shadow transition"
            >
              <span>โทร 054-511-572</span>
            </a>
          </div>
        </div>

        {/* STAFF BACKOFFICE MODE BANNER (When Staff is Authenticated and Active) */}
        {staffUser && isStaffMode ? (
          <div className="space-y-4">
            {/* Staff Officer Status Card */}
            <div className="bg-gradient-to-r from-slate-900 via-[#1a237e] to-[#283593] rounded-3xl p-5 sm:p-6 text-white shadow-xl border-2 border-amber-400/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-lg">
                  {staffUser.role === 'admin' ? 'A' : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-extrabold text-white">
                      {staffUser.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black tracking-wide">
                      {staffUser.role.toUpperCase()}
                    </span>
                    <span className="text-xs text-amber-200/90 font-medium">
                      • {staffUser.roleLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {staffUser.department} • เข้าสู่ระบบพร้อมบันทึก Audit Log ตามเกณฑ์ความมั่นคงปลอดภัยสารสนเทศ GECC หมวด 8
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsStaffMode(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="สลับไปดูมุมมองหน้าเว็บที่ประชาชนทั่วไปมองเห็น"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ดูหน้าประชาชน</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-100 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="ออกจากระบบเจ้าหน้าที่"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>

            {/* 4 BACKOFFICE NAVIGATION TABS */}
            <div className="bg-white p-2 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {/* Backoffice Tab 1: Queue & Document Approval */}
                <button
                  onClick={() => handleStaffTabChange('staff-queue')}
                  className={`flex items-center justify-start gap-2.5 p-3 rounded-xl sm:rounded-2xl transition font-bold text-xs sm:text-sm cursor-pointer ${
                    activeStaffTab === 'staff-queue'
                      ? 'bg-gradient-to-r from-[#1a237e] to-[#283593] text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeStaffTab === 'staff-queue'
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-[#1a237e]'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="leading-tight">1. จัดการคิวและอนุมัติเอกสาร</div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        activeStaffTab === 'staff-queue' ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      Pre-Check Fast Track
                    </div>
                  </div>
                </button>

                {/* Backoffice Tab 2: GIS War Room */}
                <button
                  onClick={() => handleStaffTabChange('staff-gis')}
                  className={`flex items-center justify-start gap-2.5 p-3 rounded-xl sm:rounded-2xl transition font-bold text-xs sm:text-sm cursor-pointer ${
                    activeStaffTab === 'staff-gis'
                      ? 'bg-gradient-to-r from-cyan-800 to-indigo-900 text-white shadow-md ring-2 ring-cyan-400/40'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeStaffTab === 'staff-gis'
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-cyan-100 text-cyan-800'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span>2. แผนที่เชิงรุก GIS</span>
                      {floodRiskTotal > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-red-500 text-white animate-pulse">
                          {floodRiskTotal}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        activeStaffTab === 'staff-gis' ? 'text-cyan-200' : 'text-slate-500'
                      }`}
                    >
                      War Room & ลุ่มน้ำยม
                    </div>
                  </div>
                </button>

                {/* Backoffice Tab 3: Executive Dashboard */}
                <button
                  onClick={() => handleStaffTabChange('staff-executive')}
                  className={`flex items-center justify-start gap-2.5 p-3 rounded-xl sm:rounded-2xl transition font-bold text-xs sm:text-sm cursor-pointer ${
                    activeStaffTab === 'staff-executive'
                      ? 'bg-gradient-to-r from-slate-950 via-[#1a237e] to-slate-900 text-white shadow-md ring-2 ring-amber-400/40'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeStaffTab === 'staff-executive'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="leading-tight">3. Executive Dashboard</div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        activeStaffTab === 'staff-executive' ? 'text-amber-200' : 'text-slate-500'
                      }`}
                    >
                      CSI & Service Recovery
                    </div>
                  </div>
                </button>

                {/* Backoffice Tab 4: Audit Logs (GECC หมวด 8) */}
                <button
                  onClick={() => handleStaffTabChange('staff-audit')}
                  className={`flex items-center justify-start gap-2.5 p-3 rounded-xl sm:rounded-2xl transition font-bold text-xs sm:text-sm cursor-pointer ${
                    activeStaffTab === 'staff-audit'
                      ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white shadow-md ring-2 ring-emerald-400/40'
                      : 'text-slate-700 hover:bg-emerald-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeStaffTab === 'staff-audit'
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="leading-tight">4. ประวัติการใช้งานระบบ</div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        activeStaffTab === 'staff-audit' ? 'text-emerald-100' : 'text-slate-500'
                      }`}
                    >
                      Audit Logs & GECC หมวด 8
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Backoffice Panels */}
            <div className="transition duration-200">
              {activeStaffTab === 'staff-queue' && (
                <AdminDashboard
                  viewMode="queue"
                  requests={requests}
                  feedbacks={feedbacks}
                  complaints={complaints}
                  onUpdateRequest={handleUpdateRequest}
                  onUpdateFeedback={handleUpdateFeedback}
                  onUpdateComplaint={handleUpdateComplaint}
                  onAddFeedback={handleFeedbackSubmitted}
                  onOpenTicket={handleOpenTicket}
                  onSwitchToGis={() => handleStaffTabChange('staff-gis')}
                  onLogActivity={handleAdminDashboardLog}
                />
              )}

              {activeStaffTab === 'staff-gis' && (
                <GisProactiveMap
                  vulnerableList={vulnerableList}
                  onAddVulnerable={handleAddVulnerable}
                  onDispatchEmergency={handleDispatchEmergency}
                  onOpenPrivacyPolicy={() => handleOpenDataPdpa('pdpa')}
                />
              )}

              {activeStaffTab === 'staff-executive' && (
                <AdminDashboard
                  viewMode="executive"
                  requests={requests}
                  feedbacks={feedbacks}
                  complaints={complaints}
                  onUpdateRequest={handleUpdateRequest}
                  onUpdateFeedback={handleUpdateFeedback}
                  onUpdateComplaint={handleUpdateComplaint}
                  onAddFeedback={handleFeedbackSubmitted}
                  onOpenTicket={handleOpenTicket}
                  onSwitchToGis={() => handleStaffTabChange('staff-gis')}
                  onLogActivity={handleAdminDashboardLog}
                />
              )}

              {activeStaffTab === 'staff-audit' && (
                <AuditLogViewer
                  logs={auditLogs}
                  onRefresh={handleRefreshAuditLogs}
                  onSimulateEvent={handleSimulateEvent}
                />
              )}
            </div>
          </div>
        ) : (
          /* CITIZEN PORTAL MODE (Default Landing Page for General Public - PDPA Compliant) */
          <div className="space-y-6">
            {/* If staff is logged in but browsing citizen portal */}
            {staffUser && !isStaffMode && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>
                    ท่านกำลังดูใน <strong>&ldquo;มุมมองประชาชนทั่วไป&rdquo;</strong> (สิทธิ์: {staffUser.name})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStaffMode(true)}
                  className="px-3 py-1 bg-[#1a237e] hover:bg-[#121858] text-white font-bold rounded-lg transition cursor-pointer"
                >
                  กลับสู่ระบบหลังบ้านเจ้าหน้าที่ →
                </button>
              </div>
            )}

            {/* 4 Citizen Navigation Tabs (PDPA Safe: Admin and GIS tabs are hidden!) */}
            <div className="bg-white p-2 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Citizen Tab 1: Pre-Check Form (Default Landing Page) */}
                <button
                  onClick={() => handleCitizenTabChange('precheck')}
                  className={`flex items-center justify-start gap-2.5 p-3.5 rounded-xl sm:rounded-2xl transition font-bold text-xs sm:text-sm cursor-pointer ${
                    activeCitizenTab === 'precheck'
                      ? 'bg-gradient-to-r from-[#d81b60] to-[#c2185b] text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeCitizenTab === 'precheck'
                        ? 'bg-white/20 text-white'
                        : 'bg-pink-100 text-[#d81b60]'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="leading-tight">1. ส่งตรวจเอกสารล่วงหน้า</div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        activeCitizenTab === 'precheck' ? 'text-pink-100' : 'text-slate-500'
                      }`}
                    >
                      Pre-Check & จองคิวด่วน
                    </div>
                  </div>
                </button>

                {/* Citizen Tab 2: Status Tracker */}
                <button
                  onClick={() => handleCitizenTabChange('tracker')}
                  className={`flex items-center justify-start gap-2.5 p-3.5 rounded-xl sm:rounded-2xl transition font-bold text-xs sm:text-sm cursor-pointer ${
                    activeCitizenTab === 'tracker'
                      ? 'bg-gradient-to-r from-[#1a237e] to-[#283593] text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeCitizenTab === 'tracker'
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-[#1a237e]'
                    }`}
                  >
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="leading-tight">2. เช็กสถานะคำร้อง</div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        activeCitizenTab === 'tracker' ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      4 ขั้นตอน & รับ e-Slip
                    </div>
                  </div>
                </button>

                {/* Citizen Tab 3: Complaint & 1300 Emergency */}
                <button
                  onClick={() => handleCitizenTabChange('complaint')}
                  className={`flex items-center justify-start gap-2.5 p-3.5 rounded-xl sm:rounded-2xl transition font-bold text-xs sm:text-sm cursor-pointer ${
                    activeCitizenTab === 'complaint'
                      ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-md ring-2 ring-rose-400/40'
                      : 'text-slate-700 hover:bg-rose-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeCitizenTab === 'complaint'
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="leading-tight">3. แจ้งเรื่องร้องเรียน / 1300</div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        activeCitizenTab === 'complaint' ? 'text-rose-100' : 'text-slate-500'
                      }`}
                    >
                      แจ้งเหตุฉุกเฉิน & ช่วยเหลือ
                    </div>
                  </div>
                </button>

                {/* Citizen Tab 4: Satisfaction & Open Data */}
                <button
                  onClick={() => handleCitizenTabChange('satisfaction')}
                  className={`flex items-center justify-start gap-2.5 p-3.5 rounded-xl sm:rounded-2xl transition font-bold text-xs sm:text-sm cursor-pointer ${
                    activeCitizenTab === 'satisfaction'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeCitizenTab === 'satisfaction'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Smile className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="leading-tight">4. ประเมินความพึงพอใจ</div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        activeCitizenTab === 'satisfaction' ? 'text-emerald-100' : 'text-slate-500'
                      }`}
                    >
                      CSI 3 ระดับ & Open Data
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Citizen Tab Panels */}
            <div className="transition duration-200">
              {activeCitizenTab === 'precheck' && (
                <PreCheckForm
                  onQueueCreated={handleQueueCreated}
                  onOpenPrivacyPolicy={() => handleOpenDataPdpa('pdpa')}
                />
              )}

              {activeCitizenTab === 'tracker' && (
                <StatusTracker
                  initialSearchQuery={trackerSearchId}
                  allRequests={requests}
                  onOpenTicket={handleOpenTicket}
                  onOpenESlip={handleOpenESlip}
                  onLogSearch={(query, found) => {
                    logActivity(
                      'ประชาชนทั่วไป',
                      'citizen',
                      'SEARCH_QUEUE_STATUS',
                      `ค้นหา: "${query}" (พบ: ${found ? 'ใช่' : 'ไม่พบ'})`,
                      found ? 'SUCCESS' : 'WARNING',
                      'ประชาชนค้นหาสถานะคำร้องผ่านรหัสคิวหรือเบอร์โทรศัพท์',
                      'CITIZEN'
                    );
                  }}
                />
              )}

              {activeCitizenTab === 'complaint' && (
                <ComplaintEmergencyPanel
                  complaints={complaints}
                  onComplaintCreated={handleComplaintCreated}
                  onOpenPrivacyPolicy={() => handleOpenDataPdpa('pdpa')}
                />
              )}

              {activeCitizenTab === 'satisfaction' && (
                <div className="space-y-6">
                  <SatisfactionForm
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                    onOpenPrivacyPolicy={() => handleOpenDataPdpa('pdpa')}
                  />

                  {/* Open Data & PDPA Transparency Section */}
                  <div className="bg-gradient-to-r from-indigo-50 via-white to-pink-50 p-6 rounded-3xl border border-indigo-200/80 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#1a237e] text-white font-bold text-xs">
                            ความโปร่งใสและธรรมาภิบาลข้อมูล
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 font-heading">
                          ชุดข้อมูลเปิดภาครัฐ (Open Data) & การคุ้มครองข้อมูลส่วนบุคคล (PDPA)
                        </h3>
                        <p className="text-xs text-slate-600 max-w-2xl">
                          ศูนย์บริการร่วม พมจ.แพร่ ปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และเปิดเผยข้อมูลสถิติบริการแบบไม่ระบุตัวตน (Anonymized Data) เพื่อความโปร่งใส
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenDataPdpa('opendata')}
                          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                        >
                          <Database className="w-4 h-4" />
                          <span>ดูสถิติ Open Data</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDataPdpa('pdpa')}
                          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-950 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#1a237e]" />
                          <span>นโยบาย PDPA</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Staff Login Modal (Role-Based Access Control) */}
      <StaffLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onLogSecurityEvent={(params) => {
          logActivity(
            params.actor,
            params.status === 'SUCCESS' ? 'staff' : 'system',
            params.action,
            params.target,
            params.status,
            params.details,
            'SECURITY'
          );
        }}
      />

      {/* Queue Ticket Modal */}
      <QueueTicketModal
        isOpen={isTicketModalOpen}
        request={selectedTicket}
        onClose={() => setIsTicketModalOpen(false)}
        onTrackQueue={handleTrackQueue}
        onOpenESlip={handleOpenESlip}
      />

      {/* e-Slip / e-Certificate Modal */}
      <ESlipModal
        isOpen={isESlipModalOpen}
        request={selectedESlip}
        onClose={() => setIsESlipModalOpen(false)}
        onLogDownload={(action) => {
          logActivity(
            'ประชาชนทั่วไป',
            'citizen',
            action,
            `คำร้อง: ${selectedESlip?.id || 'e-Slip'} (${selectedESlip?.citizenName || ''})`,
            'SUCCESS',
            'ประชาชนดาวน์โหลดหรือสั่งพิมพ์เอกสารอิเล็กทรอนิกส์ e-Slip / e-Certificate',
            'CITIZEN'
          );
        }}
      />

      {/* Open Data & PDPA Modal */}
      {isOpenDataModalOpen && (
        <OpenDataPdpaModal
          isOpen={isOpenDataModalOpen}
          initialSection={openDataSection}
          requests={requests}
          onClose={() => setIsOpenDataModalOpen(false)}
        />
      )}

      {/* Floating 24/7 AI Chatbot Widget */}
      <ChatbotWidget
        onNavigateTab={handleNavigateTab}
        onLogQuery={(query) => {
          logActivity(
            'ประชาชนทั่วไป',
            'citizen',
            'CHATBOT_QUERY',
            `สอบถาม AI Chatbot: "${query.slice(0, 50)}"`,
            'SUCCESS',
            `ประชาชนสอบถามข้อมูลสวัสดิการสังคมผ่าน AI Chatbot น้องน้ำใจ 24 ชม.`,
            'CITIZEN'
          );
        }}
      />

      {/* Footer */}
      <Footer onOpenDataPdpa={handleOpenDataPdpa} />
    </div>
  );
}
