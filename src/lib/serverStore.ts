import { QueueRequest, FeedbackItem, VulnerablePerson, ComplaintItem, AuditLogEntry } from '@/types';
import { INITIAL_REQUESTS, INITIAL_FEEDBACK, INITIAL_VULNERABLE, INITIAL_COMPLAINTS } from './mockData';
import { INITIAL_AUDIT_LOGS } from './auditLogger';
import { maskName, maskPhone } from './gisFallbackData';

// Global store for the Next.js process
declare global {
  // eslint-disable-next-line no-var
  var __phraeQueueRequests: QueueRequest[] | undefined;
  // eslint-disable-next-line no-var
  var __phraeFeedbacks: FeedbackItem[] | undefined;
  // eslint-disable-next-line no-var
  var __phraeVulnerable: VulnerablePerson[] | undefined;
  // eslint-disable-next-line no-var
  var __phraeComplaints: ComplaintItem[] | undefined;
  // eslint-disable-next-line no-var
  var __phraeAuditLogs: AuditLogEntry[] | undefined;
  // eslint-disable-next-line no-var
  var __phraeDemoCriticalMode: boolean | undefined;
}

const SEEDED_VULNERABLE = INITIAL_VULNERABLE.map((v) => ({
  ...v,
  maskedName: maskName(v.name),
  maskedApamPhone: maskPhone(v.apamPhone),
}));

if (!global.__phraeQueueRequests) {
  global.__phraeQueueRequests = [...INITIAL_REQUESTS];
}

if (!global.__phraeFeedbacks) {
  global.__phraeFeedbacks = [...INITIAL_FEEDBACK];
}

if (!global.__phraeVulnerable) {
  global.__phraeVulnerable = [...SEEDED_VULNERABLE];
}

if (!global.__phraeComplaints) {
  global.__phraeComplaints = [...INITIAL_COMPLAINTS];
}

if (!global.__phraeAuditLogs) {
  global.__phraeAuditLogs = [...INITIAL_AUDIT_LOGS];
}

if (typeof global.__phraeDemoCriticalMode === 'undefined') {
  global.__phraeDemoCriticalMode = false;
}

export function getDemoCriticalMode(): boolean {
  return !!global.__phraeDemoCriticalMode;
}

export function setDemoCriticalMode(enabled: boolean): boolean {
  global.__phraeDemoCriticalMode = enabled;
  return enabled;
}

export function getRequests(): QueueRequest[] {
  return global.__phraeQueueRequests || [];
}

export function addRequest(request: QueueRequest): QueueRequest {
  if (!global.__phraeQueueRequests) {
    global.__phraeQueueRequests = [...INITIAL_REQUESTS];
  }
  global.__phraeQueueRequests.unshift(request);
  return request;
}

export function updateRequest(
  id: string,
  updates: Partial<QueueRequest>
): QueueRequest | null {
  if (!global.__phraeQueueRequests) {
    global.__phraeQueueRequests = [...INITIAL_REQUESTS];
  }
  const index = global.__phraeQueueRequests.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const current = global.__phraeQueueRequests[index];
  const updated: QueueRequest = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.status) {
    if (updates.status.startsWith('1')) updated.statusStep = 1;
    else if (updates.status.startsWith('2')) updated.statusStep = 2;
    else if (updates.status.startsWith('3')) updated.statusStep = 3;
    else if (updates.status.startsWith('4')) updated.statusStep = 4;
    else if (updates.status.includes('ไม่ครบถ้วน')) updated.statusStep = 1;
  }

  global.__phraeQueueRequests[index] = updated;
  return updated;
}

// Feedback Methods
export function getFeedbacks(): FeedbackItem[] {
  return global.__phraeFeedbacks || [];
}

export function addFeedback(item: FeedbackItem): FeedbackItem {
  if (!global.__phraeFeedbacks) {
    global.__phraeFeedbacks = [...INITIAL_FEEDBACK];
  }
  global.__phraeFeedbacks.unshift(item);
  return item;
}

export function updateFeedback(
  id: string,
  updates: Partial<FeedbackItem>
): FeedbackItem | null {
  if (!global.__phraeFeedbacks) {
    global.__phraeFeedbacks = [...INITIAL_FEEDBACK];
  }
  const index = global.__phraeFeedbacks.findIndex((f) => f.id === id);
  if (index === -1) return null;

  const current = global.__phraeFeedbacks[index];
  const updated: FeedbackItem = {
    ...current,
    ...updates,
    recoveredAt:
      updates.recoveryStatus === 'ติดต่อกลับแล้ว (Service Recovery)' || updates.recoveryStatus === 'เสร็จสิ้น'
        ? new Date().toISOString()
        : current.recoveredAt,
  };

  global.__phraeFeedbacks[index] = updated;
  return updated;
}

// Vulnerable Persons Methods
export function getVulnerablePersons(): VulnerablePerson[] {
  return global.__phraeVulnerable || [];
}

export function addVulnerablePerson(person: VulnerablePerson): VulnerablePerson {
  if (!global.__phraeVulnerable) {
    global.__phraeVulnerable = [...SEEDED_VULNERABLE];
  }
  const decorated: VulnerablePerson = {
    ...person,
    maskedName: maskName(person.name),
    maskedApamPhone: maskPhone(person.apamPhone),
  };
  global.__phraeVulnerable.unshift(decorated);
  return decorated;
}

export function updateVulnerablePerson(
  id: string,
  updates: Partial<VulnerablePerson>
): VulnerablePerson | null {
  if (!global.__phraeVulnerable) {
    global.__phraeVulnerable = [...INITIAL_VULNERABLE];
  }
  const index = global.__phraeVulnerable.findIndex((v) => v.id === id);
  if (index === -1) return null;

  const current = global.__phraeVulnerable[index];
  const updated: VulnerablePerson = {
    ...current,
    ...updates,
    dispatchedAt: updates.status === 'ได้รับการช่วยเหลือแล้ว' ? new Date().toISOString() : current.dispatchedAt,
  };

  global.__phraeVulnerable[index] = updated;
  return updated;
}

// Complaints & 1300 Emergency Methods
export function getComplaints(): ComplaintItem[] {
  return global.__phraeComplaints || [];
}

export function addComplaint(item: ComplaintItem): ComplaintItem {
  if (!global.__phraeComplaints) {
    global.__phraeComplaints = [...INITIAL_COMPLAINTS];
  }
  global.__phraeComplaints.unshift(item);
  return item;
}

export function updateComplaint(
  id: string,
  updates: Partial<ComplaintItem>
): ComplaintItem | null {
  if (!global.__phraeComplaints) {
    global.__phraeComplaints = [...INITIAL_COMPLAINTS];
  }
  const index = global.__phraeComplaints.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const current = global.__phraeComplaints[index];
  const updated: ComplaintItem = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.status) {
    if (updates.status.startsWith('1')) updated.statusStep = 1;
    else if (updates.status.startsWith('2')) updated.statusStep = 2;
    else if (updates.status.startsWith('3')) updated.statusStep = 3;
    else if (updates.status.startsWith('4')) updated.statusStep = 4;
  }

  global.__phraeComplaints[index] = updated;
  return updated;
}

// Audit Logs Methods (GECC Category 8)
export function getAuditLogs(): AuditLogEntry[] {
  return global.__phraeAuditLogs || [];
}

export function addAuditLog(entry: AuditLogEntry): AuditLogEntry {
  if (!global.__phraeAuditLogs) {
    global.__phraeAuditLogs = [...INITIAL_AUDIT_LOGS];
  }
  global.__phraeAuditLogs.unshift(entry);
  return entry;
}

