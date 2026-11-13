import { AuditLogEntry, AuditLogCategory, AuditLogStatus, StaffUser } from '@/types';

// Mock staff accounts for GECC evaluation & demonstration
export const TEST_STAFF_ACCOUNTS: {
  user: StaffUser;
  pass: string;
}[] = [
  {
    user: {
      id: 'staff-admin-01',
      username: 'admin',
      name: 'นายประสิทธิ์ สุขสมบูรณ์',
      role: 'admin',
      roleLabel: 'หัวหน้าศูนย์บริการร่วม พมจ.แพร่ (Admin)',
      department: 'กลุ่มการพัฒนาสังคมและสวัสดิการ',
    },
    pass: 'phrae1300',
  },
  {
    user: {
      id: 'staff-screening-01',
      username: 'staff01',
      name: 'นางสาวพิมพา ใจดี',
      role: 'staff',
      roleLabel: 'เจ้าหน้าที่จุดคัดกรองคำร้อง Fast Track',
      department: 'ศูนย์บริการร่วม พมจ.แพร่',
    },
    pass: '1234',
  },
  {
    user: {
      id: 'staff-apam-01',
      username: 'apam01',
      name: 'นายสมชาย รักแพร่',
      role: 'apam',
      roleLabel: 'เจ้าหน้าที่ปฏิบัติการภาคสนาม / อพม.',
      department: 'หน่วยปฏิบัติการเคลื่อนที่เร็ว 1300',
    },
    pass: '1300care',
  },
];

