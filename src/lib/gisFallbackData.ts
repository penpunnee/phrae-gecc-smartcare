import { District, RiverGaugeStation, FloodZoneFeature, GisSummaryDistrict, VulnerablePerson } from '@/types';

// ==========================================
// PDPA Masking Utilities
// ==========================================

/**
 * Mask person name according to PDPA standards
 * e.g. "นางคำป้อ แสนแก้ว" -> "นางคำป้อ ส***"
 * e.g. "นายสม ยอดเรือน" -> "นายสม ย***"
 */
export function maskName(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    if (trimmed.length <= 4) return trimmed;
    return trimmed.slice(0, 3) + '***';
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  const firstChar = lastName.charAt(0);
  return `${firstName} ${firstChar}***`;
}

/**
 * Mask phone number according to PDPA standards
 * e.g. "081-332-1144" -> "081-xxx-1144"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.trim();
  const match = clean.match(/^(\d{3})[- ]?(\d{3})[- ]?(\d{4})$/);
  if (match) {
    return `${match[1]}-xxx-${match[3]}`;
  }
  if (clean.length >= 10) {
    return clean.slice(0, 3) + '-xxx-' + clean.slice(-4);
  }
  return clean;
}

/**
 * Mask Citizen ID according to PDPA standards
 * e.g. "1-5401-00214-88-1" -> "1-5401-xxxxx-88-1"
 */
export function maskCitizenId(cid?: string): string {
  if (!cid) return '';
  const clean = cid.trim();
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 5) {
      return `${parts[0]}-${parts[1]}-xxxxx-${parts[3]}-${parts[4]}`;
    }
  }
  if (clean.length === 13) {
    return `${clean.slice(0, 5)}xxxxx${clean.slice(10)}`;
  }
  return 'x-xxxx-xxxxx-xx-x';
}

// ==========================================
// River Gauge Telemetry (แม่น้ำยม จ.แพร่)
// Realistic hydrologic monitoring stations
// ==========================================

