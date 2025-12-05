import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CityProperties, GeoJSONResponse } from '@/lib/api';

interface CSVRow {
    City: string;
    Severity: string;
    Latitude: string;
    Longitude: string;
    Crime: string;
    'Date.of.Occurrence': string;
    'Time.of.Occurrence': string;
    'Victim.Age': string;
    'Victim.Gender': string;
    'Report.Number': string;
}

export async function GET() {
    try {
        // Read CSV file
        const csvPath = join(process.cwd(), 'app', 'data', 'cities.csv');
        const csvContent = readFileSync(csvPath, 'utf-8');

        // Parse CSV
        const records: CSVRow[] = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        // Group by city
        const cityData = new Map<string, {
            crimes: Array<{
                crime: string;
                severity: number;
                date: string;
                lat: number;
                lon: number;
            }>;
            latSum: number;
            lonSum: number;
            coordCount: number;
        }>();

        for (const record of records) {
            const city = record.City?.trim();
            if (!city) continue;

            const severity = parseInt(record.Severity) || 1;
            const lat = parseFloat(record.Latitude);
            const lon = parseFloat(record.Longitude);

            if (!cityData.has(city)) {
                cityData.set(city, {
                    crimes: [],
                    latSum: 0,
                    lonSum: 0,
                    coordCount: 0,
                });
            }

            const data = cityData.get(city)!;

            // Accumulate coordinates for averaging
            if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
                data.latSum += lat;
                data.lonSum += lon;
                data.coordCount += 1;
            }

            // Use the current record's coordinates, or fallback to 0
            const recordLat = (lat && !isNaN(lat)) ? lat : (data.coordCount > 0 ? data.latSum / data.coordCount : 0);
            const recordLon = (lon && !isNaN(lon)) ? lon : (data.coordCount > 0 ? data.lonSum / data.coordCount : 0);

            data.crimes.push({
                crime: record.Crime || 'Unknown',
                severity,
                date: record['Date.of.Occurrence'] || '',
                lat: recordLat,
                lon: recordLon,
            });
        }

        // Calculate statistics for each city
        const features: GeoJSONResponse['features'] = [];

        for (const [city, data] of cityData.entries()) {
            if (data.crimes.length === 0) continue;

            const count = data.crimes.length;
            const avgSeverity = data.crimes.reduce((sum, c) => sum + c.severity, 0) / count;

            // Calculate intensity score: avg_severity × log(1 + count)
            const intensityScore = avgSeverity * Math.log(1 + count);

            // Calculate average coordinates
            const avgLat = data.coordCount > 0 ? data.latSum / data.coordCount : 0;
            const avgLon = data.coordCount > 0 ? data.lonSum / data.coordCount : 0;

            // Skip cities with invalid coordinates
            if (!avgLat || !avgLon || isNaN(avgLat) || isNaN(avgLon)) {
                continue;
            }

            // Get top crimes
            const crimeCounts = new Map<string, number>();
            data.crimes.forEach(c => {
                crimeCounts.set(c.crime, (crimeCounts.get(c.crime) || 0) + 1);
            });

            const topCrimes = Array.from(crimeCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([crime, count]) => ({ crime, count }));

            // Get sample records (last 5)
            const sampleRecords = data.crimes.slice(-5).map(c => ({
                'Crime': c.crime,
                'Severity': c.severity,
                'Date.of.Occurrence': c.date,
            }));

            const properties: CityProperties = {
                city,
                latitude: avgLat,
                longitude: avgLon,
                count,
                avg_severity: Math.round(avgSeverity * 100) / 100,
                intensity_score: Math.round(intensityScore * 100) / 100,
                top_crimes: topCrimes,
                sample_records: sampleRecords,
            };

            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [avgLon, avgLat],
                },
                properties,
            });
        }

        const response: GeoJSONResponse = {
            type: 'FeatureCollection',
            features,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error processing cities data:', error);
        return NextResponse.json(
            { error: 'Failed to process cities data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