// Initial seed audit logs for GECC Category 8 evaluation
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-20261113-0001',
    timestamp: '2026-11-13T08:30:15.120Z',
    actor: 'ระบบรักษาความปลอดภัย (Security Gateway)',
    role: 'system',
    action: 'SYSTEM_BOOT_SECURITY_AUDIT',
    target: 'GECC Information Security Suite v2.0',
    status: 'SUCCESS',
    category: 'SECURITY',
    details: 'ตรวจสอบการเข้ารหัสข้อมูล TLS 1.3, PDPA Masking Rule และระบบบันทึก Log ตาม พ.ร.บ.คอมพิวเตอร์ฯ มาตรา 26',
    ipAddress: '127.0.0.1 (Localhost Engine)',
    device: 'Linux Server / TLS 1.3 Strict',
  },
  {
    id: 'LOG-20261113-0002',
    timestamp: '2026-11-13T08:35:42.340Z',
    actor: 'admin (นายประสิทธิ์ สุขสมบูรณ์)',
    role: 'admin',
    action: 'STAFF_LOGIN_SUCCESS',
    target: 'ระบบบริหารจัดการหลังบ้าน (Backoffice)',
    status: 'SUCCESS',
    category: 'SECURITY',
    details: 'เข้าสู่ระบบสำเร็จด้วยรหัสผ่านสองปัจจัย (Role: หัวหน้าศูนย์บริการร่วม พมจ.แพร่)',
    ipAddress: '192.168.10.12 (Internal LAN)',
    device: 'Chrome 128 / macOS Desktop (Workstation-01)',
  },
  {
    id: 'LOG-20261113-0840-003',
    timestamp: '2026-11-13T08:40:11.890Z',
    actor: 'ประชาชนทั่วไป (อ.เมืองแพร่)',
    role: 'citizen',
    action: 'SUBMIT_PRECHECK_FORM',
    target: 'คำร้อง: PQ-2026-001 (ทำบัตรคนพิการ/ต่ออายุบัตร)',
    status: 'SUCCESS',
    category: 'CITIZEN',
    details: 'ยื่นเอกสารล่วงหน้าผ่านระบบ Pre-Check พร้อมแนบรูปภาพบัตรและใบรับรองแพทย์ 2 ไฟล์ (Fast Track)',
    ipAddress: '118.174.45.102 (TOT Mobile Phrae)',
    device: 'Mobile Safari / iOS 17.5',
  },
  {
    id: 'LOG-20261113-0845-004',
    timestamp: '2026-11-13T08:45:22.560Z',
    actor: 'staff01 (นางสาวพิมพา ใจดี)',
    role: 'staff',
    action: 'INSPECT_CITIZEN_DOCS',
    target: 'เอกสารคำร้อง: PQ-2026-001',
    status: 'SUCCESS',
    category: 'OFFICER',
    details: 'เปิดตรวจสอบไฟล์ภาพเอกสารทางการแพทย์และบัตร ปชช. (ผ่านการยืนยันตัวตนตามเกณฑ์ PDPA)',
    ipAddress: '192.168.10.25 (Screening Counter 1)',
    device: 'Chrome 128 / Windows 11 Enterprise',
  },
  {
    id: 'LOG-20261113-0846-005',
    timestamp: '2026-11-13T08:46:05.110Z',
    actor: 'staff01 (นางสาวพิมพา ใจดี)',
    role: 'staff',
    action: 'UPDATE_QUEUE_STATUS',
    target: 'คำร้อง: PQ-2026-001 -> 2. ตรวจเอกสารผ่าน',
    status: 'SUCCESS',
    category: 'OFFICER',
    details: 'อนุมัติเอกสารล่วงหน้าเรียบร้อย ออกบัตรคิวด่วน Fast Track ช่องบริการ 1',
    ipAddress: '192.168.10.25 (Screening Counter 1)',
    device: 'Chrome 128 / Windows 11 Enterprise',
  },
  {
    id: 'LOG-20261113-0847-006',
    timestamp: '2026-11-13T08:47:30.400Z',
    actor: 'staff01 (นางสาวพิมพา ใจดี)',
    role: 'staff',
    action: 'SEND_LINE_NOTIFICATION',
    target: 'คำร้อง: PQ-2026-001 (คุณสมชาย ใจภักดี)',
    status: 'SUCCESS',
    category: 'OFFICER',
    details: 'ส่งข้อความแจ้งเตือนผลตรวจเอกสารและนัดหมายผ่าน LINE Messaging API สำเร็จ',
    ipAddress: '192.168.10.25 (Screening Counter 1)',
    device: 'Backend Worker / LINE Webhook',
  },
  {
    id: 'LOG-20261113-0902-007',
    timestamp: '2026-11-13T09:02:18.770Z',
    actor: 'ประชาชนทั่วไป (อ.ร้องกวาง)',
    role: 'citizen',
    action: 'SEARCH_QUEUE_STATUS',
    target: 'ค้นหารหัสคิว: PQ-2026-002',
    status: 'SUCCESS',
    category: 'CITIZEN',
    details: 'ประชาชนติดตามขั้นตอนการพิจารณาคำร้อง 4 ขั้นตอน (GECC Real-time Tracking)',
    ipAddress: '49.228.188.42 (AIS Fibre Phrae)',
    device: 'Chrome Mobile / Android 14',
  },
  {
    id: 'LOG-20261113-0915-008',
    timestamp: '2026-11-13T09:15:33.220Z',
    actor: 'ประชาชนทั่วไป (อ.สูงเม่น)',
    role: 'citizen',
    action: 'CHATBOT_QUERY',
    target: 'AI Chatbot น้องน้ำใจ (คำถาม: เงินสงเคราะห์ผู้สูงอายุ)',
    status: 'SUCCESS',
    category: 'CITIZEN',
    details: 'สอบถามข้อมูลสิทธิประโยชน์ผู้สูงอายุผ่าน AI ผู้ช่วย 24 ชม. และกดเปิดดูขั้นตอนยื่นคำร้อง',
    ipAddress: '182.232.90.15 (TrueMove H)',
    device: 'Chrome 128 / Windows Desktop',
  },
  {
    id: 'LOG-20261113-0925-009',
    timestamp: '2026-11-13T09:25:50.650Z',
    actor: 'admin (นายประสิทธิ์ สุขสมบูรณ์)',
    role: 'admin',
    action: 'ACCESS_GIS_MAP',
    target: 'GIS Proactive Care (แผนที่กลุ่มเปราะบาง 8 อำเภอ & สถานการณ์ลุ่มน้ำยม)',
    status: 'SUCCESS',
    category: 'OFFICER',
    details: 'เปิดดู War Room ตรวจสอบสถานีวัดน้ำ Y.20 และพิกัดผู้ป่วยติดเตียงริมแม่น้ำยม',
    ipAddress: '192.168.10.12 (Internal LAN)',
    device: 'Chrome 128 / macOS Desktop',
  },
  {
    id: 'LOG-20261113-0940-010',
    timestamp: '2026-11-13T09:40:12.300Z',
    actor: 'ประชาชนทั่วไป (อ.สอง)',
    role: 'citizen',
    action: 'SUBMIT_SATISFACTION',
    target: 'คะแนนความพึงพอใจ: ประทับใจมาก (5 ดาว)',
    status: 'SUCCESS',
    category: 'CITIZEN',
    details: 'ประเมินความพึงพอใจการบริการ Fast Track สะดวกรวดเร็ว ไม่ต้องรอนาน',
    ipAddress: '223.24.112.5 (3BB Broadband Phrae)',
    device: 'Safari / iPadOS 17',
  },
  {
    id: 'LOG-20261113-1005-011',
    timestamp: '2026-11-13T10:05:00.000Z',
    actor: 'ผู้ไม่ประสงค์ดี (Unknown Intruder)',
    role: 'system',
    action: 'STAFF_LOGIN_FAILED',
    target: 'พยายามเข้าสู่ระบบบัญชี: superadmin',
    status: 'FAILED',
    category: 'SECURITY',
    details: 'ตรวจพบการพยายามล็อกอินผิดพลาด (Password Mismatch) ระบบบันทึกหมายเลข IP เพื่อตรวจสอบ',
    ipAddress: '171.96.12.89 (External WAN)',
    device: 'Automated Bot / Python Script',
  },
];

