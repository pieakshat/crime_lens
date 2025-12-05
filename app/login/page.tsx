'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { sendOTP, verifyOTP } from '@/lib/api';
import { setUserData } from '@/lib/storage';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleSendOTP = async (e: FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) {
            showMessage('Please enter phone number', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await sendOTP({
                phone: phone.trim(),
            });

            if (response.success) {
                if (response.demo_mode || response.demo_otp) {
                    if (response.demo_otp) {
                        showMessage(
                            `OTP: ${response.demo_otp}${response.demo_mode ? ' (SMS sent via Twilio!)' : ' (Not sent via SMS - configure Twilio)'}`,
                            'success'
                        );
                    } else {
                        showMessage(response.message || 'OTP sent successfully!', 'success');
                    }
                } else {
                    showMessage('OTP sent successfully via SMS!', 'success');
                }
            } else {
                if (response.demo_otp) {
                    showMessage(
                        `OTP: ${response.demo_otp} (SMS failed - ${response.error || 'check Twilio configuration'})`,
                        'error'
                    );
                } else {
                    showMessage(response.error || 'Failed to send OTP', 'error');
                }
            }
        } catch (error) {
            showMessage('Connection error. Please try again.', 'error');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: FormEvent) => {
        e.preventDefault();
        if (!phone.trim() || !otp.trim()) {
            showMessage('Please enter phone number and OTP', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await verifyOTP({
                phone: phone.trim(),
                otp: otp.trim(),
                username: username.trim() || undefined,
                email: email.trim() || undefined,
                guardian_phone: guardianPhone.trim() || undefined,
            });

            if (response.success && response.user) {
                setUserData({
                    phone: response.user.phone,
                    username: response.user.username,
                    email: response.user.email,
                    guardian_phone: response.user.guardian_phone,
                });
                router.push('/dashboard');
            } else {
                showMessage(response.error || 'Invalid OTP', 'error');
            }
        } catch (error) {
            showMessage('Connection error. Please try again.', 'error');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-5">
            <div className="bg-black border-2 border-white p-10 rounded-lg max-w-md w-full">
                <h1 className="text-center mb-8 text-3xl tracking-wider">CRIME LENS</h1>
                <div className="text-center mb-10 text-gray-400 text-sm">
                    Emergency Detection & Alert Interface
                </div>

                <form onSubmit={handleSendOTP}>
                    <div className="mb-5">
                        <label htmlFor="username" className="block mb-2 text-sm font-medium">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="your_username"
                            className="w-full p-3 bg-black border border-white text-white text-base rounded focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                    </div>

                    <div className="mb-5">
                        <label htmlFor="phone" className="block mb-2 text-sm font-medium">
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            placeholder="+1234567890 or 1234567890"
                            className="w-full p-3 bg-black border border-white text-white text-base rounded focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                    </div>

                    <div className="mb-5">
                        <label htmlFor="email" className="block mb-2 text-sm font-medium">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full p-3 bg-black border border-white text-white text-base rounded focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                    </div>

                    <div className="mb-5">
                        <label htmlFor="guardianPhone" className="block mb-2 text-sm font-medium">
                            Guardian Phone
                        </label>
                        <input
                            type="tel"
                            id="guardianPhone"
                            value={guardianPhone}
                            onChange={(e) => setGuardianPhone(e.target.value)}
                            placeholder="+1234567890"
                            className="w-full p-3 bg-black border border-white text-white text-base rounded focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-4 bg-white text-black text-base font-bold rounded mt-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-gray-700">
                    <form onSubmit={handleVerifyOTP}>
                        <div className="mb-5">
                            <label htmlFor="otp" className="block mb-2 text-sm font-medium">
                                Enter OTP
                            </label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="6 digit OTP"
                                maxLength={6}
                                className="w-full p-3 bg-black border border-white text-white text-base rounded focus:outline-none focus:ring-2 focus:ring-white/20"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-4 bg-white text-black text-base font-bold rounded mt-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP & Login'}
                        </button>
                    </form>
                </div>

                {message && (
                    <div
                        className={`mt-4 p-3 rounded text-sm text-center ${message.type === 'success'
                            ? 'bg-gray-800 border border-white'
                            : 'bg-gray-800 border border-white'
                            }`}
                    >
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}
