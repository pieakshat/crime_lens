import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { storeOTP } from '@/lib/storage-server';

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    try {
        const body = await request.json();
        const phone = body.phone || body.numbers || '';

        console.log(`[${new Date().toISOString()}] 📱 POST /api/auth/send-otp - Phone: ${phone ? phone.replace(/(.{3})(.*)(.{4})/, '$1***$3') : 'N/A'}`);

        if (!phone) {
            console.log(`[${new Date().toISOString()}] ❌ Error: Phone number required`);
            return NextResponse.json(
                { success: false, error: 'Phone number required' },
                { status: 400 }
            );
        }

        // Get Twilio credentials from environment variables
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        // Check if Twilio Verify is configured
        const twilioConfigured = accountSid && authToken && verifyServiceSid;
        console.log(`[${new Date().toISOString()}] 🔧 Twilio Verify configured: ${twilioConfigured}`);

        if (twilioConfigured) {
            try {
                const client = twilio(accountSid, authToken);

                // Format phone number (ensure it starts with +)
                const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

                // Send OTP via Twilio Verify API
                console.log(`[${new Date().toISOString()}] 📤 Sending OTP via Twilio Verify to ${formattedPhone}`);
                const verification = await client.verify.v2
                    .services(verifyServiceSid)
                    .verifications.create({
                        to: formattedPhone,
                        channel: 'sms',
                    });

                console.log(`[${new Date().toISOString()}] ✅ OTP sent successfully via Twilio Verify - SID: ${verification.sid} (${Date.now() - startTime}ms)`);

                return NextResponse.json({
                    success: true,
                    message: 'OTP sent successfully via SMS',
                    verificationSid: verification.sid,
                    status: verification.status,
                });
            } catch (twilioError: any) {
                console.error(`[${new Date().toISOString()}] ❌ Twilio Verify error:`, twilioError.message || twilioError);

                // Fallback to demo mode if Twilio fails
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                await storeOTP(phone, otp, 10);

                return NextResponse.json(
                    {
                        success: false,
                        error: `Failed to send SMS: ${twilioError.message || 'Unknown error'}`,
                        demo_otp: otp,
                        message: `OTP generated: ${otp} (SMS sending failed - check Twilio configuration)`,
                    },
                    { status: 500 }
                );
            }
        } else {
            // Twilio not configured - demo mode
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(`[${new Date().toISOString()}] 🔐 Generated OTP for ${phone.replace(/(.{3})(.*)(.{4})/, '$1***$3')}`);

            // Store OTP with 10-minute expiration for demo mode
            await storeOTP(phone, otp, 10);

            console.log(`[${new Date().toISOString()}] 🎭 Demo mode - OTP generated but not sent (${Date.now() - startTime}ms)`);
            return NextResponse.json({
                success: true,
                message: `Demo Mode: OTP is ${otp} (SMS not sent - Twilio not configured)`,
                demo_otp: otp,
                demo_mode: true,
                note: 'To send real SMS, configure Twilio environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID',
            });
        }
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] ❌ Error in send-otp:`, error.message || error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
