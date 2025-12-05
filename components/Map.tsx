'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polygon, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { GeoJSONFeature } from '@/lib/api';

interface MapProps {
    features: GeoJSONFeature[];
    onCitySelect: (feature: GeoJSONFeature) => void;
    selectedCity?: string;
    intensityPercentiles: {
        top_20: number;
        top_50: number;
        top_80: number;
    };
}

// Heatmap layer component
function HeatmapLayer({
    features,
    intensityPercentiles,
}: {
    features: GeoJSONFeature[];
    intensityPercentiles: { top_20: number; top_50: number; top_80: number };
}) {
    const map = useMap();
    const heatLayerRef = useRef<L.HeatLayer | null>(null);

    useEffect(() => {
        if (features.length === 0) return;

        // Prepare heatmap data: [lat, lon, intensity]
        const heatData: [number, number, number][] = features
            .map((feature) => {
                const props = feature.properties;
                const intensityScore = props.intensity_score || 0;

                // Normalize intensity score for heatmap (0-1 range)
                const maxIntensity = intensityPercentiles.top_20 || 1;
                const normalizedIntensity = Math.min(intensityScore / maxIntensity, 1) * 100;

                if (feature.geometry.type === 'Point') {
                    const coords = feature.geometry.coordinates as number[];
                    const lat = props.latitude || coords[1];
                    const lon = props.longitude || coords[0];
                    if (lat && lon) {
                        return [lat, lon, normalizedIntensity] as [number, number, number];
                    }
                }
                return null;
            })
            .filter((point): point is [number, number, number] => point !== null);

        // Remove existing heat layer if present
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
        }

        // Create new heat layer
        if (heatData.length > 0) {
            const heatLayer = (L as any).heatLayer(heatData, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
                max: 100,
                gradient: {
                    0.0: 'blue',
                    0.2: 'cyan',
                    0.4: 'lime',
                    0.6: 'yellow',
                    0.8: 'orange',
                    1.0: 'red',
                },
            });

            heatLayer.addTo(map);
            heatLayerRef.current = heatLayer;
        }

        // Cleanup on unmount
        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
            }
        };
    }, [features, intensityPercentiles, map]);

    return null;
}