export function getFallbackRiverGauges(simulateCritical = false): RiverGaugeStation[] {
  const timestamp = new Date().toISOString();

  if (simulateCritical) {
    // Simulated Flood Crisis along Yom River (Upstream Y.20 -> Midstream Y.1C -> Downstream Y.37, Y.31)
    return [
      {
        id: 'Y.20',
        code: 'Y.20',
        name: 'แม่น้ำยม อ.สอง บ้านห้วยก่าน (Y.20)',
        river: 'แม่น้ำยม (ตอนบน)',
        district: 'สอง',
        subDistrict: 'ต.บ้านกลาง',
        lat: 18.3845,
        lng: 100.2012,
        waterLevelMeters: 12.80, // วิกฤต น้ำต้นน้ำยมหลาก
        warningLevelMeters: 10.50,
        criticalLevelMeters: 12.00,
        bankCapacityM3s: 1400,
        currentFlowM3s: 1690,
        status: 'critical',
        statusText: 'วิกฤตสูงสุด (Critical) - มวลน้ำต้นน้ำไหลบ่าเข้าทับถม',
        trend: 'rising',
        updatedAt: timestamp,
      },
      {
        id: 'Y.1C',
        code: 'Y.1C',
        name: 'สะพานข้ามแม่น้ำยม บ้านน้ำโค้ง (Y.1C)',
        river: 'แม่น้ำยม (ตอนกลาง)',
        district: 'เมืองแพร่',
        subDistrict: 'ต.ป่าแมต',
        lat: 18.1408,
        lng: 100.1340,
        waterLevelMeters: 9.85, // วิกฤต ล้นตลิ่ง +1.65 ม.
        warningLevelMeters: 7.00,
        criticalLevelMeters: 8.20,
        bankCapacityM3s: 1000,
        currentFlowM3s: 1260,
        status: 'critical',
        statusText: 'วิกฤตล้นตลิ่ง (Critical) - มวลน้ำเอ่อท่วมชุมชนริมน้ำยม',
        trend: 'rising',
        updatedAt: timestamp,
      },
      {
        id: 'Y.37',
        code: 'Y.37',
        name: 'แม่น้ำยม อ.วังชิ้น บ้านแม่ป้าก (Y.37)',
        river: 'แม่น้ำยม (ตอนล่าง)',
        district: 'วังชิ้น',
        subDistrict: 'ต.แม่ป้าก',
        lat: 17.8921,
        lng: 99.6105,
        waterLevelMeters: 10.65, // เฝ้าระวัง เตรียมรับมวลน้ำจากตัวเมืองแพร่
        warningLevelMeters: 9.80,
        criticalLevelMeters: 11.50,
        bankCapacityM3s: 1200,
        currentFlowM3s: 1080,
        status: 'warning',
        statusText: 'เฝ้าระวังระดับสูง (Warning) - มวลน้ำจากเมืองแพร่กำลังไหลมา',
        trend: 'rising',
        updatedAt: timestamp,
      },
      {
        id: 'Y.31',
        code: 'Y.31',
        name: 'แม่น้ำยม อ.เด่นชัย บ้านห้วยลากปืน (Y.31)',
        river: 'แม่น้ำยม (ตอนล่าง)',
        district: 'เด่นชัย',
        subDistrict: 'ต.ห้วยไร่',
        lat: 17.9785,
        lng: 100.0542,
        waterLevelMeters: 8.90, // ระดับเฝ้าระวัง
        warningLevelMeters: 8.50,
        criticalLevelMeters: 10.00,
        bankCapacityM3s: 900,
        currentFlowM3s: 820,
        status: 'warning',
        statusText: 'เฝ้าระวัง (Warning) - ระดับน้ำสูงขึ้นต่อเนื่อง',
        trend: 'rising',
        updatedAt: timestamp,
      },
    ];
  }

  // Normal Status (Baseline hydrologic state: North -> South)
  return [
    {
      id: 'Y.20',
      code: 'Y.20',
      name: 'แม่น้ำยม อ.สอง บ้านห้วยก่าน (Y.20)',
      river: 'แม่น้ำยม (ตอนบน)',
      district: 'สอง',
      subDistrict: 'ต.บ้านกลาง',
      lat: 18.3845,
      lng: 100.2012,
      waterLevelMeters: 8.20,
      warningLevelMeters: 10.50,
      criticalLevelMeters: 12.00,
      bankCapacityM3s: 1400,
      currentFlowM3s: 580,
      status: 'normal',
      statusText: 'ปกติ (ต่ำกว่าตลิ่ง 3.80 ม.)',
      trend: 'stable',
      updatedAt: timestamp,
    },
    {
      id: 'Y.1C',
      code: 'Y.1C',
      name: 'สะพานข้ามแม่น้ำยม บ้านน้ำโค้ง (Y.1C)',
      river: 'แม่น้ำยม (ตอนกลาง)',
      district: 'เมืองแพร่',
      subDistrict: 'ต.ป่าแมต',
      lat: 18.1408,
      lng: 100.1340,
      waterLevelMeters: 5.40,
      warningLevelMeters: 7.00,
      criticalLevelMeters: 8.20,
      bankCapacityM3s: 1000,
      currentFlowM3s: 430,
      status: 'normal',
      statusText: 'ปกติ (ต่ำกว่าตลิ่ง 2.80 ม.)',
      trend: 'stable',
      updatedAt: timestamp,
    },
    {
      id: 'Y.37',
      code: 'Y.37',
      name: 'แม่น้ำยม อ.วังชิ้น บ้านแม่ป้าก (Y.37)',
      river: 'แม่น้ำยม (ตอนล่าง)',
      district: 'วังชิ้น',
      subDistrict: 'ต.แม่ป้าก',
      lat: 17.8921,
      lng: 99.6105,
      waterLevelMeters: 6.80,
      warningLevelMeters: 9.80,
      criticalLevelMeters: 11.50,
      bankCapacityM3s: 1200,
      currentFlowM3s: 490,
      status: 'normal',
      statusText: 'ปกติ (ต่ำกว่าตลิ่ง 4.70 ม.)',
      trend: 'stable',
      updatedAt: timestamp,
    },
    {
      id: 'Y.31',
      code: 'Y.31',
      name: 'แม่น้ำยม อ.เด่นชัย บ้านห้วยลากปืน (Y.31)',
      river: 'แม่น้ำยม (ตอนล่าง)',
      district: 'เด่นชัย',
      subDistrict: 'ต.ห้วยไร่',
      lat: 17.9785,
      lng: 100.0542,
      waterLevelMeters: 5.20,
      warningLevelMeters: 8.50,
      criticalLevelMeters: 10.00,
      bankCapacityM3s: 900,
      currentFlowM3s: 310,
      status: 'normal',
      statusText: 'ปกติ (ต่ำกว่าตลิ่ง 4.80 ม.)',
      trend: 'stable',
      updatedAt: timestamp,
    },
  ];
}

// ==========================================
// Flood Hazard Zones GeoJSON
// Realistic alluvial plain coordinates along Yom River
// ==========================================

