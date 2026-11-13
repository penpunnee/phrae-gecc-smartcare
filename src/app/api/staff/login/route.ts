import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, mapRowToStaffUser } from '@/lib/supabase';
import { TEST_STAFF_ACCOUNTS } from '@/lib/auditLogger';
import { StaffUser } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน' },
        { status: 400 }
      );
    }

    let authenticatedUser: StaffUser | null = null;

    // 1. Try Supabase gecc_staff_users if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('gecc_staff_users')
          .select('*')
          .eq('username', cleanUser)
          .single();

        if (!error && data && data.password === cleanPass) {
          authenticatedUser = mapRowToStaffUser(data);
        }
      } catch (err) {
        console.warn('Supabase staff check error, checking fallback accounts:', err);
      }
    }

    // 2. Fallback to pre-configured test accounts
    if (!authenticatedUser) {
      const matched = TEST_STAFF_ACCOUNTS.find(
        (acc) =>
          acc.user.username.toLowerCase() === cleanUser &&
          acc.pass === cleanPass
      );
      if (matched) {
        authenticatedUser = matched.user;
      }
    }

    if (authenticatedUser) {
      return NextResponse.json({
        success: true,
        message: 'เข้าสู่ระบบเจ้าหน้าที่สำเร็จ',
        data: {
          ...authenticatedUser,
          loginTime: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
      { status: 401 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
