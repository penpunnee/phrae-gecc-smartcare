import { NextRequest, NextResponse } from 'next/server';
import { getFeedbacks, addFeedback, updateFeedback } from '@/lib/serverStore';
import {
  supabase,
  isSupabaseConfigured,
  mapRowToFeedback,
  mapFeedbackToRow,
} from '@/lib/supabase';
import { FeedbackItem, SatisfactionRating, ServiceCategory, District } from '@/types';

export async function GET() {
  try {
    let list: FeedbackItem[] = [];

    // Attempt to fetch from real Supabase table if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('gecc_satisfaction')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          list = data.map(mapRowToFeedback);
        }
      } catch (err) {
        console.warn('Supabase satisfaction fetch error, using local store:', err);
      }
    }

    if (list.length === 0) {
      list = getFeedbacks();
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
    const { rating, serviceType, district, citizenName, phone, queueId, comment } = body;

    if (!rating || !serviceType || !district) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเลือกระดับความพึงพอใจ ประเภทบริการ และอำเภอ' },
        { status: 400 }
      );
    }

    const scoreMap: Record<SatisfactionRating, number> = {
      'ประทับใจมาก': 5,
      'ปานกลาง': 3,
      'ควรปรับปรุง': 1,
    };

    const count = getFeedbacks().length + 1;
    const newId = `CSI-2026-${String(count).padStart(3, '0')}`;

    const newFeedback: FeedbackItem = {
      id: newId,
      rating: rating as SatisfactionRating,
      score: scoreMap[rating as SatisfactionRating] || 5,
      serviceType: serviceType as ServiceCategory,
      district: district as District,
      citizenName: citizenName || 'ประชาชนผู้รับบริการ',
      phone: phone || '',
      queueId: queueId || '',
      comment: comment || '',
      createdAt: new Date().toISOString(),
      recoveryStatus: rating === 'ควรปรับปรุง' ? 'รอประสานงาน' : 'เสร็จสิ้น',
      recoveryNote: '',
    };

    addFeedback(newFeedback);

    // Save to Supabase gecc_satisfaction if configured
    if (isSupabaseConfigured()) {
      try {
        const row = mapFeedbackToRow(newFeedback);
        const { error } = await supabase.from('gecc_satisfaction').insert(row);
        if (error) {
          console.error('Error inserting into Supabase gecc_satisfaction:', error.message);
        }
      } catch (err) {
        console.error('Supabase satisfaction insert exception:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกการประเมินความพึงพอใจสำเร็จ ขอบพระคุณสำหรับความคิดเห็น',
      data: newFeedback,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, recoveryStatus, recoveryNote } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุ id ของรายการประเมิน' },
        { status: 400 }
      );
    }

    const updates: Partial<FeedbackItem> = {
      ...(recoveryStatus ? { recoveryStatus } : {}),
      ...(recoveryNote !== undefined ? { recoveryNote } : {}),
    };

    const updated = updateFeedback(id, updates);

    // Update in Supabase gecc_satisfaction
    if (isSupabaseConfigured()) {
      try {
        const rowUpdates = mapFeedbackToRow(updates);
        const { error } = await supabase
          .from('gecc_satisfaction')
          .update(rowUpdates)
          .eq('id', id);
        if (error) {
          console.error('Error updating Supabase gecc_satisfaction:', error.message);
        }
      } catch (err) {
        console.error('Supabase satisfaction update exception:', err);
      }
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการที่ต้องการอัปเดต' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'อัปเดตการทำ Service Recovery สำเร็จ',
      data: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