export const FALLBACK_FLOOD_ZONES: { type: 'FeatureCollection'; features: FloodZoneFeature[] } = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'zone-yom-mueang-phrae',
        name: 'แนวพื้นที่เสี่ยงภัยน้ำท่วมลุ่มน้ำยม อ.เมืองแพร่ - อ.สูงเม่น (ระดับสีแดงเข้ม)',
        riskLevel: 'วิกฤต (Critical High Risk)',
        source: 'GISTDA Satellite Sentinel-1 & กรมชลประทาน',
        waterLevelStatus: 'น้ำล้นตลิ่งท่วมขัง 1.20 - 2.50 เมตร',
        depthMeters: '1.2 - 2.5 ม.',
        affectedDistricts: ['เมืองแพร่', 'สูงเม่น'],
        evacuationPriority: 'ระดับสูงสุด: อพยพผู้ป่วยติดเตียงและผู้สูงอายุทันที',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [100.118, 18.172],
            [100.146, 18.168],
            [100.155, 18.142],
            [100.138, 18.105],
            [100.128, 18.058],
            [100.102, 18.048],
            [100.092, 18.082],
            [100.108, 18.145],
            [100.118, 18.172],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'zone-yom-song-upstream',
        name: 'แนวเสี่ยงภัยลุ่มน้ำยมตอนบน อ.สอง (แก่งเสือเต้น - บ้านกลาง)',
        riskLevel: 'วิกฤตต้นน้ำ (Critical Inflow)',
        source: 'กรมป้องกันและบรรเทาสาธารณภัย (ปภ.)',
        waterLevelStatus: 'มวลน้ำหลากเอ่อล้นตลิ่ง 1.50 เมตร',
        depthMeters: '1.0 - 1.8 ม.',
        affectedDistricts: ['สอง'],
        evacuationPriority: 'เตรียมพร้อมรับมวลน้ำและย้ายผู้ป่วยติดเตียงขึ้นที่สูง',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [100.175, 18.425],
            [100.225, 18.412],
            [100.218, 18.358],
            [100.168, 18.348],
            [100.175, 18.425],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'zone-yom-wangchin-downstream',
        name: 'แนวเสี่ยงภัยลุ่มน้ำยมตอนล่าง อ.วังชิ้น (แม่ป้าก - แม่พุง)',
        riskLevel: 'เฝ้าระวังระดับสูง (High Warning)',
        source: 'ศูนย์อุทกวิทยาชลประทานภาคเหนือตอนบน',
        waterLevelStatus: 'ระดับน้ำหนุนสูง เฝ้าระวัง 24 ชม.',
        depthMeters: '0.8 - 1.4 ม.',
        affectedDistricts: ['วังชิ้น'],
        evacuationPriority: 'เฝ้าระวังมวลน้ำที่เดินทางจากเมืองแพร่ใน 12 ชั่วโมง',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [99.585, 17.925],
            [99.635, 17.915],
            [99.625, 17.855],
            [99.575, 17.865],
            [99.585, 17.925],
          ],
        ],
      },
    },
  ],
};

// ==========================================
// 8 Districts GIS Vulnerability Summary
// ==========================================

export const FALLBACK_DISTRICT_SUMMARIES: GisSummaryDistrict[] = [
  {
    district: 'เมืองแพร่',
    totalVulnerable: 428,
    bedridden: 114,
    elderlyAlone: 189,
    vulnerableFamily: 125,
    inFloodRiskArea: 142,
    urgentAssistanceNeeded: 8,
    resolvedAssistance: 134,
  },
  {
    district: 'สูงเม่น',
    totalVulnerable: 285,
    bedridden: 72,
    elderlyAlone: 130,
    vulnerableFamily: 83,
    inFloodRiskArea: 98,
    urgentAssistanceNeeded: 5,
    resolvedAssistance: 93,
  },
  {
    district: 'สอง',
    totalVulnerable: 215,
    bedridden: 56,
    elderlyAlone: 94,
    vulnerableFamily: 65,
    inFloodRiskArea: 84,
    urgentAssistanceNeeded: 6,
    resolvedAssistance: 78,
  },
  {
    district: 'วังชิ้น',
    totalVulnerable: 194,
    bedridden: 48,
    elderlyAlone: 88,
    vulnerableFamily: 58,
    inFloodRiskArea: 76,
    urgentAssistanceNeeded: 4,
    resolvedAssistance: 72,
  },
  {
    district: 'เด่นชัย',
    totalVulnerable: 172,
    bedridden: 41,
    elderlyAlone: 79,
    vulnerableFamily: 52,
    inFloodRiskArea: 32,
    urgentAssistanceNeeded: 2,
    resolvedAssistance: 30,
  },
  {
    district: 'ร้องกวาง',
    totalVulnerable: 240,
    bedridden: 63,
    elderlyAlone: 108,
    vulnerableFamily: 69,
    inFloodRiskArea: 18,
    urgentAssistanceNeeded: 1,
    resolvedAssistance: 17,
  },
  {
    district: 'ลอง',
    totalVulnerable: 260,
    bedridden: 68,
    elderlyAlone: 115,
    vulnerableFamily: 77,
    inFloodRiskArea: 25,
    urgentAssistanceNeeded: 2,
    resolvedAssistance: 23,
  },
  {
    district: 'หนองม่วงไข่',
    totalVulnerable: 98,
    bedridden: 24,
    elderlyAlone: 46,
    vulnerableFamily: 28,
    inFloodRiskArea: 12,
    urgentAssistanceNeeded: 1,
    resolvedAssistance: 11,
  },
];

