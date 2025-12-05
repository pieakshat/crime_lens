import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getOTP, deleteOTP, storeUser } from '@/lib/storage-server';

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    try {
        const body = await request.json();
        const { phone, otp, email, guardian_phone } = body;

        console.log(`[${new Date().toISOString()}] 🔍 POST /api/auth/verify-otp - Phone: ${phone ? phone.replace(/(.{3})(.*)(.{4})/, '$1***$3') : 'N/A'}, OTP: ${otp ? '****' : 'N/A'}`);

        if (!phone || !otp) {
            console.log(`[${new Date().toISOString()}] ❌ Error: Phone number and OTP required`);
            return NextResponse.json(
                { success: false, error: 'Phone number and OTP required' },
                { status: 400 }
            );
        }

        // Demo mode: Auto-verify common demo OTPs
        const DEMO_MODE = process.env.DEMO_MODE !== 'false';
        if (DEMO_MODE && (otp === 'demo' || otp === '123456')) {
            console.log(`[${new Date().toISOString()}] 🎭 Demo mode OTP verified for ${phone.replace(/(.{3})(.*)(.{4})/, '$1***$3')}`);
            const userData = {
                phone,
                email: email || undefined,
                guardian_phone: guardian_phone || undefined,
                verified: true,
            };
            storeUser(userData);
            console.log(`[${new Date().toISOString()}] ✅ User verified (Demo Mode) (${Date.now() - startTime}ms)`);
            return NextResponse.json({
                success: true,
                message: 'OTP verified (Demo Mode)',
                user: userData,
            });
        }

        // Get Twilio credentials
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        // Check if Twilio Verify is configured
        const twilioConfigured = accountSid && authToken && verifyServiceSid;

        if (twilioConfigured) {
            try {
                const client = twilio(accountSid, authToken);
                const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

                // Verify OTP using Twilio Verify API
                console.log(`[${new Date().toISOString()}] 🔐 Verifying OTP via Twilio Verify for ${formattedPhone}`);
                const verificationCheck = await client.verify.v2
                    .services(verifyServiceSid)
                    .verificationChecks.create({
                        to: formattedPhone,
                        code: otp,
                    });

                if (verificationCheck.status === 'approved') {
                    console.log(`[${new Date().toISOString()}] ✅ OTP verified successfully via Twilio Verify (${Date.now() - startTime}ms)`);

                    const userData = {
                        phone,
                        email: email || undefined,
                        guardian_phone: guardian_phone || undefined,
                        verified: true,
                    };
                    storeUser(userData);

                    return NextResponse.json({
                        success: true,
                        message: 'OTP verified successfully',
                        user: userData,
                    });
                } else {
                    console.log(`[${new Date().toISOString()}] ❌ OTP verification failed - Status: ${verificationCheck.status}`);
                    return NextResponse.json(
                        { success: false, error: 'Invalid or expired OTP' },
                        { status: 400 }
                    );
                }
            } catch (twilioError: any) {
                console.error(`[${new Date().toISOString()}] ❌ Twilio Verify error:`, twilioError.message || twilioError);

                // Fallback to local OTP storage if Twilio fails
                const storedOtpData = getOTP(phone);
                if (storedOtpData && storedOtpData.otp === otp) {
                    if (new Date() > storedOtpData.expiresAt) {
                        deleteOTP(phone);
                        return NextResponse.json(
                            { success: false, error: 'OTP expired' },
                            { status: 400 }
                        );
                    }

                    deleteOTP(phone);
                    const userData = {
                        phone,
                        email: email || undefined,
                        guardian_phone: guardian_phone || undefined,
                        verified: true,
                    };
                    storeUser(userData);

                    console.log(`[${new Date().toISOString()}] ✅ OTP verified via fallback storage (${Date.now() - startTime}ms)`);
                    return NextResponse.json({
                        success: true,
                        message: 'OTP verified successfully',
                        user: userData,
                    });
                }

                return NextResponse.json(
                    { success: false, error: twilioError.message || 'Invalid OTP' },
                    { status: 400 }
                );
            }
        } else {
            // Twilio not configured - use local storage
            const storedOtpData = getOTP(phone);
            if (!storedOtpData) {
                console.log(`[${new Date().toISOString()}] ❌ OTP not found or expired for ${phone.replace(/(.{3})(.*)(.{4})/, '$1***$3')}`);
                return NextResponse.json(
                    { success: false, error: 'OTP not found or expired' },
                    { status: 400 }
                );
            }

            // Check if OTP expired
            if (new Date() > storedOtpData.expiresAt) {
                console.log(`[${new Date().toISOString()}] ⏰ OTP expired for ${phone.replace(/(.{3})(.*)(.{4})/, '$1***$3')}`);
                deleteOTP(phone);
                return NextResponse.json(
                    { success: false, error: 'OTP expired' },
                    { status: 400 }
                );
            }

            // Verify OTP
            if (storedOtpData.otp !== otp) {
                console.log(`[${new Date().toISOString()}] ❌ Invalid OTP for ${phone.replace(/(.{3})(.*)(.{4})/, '$1***$3')}`);
                return NextResponse.json(
                    { success: false, error: 'Invalid OTP' },
                    { status: 400 }
                );
            }

            // OTP verified - remove it and create user session
            deleteOTP(phone);

            const userData = {
                phone,
                email: email || undefined,
                guardian_phone: guardian_phone || undefined,
                verified: true,
            };
            storeUser(userData);

            console.log(`[${new Date().toISOString()}] ✅ OTP verified successfully for ${phone.replace(/(.{3})(.*)(.{4})/, '$1***$3')} (${Date.now() - startTime}ms)`);

            return NextResponse.json({
                success: true,
                message: 'OTP verified successfully',
                user: userData,
            });
        }
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] ❌ Error in verify-otp:`, error.message || error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
