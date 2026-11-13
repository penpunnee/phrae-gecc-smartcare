import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueueRequest, FeedbackItem, ComplaintItem, AuditLogEntry, StaffUser } from '@/types';

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if valid credentials are provided
export function isSupabaseConfigured(): boolean {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 20
  );
}

// Fallback dummy credentials to prevent Next.js build-time crash on Vercel
const safeUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-gecc-phrae.supabase.co';
const safeKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key-gecc-phrae';

// Global Supabase client instance
export const supabase: SupabaseClient = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Helper: Mask IP address according to PDPA
export function maskIpAddress(ip?: string): string {
  if (!ip) return '192.168.10.xxx';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  return ip.replace(/:[^:]+$/, ':xxxx');
}

// ==============================================================================
// 1. QUEUE SUBMISSIONS (gecc_submissions)
// ==============================================================================

export function mapRowToQueueRequest(row: any): QueueRequest {
  return {
    id: row.id,
    citizenName: row.citizen_name,
    citizenId: row.citizen_id,
    phone: row.phone,
    district: row.district,
    serviceType: row.service_type,
    appointmentDate: row.appointment_date,
    appointmentTimeSlot: row.appointment_time_slot,
    submitterRole: row.submitter_role || 'ประชาชนทั่วไป',
    submitterName: row.submitter_name,
    documents: Array.isArray(row.documents) ? row.documents : [],
    status: row.status,
    statusStep: (row.status_step || 1) as 1 | 2 | 3 | 4,
    officerNotes: row.officer_notes || '',
    officerName: row.officer_name || '',
    slaMinutes: row.sla_minutes || 12,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export function mapQueueRequestToRow(req: Partial<QueueRequest>) {
  const row: Record<string, any> = {};
  if (req.id !== undefined) row.id = req.id;
  if (req.citizenName !== undefined) row.citizen_name = req.citizenName;
  if (req.citizenId !== undefined) row.citizen_id = req.citizenId;
  if (req.phone !== undefined) row.phone = req.phone;
  if (req.district !== undefined) row.district = req.district;
  if (req.serviceType !== undefined) row.service_type = req.serviceType;
  if (req.appointmentDate !== undefined) row.appointment_date = req.appointmentDate;
  if (req.appointmentTimeSlot !== undefined) row.appointment_time_slot = req.appointmentTimeSlot;
  if (req.submitterRole !== undefined) row.submitter_role = req.submitterRole;
  if (req.submitterName !== undefined) row.submitter_name = req.submitterName;
  if (req.documents !== undefined) {
    row.documents = req.documents;
    row.documents_count = req.documents.length;
  }
  if (req.status !== undefined) {
    row.status = req.status;
    if (req.status.startsWith('1')) row.status_step = 1;
    else if (req.status.startsWith('2')) row.status_step = 2;
    else if (req.status.startsWith('3')) row.status_step = 3;
    else if (req.status.startsWith('4')) row.status_step = 4;
    else if (req.status.includes('ไม่ครบ')) row.status_step = 1;
  }
  if (req.statusStep !== undefined) row.status_step = req.statusStep;
  if (req.officerNotes !== undefined) row.officer_notes = req.officerNotes;
  if (req.officerName !== undefined) row.officer_name = req.officerName;
  if (req.slaMinutes !== undefined) row.sla_minutes = req.slaMinutes;
  row.updated_at = new Date().toISOString();
  return row;
}

// ==============================================================================
// 2. COMPLAINTS & 1300 EMERGENCY (gecc_complaints)
// ==============================================================================

export function mapRowToComplaint(row: any): ComplaintItem {
  return {
    id: row.id,
    type: row.type,
    reporterName: row.reporter_name || 'ประชาชนทั่วไป',
    phone: row.phone,
    district: row.district,
    locationDetail: row.location_detail || '',
    description: row.description,
    status: row.status,
    statusStep: (row.status_step || 1) as 1 | 2 | 3 | 4,
    takeActionNote: row.take_action_note || '',
    assignedOfficer: row.assigned_officer || '',
    lineNotified: row.line_notified || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export function mapComplaintToRow(cmp: Partial<ComplaintItem>) {
  const row: Record<string, any> = {};
  if (cmp.id !== undefined) row.id = cmp.id;
  if (cmp.type !== undefined) row.type = cmp.type;
  if (cmp.reporterName !== undefined) row.reporter_name = cmp.reporterName;
  if (cmp.phone !== undefined) row.phone = cmp.phone;
  if (cmp.district !== undefined) row.district = cmp.district;
  if (cmp.locationDetail !== undefined) row.location_detail = cmp.locationDetail;
  if (cmp.description !== undefined) row.description = cmp.description;
  if (cmp.status !== undefined) {
    row.status = cmp.status;
    if (cmp.status.startsWith('1')) row.status_step = 1;
    else if (cmp.status.startsWith('2')) row.status_step = 2;
    else if (cmp.status.startsWith('3')) row.status_step = 3;
    else if (cmp.status.startsWith('4')) row.status_step = 4;
  }
  if (cmp.statusStep !== undefined) row.status_step = cmp.statusStep;
  if (cmp.takeActionNote !== undefined) row.take_action_note = cmp.takeActionNote;
  if (cmp.assignedOfficer !== undefined) row.assigned_officer = cmp.assignedOfficer;
  if (cmp.lineNotified !== undefined) row.line_notified = cmp.lineNotified;
  row.updated_at = new Date().toISOString();
  return row;
}

// ==============================================================================
// 3. SATISFACTION FEEDBACK (gecc_satisfaction)
// ==============================================================================

export function mapRowToFeedback(row: any): FeedbackItem {
  return {
    id: row.id,
    rating: row.rating,
    score: row.score,
    serviceType: row.service_type,
    district: row.district,
    citizenName: row.citizen_name,
    phone: row.phone,
    queueId: row.queue_id,
    comment: row.comment,
    recoveryStatus: row.recovery_status || 'เสร็จสิ้น',
    recoveryNote: row.recovery_note,
    recoveredAt: row.recovered_at,
    createdAt: row.created_at,
  };
}

export function mapFeedbackToRow(fb: Partial<FeedbackItem>) {
  const row: Record<string, any> = {};
  if (fb.id !== undefined) row.id = fb.id;
  if (fb.rating !== undefined) row.rating = fb.rating;
  if (fb.score !== undefined) row.score = fb.score;
  if (fb.serviceType !== undefined) row.service_type = fb.serviceType;
  if (fb.district !== undefined) row.district = fb.district;
  if (fb.citizenName !== undefined) row.citizen_name = fb.citizenName;
  if (fb.phone !== undefined) row.phone = fb.phone;
  if (fb.queueId !== undefined) row.queue_id = fb.queueId;
  if (fb.comment !== undefined) row.comment = fb.comment;
  if (fb.recoveryStatus !== undefined) row.recovery_status = fb.recoveryStatus;
  if (fb.recoveryNote !== undefined) row.recovery_note = fb.recoveryNote;
  if (fb.recoveredAt !== undefined) row.recovered_at = fb.recoveredAt;
  return row;
}

// ==============================================================================
// 4. AUDIT LOGS (gecc_audit_logs)
// ==============================================================================

export function mapRowToAuditLog(row: any): AuditLogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    actor: row.actor,
    role: row.role,
    action: row.action,
    target: row.target,
    status: row.status,
    category: row.category,
    ipAddress: row.ip_address,
    device: row.device,
    details: row.details,
  };
}

export function mapAuditLogToRow(log: AuditLogEntry) {
  return {
    id: log.id,
    timestamp: log.timestamp,
    actor: log.actor,
    role: log.role,
    action: log.action,
    target: log.target,
    status: log.status,
    category: log.category,
    ip_address: maskIpAddress(log.ipAddress),
    device: log.device,
    details: log.details,
  };
}

// ==============================================================================
// 5. STAFF USERS (gecc_staff_users)
// ==============================================================================

export function mapRowToStaffUser(row: any): StaffUser {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    roleLabel: row.role_label,
    department: row.department,
  };
}
