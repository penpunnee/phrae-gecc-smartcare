import { NextResponse } from 'next/server';
import { FALLBACK_DISTRICT_SUMMARIES, getFallbackRiverGauges } from '@/lib/gisFallbackData';
import { getDemoCriticalMode, getVulnerablePersons } from '@/lib/serverStore';

export async function GET() {
  try {
    const isCritical = getDemoCriticalMode();
    const riverGauges = getFallbackRiverGauges(isCritical);
    const vulnerableList = getVulnerablePersons();

    // Calculate aggregated totals across the 8 districts
    const totalVulnerable = FALLBACK_DISTRICT_SUMMARIES.reduce((acc, d) => acc + d.totalVulnerable, 0);
    const totalBedridden = FALLBACK_DISTRICT_SUMMARIES.reduce((acc, d) => acc + d.bedridden, 0);
    const totalElderlyAlone = FALLBACK_DISTRICT_SUMMARIES.reduce((acc, d) => acc + d.elderlyAlone, 0);
    const totalFloodRisk = FALLBACK_DISTRICT_SUMMARIES.reduce((acc, d) => acc + d.inFloodRiskArea, 0);

    const criticalRiverStations = riverGauges.filter((g) => g.status === 'critical');
    const warningRiverStations = riverGauges.filter((g) => g.status === 'warning');

    const statusLevel = criticalRiverStations.length > 0 ? 'CRITICAL' : warningRiverStations.length > 0 ? 'WARNING' : 'NORMAL';

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      riverStatus: {
        level: statusLevel,
        isCriticalDemo: isCritical,
        criticalStations: criticalRiverStations.map((s) => s.id),
        stations: riverGauges,
      },
      proactiveTotals: {
        totalVulnerable,
        totalBedridden,
        totalElderlyAlone,
        totalFloodRisk,
        activePinnedCases: vulnerableList.length,
        urgentSosCount: vulnerableList.filter((p) => p.status === 'ต้องการความช่วยเหลือฉุกเฉิน').length,
      },
      districts: FALLBACK_DISTRICT_SUMMARIES,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

