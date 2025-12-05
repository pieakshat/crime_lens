import { getDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export interface OtpDocument {
    _id?: ObjectId;
    phone: string;
    otp: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface UserDocument {
    _id?: ObjectId;
    phone: string;
    username?: string;
    email?: string;
    guardian_phone?: string;
    verified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const OTP_COLLECTION = 'otps';
export const USERS_COLLECTION = 'users';

// OTP operations
export async function storeOTP(phone: string, otp: string, expiresInMinutes: number = 10): Promise<void> {
    try {
        const db = await getDatabase();
        const collection = db.collection<OtpDocument>(OTP_COLLECTION);

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

        // Upsert: replace existing OTP for this phone
        await collection.updateOne(
            { phone },
            {
                $set: {
                    phone,
                    otp,
                    expiresAt,
                    createdAt: new Date(),
                },
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error storing OTP:', error);
        throw error;
    }
}

export async function getOTP(phone: string): Promise<OtpDocument | null> {
    try {
        const db = await getDatabase();
        const collection = db.collection<OtpDocument>(OTP_COLLECTION);

        const otpDoc = await collection.findOne({ phone });

        // Check if expired
        if (otpDoc && new Date() > otpDoc.expiresAt) {
            // Auto-delete expired OTP
            await collection.deleteOne({ phone });
            return null;
        }

        return otpDoc;
    } catch (error) {
        console.error('Error getting OTP:', error);
        throw error;
    }
}

export async function deleteOTP(phone: string): Promise<void> {
    try {
        const db = await getDatabase();
        const collection = db.collection<OtpDocument>(OTP_COLLECTION);
        await collection.deleteOne({ phone });
    } catch (error) {
        console.error('Error deleting OTP:', error);
        throw error;
    }
}

// Clean up expired OTPs (can be called periodically)
export async function cleanupExpiredOTPs(): Promise<number> {
    try {
        const db = await getDatabase();
        const collection = db.collection<OtpDocument>(OTP_COLLECTION);

        const result = await collection.deleteMany({
            expiresAt: { $lt: new Date() },
        });

        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up expired OTPs:', error);
        return 0; // Return 0 on error to avoid breaking the cleanup process
    }
}

// User operations
export async function storeUser(data: {
    phone: string;
    username?: string;
    email?: string;
    guardian_phone?: string;
    verified: boolean;
}): Promise<UserDocument> {
    try {
        const db = await getDatabase();
        const collection = db.collection<UserDocument>(USERS_COLLECTION);

        const now = new Date();

        // Upsert: update if exists, create if not
        // Exclude createdAt from $set to avoid conflict with $setOnInsert
        await collection.updateOne(
            { phone: data.phone },
            {
                $set: {
                    phone: data.phone,
                    username: data.username,
                    email: data.email,
                    guardian_phone: data.guardian_phone,
                    verified: data.verified,
                    updatedAt: now,
                },
                $setOnInsert: {
                    createdAt: now,
                },
            },
            { upsert: true }
        );

        // Return the user document (fetch it to get the actual createdAt if it was just created)
        const userDoc = await getUser(data.phone);
        if (!userDoc) {
            // Fallback if getUser fails (shouldn't happen after upsert)
            return {
                phone: data.phone,
                username: data.username,
                email: data.email,
                guardian_phone: data.guardian_phone,
                verified: data.verified,
                createdAt: now,
                updatedAt: now,
            };
        }

        return userDoc;
    } catch (error) {
        console.error('Error storing user:', error);
        throw error;
    }
}

export async function getUser(phone: string): Promise<UserDocument | null> {
    try {
        const db = await getDatabase();
        const collection = db.collection<UserDocument>(USERS_COLLECTION);
        return collection.findOne({ phone });
    } catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
}

export async function updateUser(phone: string, updates: Partial<Omit<UserDocument, '_id' | 'phone' | 'createdAt'>>): Promise<UserDocument | null> {
    try {
        const db = await getDatabase();
        const collection = db.collection<UserDocument>(USERS_COLLECTION);

        await collection.updateOne(
            { phone },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date(),
                },
            }
        );

        return getUser(phone);
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

export async function getAllUsers(): Promise<UserDocument[]> {
    try {
        const db = await getDatabase();
        const collection = db.collection<UserDocument>(USERS_COLLECTION);
        return collection.find({}).toArray();
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
}

