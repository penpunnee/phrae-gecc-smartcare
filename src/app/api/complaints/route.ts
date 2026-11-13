import { NextRequest, NextResponse } from 'next/server';
import { getComplaints, addComplaint, updateComplaint } from '@/lib/serverStore';
import {
  supabase,
  isSupabaseConfigured,
  mapRowToComplaint,
  mapComplaintToRow,
} from '@/lib/supabase';
import { ComplaintItem } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';

    let list: ComplaintItem[] = [];

    // Attempt to fetch from real Supabase table if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('gecc_complaints')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          list = data.map(mapRowToComplaint);
        }
      } catch (err) {
        console.warn('Supabase complaints fetch error, using local store:', err);
      }
    }

    if (list.length === 0) {
      list = getComplaints();
    }

    if (search) {
      const cleanDigits = search.replace(/\D/g, '');
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(search) ||
          (cleanDigits && c.phone.replace(/\D/g, '').includes(cleanDigits)) ||
          c.reporterName.toLowerCase().includes(search)
      );
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
    const { type, reporterName, phone, district, locationDetail, description } = body;

    if (!type || !phone || !district || !description) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const existing = getComplaints();
    const currentYear = new Date().getFullYear();
    const nextNum = existing.length + 1;
    const padNum = String(nextNum).padStart(3, '0');
    const complaintId = `CMP-${currentYear}-${padNum}`;

    const isEmergency = type === 'แจ้งเหตุฉุกเฉินกลุ่มเปราะบาง 1300';

    const newItem: ComplaintItem = {
      id: complaintId,
      type,
      reporterName: reporterName?.trim() || 'ผู้แจ้ง (ไม่ประสงค์ออกนาม)',
      phone: phone.trim(),
      district,
      locationDetail: locationDetail?.trim() || `อำเภอ${district} จังหวัดแพร่`,
      description: description.trim(),
      status: '1. รับเรื่องแล้ว',
      statusStep: 1,
      takeActionNote: isEmergency
        ? 'ระบบ 1300 ได้รับแจ้งเหตุฉุกเฉินแล้ว กำลังส่งต่อข้อมูลให้ทีมเคลื่อนที่เร็ว พมจ.แพร่ และ อพม. ประจำอำเภอเพื่อเข้าตรวจสอบเร่งด่วน'
        : 'ศูนย์บริการร่วม พมจ.แพร่ ได้รับเรื่องร้องเรียนแล้ว อยู่ระหว่างส่งต่อให้หัวหน้าฝ่ายตรวจสอบและดำเนินการแก้ไข (Take Action)',
      assignedOfficer: isEmergency
        ? 'ศูนย์ช่วยเหลือสังคม 1300 พมจ.แพร่'
        : 'กลุ่มงานบริหารศูนย์บริการร่วม (GECC) พมจ.แพร่',
      lineNotified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addComplaint(newItem);

    // Save to Supabase gecc_complaints if configured
    if (isSupabaseConfigured()) {
      try {
        const row = mapComplaintToRow(newItem);
        const { error } = await supabase.from('gecc_complaints').insert(row);
        if (error) {
          console.error('Error inserting into Supabase gecc_complaints:', error.message);
        }
      } catch (err) {
        console.error('Supabase complaint insert exception:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกเรื่องร้องเรียน/แจ้งเหตุฉุกเฉินสำเร็จ',
      data: newItem,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, takeActionNote, assignedOfficer } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุ id ของเรื่อง' },
        { status: 400 }
      );
    }

    const updates: Partial<ComplaintItem> = {
      ...(status ? { status } : {}),
      ...(takeActionNote !== undefined ? { takeActionNote } : {}),
      ...(assignedOfficer ? { assignedOfficer } : {}),
    };

    const updated = updateComplaint(id, updates);

    // Update in Supabase gecc_complaints
    if (isSupabaseConfigured()) {
      try {
        const rowUpdates = mapComplaintToRow(updates);
        const { error } = await supabase
          .from('gecc_complaints')
          .update(rowUpdates)
          .eq('id', id);
        if (error) {
          console.error('Error updating Supabase gecc_complaints:', error.message);
        }
      } catch (err) {
        console.error('Supabase complaint update exception:', err);
      }
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลรหัสเรื่องที่ระบุ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'อัปเดตความคืบหน้า Take Action เรียบร้อยแล้ว',
      data: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
