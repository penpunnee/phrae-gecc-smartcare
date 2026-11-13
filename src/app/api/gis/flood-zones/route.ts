import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_FLOOD_ZONES } from '@/lib/gisFallbackData';

const UPSTREAM_API_URL = process.env.PHRAE_DATA_MAP_API_URL || 'http://localhost:4001/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get('district');

  // Attempt upstream connection to port 4001
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const upstreamRes = await fetch(`${UPSTREAM_API_URL}/flood/zones`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (upstreamRes.ok) {
      const json = await upstreamRes.json();
      const features = json.data?.features || json.features || json.data;

      if (Array.isArray(features) && features.length > 0) {
        let filteredFeatures = features;
        if (district && district !== 'all') {
          filteredFeatures = features.filter((f: any) =>
            f.properties?.affectedDistricts?.includes(district) ||
            f.properties?.name?.includes(district)
          );
        }

        return NextResponse.json({
          success: true,
          source: 'upstream-port-4001',
          data: {
            type: 'FeatureCollection',
            features: filteredFeatures,
          },
        });
      }
    }
  } catch (err) {
    // Graceful fallback
  }

  // Fallback to high-accuracy Phrae Yom river basin polygon
  let features = FALLBACK_FLOOD_ZONES.features;
  if (district && district !== 'all') {
    features = features.filter((f) =>
      f.properties.affectedDistricts.includes(district as any) ||
      f.properties.name.includes(district)
    );
  }

  return NextResponse.json({
    success: true,
    source: 'phrae-gis-fallback',
    message: 'ขอบเขตพื้นที่เสี่ยงภัยน้ำท่วมลุ่มน้ำยม จ.แพร่ (GISTDA & กรมชลประทาน)',
    data: {
      type: 'FeatureCollection',
      features,
    },
  });
}

