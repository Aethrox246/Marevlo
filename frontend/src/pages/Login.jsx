import React, { useState } from 'react';
import { Layers, ArrowRight, Github, Code2, Cpu, Globe, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Login({ onLogin, onSignup }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState('email'); // email | verify
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [forgotMsg, setForgotMsg] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch(`${API}/auth/login`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Incorrect email or password');
            }

            const data = await response.json();
            const token = data.access_token;
            const refreshToken = data.refresh_token;
            localStorage.setItem('access_token', token);
            if (refreshToken) {
                localStorage.setItem('refresh_token', refreshToken);
            }

            // Fetch user details
            const userResponse = await fetch(`${API}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                onLogin(userData);
            } else {
                onLogin();
            }

        } catch (err) {
            setError(err.message);
        }
    };

    const handleMockSocialLogin = (provider) => {
        const mockUser = {
            id: Date.now(),
            email: `user_${provider.toLowerCase()}@example.com`,
            name: `User`,
            username: `user_${provider.toLowerCase()}`,
        };
        onLogin(mockUser);
    };

    const resetForgotState = () => {
        setForgotStep('email');
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
        setForgotMsg('');
        setForgotError('');
        setForgotLoading(false);
    };

    const handleSendOtp = async () => {
        setForgotError('');
        setForgotMsg('');
        if (!forgotEmail) {
            setForgotError('Please enter your email.');
            return;
        }
        setForgotLoading(true);
        try {
            const response = await fetch(`${API}/auth/password/forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to send OTP');
            }
            setForgotMsg('If the email exists, an OTP has been sent.');
            setForgotStep('verify');
        } catch (err) {
            setForgotError(err.message);
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setForgotError('');
        setForgotMsg('');
        if (!otp || !newPassword || !confirmNewPassword) {
            setForgotError('Please fill all fields.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setForgotError('Passwords do not match.');
            return;
        }
        setForgotLoading(true);
        try {
            const response = await fetch(`${API}/auth/password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotEmail,
                    otp,
                    new_password: newPassword,
                }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to reset password');
            }
            setForgotMsg('Password reset successful. Please log in.');
            setForgotOpen(false);
            setEmail(forgotEmail);
            setPassword('');
            resetForgotState();
        } catch (err) {
            setForgotError(err.message);
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex bg-app-bg text-primary-text">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 border-r border-neutral-200 bg-surface z-10 w-full lg:w-1/2 max-w-[600px]">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black text-white shadow-lg mb-6">
                            <Layers size={24} />
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight text-primary-text mb-2">Welcome back</h2>
                        <p className="text-muted-text text-lg">
                            Sign in to continue your coding streak.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form action="#" className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-xl border-0 bg-white py-3 px-4 text-primary-text shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                                    Password
                                </label>
                                <div className="text-sm">
                                    <button
                                        type="button"
                                        onClick={() => { resetForgotState(); setForgotEmail(email); setForgotOpen(true); }}
                                        className="font-semibold text-neutral-600 hover:text-black"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-xl border-0 bg-white py-3 px-4 text-primary-text shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-xl bg-black px-3 py-3.5 text-sm font-semibold leading-6 text-white shadow-lg hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Sign in <ArrowRight size={16} className="ml-2 mt-0.5" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-neutral-200" />
                            </div>
                            <div className="relative flex justify-center text-sm font-medium leading-6">
                                <span className="bg-white px-6 text-neutral-500 rounded-full">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleMockSocialLogin('GitHub')}
                                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-3 py-2.5 text-primary-text hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black border border-neutral-200 transition-all hover:border-neutral-300 shadow-sm"
                            >
                                <Github size={20} />
                                <span className="text-sm font-semibold">GitHub</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleMockSocialLogin('Google')}
                                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-3 py-2.5 text-primary-text hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black border border-neutral-200 transition-all hover:border-neutral-300 shadow-sm"
                            >
                                <Globe size={20} />
                                <span className="text-sm font-semibold">Google</span>
                            </button>
                        </div>
                    </div>

                    <p className="mt-10 text-center text-sm text-muted-text">
                        Not a member?{' '}
                        <button onClick={onSignup} className="font-semibold leading-6 text-black hover:text-neutral-700">
                            Sign Up now
                        </button>
                    </p>
                </div>
            </div>

            {/* Right Side - Visuals */}
            <div className="relative hidden w-0 flex-1 lg:block overflow-hidden bg-neutral-50">
                {/* Background Gradients */}
                <div className="absolute inset-0 h-full w-full bg-neutral-50">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-neutral-200 rounded-full blur-[100px] animate-pulse opacity-60"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-neutral-300 rounded-full blur-[100px] animate-pulse animation-delay-2000 opacity-60"></div>
                </div>

                {/* Abstract Code Grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute inset-0 flex items-center justify-center p-20">
                    <div className="relative w-full max-w-lg">
                        {/* Code Editor Window */}
                        <div className="rounded-xl overflow-hidden bg-white border border-neutral-200 shadow-2xl skew-y-[-2deg] hover:skew-y-0 transition-transform duration-700">
                            {/* Window Header */}
                            <div className="bg-neutral-50 px-4 py-3 flex items-center gap-2 border-b border-neutral-100">
                                <div className="ml-4 text-xs font-mono text-neutral-400">solution.py</div>
                            </div>
                            {/* Editor Content */}
                            <div className="p-6 font-mono text-sm leading-relaxed text-neutral-800">
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">1</span><span><span className="text-violet-600 font-bold">def</span> <span className="text-blue-600">binary_search</span>(arr, target):</span></div>
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">2</span><span className="pl-4">left, right = <span className="text-emerald-600">0</span>, <span className="text-violet-600">len</span>(arr) - <span className="text-emerald-600">1</span></span></div>
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">3</span><span></span></div>
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">4</span><span className="pl-4"><span className="text-violet-600 font-bold">while</span> left &lt;= right:</span></div>
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">5</span><span className="pl-8">mid = (left + right) // <span className="text-emerald-600">2</span></span></div>
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">6</span><span className="pl-8"><span className="text-violet-600 font-bold">if</span> arr[mid] == target:</span></div>
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">7</span><span className="pl-12"><span className="text-violet-600 font-bold">return</span> mid</span></div>
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">8</span><span className="pl-8"><span className="text-violet-600 font-bold">elif</span> arr[mid] &lt; target:</span></div>
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">9</span><span className="pl-12">left = mid + <span className="text-emerald-600">1</span></span></div>
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">10</span><span className="pl-8"><span className="text-violet-600 font-bold">else:</span></span></div>
                                <div className="flex"><span className="text-neutral-400 select-none mr-4">11</span><span className="pl-12">right = mid - <span className="text-emerald-600">1</span></span></div>
                            </div>
                        </div>

                        {/* Floating Success Toast */}
                        <div className="absolute -bottom-6 -right-6 bg-white border border-neutral-200 p-4 rounded-xl shadow-xl flex items-center gap-4 animate-float">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Code2 size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-primary-text">Tests Passed</div>
                                <div className="text-xs text-neutral-500">Runtime: <span className="font-bold text-emerald-600">42ms</span> (Top 5%)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {forgotOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    <div className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 shadow-2xl">
                        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-primary-text">Reset Password</h3>
                            <button
                                type="button"
                                onClick={() => { setForgotOpen(false); resetForgotState(); }}
                                className="p-2 rounded-lg hover:bg-neutral-100"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {forgotMsg && (
                                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                                    {forgotMsg}
                                </div>
                            )}
                            {forgotError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                    {forgotError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Email address</label>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    className="mt-2 block w-full rounded-xl border-0 bg-white py-3 px-4 text-primary-text shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>

                            {forgotStep === 'verify' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700">OTP</label>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="mt-2 block w-full rounded-xl border-0 bg-white py-3 px-4 text-primary-text shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                            placeholder="6-digit code"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="mt-2 block w-full rounded-xl border-0 bg-white py-3 px-4 text-primary-text shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            className="mt-2 block w-full rounded-xl border-0 bg-white py-3 px-4 text-primary-text shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-5 border-t border-neutral-200 flex gap-3 justify-end">
                            {forgotStep === 'email' ? (
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={forgotLoading}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-black hover:bg-neutral-800 transition-all disabled:opacity-60"
                                >
                                    {forgotLoading ? 'Sending...' : 'Send OTP'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResetPassword}
                                    disabled={forgotLoading}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-black hover:bg-neutral-800 transition-all disabled:opacity-60"
                                >
                                    {forgotLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
