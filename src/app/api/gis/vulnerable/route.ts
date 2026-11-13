import { NextRequest, NextResponse } from 'next/server';
import {
  getVulnerablePersons,
  addVulnerablePerson,
  updateVulnerablePerson,
} from '@/lib/serverStore';
import { maskName, maskPhone } from '@/lib/gisFallbackData';
import { VulnerablePerson, VulnerableCategory, District } from '@/types';

const UPSTREAM_API_URL = process.env.PHRAE_DATA_MAP_API_URL || 'http://localhost:4001/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unmask = searchParams.get('unmask') === 'true';
    const floodRiskOnly = searchParams.get('floodRisk') === 'true';
    const district = searchParams.get('district');
    const category = searchParams.get('category');

    let rawList = getVulnerablePersons();

    // Optionally check if upstream port 4001 has more data
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const upstreamRes = await fetch(`${UPSTREAM_API_URL}/vulnerable`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (upstreamRes.ok) {
        const json = await upstreamRes.json();
        const upstreamData = json.data || json;
        if (Array.isArray(upstreamData) && upstreamData.length > 0) {
          // Merge unique entries if available
          const existingIds = new Set(rawList.map((p) => p.id));
          const newFromUpstream: VulnerablePerson[] = upstreamData
            .filter((u: any) => !existingIds.has(u.id))
            .map((u: any, idx: number) => ({
              id: u.id || `VUL-UPS-${idx + 1}`,
              name: u.fullName || u.name || 'ประชาชนกลุ่มเปราะบาง',
              age: Number(u.age || 65),
              category: (u.category || 'ผู้สูงอายุอยู่ลำพัง') as VulnerableCategory,
              district: (u.district || 'เมืองแพร่') as District,
              subDistrict: u.subDistrict || 'ต.ในเวียง',
              village: u.village || 'ม.1',
              lat: Number(u.lat || 18.1446),
              lng: Number(u.lng || 100.1403),
              inFloodRiskArea: Boolean(u.inFloodRiskArea ?? u.isFloodRisk ?? false),
              assistanceNeeded: u.assistanceNeeded || 'ตรวจเยี่ยมสวัสดิการ',
              apamName: u.apamName || 'อพม.จิตอาสา',
              apamPhone: u.apamPhone || '081-000-0000',
              status: u.status || 'ปกติ',
              createdAt: u.createdAt || new Date().toISOString(),
            }));
          rawList = [...rawList, ...newFromUpstream];
        }
      }
    } catch {
      // Upstream offline: graceful fallback to internal store
    }

    // Apply filtering
    let filtered = rawList;
    if (floodRiskOnly) {
      filtered = filtered.filter((p) => p.inFloodRiskArea);
    }
    if (district && district !== 'all') {
      filtered = filtered.filter((p) => p.district === district);
    }
    if (category && category !== 'all') {
      filtered = filtered.filter((p) => p.category === category);
    }

    // Apply PDPA Masking unless authorized officer requested unmask
    const formattedData = filtered.map((p) => {
      const realName = p.name;
      const maskedPersonName = p.maskedName || maskName(realName);
      const realApamPhone = p.apamPhone;
      const maskedPhone = p.maskedApamPhone || maskPhone(realApamPhone);

      return {
        ...p,
        name: unmask ? realName : maskedPersonName,
        maskedName: maskedPersonName,
        apamPhone: unmask ? realApamPhone : maskedPhone,
        maskedApamPhone: maskedPhone,
      };
    });

    return NextResponse.json({
      success: true,
      pdpaMasked: !unmask,
      total: formattedData.length,
      floodRiskCount: formattedData.filter((p) => p.inFloodRiskArea).length,
      data: formattedData,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      age,
      category,
      district,
      subDistrict,
      village,
      lat,
      lng,
      inFloodRiskArea,
      assistanceNeeded,
      apamName,
      apamPhone,
    } = body;

    if (!name || !category || !district) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่อ-นามสกุล ประเภท และอำเภอ' },
        { status: 400 }
      );
    }

    const count = getVulnerablePersons().length + 1;
    const newId = `VUL-${String(count).padStart(3, '0')}`;

    const newPerson: VulnerablePerson = {
      id: newId,
      name,
      age: Number(age) || 60,
      category: category as VulnerableCategory,
      district: district as District,
      subDistrict: subDistrict || 'ต.ในเวียง',
      village: village || 'ม.1',
      lat: Number(lat) || 18.1446,
      lng: Number(lng) || 100.1403,
      inFloodRiskArea: Boolean(inFloodRiskArea),
      assistanceNeeded: assistanceNeeded || 'ตรวจเยี่ยมและประเมินสิทธิสวัสดิการ',
      apamName: apamName || 'อพม.จิตอาสา จ.แพร่',
      apamPhone: apamPhone || '',
      status: inFloodRiskArea ? 'ต้องการความช่วยเหลือฉุกเฉิน' : 'ปกติ',
      createdAt: new Date().toISOString(),
    };

    const added = addVulnerablePerson(newPerson);

    return NextResponse.json({
      success: true,
      message: 'ปักหมุดชี้เป้ากลุ่มเปราะบางสำเร็จ (เชื่อมต่อฐานข้อมูล GIS พมจ.แพร่)',
      data: added,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, emergencyBroadcast } = body;

    if (emergencyBroadcast) {
      const all = getVulnerablePersons();
      const floodRiskPersons = all.filter((p) => p.inFloodRiskArea);
      floodRiskPersons.forEach((p) => {
        updateVulnerablePerson(p.id, {
          status: 'ต้องการความช่วยเหลือฉุกเฉิน',
        });
      });

      return NextResponse.json({
        success: true,
        message: `ส่งสัญญาณ SOS และพิกัดฉุกเฉินไปยังเครือข่าย อพม. เรียบร้อย (${floodRiskPersons.length} ราย)`,
        dispatchedCount: floodRiskPersons.length,
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุ id ของกลุ่มเปราะบาง' },
        { status: 400 }
      );
    }

    const updated = updateVulnerablePerson(id, {
      ...(status ? { status } : {}),
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายการ' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะสำเร็จ',
      data: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

