interface CrimeRecord {
    crime: string;
    date: string;
    time: number;
    severity: number;
}

interface TimePattern {
    timeRange: string;
    crimeType: string;
    probability: number;
    description: string;
    averageTime?: string; // Format: "HH:MM AM/PM"
}

interface DayPattern {
    dayType: string;
    crimeType: string;
    probability: number;
    description: string;
}

export interface CrimePrediction {
    mostLikelyTime: TimePattern;
    mostLikelyDay: DayPattern;
    highRiskPeriods: Array<{
        period: string;
        crimeType: string;
        riskLevel: 'High' | 'Medium' | 'Low';
    }>;
    recommendations: string[];
}

/**
 * Get time of day category from hour (decimal hours, e.g., 1.5 = 1:30 AM)
 */
function getTimeCategory(timeInHours: number): string {
    const hour = Math.floor(timeInHours) % 24;
    if (hour >= 22 || hour < 4) return 'Night (10 PM - 4 AM)';
    if (hour >= 4 && hour < 8) return 'Early Morning (4 AM - 8 AM)';
    if (hour >= 8 && hour < 12) return 'Morning (8 AM - 12 PM)';
    if (hour >= 12 && hour < 17) return 'Afternoon (12 PM - 5 PM)';
    if (hour >= 17 && hour < 22) return 'Evening (5 PM - 10 PM)';
    return 'Unknown';
}

/**
 * Get day type from date string (DD-MM-YYYY format)
 */
function getDayType(dateStr: string): string {
    try {
        const [day, month, year] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();

        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return 'Weekend';
        }
        return 'Weekday';
    } catch {
        return 'Unknown';
    }
}

/**
 * Format hour (0-23) to time string (HH:MM AM/PM)
 */
function formatTime(hour: number, minute: number = 0): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Analyze crime patterns and generate predictions
 */
