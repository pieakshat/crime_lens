/**
 * Server-side storage for OTP and user data
 * 
 * NOTE: This uses in-memory storage which is fine for development.
 * For production, replace with Redis or a database.
 */

interface OtpData {
    otp: string;
    expiresAt: Date;
}

interface UserData {
    phone: string;
    email?: string;
    guardian_phone?: string;
    verified: boolean;
}

// Shared in-memory storage
const otpStorage: Record<string, OtpData> = {};
const users: Record<string, UserData> = {};

// Clean up expired OTPs periodically
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = new Date();
        Object.keys(otpStorage).forEach((phone) => {
            if (otpStorage[phone].expiresAt < now) {
                delete otpStorage[phone];
            }
        });
    }, 60000); // Clean up every minute
}

export function storeOTP(phone: string, otp: string, expiresInMinutes: number = 10): void {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    otpStorage[phone] = { otp, expiresAt };
}

export function getOTP(phone: string): OtpData | null {
    return otpStorage[phone] || null;
}

export function deleteOTP(phone: string): void {
    delete otpStorage[phone];
}

export function storeUser(data: UserData): void {
    users[data.phone] = data;
}

export function getUser(phone: string): UserData | null {
    return users[phone] || null;
}

export function getAllUsers(): Record<string, UserData> {
    return users;
}

