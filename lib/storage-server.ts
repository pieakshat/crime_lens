/**
 * Server-side storage for OTP and user data
 * 
 * Uses MongoDB for persistent storage.
 */

import {
    storeOTP as dbStoreOTP,
    getOTP as dbGetOTP,
    deleteOTP as dbDeleteOTP,
    storeUser as dbStoreUser,
    getUser as dbGetUser,
    getAllUsers as dbGetAllUsers,
    cleanupExpiredOTPs,
    OtpDocument,
    UserDocument,
} from './db-models';

// Re-export types for backward compatibility
export interface OtpData {
    otp: string;
    expiresAt: Date;
}

export interface UserData {
    phone: string;
    username?: string;
    email?: string;
    guardian_phone?: string;
    verified: boolean;
}

// Clean up expired OTPs periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(async () => {
        try {
            const deletedCount = await cleanupExpiredOTPs();
            if (deletedCount > 0) {
                console.log(`[${new Date().toISOString()}] 🧹 Cleaned up ${deletedCount} expired OTP(s)`);
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ❌ Error cleaning up expired OTPs:`, error);
        }
    }, 5 * 60000); // Every 5 minutes
}

// OTP functions - MongoDB backed
export async function storeOTP(phone: string, otp: string, expiresInMinutes: number = 10): Promise<void> {
    await dbStoreOTP(phone, otp, expiresInMinutes);
}

export async function getOTP(phone: string): Promise<OtpData | null> {
    const otpDoc = await dbGetOTP(phone);
    if (!otpDoc) return null;

    return {
        otp: otpDoc.otp,
        expiresAt: otpDoc.expiresAt,
    };
}

export async function deleteOTP(phone: string): Promise<void> {
    await dbDeleteOTP(phone);
}

// User functions - MongoDB backed
export async function storeUser(data: UserData): Promise<void> {
    await dbStoreUser(data);
}

export async function getUser(phone: string): Promise<UserData | null> {
    const userDoc = await dbGetUser(phone);
    if (!userDoc) return null;

    return {
        phone: userDoc.phone,
        username: userDoc.username,
        email: userDoc.email,
        guardian_phone: userDoc.guardian_phone,
        verified: userDoc.verified,
    };
}

export async function getAllUsers(): Promise<Record<string, UserData>> {
    const users = await dbGetAllUsers();
    const result: Record<string, UserData> = {};

    users.forEach((userDoc) => {
        result[userDoc.phone] = {
            phone: userDoc.phone,
            username: userDoc.username,
            email: userDoc.email,
            guardian_phone: userDoc.guardian_phone,
            verified: userDoc.verified,
        };
    });

    return result;
}

