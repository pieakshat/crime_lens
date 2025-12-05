'use client';

import { CityProperties, GeoJSONFeature } from '@/lib/api';
import { UserData } from '@/lib/storage';

interface SidebarProps {
    userData: UserData | null;
    selectedCity: CityProperties | null;
    cities: GeoJSONFeature[];
    onCitySelect: (cityName: string) => void;
    onSimulateEntry: () => void;
    onSOSClick: () => void;
}

export default function Sidebar({
    userData,
    selectedCity,
    cities,
    onCitySelect,
    onSimulateEntry,
    onSOSClick,
}: SidebarProps) {
    return (
        <div className="w-[30%] bg-black border-l-2 border-white p-5 overflow-y-auto">
            <div className="mb-8 pb-5 border-b border-gray-700">
                <h2 className="text-xl mb-4 uppercase tracking-wide">User Info</h2>
                <div className="text-sm leading-relaxed">
                    {userData ? (
                        <>
                            <p className="mb-2">
                                <strong>Username:</strong> {userData.username || 'Not set'}
                            </p>
                            <p className="mb-2">
                                <strong>Phone:</strong> {userData.phone}
                            </p>
                            <p className="mb-2">
                                <strong>Email:</strong> {userData.email || 'N/A'}
                            </p>
                            <p className="mb-2">
                                <strong>Guardian:</strong> {userData.guardian_phone || 'Not set'}
                            </p>
                        </>
                    ) : (
                        <p>Loading...</p>
                    )}
                </div>
            </div>

            <div className="mb-8 pb-5 border-b border-gray-700">
                <h2 className="text-xl mb-4 uppercase tracking-wide">Emergency Numbers</h2>
                <ul className="list-none">
                    <li className="py-2 text-sm">🚨 Police: 100</li>
                    <li className="py-2 text-sm">🚑 Ambulance: 102</li>
                    <li className="py-2 text-sm">🔥 Fire: 101</li>
                    <li className="py-2 text-sm">🚨 Women Helpline: 1091</li>
                </ul>
            </div>

            <div className="mb-8 pb-5 border-b border-gray-700">
                <h2 className="text-xl mb-4 uppercase tracking-wide">Selected City</h2>
                <div className="text-sm leading-relaxed">
                    {selectedCity ? (
                        <>
                            <div className="mb-3">
                                <span className="font-bold text-gray-400">City:</span> {selectedCity.city || 'Unknown'}
                            </div>
                            <div className="mb-3">
                                <span className="font-bold text-gray-400">Total Crimes:</span> {selectedCity.count}
                            </div>
                            <div className="mb-3">
                                <span className="font-bold text-gray-400">Avg Severity:</span> {selectedCity.avg_severity}
                            </div>
                            <div className="mb-3">
                                <span className="font-bold text-gray-400">Intensity Score:</span> {selectedCity.intensity_score}
                            </div>
                            <div className="mb-3">
                                <span className="font-bold text-gray-400">Top 3 Crimes:</span>
                                <ul className="list-none mt-2">
                                    {selectedCity.top_crimes.map((crime, idx) => (
                                        <li key={idx} className="py-1 text-xs">
                                            {crime.crime} ({crime.count})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mb-3">
                                <span className="font-bold text-gray-400">Sample Records:</span>
                                <ul className="list-disc mt-2 ml-5 text-xs text-gray-400">
                                    {selectedCity.sample_records.slice(0, 5).map((record, idx) => {
                                        let displayText = '';
                                        if (record['Crime.Code']) {
                                            displayText = `Crime Code: ${record['Crime.Code']}`;
                                        } else if (record['Crime Description']) {
                                            displayText = record['Crime Description'];
                                        }

                                        for (const key in record) {
                                            if (key.includes('Domain') || key.includes('domain')) {
                                                displayText += ` - ${record[key]}`;
                                                break;
                                            }
                                        }

                                        if (record['Date.of.Occurrence']) {
                                            displayText += ` (${record['Date.of.Occurrence']})`;
                                        }

                                        if (!displayText) {
                                            displayText = JSON.stringify(record).substring(0, 50) + '...';
                                        }

                                        return <li key={idx} className="py-1">{displayText}</li>;
                                    })}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <p>Click on a city marker to view stats</p>
                    )}
                </div>
            </div>

            <div className="mb-8 pb-5 border-b border-gray-700">
                <h2 className="text-xl mb-4 uppercase tracking-wide">Heatmap Legend</h2>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-xs">
                        <div className="w-8 h-5 border border-white bg-red-500"></div>
                        <span>Top 20% Severe</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="w-8 h-5 border border-white bg-orange-500"></div>
                        <span>Next 30%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="w-8 h-5 border border-white bg-yellow-500"></div>
                        <span>Next 30%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="w-8 h-5 border border-white bg-green-500"></div>
                        <span>Bottom 20%</span>
                    </div>
                </div>
            </div>

            <div className="mb-8 pb-5 border-b border-gray-700">
                <button
                    onClick={onSOSClick}
                    className="w-full p-4 bg-red-500 text-white text-lg font-bold rounded mt-2 transition-opacity hover:opacity-90"
                >
                    🚨 SOS ALERT
                </button>
            </div>

            <div>
                <h2 className="text-xl mb-4 uppercase tracking-wide">Demo Controls</h2>
                <div className="bg-gray-900 p-4 border border-white rounded">
                    <select
                        onChange={(e) => onCitySelect(e.target.value)}
                        className="w-full p-3 bg-black text-white border border-white rounded text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                        <option value="">Select an area...</option>
                        {cities.map((feature) => (
                            <option key={feature.properties.city} value={feature.properties.city}>
                                {feature.properties.area || feature.properties.city}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={onSimulateEntry}
                        className="w-full p-3 bg-gray-700 text-white rounded transition-opacity hover:opacity-90"
                    >
                        Simulate Entering Area
                    </button>
                </div>
            </div>
        </div>
    );
}

