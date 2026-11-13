import { NextRequest, NextResponse } from 'next/server';
import { getFallbackRiverGauges } from '@/lib/gisFallbackData';
import { getDemoCriticalMode, setDemoCriticalMode } from '@/lib/serverStore';
import { RiverGaugeStation } from '@/types';

const UPSTREAM_API_URL = process.env.PHRAE_DATA_MAP_API_URL || 'http://localhost:4001/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const simulateParam = searchParams.get('simulateCritical');
  const forcedCritical = simulateParam === 'true';
  const globalDemo = getDemoCriticalMode();
  const isCritical = forcedCritical || globalDemo;

  // If critical simulation is requested, immediately return simulated critical data
  if (isCritical) {
    return NextResponse.json({
      success: true,
      mode: 'simulation',
      isCritical: true,
      source: 'fallback-simulation',
      message: '⚡ โหมดจำลองสถานการณ์น้ำยมวิกฤต (Demo Mode สำหรับคณะกรรมการ GECC)',
      data: getFallbackRiverGauges(true),
    });
  }

  // Otherwise, attempt to connect to upstream phrae-data-map-dev (port 4001)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const upstreamRes = await fetch(`${UPSTREAM_API_URL}/river-gauges`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (upstreamRes.ok) {
      const json = await upstreamRes.json();
      const upstreamData = json.data || json;

      if (Array.isArray(upstreamData) && upstreamData.length > 0) {
        // Map upstream schema to standard RiverGaugeStation
        const mapped: RiverGaugeStation[] = upstreamData.map((g: any, index: number) => {
          const wl = Number(g.waterLevelMeters ?? g.waterLevel ?? g.currentLevel ?? 5.4);
          const warn = Number(g.warningLevelMeters ?? g.warningLevel ?? 7.0);
          const crit = Number(g.criticalLevelMeters ?? g.criticalLevel ?? 8.2);
          const status = wl >= crit ? 'critical' : wl >= warn ? 'warning' : 'normal';

          return {
            id: g.id || g.code || `Y-${index + 1}`,
            code: g.code || g.id || 'Y.1C',
            name: g.name || 'สถานีวัดน้ำแม่น้ำยม',
            river: g.river || 'แม่น้ำยม',
            district: g.district || 'เมืองแพร่',
            subDistrict: g.subDistrict || 'ต.ป่าแมต',
            lat: Number(g.lat || 18.1408),
            lng: Number(g.lng || 100.1340),
            waterLevelMeters: wl,
            warningLevelMeters: warn,
            criticalLevelMeters: crit,
            bankCapacityM3s: Number(g.bankCapacityM3s || 1000),
            currentFlowM3s: Number(g.currentFlowM3s || 450),
            status,
            statusText:
              status === 'critical'
                ? 'วิกฤตล้นตลิ่ง (Critical)'
                : status === 'warning'
                ? 'เฝ้าระวัง (Warning)'
                : 'ปกติ (Normal)',
            trend: g.trend || 'stable',
            updatedAt: g.updatedAt || new Date().toISOString(),
          };
        });

        // Sort order: Y.20 (Upstream Song) -> Y.1C (Mueang Phrae) -> Y.37 (Wang Chin) -> Y.31 (Den Chai)
        const ORDER_WEIGHT: Record<string, number> = {
          'Y.20': 1,
          'Y.1C': 2,
          'Y.37': 3,
          'Y.31': 4,
        };

        mapped.sort((a, b) => (ORDER_WEIGHT[a.code] || 99) - (ORDER_WEIGHT[b.code] || 99));

        return NextResponse.json({
          success: true,
          mode: 'live',
          isCritical: mapped.some((m) => m.status === 'critical'),
          source: 'upstream-port-4001',
          data: mapped,
        });
      }
    }
  } catch (err) {
    // Graceful fallback: Do not log scary error stacks, port 4001 is optional
  }

  // Return realistic Phrae hydrological fallback
  return NextResponse.json({
    success: true,
    mode: 'fallback',
    isCritical: false,
    source: 'phrae-gis-adapter',
    message: 'สถานะระดับน้ำแม่น้ำยม จ.แพร่ (Graceful Fallback Mode)',
    data: getFallbackRiverGauges(false),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { simulateCritical } = body;
    const newState = Boolean(simulateCritical);
    setDemoCriticalMode(newState);

    return NextResponse.json({
      success: true,
      message: newState
        ? '⚡ เปิดโหมดจำลองสถานการณ์น้ำยมวิกฤต (Critical Demo Mode) แล้ว'
        : 'ปิดโหมดจำลองสถานการณ์ ระดับน้ำแม่น้ำยมกลับสู่ค่ามาตรฐาน',
      isCritical: newState,
      data: getFallbackRiverGauges(newState),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

