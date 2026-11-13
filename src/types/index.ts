export type District =
  | 'เมืองแพร่'
  | 'ร้องกวาง'
  | 'ลอง'
  | 'สูงเม่น'
  | 'เด่นชัย'
  | 'สอง'
  | 'วังชิ้น'
  | 'หนองม่วงไข่';

export type ServiceCategory =
  | 'ทำบัตรคนพิการ/ต่ออายุบัตร'
  | 'กู้ยืมเงินทุนประกอบอาชีพผู้สูงอายุ'
  | 'กองทุนเด็กแรกเกิด'
  | 'กู้ยืมเงินทุนประกอบอาชีพคนพิการ'
  | 'เงินสงเคราะห์การจัดการศพผู้สูงอายุ'
  | 'คำร้องทั่วไป';

export type SubmitterRole =
  | 'ประชาชนทั่วไป'
  | 'อพม. (อาสาสมัคร พม.)'
  | 'อปท. (อบต./เทศบาล)';

export type QueueStatus =
  | '1. รับเรื่องแล้ว'
  | '2. ตรวจเอกสารผ่าน'
  | '3. รออนุมัติ/ลงพื้นที่'
  | '4. ดำเนินการสำเร็จ'
  | 'เอกสารไม่ครบถ้วนให้แก้ไข';

export interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  type: string;
  dataUrl?: string;
}

export interface QueueRequest {
  id: string;
  citizenName: string;
  citizenId?: string; // e.g. 1-5401-00214-88-1
  phone: string;
  district: District;
  serviceType: ServiceCategory;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTimeSlot: string; // e.g. 09:00 - 10:30 น.
  submitterRole: SubmitterRole;
  submitterName?: string;
  documents: UploadedDoc[];
  status: QueueStatus;
  statusStep: 1 | 2 | 3 | 4;
  officerNotes: string;
  officerName: string;
  createdAt: string;
  updatedAt: string;
  slaMinutes: number;
}

export type SatisfactionRating = 'ประทับใจมาก' | 'ปานกลาง' | 'ควรปรับปรุง';

export interface FeedbackItem {
  id: string;
  rating: SatisfactionRating;
  score: number; // 5 = ประทับใจมาก, 3 = ปานกลาง, 1 = ควรปรับปรุง
  serviceType: ServiceCategory;
  district: District;
  citizenName?: string;
  phone?: string;
  queueId?: string;
  comment?: string;
  createdAt: string;
  recoveryStatus: 'รอประสานงาน' | 'ติดต่อกลับแล้ว (Service Recovery)' | 'เสร็จสิ้น';
  recoveryNote?: string;
  recoveredAt?: string;
}

export type VulnerableCategory =
  | 'ผู้พิการติดเตียง' // Red pin
  | 'ผู้สูงอายุอยู่ลำพัง' // Orange pin
  | 'ครอบครัวเปราะบาง'; // Blue pin

export interface VulnerablePerson {
  id: string;
  name: string;
  maskedName?: string;
  age: number;
  category: VulnerableCategory;
  district: District;
  subDistrict: string;
  village: string;
  lat: number;
  lng: number;
  inFloodRiskArea: boolean; // พื้นที่เสี่ยงภัยน้ำท่วมริมแม่น้ำยม
  assistanceNeeded: string;
  apamName: string;
  apamPhone: string;
  maskedApamPhone?: string;
  status: 'ปกติ' | 'ต้องการความช่วยเหลือฉุกเฉิน' | 'ได้รับการช่วยเหลือแล้ว';
  dispatchedAt?: string;
  createdAt: string;
}

export type RiverGaugeStatus = 'normal' | 'warning' | 'critical';

export interface RiverGaugeStation {
  id: string; // e.g. "Y.1C", "Y.20", "Y.37", "Y.31"
  code: string;
  name: string;
  river: string;
  district: District;
  subDistrict: string;
  lat: number;
  lng: number;
  waterLevelMeters: number;
  warningLevelMeters: number;
  criticalLevelMeters: number;
  bankCapacityM3s?: number;
  currentFlowM3s?: number;
  status: RiverGaugeStatus;
  statusText: string;
  trend: 'rising' | 'stable' | 'falling';
  updatedAt: string;
}

export interface FloodZoneFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    riskLevel: string;
    source: string;
    waterLevelStatus: string;
    depthMeters: string;
    affectedDistricts: District[];
    evacuationPriority: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface GisSummaryDistrict {
  district: District;
  totalVulnerable: number;
  bedridden: number;
  elderlyAlone: number;
  vulnerableFamily: number;
  inFloodRiskArea: number;
  urgentAssistanceNeeded: number;
  resolvedAssistance: number;
}

export type ComplaintType =
  | 'ร้องเรียนการบริการ'
  | 'แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300';

export type ComplaintStatus =
  | '1. รับเรื่องแล้ว'
  | '2. ส่งต่อเจ้าหน้าที่/ทีม 1300'
  | '3. กำลังลงพื้นที่แก้ไข (Take Action)'
  | '4. ดำเนินการเสร็จสิ้น';

export interface ComplaintItem {
  id: string;
  type: ComplaintType;
  reporterName: string;
  phone: string;
  district: District;
  locationDetail?: string;
  description: string;
  status: ComplaintStatus;
  statusStep: 1 | 2 | 3 | 4;
  takeActionNote: string;
  assignedOfficer: string;
  lineNotified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StaffRole = 'admin' | 'staff' | 'apam';

export interface StaffUser {
  id: string;
  username: string;
  name: string;
  role: StaffRole;
  roleLabel: string;
  department: string;
  avatar?: string;
  loginTime?: string;
}

export type AuditLogCategory = 'CITIZEN' | 'OFFICER' | 'SECURITY';
export type AuditLogStatus = 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: 'citizen' | 'staff' | 'admin' | 'system' | 'apam';
  action: string;
  target: string;
  status: AuditLogStatus;
  category: AuditLogCategory;
  details?: string;
  ipAddress?: string;
  device?: string;
}

