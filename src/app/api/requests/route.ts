import { NextRequest, NextResponse } from 'next/server';
import { getRequests, addRequest, updateRequest } from '@/lib/serverStore';
import {
  supabase,
  isSupabaseConfigured,
  mapRowToQueueRequest,
  mapQueueRequestToRow,
} from '@/lib/supabase';
import { QueueRequest } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const district = searchParams.get('district');
    const status = searchParams.get('status');

    let list: QueueRequest[] = [];

    // Attempt to fetch from real Supabase table if configured
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('gecc_submissions')
          .select('*')
          .order('created_at', { ascending: false });

        if (district && district !== 'all') {
          query = query.eq('district', district);
        }
        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          list = data.map(mapRowToQueueRequest);
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local memory store:', err);
      }
    }

    // Fallback to in-memory store if list is empty
    if (list.length === 0) {
      list = getRequests();
      if (district && district !== 'all') {
        list = list.filter((r) => r.district === district);
      }
      if (status && status !== 'all') {
        list = list.filter((r) => r.status === status);
      }
    }

    if (search) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(search) ||
          r.citizenName.toLowerCase().includes(search) ||
          r.phone.replace(/\D/g, '').includes(search.replace(/\D/g, '')) ||
          (r.citizenId && r.citizenId.replace(/\D/g, '').includes(search.replace(/\D/g, '')))
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

    const {
      citizenName,
      citizenId,
      phone,
      district,
      serviceType,
      appointmentDate,
      appointmentTimeSlot,
      submitterRole,
      submitterName,
      documents,
    } = body;

    if (!citizenName || !phone || !district || !serviceType || !appointmentDate) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Generate consecutive queue ID: PRE-2026-XXX
    const existing = getRequests();
    const currentYear = new Date().getFullYear();
    const nextNum = existing.length + 1;
    const padNum = String(nextNum).padStart(3, '0');
    const queueId = `PRE-${currentYear}-${padNum}`;

    const newRequest: QueueRequest = {
      id: queueId,
      citizenName,
      citizenId: citizenId || undefined,
      phone,
      district,
      serviceType,
      appointmentDate,
      appointmentTimeSlot: appointmentTimeSlot || '09:00 - 10:30 น.',
      submitterRole: submitterRole || 'ประชาชนทั่วไป',
      submitterName: submitterName || undefined,
      documents: documents || [],
      status: '1. รับเรื่องแล้ว',
      statusStep: 1,
      officerNotes: 'รับเรื่องเข้าระบบศูนย์บริการร่วม GECC เรียบร้อย เจ้าหน้าที่กำลังตรวจสอบเอกสารล่วงหน้า',
      officerName: 'เจ้าหน้าที่ศูนย์บริการร่วม พมจ.แพร่',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slaMinutes: 5,
    };

    // Always update in-memory store for instant zero-latency UI
    addRequest(newRequest);

    // Save to Supabase gecc_submissions if configured
    if (isSupabaseConfigured()) {
      try {
        const row = mapQueueRequestToRow(newRequest);
        const { error } = await supabase.from('gecc_submissions').insert(row);
        if (error) {
          console.error('Error inserting into Supabase gecc_submissions:', error.message);
        }
      } catch (err) {
        console.error('Supabase insert exception:', err);
      }
    }

    // Call LINE notify internally (non-blocking)
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    try {
      fetch(`${protocol}://${host}/api/notify-line`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: newRequest.id,
          citizenName: newRequest.citizenName,
          phone: newRequest.phone,
          district: newRequest.district,
          serviceType: newRequest.serviceType,
          appointmentDate: newRequest.appointmentDate,
          appointmentTimeSlot: newRequest.appointmentTimeSlot,
          submitterRole: newRequest.submitterRole,
        }),
      }).catch((err) => console.error('Background LINE Notify error:', err));
    } catch {
      // Ignore background notification error
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกคำร้องและสร้างบัตรคิวสำเร็จ',
      data: newRequest,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, officerNotes, officerName } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุ id ของคำร้อง' },
        { status: 400 }
      );
    }

    const updates: Partial<QueueRequest> = {
      ...(status ? { status } : {}),
      ...(officerNotes !== undefined ? { officerNotes } : {}),
      ...(officerName ? { officerName } : {}),
    };

    const updated = updateRequest(id, updates);

    // Update in Supabase gecc_submissions
    if (isSupabaseConfigured()) {
      try {
        const rowUpdates = mapQueueRequestToRow(updates);
        const { error } = await supabase
          .from('gecc_submissions')
          .update(rowUpdates)
          .eq('id', id);
        if (error) {
          console.error('Error updating Supabase gecc_submissions:', error.message);
        }
      } catch (err) {
        console.error('Supabase update exception:', err);
      }
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการคำร้องที่ระบุ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะคำร้องเรียบร้อยแล้ว',
      data: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