export function analyzeCrimePatterns(crimes: CrimeRecord[]): CrimePrediction {
    if (crimes.length === 0) {
        return getDefaultPrediction();
    }

    // Group crimes by time category with time tracking
    const timeCategoryCrimes = new Map<string, Map<string, { count: number; times: number[] }>>();
    const dayTypeCrimes = new Map<string, Map<string, number>>();

    crimes.forEach((crime) => {
        const timeCat = getTimeCategory(crime.time);
        const dayType = getDayType(crime.date);

        // Count by time category with time tracking
        if (!timeCategoryCrimes.has(timeCat)) {
            timeCategoryCrimes.set(timeCat, new Map());
        }
        const timeMap = timeCategoryCrimes.get(timeCat)!;
        if (!timeMap.has(crime.crime)) {
            timeMap.set(crime.crime, { count: 0, times: [] });
        }
        const crimeData = timeMap.get(crime.crime)!;
        crimeData.count += 1;
        crimeData.times.push(crime.time);

        // Count by day type
        if (!dayTypeCrimes.has(dayType)) {
            dayTypeCrimes.set(dayType, new Map());
        }
        const dayMap = dayTypeCrimes.get(dayType)!;
        dayMap.set(crime.crime, (dayMap.get(crime.crime) || 0) + 1);
    });

    // Find most common crime in each time category
    let maxTimeCount = 0;
    let mostLikelyTime: TimePattern = {
        timeRange: 'Night (10 PM - 4 AM)',
        crimeType: 'THEFT',
        probability: 0.3,
        description: 'Crimes are most common during night hours',
        averageTime: '10:37 PM',
    };

    timeCategoryCrimes.forEach((crimeMap, timeRange) => {
        let maxCount = 0;
        let mostCommonCrime = '';
        let crimeTimes: number[] = [];

        crimeMap.forEach((crimeData, crime) => {
            if (crimeData.count > maxCount) {
                maxCount = crimeData.count;
                mostCommonCrime = crime;
                crimeTimes = crimeData.times;
            }
        });

        const probability = maxCount / crimes.length;
        if (probability > mostLikelyTime.probability) {
            // Calculate average time from decimal hours
            let averageTime: string | undefined;
            if (crimeTimes.length > 0) {
                const avgTimeInHours = crimeTimes.reduce((sum, time) => sum + time, 0) / crimeTimes.length;
                const hour = Math.floor(avgTimeInHours) % 24;
                const minute = Math.round((avgTimeInHours - Math.floor(avgTimeInHours)) * 60);
                // Ensure minute is between 0-59
                const finalMinute = minute >= 60 ? minute % 60 : minute;
                const finalHour = minute >= 60 ? (hour + 1) % 24 : hour;
                averageTime = formatTime(finalHour, finalMinute);
            }

            mostLikelyTime = {
                timeRange,
                crimeType: mostCommonCrime,
                probability: Math.min(probability * 2, 0.9), // Scale up for readability
                description: `${mostCommonCrime} is most likely during ${timeRange}${averageTime ? ` at an average time of ${averageTime}` : ''}`,
                averageTime,
            };
        }
    });

    // Find most common crime by day type
    let mostLikelyDay: DayPattern = {
        dayType: 'Weekend',
        crimeType: 'ASSAULT',
        probability: 0.3,
        description: 'Crimes are more common on weekends',
    };

    dayTypeCrimes.forEach((crimeMap, dayType) => {
        let maxCount = 0;
        let mostCommonCrime = '';

        crimeMap.forEach((count, crime) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommonCrime = crime;
            }
        });

        const probability = maxCount / crimes.length;
        if (probability > mostLikelyDay.probability) {
            mostLikelyDay = {
                dayType,
                crimeType: mostCommonCrime,
                probability: Math.min(probability * 2, 0.9),
                description: `${mostCommonCrime} is more likely on ${dayType}s`,
            };
        }
    });

    // Generate high-risk periods
    const highRiskPeriods: CrimePrediction['highRiskPeriods'] = [];

    // Night crimes
    const nightCrimes = timeCategoryCrimes.get('Night (10 PM - 4 AM)');
    if (nightCrimes && nightCrimes.size > 0) {
        let maxNightCrime = '';
        let maxNightCount = 0;
        nightCrimes.forEach((crimeData, crime) => {
            if (crimeData.count > maxNightCount) {
                maxNightCount = crimeData.count;
                maxNightCrime = crime;
            }
        });
        if (maxNightCount > crimes.length * 0.1) {
            highRiskPeriods.push({
                period: 'Night (10 PM - 4 AM)',
                crimeType: maxNightCrime,
                riskLevel: 'High',
            });
        }
    }

    // Weekend crimes
    const weekendCrimes = dayTypeCrimes.get('Weekend');
    if (weekendCrimes && weekendCrimes.size > 0) {
        let maxWeekendCrime = '';
        let maxWeekendCount = 0;
        weekendCrimes.forEach((count, crime) => {
            if (count > maxWeekendCount) {
                maxWeekendCount = count;
                maxWeekendCrime = crime;
            }
        });
        if (maxWeekendCount > crimes.length * 0.15) {
            highRiskPeriods.push({
                period: 'Weekends',
                crimeType: maxWeekendCrime,
                riskLevel: 'High',
            });
        }
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (mostLikelyTime.timeRange.includes('Night')) {
        recommendations.push('Avoid traveling alone during night hours (10 PM - 4 AM)');
    }

    if (mostLikelyDay.dayType === 'Weekend') {
        recommendations.push('Exercise extra caution on weekends, especially in crowded areas');
    }

    if (highRiskPeriods.length > 0) {
        recommendations.push(`Be particularly alert for ${highRiskPeriods[0].crimeType} during high-risk periods`);
    }

    recommendations.push('Stay in well-lit areas and avoid isolated locations');
    recommendations.push('Keep emergency contacts readily available');

    return {
        mostLikelyTime,
        mostLikelyDay,
        highRiskPeriods,
        recommendations,
    };
}

function getDefaultPrediction(): CrimePrediction {
    return {
        mostLikelyTime: {
            timeRange: 'Night (10 PM - 4 AM)',
            crimeType: 'THEFT',
            probability: 0.4,
            description: 'Crimes are most common during night hours at an average time of 10:37 PM',
            averageTime: '10:37 PM',
        },
        mostLikelyDay: {
            dayType: 'Weekend',
            crimeType: 'ASSAULT',
            probability: 0.35,
            description: 'Crimes are more common on weekends',
        },
        highRiskPeriods: [
            {
                period: 'Night (10 PM - 4 AM)',
                crimeType: 'THEFT',
                riskLevel: 'High',
            },
        ],
        recommendations: [
            'Avoid traveling alone during night hours',
            'Exercise extra caution on weekends',
            'Stay in well-lit areas',
        ],
    };
}

