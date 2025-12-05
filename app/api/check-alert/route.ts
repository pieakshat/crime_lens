import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { city } = body;

        if (!city) {
            return NextResponse.json(
                { success: false, error: 'City required' },
                { status: 400 }
            );
        }

        // Get city data from areas API
        const areasResponse = await fetch(`${request.nextUrl.origin}/api/areas`);
        if (!areasResponse.ok) {
            throw new Error('Failed to fetch city data');
        }
        const areasData = await areasResponse.json();

        const cityFeature = areasData.features?.find(
            (f: any) => f.properties.city.toLowerCase() === city.toLowerCase()
        );

        if (!cityFeature) {
            return NextResponse.json(
                { success: false, error: 'City not found' },
                { status: 404 }
            );
        }

        const cityData = cityFeature.properties;
        const avgSeverity = cityData.avg_severity || 0;
        const intensityScore = cityData.intensity_score || 0;

        // Calculate intensity percentiles
        const allIntensityScores = areasData.features
            .map((f: any) => f.properties.intensity_score || 0)
            .sort((a: number, b: number) => b - a);

        const n = allIntensityScores.length;
        const top_50_threshold = n > 0 ? allIntensityScores[Math.floor(n * 0.5)] : 0;

        // Alert conditions: avg_severity >= 2 OR intensity_score >= top_50_threshold
        const shouldAlert = avgSeverity >= 2 || intensityScore >= top_50_threshold;

        return NextResponse.json({
            success: true,
            should_alert: shouldAlert,
            city_data: cityData,
            top_50_threshold,
        });
    } catch (error: any) {
        console.error('Error in check-alert:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