// Helper to get client IP and Device info in browser
export function getClientDeviceInfo(): { ip: string; device: string } {
  if (typeof window === 'undefined') {
    return { ip: '127.0.0.1 (Server)', device: 'Node.js Server' };
  }

  const ua = navigator.userAgent;
  let deviceName = 'Web Browser';
  if (/Android/i.test(ua)) deviceName = 'Android Mobile';
  else if (/iPhone|iPad|iPod/i.test(ua)) deviceName = 'iOS Device (iPhone/iPad)';
  else if (/Mac OS X/i.test(ua)) deviceName = 'macOS Desktop';
  else if (/Windows/i.test(ua)) deviceName = 'Windows Desktop';

  // Simulated subnet IP based on hostname/local storage
  const simulatedIp = '192.168.10.' + ((Math.abs(hashString(ua)) % 150) + 10);
  return { ip: simulatedIp, device: deviceName };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Global logger function
export function createAuditLog(params: {
  actor: string;
  role: 'citizen' | 'staff' | 'admin' | 'system' | 'apam';
  action: string;
  target: string;
  status?: AuditLogStatus;
  category?: AuditLogCategory;
  details?: string;
  ipAddress?: string;
  device?: string;
}): AuditLogEntry {
  const { ip, device } = getClientDeviceInfo();
  const date = new Date();
  const timeId = date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const rand = Math.floor(Math.random() * 900 + 100);

  // Infer category if not provided
  let cat: AuditLogCategory = params.category || 'CITIZEN';
  if (!params.category) {
    if (params.action.includes('LOGIN') || params.action.includes('SECURITY') || params.status === 'FAILED') {
      cat = 'SECURITY';
    } else if (params.role === 'staff' || params.role === 'admin' || params.role === 'apam') {
      cat = 'OFFICER';
    } else {
      cat = 'CITIZEN';
    }
  }

  return {
    id: `LOG-${timeId}-${rand}`,
    timestamp: date.toISOString(),
    actor: params.actor,
    role: params.role,
    action: params.action,
    target: params.target,
    status: params.status || 'SUCCESS',
    category: cat,
    details: params.details || '',
    ipAddress: params.ipAddress || ip,
    device: params.device || device,
  };
}

// CSV Exporter for GECC Category 8 Audit Evidence
export function exportAuditLogsToCsv(logs: AuditLogEntry[]) {
  const headers = [
    'รหัสบันทึก (Log ID)',
    'วันเวลาที่เกิดเหตุ (Timestamp)',
    'ผู้ดำเนินการ (Actor)',
    'บทบาท (Role)',
    'หมวดหมู่ (Category)',
    'การกระทำ (Action)',
    'เป้าหมาย/ทรัพยากร (Target)',
    'ผลลัพธ์ (Status)',
    'หมายเลข IP (IP Address)',
    'อุปกรณ์/ระบบ (Device/Client)',
    'รายละเอียดการตรวจสอบ (Audit Details)',
  ];

  const rows = logs.map((log) => [
    `"${log.id}"`,
    `"${new Date(log.timestamp).toLocaleString('th-TH')}"`,
    `"${log.actor.replace(/"/g, '""')}"`,
    `"${log.role}"`,
    `"${log.category}"`,
    `"${log.action}"`,
    `"${log.target.replace(/"/g, '""')}"`,
    `"${log.status}"`,
    `"${log.ipAddress || '-'}"`,
    `"${(log.device || '-').replace(/"/g, '""')}"`,
    `"${(log.details || '-').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `หลักฐานประวัติการใช้งาน_GECC_หมวด8_พมจแพร่_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