function MapController({
    features,
    selectedCity,
}: {
    features: GeoJSONFeature[];
    selectedCity?: string;
}) {
    const map = useMap();

    useEffect(() => {
        if (features.length === 0) return;

        // Check if demo mode (only Delhi, single city)
        const isDemoMode =
            features.length === 1 &&
            features[0].properties?.city?.includes('Delhi');

        if (isDemoMode) {
            const delhiFeature = features[0];
            if (delhiFeature.geometry.type === 'Polygon') {
                const polygonCoords = delhiFeature.geometry.coordinates;
                if (Array.isArray(polygonCoords) && Array.isArray(polygonCoords[0]) && Array.isArray(polygonCoords[0][0])) {
                    const coords = ((polygonCoords[0] as unknown) as number[][]).map(
                        (coord) => [coord[1], coord[0]] as [number, number]
                    );
                    const bounds = L.latLngBounds(coords);
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } else {
                const props = delhiFeature.properties;
                const lat = props.latitude || 28.6600;
                const lon = props.longitude || 77.2350;
                map.setView([lat, lon], 13);
            }
        } else {
            // Normal mode: Fit to show all cities
            const bounds = L.latLngBounds([]);
            features.forEach((feature) => {
                const props = feature.properties;
                if (feature.geometry.type === 'Point') {
                    const coords = feature.geometry.coordinates as number[];
                    const lat = props.latitude || coords[1];
                    const lon = props.longitude || coords[0];
                    if (lat && lon) {
                        bounds.extend([lat, lon]);
                    }
                } else if (feature.geometry.type === 'Polygon') {
                    const polygonCoords = feature.geometry.coordinates;
                    if (Array.isArray(polygonCoords) && Array.isArray(polygonCoords[0]) && Array.isArray(polygonCoords[0][0])) {
                        const coords = ((polygonCoords[0] as unknown) as number[][]).map(
                            (coord) => [coord[1], coord[0]] as [number, number]
                        );
                        coords.forEach((coord) => bounds.extend(coord));
                    }
                }
            });
            if (!bounds.isValid()) {
                map.setView([20.5937, 78.9629], 5); // Center of India
            } else {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [features, map]);

    useEffect(() => {
        if (selectedCity) {
            const feature = features.find(
                (f) => f.properties.city === selectedCity
            );
            if (feature) {
                if (feature.geometry.type === 'Polygon') {
                    const polygonCoords = feature.geometry.coordinates;
                    if (Array.isArray(polygonCoords) && Array.isArray(polygonCoords[0]) && Array.isArray(polygonCoords[0][0])) {
                        const coords = ((polygonCoords[0] as unknown) as number[][]).map(
                            (coord) => [coord[1], coord[0]] as [number, number]
                        );
                        const bounds = L.latLngBounds(coords);
                        map.fitBounds(bounds, { padding: [50, 50] });
                    }
                } else {
                    const props = feature.properties;
                    const coords = feature.geometry.coordinates as number[];
                    const lat = props.latitude || coords[1];
                    const lon = props.longitude || coords[0];
                    map.setView([lat, lon], 12);
                }
            }
        }
    }, [selectedCity, features, map]);

    return null;
}

function getMarkerColor(
    intensityScore: number,
    percentiles: { top_20: number; top_50: number; top_80: number }
): string {
    if (intensityScore >= percentiles.top_20) {
        return '#FF0000'; // Red - top 20%
    } else if (intensityScore >= percentiles.top_50) {
        return '#FF8800'; // Orange - next 30%
    } else if (intensityScore >= percentiles.top_80) {
        return '#FFFF00'; // Yellow - next 30%
    } else {
        return '#00FF00'; // Green - bottom 20%
    }
}

export default function Map({ features, onCitySelect, selectedCity, intensityPercentiles }: MapProps) {
    return (
        <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
                maxZoom={19}
            />
            <MapController features={features} selectedCity={selectedCity} />
            <HeatmapLayer features={features} intensityPercentiles={intensityPercentiles} />

            {features.map((feature, index) => {
                const props = feature.properties;
                const intensityScore = props.intensity_score || 0;
                const color = getMarkerColor(intensityScore, intensityPercentiles);
                const city = props.city || 'Unknown';

                const tooltipContent = (
                    <>
                        <strong>{props.area || city}</strong>
                        <br />
                        Severity: {props.avg_severity}
                        <br />
                        Crimes: {props.count}
                        <br />
                        Top Crimes: {props.top_crimes ? props.top_crimes.map((c) => c.crime).slice(0, 3).join(', ') : 'N/A'}
                        {props.prediction && (
                            <>
                                <br />
                                <br />
                                <strong>🔮 Prediction:</strong>
                                <br />
                                {props.prediction.mostLikelyTime.crimeType} likely during {props.prediction.mostLikelyTime.timeRange}
                                {props.prediction.mostLikelyTime.averageTime && (
                                    <> at {props.prediction.mostLikelyTime.averageTime}</>
                                )}
                            </>
                        )}
                    </>
                );

                if (feature.geometry.type === 'Polygon') {
                    const polygonCoords = feature.geometry.coordinates;
                    if (Array.isArray(polygonCoords) && Array.isArray(polygonCoords[0]) && Array.isArray(polygonCoords[0][0])) {
                        const coords = ((polygonCoords[0] as unknown) as number[][]).map(
                            (coord) => [coord[1], coord[0]] as [number, number]
                        );
                        return (
                            <Polygon
                                key={`polygon-${index}`}
                                positions={coords}
                                pathOptions={{
                                    fillColor: color,
                                    color: '#FFFFFF',
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 0.6,
                                }}
                                eventHandlers={{
                                    click: () => onCitySelect(feature),
                                }}
                            >
                                <Tooltip>{tooltipContent}</Tooltip>
                            </Polygon>
                        );
                    }
                    return null;
                } else {
                    const coords = feature.geometry.coordinates as number[];
                    const lat = props.latitude || coords[1];
                    const lon = props.longitude || coords[0];
                    return (
                        <CircleMarker
                            key={`marker-${index}`}
                            center={[lat, lon]}
                            radius={10}
                            pathOptions={{
                                fillColor: color,
                                color: '#FFFFFF',
                                weight: 2,
                                opacity: 1,
                                fillOpacity: 0.8,
                            }}
                            eventHandlers={{
                                click: () => onCitySelect(feature),
                            }}
                        >
                            <Tooltip>{tooltipContent}</Tooltip>
                        </CircleMarker>
                    );
                }
            })}
        </MapContainer>
    );
}

