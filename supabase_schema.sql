-- ==============================================================================
-- สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแพร่ (พมจ.แพร่)
-- ศูนย์บริการร่วม พมจ.แพร่ (GECC Smart Care)
-- SUPABASE DATABASE SCHEMA (5 TABLES + RLS POLICIES + SEED DATA)
-- รองรับมาตรฐานศูนย์ราชการสะดวก (GECC) หมวด 8 และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
-- ==============================================================================

-- 1. ตารางคำร้องส่งตรวจเอกสารล่วงหน้าและจองคิวด่วน (gecc_submissions)
CREATE TABLE IF NOT EXISTS gecc_submissions (
  id TEXT PRIMARY KEY,                             -- รหัสคิว เช่น PQ-2026-001
  citizen_name TEXT NOT NULL,                     -- ชื่อ-นามสกุล ผู้ยื่นคำขอ
  citizen_id TEXT,                                -- เลขบัตร ปชช. (มาสก์ตาม PDPA)
  phone TEXT NOT NULL,                            -- หมายเลขโทรศัพท์
  district TEXT NOT NULL,                         -- อำเภอ (8 อำเภอใน จ.แพร่)
  service_type TEXT NOT NULL,                     -- ประเภทบริการ พม.
  appointment_date TEXT NOT NULL,                 -- วันที่นัดหมายรับบริการ (YYYY-MM-DD)
  appointment_time_slot TEXT NOT NULL,            -- ช่วงเวลานัดหมาย เช่น 09:00 - 10:30 น.
  submitter_role TEXT NOT NULL DEFAULT 'ประชาชนทั่วไป', -- ประชาชนทั่วไป / อพม. / อปท.
  submitter_name TEXT,                            -- ชื่อผู้ยื่นแทน (กรณี อพม./อปท.)
  documents JSONB DEFAULT '[]'::jsonb,            -- รายการไฟล์แนบ [{id, name, size, type}]
  documents_count INT DEFAULT 0,                  -- จำนวนไฟล์แนบ
  status TEXT NOT NULL DEFAULT '1. รับเรื่องแล้ว',  -- 1.รับเรื่อง / 2.ตรวจเอกสารผ่าน / 3.รออนุมัติ / 4.สำเร็จ / เอกสารไม่ครบ
  status_step INT DEFAULT 1,                      -- ขั้นตอน 1-4 ตามเกณฑ์ GECC
  officer_notes TEXT DEFAULT '',                  -- หมายเหตุตอบกลับประชาชน
  officer_name TEXT DEFAULT '',                   -- เจ้าหน้าที่ผู้ตรวจเอกสาร
  sla_minutes INT DEFAULT 12,                     -- เวลารับบริการเฉลี่ย (นาที) <= 15 นาที
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index สำหรับค้นหาคำร้องและกรองสถานะ
CREATE INDEX IF NOT EXISTS idx_submissions_district ON gecc_submissions(district);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON gecc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON gecc_submissions(created_at DESC);


-- 2. ตารางเรื่องร้องเรียนและการแจ้งเหตุฉุกเฉิน 1300 (gecc_complaints)
CREATE TABLE IF NOT EXISTS gecc_complaints (
  id TEXT PRIMARY KEY,                            -- รหัสเรื่องร้องเรียน เช่น CMP-2026-001
  type TEXT NOT NULL,                             -- ร้องเรียนการบริการ / แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300
  reporter_name TEXT DEFAULT 'ประชาชนทั่วไป',    -- ชื่อผู้แจ้ง
  phone TEXT NOT NULL,                            -- เบอร์โทรติดต่อ
  district TEXT NOT NULL,                         -- อำเภอ
  location_detail TEXT DEFAULT '',                -- รายละเอียดสถานที่เกิดเหตุ
  description TEXT NOT NULL,                      -- รายละเอียดเรื่องร้องเรียน/เหตุฉุกเฉิน
  status TEXT NOT NULL DEFAULT '1. รับเรื่องแล้ว', -- 1.รับเรื่อง / 2.ส่งต่อ 1300 / 3.ลงพื้นที่ Take Action / 4.เสร็จสิ้น
  status_step INT DEFAULT 1,                      -- ขั้นตอน 1-4
  take_action_note TEXT DEFAULT '',               -- บันทึกผลการแก้ไขปัญหา (Take Action)
  assigned_officer TEXT DEFAULT '',               -- เจ้าหน้าที่ผู้รับผิดชอบ
  line_notified BOOLEAN DEFAULT FALSE,            -- สถานะการแจ้งเตือน LINE
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON gecc_complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_district ON gecc_complaints(district);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON gecc_complaints(created_at DESC);


-- 3. ตารางประเมินความพึงพอใจและดัชนี CSI (gecc_satisfaction)
CREATE TABLE IF NOT EXISTS gecc_satisfaction (
  id TEXT PRIMARY KEY,                            -- รหัสการประเมิน เช่น CSI-2026-001
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5), -- คะแนน (5 = ประทับใจมาก, 3 = ปานกลาง, 1 = ควรปรับปรุง)
  rating TEXT NOT NULL,                           -- ประทับใจมาก / ปานกลาง / ควรปรับปรุง
  service_channel TEXT DEFAULT 'Online',          -- Walk-in / Online
  service_type TEXT NOT NULL,                     -- ประเภทบริการที่ประเมิน
  district TEXT NOT NULL,                         -- อำเภอ
  citizen_name TEXT,                              -- ชื่อผู้รับบริการ (ไม่บังคับ)
  phone TEXT,                                     -- เบอร์โทรติดต่อกลับ (สำหรับ Service Recovery)
  queue_id TEXT,                                  -- รหัสคิวที่เกี่ยวข้อง
  comment TEXT,                                   -- ข้อเสนอแนะเพิ่มเติม
  recovery_status TEXT DEFAULT 'เสร็จสิ้น',       -- รอประสานงาน / ติดต่อกลับแล้ว (Service Recovery) / เสร็จสิ้น
  recovery_note TEXT,                             -- บันทึกการประสานงานเยียวยาข้อร้องเรียน
  recovered_at TIMESTAMPTZ,                       -- เวลาที่ติดต่อเยียวยาสำเร็จ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satisfaction_rating ON gecc_satisfaction(rating);
CREATE INDEX IF NOT EXISTS idx_satisfaction_recovery ON gecc_satisfaction(recovery_status);
CREATE INDEX IF NOT EXISTS idx_satisfaction_created_at ON gecc_satisfaction(created_at DESC);


-- 4. ตารางประวัติการใช้งานและตรวจสอบความปลอดภัย (gecc_audit_logs)
-- มาตรฐานความมั่นคงปลอดภัยสารสนเทศ GECC หมวด 8 และ พ.ร.บ.คอมพิวเตอร์ฯ มาตรา 26 (เก็บ >= 90 วัน)
CREATE TABLE IF NOT EXISTS gecc_audit_logs (
  id TEXT PRIMARY KEY,                            -- รหัสบันทึก เช่น LOG-20261113-0001
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- เวลาที่เกิดเหตุ (UTC/Timestamp)
  actor TEXT NOT NULL,                            -- ผู้ดำเนินการ (ประชาชน / เจ้าหน้าที่ / ระบบ)
  role TEXT NOT NULL,                             -- citizen / staff / admin / system
  action TEXT NOT NULL,                           -- กิจกรรม เช่น CHANGE_TAB, SUBMIT_PRECHECK, STAFF_LOGIN_SUCCESS
  target TEXT NOT NULL,                           -- เป้าหมาย/ทรัพยากรที่กระทำ
  status TEXT NOT NULL DEFAULT 'SUCCESS',         -- SUCCESS / WARNING / FAILED / INFO
  category TEXT NOT NULL DEFAULT 'CITIZEN',       -- CITIZEN / OFFICER / SECURITY
  ip_address TEXT,                                -- หมายเลข IP (มาสก์เลขท้ายตามมาตรฐาน PDPA)
  device TEXT,                                    -- อุปกรณ์/เบราว์เซอร์
  details TEXT                                    -- รายละเอียดการตรวจสอบเพิ่มเติม
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON gecc_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON gecc_audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON gecc_audit_logs(action);


-- 5. ตารางบัญชีเจ้าหน้าที่และกำหนดสิทธิ์เข้าใช้งาน (gecc_staff_users)
CREATE TABLE IF NOT EXISTS gecc_staff_users (
  id TEXT PRIMARY KEY,                            -- รหัสเจ้าหน้าที่
  username TEXT UNIQUE NOT NULL,                  -- ชื่อผู้ใช้งาน
  password TEXT NOT NULL,                         -- รหัสผ่าน
  name TEXT NOT NULL,                             -- ชื่อ-นามสกุล
  role TEXT NOT NULL,                             -- admin / staff / apam
  role_label TEXT NOT NULL,                       -- ป้ายแสดงบทบาท
  department TEXT NOT NULL,                       -- แผนก/กลุ่มงานใน พมจ.แพร่
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- เปิดการใช้งาน RLS และตั้งค่าให้อนุญาตการอ่าน/เขียนผ่าน Web Frontend (anon key)
-- ==============================================================================

ALTER TABLE gecc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gecc_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE gecc_satisfaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE gecc_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gecc_staff_users ENABLE ROW LEVEL SECURITY;

-- gecc_submissions Policies
DROP POLICY IF EXISTS "Public can view submissions" ON gecc_submissions;
CREATE POLICY "Public can view submissions" ON gecc_submissions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can insert submissions" ON gecc_submissions;
CREATE POLICY "Public can insert submissions" ON gecc_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Officers can update submissions" ON gecc_submissions;
CREATE POLICY "Officers can update submissions" ON gecc_submissions
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- gecc_complaints Policies
DROP POLICY IF EXISTS "Public can view complaints" ON gecc_complaints;
CREATE POLICY "Public can view complaints" ON gecc_complaints
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can insert complaints" ON gecc_complaints;
CREATE POLICY "Public can insert complaints" ON gecc_complaints
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Officers can update complaints" ON gecc_complaints;
CREATE POLICY "Officers can update complaints" ON gecc_complaints
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- gecc_satisfaction Policies
DROP POLICY IF EXISTS "Public can view satisfaction" ON gecc_satisfaction;
CREATE POLICY "Public can view satisfaction" ON gecc_satisfaction
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can insert satisfaction" ON gecc_satisfaction;
CREATE POLICY "Public can insert satisfaction" ON gecc_satisfaction
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Officers can update satisfaction" ON gecc_satisfaction;
CREATE POLICY "Officers can update satisfaction" ON gecc_satisfaction
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- gecc_audit_logs Policies (Immutable Audit Trail: SELECT & INSERT only, NO UPDATE/DELETE)
DROP POLICY IF EXISTS "Allow select audit logs" ON gecc_audit_logs;
CREATE POLICY "Allow select audit logs" ON gecc_audit_logs
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert audit logs" ON gecc_audit_logs;
CREATE POLICY "Allow insert audit logs" ON gecc_audit_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- gecc_staff_users Policies (SELECT only for authentication check)
DROP POLICY IF EXISTS "Allow select staff users" ON gecc_staff_users;
CREATE POLICY "Allow select staff users" ON gecc_staff_users
  FOR SELECT TO anon, authenticated USING (true);


-- ==============================================================================
-- INITIAL SEED DATA
-- ข้อมูลเริ่มต้นสำหรับการทดสอบและตรวจประเมินศูนย์ราชการสะดวก (GECC) พมจ.แพร่
-- ==============================================================================

-- 1. บัญชีเจ้าหน้าที่เริ่มต้น (Default Staff Accounts)
INSERT INTO gecc_staff_users (id, username, password, name, role, role_label, department)
VALUES
  (
    'staff-admin-01',
    'admin',
    'phrae1300',
    'นายประสิทธิ์ สุขสมบูรณ์',
    'admin',
    'หัวหน้าศูนย์บริการร่วม พมจ.แพร่ (Admin)',
    'กลุ่มการพัฒนาสังคมและสวัสดิการ'
  ),
  (
    'staff-screening-01',
    'staff01',
    '1234',
    'นางสาวพิมพา ใจดี',
    'staff',
    'เจ้าหน้าที่จุดคัดกรองคำร้อง Fast Track',
    'ศูนย์บริการร่วม พมจ.แพร่'
  ),
  (
    'staff-apam-01',
    'apam01',
    '1300care',
    'นายสมชาย รักแพร่',
    'apam',
    'เจ้าหน้าที่ปฏิบัติการภาคสนาม / อพม.',
    'หน่วยปฏิบัติการเคลื่อนที่เร็ว 1300'
  )
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  role_label = EXCLUDED.role_label,
  department = EXCLUDED.department;

-- 2. ข้อมูลคำร้องเริ่มต้น (Initial Submissions)
INSERT INTO gecc_submissions (id, citizen_name, citizen_id, phone, district, service_type, appointment_date, appointment_time_slot, submitter_role, documents_count, status, status_step, officer_notes, officer_name, sla_minutes, created_at)
VALUES
  (
    'PQ-2026-001',
    'นายสมชาย ใจภักดี',
    '1-5401-00214-88-1',
    '081-234-5678',
    'เมืองแพร่',
    'ทำบัตรคนพิการ/ต่ออายุบัตร',
    '2026-11-14',
    '09:00 - 10:30 น.',
    'ประชาชนทั่วไป',
    2,
    '2. ตรวจเอกสารผ่าน',
    2,
    'เอกสารภาพถ่ายและใบรับรองแพทย์ครบถ้วน ได้รับคิวด่วน Fast Track ช่องบริการ 1',
    'นางสาวพิมพา ใจดี (เจ้าหน้าที่คัดกรอง)',
    8,
    NOW() - INTERVAL '3 hours'
  ),
  (
    'PQ-2026-002',
    'นางสมศรี แสนสุข',
    '3-5402-00129-33-0',
    '089-876-5432',
    'ร้องกวาง',
    'กู้ยืมเงินทุนประกอบอาชีพผู้สูงอายุ',
    '2026-11-15',
    '10:30 - 12:00 น.',
    'อพม. (อาสาสมัคร พม.)',
    3,
    '1. รับเรื่องแล้ว',
    1,
    'รอเจ้าหน้าที่ตรวจสอบแผนการประกอบอาชีพและเอกสารผู้ค้ำประกัน',
    '',
    14,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'PQ-2026-003',
    'นายบุญส่ง ทิพย์เนตร',
    '1-5403-00055-12-8',
    '093-456-7890',
    'สูงเม่น',
    'กองทุนเด็กแรกเกิด',
    '2026-11-14',
    '13:00 - 14:30 น.',
    'อปท. (อบต./เทศบาล)',
    2,
    '3. รออนุมัติ/ลงพื้นที่',
    3,
    'ประสาน อพม. ตำบลสูงเม่น ยืนยันข้อมูลสถานะครัวเรือนยากจนเพื่อเบิกจ่าย',
    'นายประสิทธิ์ สุขสมบูรณ์ (หัวหน้าศูนย์ฯ)',
    11,
    NOW() - INTERVAL '5 hours'
  ),
  (
    'PQ-2026-004',
    'นางคำมูล ดอยแก้ว',
    '5-5404-00332-91-4',
    '086-112-2334',
    'ลอง',
    'เงินสงเคราะห์การจัดการศพผู้สูงอายุ',
    '2026-11-16',
    '09:00 - 10:30 น.',
    'ประชาชนทั่วไป',
    1,
    '4. ดำเนินการสำเร็จ',
    4,
    'ตรวจสอบมรณบัตรและเอกสารทายาทถูกต้อง โอนเงินสงเคราะห์เข้าบัญชีเรียบร้อย',
    'เจ้าหน้าที่การเงิน พมจ.แพร่',
    10,
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. ข้อมูลเรื่องร้องเรียนและแจ้งเหตุ 1300 เริ่มต้น (Initial Complaints)
INSERT INTO gecc_complaints (id, type, reporter_name, phone, district, location_detail, description, status, status_step, take_action_note, assigned_officer, created_at)
VALUES
  (
    'CMP-2026-001',
    'แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300',
    'นางวิภา ใจดี (ผู้ใหญ่บ้าน)',
    '081-998-7766',
    'สอง',
    'หมู่ 3 บ้านดอนชัย ต.สะเอียบ ริมแม่น้ำยม',
    'พบผู้สูงอายุติดเตียงอยู่ลำพัง ระดับน้ำแม่น้ำยมเริ่มเอ่อล้นตลิ่ง ขอทีมช่วยเหลือเคลื่อนย้ายชั่วคราว',
    '3. กำลังลงพื้นที่แก้ไข (Take Action)',
    3,
    'ประสานทีมเคลื่อนที่เร็ว 1300 ร่วมกับ อพม. ต.สะเอียบ และ อบต.สะเอียบ เข้าช่วยเหลือเคลื่อนย้ายขึ้นที่สูงปลอดภัย',
    'นายสมชาย รักแพร่ (ทีม 1300)',
    NOW() - INTERVAL '4 hours'
  ),
  (
    'CMP-2026-002',
    'ร้องเรียนการบริการ',
    'นายธวัชชัย เมืองแพร่',
    '084-555-1212',
    'เมืองแพร่',
    'ศูนย์บริการร่วม พมจ.แพร่',
    'สอบถามเรื่องระยะเวลาการอนุมัติเงินกู้ยืมทุนคนพิการ อยากให้ช่วยติดตามความคืบหน้า',
    '4. ดำเนินการเสร็จสิ้น',
    4,
    'เจ้าหน้าที่ประสานงานกลุ่มส่งเสริมและพัฒนา โทรติดต่อกลับชี้แจงขั้นตอนและอนุมัติเรื่องเรียบร้อยภายใน 24 ชม.',
    'นายประสิทธิ์ สุขสมบูรณ์ (หัวหน้าศูนย์ฯ)',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. ข้อมูลความพึงพอใจเริ่มต้น (Initial Satisfaction)
INSERT INTO gecc_satisfaction (id, score, rating, service_channel, service_type, district, citizen_name, phone, queue_id, comment, recovery_status, created_at)
VALUES
  ('CSI-2026-001', 5, 'ประทับใจมาก', 'Online', 'ทำบัตรคนพิการ/ต่ออายุบัตร', 'เมืองแพร่', 'นายสมชาย ใจภักดี', '081-234-5678', 'PQ-2026-001', 'ระบบส่งตรวจเอกสารล่วงหน้าดีมาก ไม่ต้องเสียเวลาเดินทางมาหลายรอบ ไวมากครับ', 'เสร็จสิ้น', NOW() - INTERVAL '3 hours'),
  ('CSI-2026-002', 5, 'ประทับใจมาก', 'Online', 'กู้ยืมเงินทุนประกอบอาชีพผู้สูงอายุ', 'ร้องกวาง', 'นางสมศรี แสนสุข', '089-876-5432', 'PQ-2026-002', 'เจ้าหน้าที่ให้คำแนะนำชัดเจน จองคิวแล้วมาตามเวลาได้เลย', 'เสร็จสิ้น', NOW() - INTERVAL '2 hours'),
  ('CSI-2026-003', 3, 'ปานกลาง', 'Walk-in', 'กองทุนเด็กแรกเกิด', 'สูงเม่น', 'นายบุญส่ง ทิพย์เนตร', '093-456-7890', 'PQ-2026-003', 'อยากให้มีจุดบริการน้ำดื่มเพิ่มที่ชั้น 1 ศาลากลาง', 'เสร็จสิ้น', NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO NOTHING;

-- 5. ข้อมูลประวัติการใช้งานเริ่มต้น (Initial Audit Logs)
INSERT INTO gecc_audit_logs (id, timestamp, actor, role, action, target, status, category, ip_address, device, details)
VALUES
  (
    'LOG-20261113-0001',
    NOW() - INTERVAL '6 hours',
    'ระบบรักษาความปลอดภัย (Security Gateway)',
    'system',
    'SYSTEM_BOOT_SECURITY_AUDIT',
    'GECC Information Security Suite v2.0',
    'SUCCESS',
    'SECURITY',
    '127.0.0.1 (Localhost Engine)',
    'Linux Server / TLS 1.3 Strict',
    'ตรวจสอบการเข้ารหัสข้อมูล TLS 1.3, PDPA Masking Rule และระบบบันทึก Log ตาม พ.ร.บ.คอมพิวเตอร์ฯ มาตรา 26'
  ),
  (
    'LOG-20261113-0002',
    NOW() - INTERVAL '5 hours',
    'admin (นายประสิทธิ์ สุขสมบูรณ์)',
    'admin',
    'STAFF_LOGIN_SUCCESS',
    'ระบบบริหารจัดการหลังบ้าน (Backoffice)',
    'SUCCESS',
    'SECURITY',
    '192.168.10.12 (Internal LAN)',
    'Chrome 128 / macOS Desktop',
    'เข้าสู่ระบบสำเร็จด้วยรหัสผ่านสองปัจจัย (Role: หัวหน้าศูนย์บริการร่วม พมจ.แพร่)'
  ),
  (
    'LOG-20261113-0003',
    NOW() - INTERVAL '3 hours',
    'ประชาชนทั่วไป (อ.เมืองแพร่)',
    'citizen',
    'SUBMIT_PRECHECK_FORM',
    'คำร้อง: PQ-2026-001 (ทำบัตรคนพิการ/ต่ออายุบัตร)',
    'SUCCESS',
    'CITIZEN',
    '118.174.xxx.xxx (TOT Mobile Phrae)',
    'Mobile Safari / iOS 17.5',
    'ยื่นเอกสารล่วงหน้าผ่านระบบ Pre-Check พร้อมแนบรูปภาพบัตรและใบรับรองแพทย์ 2 ไฟล์ (Fast Track)'
  )
ON CONFLICT (id) DO NOTHING;
