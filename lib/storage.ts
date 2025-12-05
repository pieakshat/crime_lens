'use client';

export interface UserData {
    phone: string;
    email?: string;
    guardian_phone?: string;
}

const STORAGE_KEYS = {
    USER_PHONE: 'userPhone',
    USER_EMAIL: 'userEmail',
    GUARDIAN_PHONE: 'guardianPhone',
} as const;

export function getUserData(): UserData | null {
    if (typeof window === 'undefined') return null;

    const phone = sessionStorage.getItem(STORAGE_KEYS.USER_PHONE);
    if (!phone) return null;

    return {
        phone,
        email: sessionStorage.getItem(STORAGE_KEYS.USER_EMAIL) || undefined,
        guardian_phone: sessionStorage.getItem(STORAGE_KEYS.GUARDIAN_PHONE) || undefined,
    };
}

export function setUserData(data: UserData): void {
    if (typeof window === 'undefined') return;

    sessionStorage.setItem(STORAGE_KEYS.USER_PHONE, data.phone);
    if (data.email) {
        sessionStorage.setItem(STORAGE_KEYS.USER_EMAIL, data.email);
    }
    if (data.guardian_phone) {
        sessionStorage.setItem(STORAGE_KEYS.GUARDIAN_PHONE, data.guardian_phone);
    }
}

export function clearUserData(): void {
    if (typeof window === 'undefined') return;

    sessionStorage.removeItem(STORAGE_KEYS.USER_PHONE);
    sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    sessionStorage.removeItem(STORAGE_KEYS.GUARDIAN_PHONE);
}

export function isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem(STORAGE_KEYS.USER_PHONE);
}

