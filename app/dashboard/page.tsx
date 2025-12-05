'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getUserData, isAuthenticated } from '@/lib/storage';
import { getAreas, sendSOS, checkAlert, GeoJSONFeature, CityProperties } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import WarningPopup from '@/components/WarningPopup';

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-black text-white">
            Loading map...
        </div>
    ),
});

export default function DashboardPage() {
    const router = useRouter();
    const [userData, setUserData] = useState(getUserData());
    const [features, setFeatures] = useState<GeoJSONFeature[]>([]);
    const [selectedCity, setSelectedCity] = useState<CityProperties | null>(null);
    const [selectedCityName, setSelectedCityName] = useState<string>('');
    const [intensityPercentiles, setIntensityPercentiles] = useState({
        top_20: 0,
        top_50: 0,
        top_80: 0,
    });
    const [warning, setWarning] = useState<{
        show: boolean;
        severity: number;
        crimes: string;
        areaName: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // if (!isAuthenticated()) {
        //     router.push('/login');
        //     return;
        // }

        loadCitiesData();
    }, [router]);

    const loadCitiesData = async () => {
        try {
            const response = await getAreas();
            const citiesData = response.features || [];

            // Calculate intensity percentiles
            const intensityScores = citiesData
                .map((f) => f.properties.intensity_score || 0)
                .sort((a, b) => b - a);
            const n = intensityScores.length;

            setIntensityPercentiles({
                top_20: intensityScores[Math.floor(n * 0.2)] || 0,
                top_50: intensityScores[Math.floor(n * 0.5)] || 0,
                top_80: intensityScores[Math.floor(n * 0.8)] || 0,
            });

            setFeatures(citiesData);
        } catch (error) {
            console.error('Error loading cities:', error);
            alert('Failed to load map data. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleCitySelect = (feature: GeoJSONFeature) => {
        setSelectedCity(feature.properties);
        setSelectedCityName(feature.properties.city);
    };

    const handleCitySelectFromDropdown = (cityName: string) => {
        if (!cityName) return;
        const feature = features.find((f) => f.properties.city === cityName);
        if (feature) {
            handleCitySelect(feature);
        }
    };

    const handleSimulateEntry = async () => {
        if (!selectedCity) {
            alert('Please select an area first');
            return;
        }

        const props = selectedCity;
        const shouldAlert =
            props.avg_severity >= 2 ||
            props.intensity_score >= intensityPercentiles.top_50;

        if (shouldAlert) {
            const topCrimes = props.top_crimes
                ? props.top_crimes.map((c) => c.crime).slice(0, 3).join(', ')
                : 'Various';
            const areaName = props.area || props.city || 'Area';
            setWarning({
                show: true,
                severity: props.avg_severity,
                crimes: topCrimes,
                areaName,
            });
        }
    };

    const handleSOS = async () => {
        if (!selectedCityName) {
            alert('Please select a city first');
            return;
        }

        const confirmSOS = confirm('Are you sure you want to send an SOS alert?');
        if (!confirmSOS) return;

        if (!userData) return;

        try {
            const response = await sendSOS({
                user_phone: userData.phone,
                city: selectedCityName,
            });

            if (response.success) {
                if (response.demo) {
                    const demo = response.demo as { user_message: string; guardian_message: string };
                    alert(
                        `Demo Mode:\n\nUser Message:\n${demo.user_message}\n\nGuardian Message:\n${demo.guardian_message || 'No guardian phone set'}`
                    );
                } else {
                    alert('SOS alert sent successfully!');
                }
            } else {
                alert('Failed to send SOS: ' + response.error);
            }
        } catch (error) {
            alert('Connection error. Make sure backend is running.');
            console.error('Error:', error);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-black text-white flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="h-screen bg-black text-white flex overflow-hidden">
            <div className="w-[70%] h-screen relative">
                <Map
                    features={features}
                    onCitySelect={handleCitySelect}
                    selectedCity={selectedCityName}
                    intensityPercentiles={intensityPercentiles}
                />
            </div>

            <Sidebar
                userData={userData}
                selectedCity={selectedCity}
                cities={features}
                onCitySelect={handleCitySelectFromDropdown}
                onSimulateEntry={handleSimulateEntry}
                onSOSClick={handleSOS}
            />

            {warning && (
                <WarningPopup
                    show={warning.show}
                    severity={warning.severity}
                    crimes={warning.crimes}
                    areaName={warning.areaName}
                    onClose={() => setWarning(null)}
                />
            )}
        </div>
    );
}

