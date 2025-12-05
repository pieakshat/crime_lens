export interface SendOTPRequest {
    phone: string;
}

export interface SendOTPResponse {
    success: boolean;
    message?: string;
    demo_mode?: boolean;
    demo_otp?: string;
    error?: string;
    messageSid?: string;
    note?: string;
}

export interface VerifyOTPRequest {
    phone: string;
    otp: string;
    username?: string;
    email?: string;
    guardian_phone?: string;
}

export interface VerifyOTPResponse {
    success: boolean;
    message?: string;
    user?: {
        phone: string;
        username?: string;
        email?: string;
        guardian_phone?: string;
        verified: boolean;
    };
    error?: string;
}

export interface CityProperties {
    city: string;
    area?: string;
    latitude: number;
    longitude: number;
    count: number;
    avg_severity: number;
    intensity_score: number;
    top_crimes: Array<{ crime: string; count: number }>;
    sample_records: Array<Record<string, any>>;
}

export interface GeoJSONFeature {
    type: 'Feature';
    geometry: {
        type: 'Point' | 'Polygon';
        coordinates: number[] | number[][];
    };
    properties: CityProperties;
}

export interface GeoJSONResponse {
    type: 'FeatureCollection';
    features: GeoJSONFeature[];
}

export interface SOSRequest {
    user_phone: string;
    city: string;
}

export interface SOSResponse {
    success: boolean;
    message?: string;
    user_sms_sent?: boolean;
    guardian_sms_sent?: boolean;
    demo?: boolean | {
        user_message: string;
        guardian_message: string;
    };
    error?: string;
}

export interface CheckAlertRequest {
    city: string;
}

export interface CheckAlertResponse {
    should_alert: boolean;
    city_data: CityProperties;
    top_50_threshold: number;
}

export async function sendOTP(data: SendOTPRequest): Promise<SendOTPResponse> {
    const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: data.phone }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send OTP: ${response.statusText}`);
    }

    return response.json();
}

export async function verifyOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to verify OTP: ${response.statusText}`);
    }

    return response.json();
}

export async function getAreas(): Promise<GeoJSONResponse> {
    const response = await fetch('/api/areas', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get areas: ${response.statusText}`);
    }

    return response.json();
}

export async function getArea(city: string): Promise<CityProperties> {
    // TODO: Create /api/area/[city] route
    throw new Error('Not implemented yet - needs Next.js API route');
}

export async function sendSOS(data: SOSRequest): Promise<SOSResponse> {
    const response = await fetch('/api/sos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to send SOS: ${response.statusText}`);
    }

    return response.json();
}

export async function checkAlert(data: CheckAlertRequest): Promise<CheckAlertResponse> {
    const response = await fetch('/api/check-alert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to check alert: ${response.statusText}`);
    }

    const result = await response.json();
    return {
        should_alert: result.should_alert,
        city_data: result.city_data,
        top_50_threshold: result.top_50_threshold,
    };
}
