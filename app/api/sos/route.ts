import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getUser } from '@/lib/db-models';
import { CityProperties } from '@/lib/api';

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    try {
        const body = await request.json();
        const { user_phone, city } = body;

        console.log(`[${new Date().toISOString()}] POST /api/sos - User: ${user_phone ? user_phone.replace(/(.{3})(.*)(.{4})/, '$1***$3') : 'N/A'}, City: ${city}`);

        if (!user_phone || !city) {
            console.log(`[${new Date().toISOString()}] Error: User phone and city required`);
            return NextResponse.json(
                { success: false, error: 'User phone and city required' },
                { status: 400 }
            );
        }

        // Get user from database
        const user = await getUser(user_phone);
        if (!user) {
            console.log(`[${new Date().toISOString()}] Error: User not found`);
            return NextResponse.json(
                { success: false, error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get city data from areas API
        const areasResponse = await fetch(`${request.nextUrl.origin}/api/areas`);
        if (!areasResponse.ok) {
            throw new Error('Failed to fetch city data');
        }
        const areasData = await areasResponse.json();

        const cityFeature = areasData.features?.find(
            (f: any) => f.properties.city.toLowerCase() === city.toLowerCase()
        );

        if (!cityFeature) {
            console.log(`[${new Date().toISOString()}] Error: City data not found`);
            return NextResponse.json(
                { success: false, error: 'City data not found' },
                { status: 404 }
            );
        }

        const cityData: CityProperties = cityFeature.properties;
        const severity = cityData.avg_severity || 0;
        const topCrimes = cityData.top_crimes || [];
        const crimesText = topCrimes.slice(0, 3).map((c) => c.crime).join(', ') || 'Various';

        // Generate map link
        const lat = cityData.latitude || 0;
        const lon = cityData.longitude || 0;
        const mapLink = `https://www.google.com/maps?q=${lat},${lon}`;

        // User alert message
        const userMessage = `⚠ SAFETY ALERT
You've entered: ${city}
Severity: ${severity}
Common crimes: ${crimesText}
Location: ${mapLink}`;

        // Guardian alert message
        const guardianMessage = `GUARDIAN ALERT
Your contact ${user_phone} is in ${city} (Severity ${severity}).
Crimes: ${crimesText}
Location: ${mapLink}`;

        // Get Twilio credentials
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;


        const twilioConfigured = accountSid && authToken && twilioPhoneNumber;
        const DEMO_MODE = process.env.DEMO_MODE !== 'false';

        if (twilioConfigured && !DEMO_MODE) {
            try {
                const client = twilio(accountSid, authToken);
                let userSmsSent = false;
                let guardianSmsSent = false;
                const errors: string[] = [];

                // Format phone numbers (ensure they start with +)
                const formatPhone = (phone: string) => {
                    return phone.startsWith('+') ? phone : `+${phone}`;
                };

                // Send SMS to user
                try {
                    const formattedUserPhone = formatPhone(user_phone);
                    console.log(`[${new Date().toISOString()}] 📤 Sending SOS SMS to user: ${formattedUserPhone.replace(/(.{3})(.*)(.{4})/, '$1***$3')}`);

                    const userMessageResult = await client.messages.create({
                        body: userMessage,
                        from: twilioPhoneNumber,
                        to: formattedUserPhone,
                    });

                    userSmsSent = true;
                    console.log(`[${new Date().toISOString()}] User SOS SMS sent - SID: ${userMessageResult.sid}`);
                } catch (userError: any) {
                    errors.push(`User SMS failed: ${userError.message}`);
                    console.error(`[${new Date().toISOString()}] User SMS error:`, userError.message);
                }

                // Send SMS to guardian if provided
                if (user.guardian_phone) {
                    try {
                        const formattedGuardianPhone = formatPhone(user.guardian_phone);
                        console.log(`[${new Date().toISOString()}] 📤 Sending SOS SMS to guardian: ${formattedGuardianPhone.replace(/(.{3})(.*)(.{4})/, '$1***$3')}`);

                        const guardianMessageResult = await client.messages.create({
                            body: guardianMessage,
                            from: twilioPhoneNumber,
                            to: formattedGuardianPhone,
                        });

                        guardianSmsSent = true;
                        console.log(`[${new Date().toISOString()}] Guardian SOS SMS sent - SID: ${guardianMessageResult.sid}`);
                    } catch (guardianError: any) {
                        errors.push(`Guardian SMS failed: ${guardianError.message}`);
                        console.error(`[${new Date().toISOString()}] Guardian SMS error:`, guardianError.message);
                    }
                }

                if (userSmsSent || guardianSmsSent) {
                    return NextResponse.json({
                        success: true,
                        message: 'SOS alerts sent successfully',
                        user_sms_sent: userSmsSent,
                        guardian_sms_sent: guardianSmsSent,
                        errors: errors.length > 0 ? errors : undefined,
                    });
                } else {
                    return NextResponse.json(
                        {
                            success: false,
                            error: errors.join('; ') || 'Failed to send SMS',
                            demo: {
                                user_message: userMessage,
                                guardian_message: user.guardian_phone ? guardianMessage : 'No guardian phone set',
                            },
                        },
                        { status: 500 }
                    );
                }
            } catch (error: any) {
                console.error(`[${new Date().toISOString()}] ❌ Twilio error:`, error.message || error);
                return NextResponse.json(
                    {
                        success: false,
                        error: error.message || 'Failed to send SMS',
                        demo: {
                            user_message: userMessage,
                            guardian_message: user.guardian_phone ? guardianMessage : 'No guardian phone set',
                        },
                    },
                    { status: 500 }
                );
            }
        } else {
            // Demo mode or Twilio not configured
            console.log(`[${new Date().toISOString()}] 🎭 Demo mode - SOS alert prepared but not sent (${Date.now() - startTime}ms)`);
            return NextResponse.json({
                success: true,
                message: DEMO_MODE
                    ? 'SOS alert prepared (Demo Mode - SMS not sent)'
                    : 'SOS alert prepared (Twilio not configured)',
                demo: {
                    user_message: userMessage,
                    guardian_message: user.guardian_phone ? guardianMessage : 'No guardian phone set',
                },
                user_sms_sent: false,
                guardian_sms_sent: false,
                note: DEMO_MODE
                    ? 'To send real SMS, set DEMO_MODE=false and configure Twilio'
                    : 'To send real SMS, configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER',
            });
        }
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] ❌ Error in SOS:`, error.message || error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

