import { NextResponse } from 'next/server';
import { getAuditLogs, addAuditLog } from '@/lib/serverStore';
import { createAuditLog } from '@/lib/auditLogger';
import {
  supabase,
  isSupabaseConfigured,
  mapRowToAuditLog,
  mapAuditLogToRow,
} from '@/lib/supabase';
import { AuditLogEntry } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '150', 10);

    let logs: AuditLogEntry[] = [];

    // Attempt to fetch from real Supabase table if configured
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('gecc_audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (category && category !== 'ALL') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          logs = data.map(mapRowToAuditLog);
        }
      } catch (err) {
        console.warn('Supabase audit logs fetch error, using local store:', err);
      }
    }

    if (logs.length === 0) {
      logs = getAuditLogs();
      if (category && category !== 'ALL') {
        logs = logs.filter((l) => l.category === category);
      }
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      data: logs.slice(0, limit),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newEntry: AuditLogEntry = createAuditLog({
      actor: body.actor || 'ผู้ใช้งานระบบ',
      role: body.role || 'citizen',
      action: body.action || 'UNKNOWN_ACTION',
      target: body.target || '-',
      status: body.status || 'SUCCESS',
      category: body.category,
      details: body.details,
      ipAddress: body.ipAddress,
      device: body.device,
    });

    const saved = addAuditLog(newEntry);

    // Save to Supabase gecc_audit_logs if configured
    if (isSupabaseConfigured()) {
      try {
        const row = mapAuditLogToRow(newEntry);
        const { error } = await supabase.from('gecc_audit_logs').insert(row);
        if (error) {
          console.error('Error inserting into Supabase gecc_audit_logs:', error.message);
        }
      } catch (err) {
        console.error('Supabase audit log insert exception:', err);
      }
    }

    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
