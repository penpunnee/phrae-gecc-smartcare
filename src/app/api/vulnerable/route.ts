import { NextRequest, NextResponse } from 'next/server';
import {
  getVulnerablePersons,
  addVulnerablePerson,
  updateVulnerablePerson,
} from '@/lib/serverStore';
import { VulnerablePerson, VulnerableCategory, District } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const floodRiskOnly = searchParams.get('floodRisk') === 'true';
    const district = searchParams.get('district');

    let list = getVulnerablePersons();

    if (floodRiskOnly) {
      list = list.filter((p) => p.inFloodRiskArea);
    }

    if (district && district !== 'all') {
      list = list.filter((p) => p.district === district);
    }

    return NextResponse.json({
      success: true,
      total: list.length,
      data: list,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
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
        { success: false, error: 'กรุณากรอกข้อมูลชื่อ ประเภทกลุ่มเปราะบาง และอำเภอให้ครบถ้วน' },
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

    addVulnerablePerson(newPerson);

    return NextResponse.json({
      success: true,
      message: 'ปักหมุดชี้เป้ากลุ่มเปราะบางรายใหม่สำเร็จ ข้อมูลเข้าสู่ศูนย์ Command Center แล้ว',
      data: newPerson,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, emergencyBroadcast } = body;

    if (emergencyBroadcast) {
      // Broadcast emergency assistance for all flood risk persons
      const all = getVulnerablePersons();
      const floodRiskPersons = all.filter((p) => p.inFloodRiskArea);
      floodRiskPersons.forEach((p) => {
        updateVulnerablePerson(p.id, {
          status: 'ต้องการความช่วยเหลือฉุกเฉิน',
        });
      });

      return NextResponse.json({
        success: true,
        message: `ส่งพิกัดแจ้ง อพม. เข้าช่วยเหลือฉุกเฉินกลุ่มเปราะบางริมน้ำยมเรียบร้อยแล้ว (${floodRiskPersons.length} ราย)`,
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
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการที่ต้องการอัปเดต' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะการช่วยเหลือสำเร็จ',
      data: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

