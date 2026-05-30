import React, { useState } from 'react';
import { ArrowRight, User, Mail, Lock, X, Github, Globe } from 'lucide-react';
import { getFirebaseAuth } from '../lib/firebase';
import AuthVisual from '../components/AuthVisual';

const API = import.meta.env.VITE_API_URL;

export default function Signup({ onLogin, onSignupSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordError, setPasswordError] = useState('');

    const calculateStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'password') {
            setPasswordStrength(calculateStrength(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');

        if (passwordStrength < 3) {
            setPasswordError('Please choose a stronger password.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }

        try {
            const response = await fetch(`${API}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    username: formData.name || (formData.email ? formData.email.split('@')[0] : ''),
                    password: formData.password,
                    heard_from: localStorage.getItem('heardFrom')
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Registration failed');
            }

            const userData = await response.json();
            onSignupSuccess(userData);

        } catch (error) {
            setPasswordError(error.message);
        }
    };

    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleSignup = async () => {
        setPasswordError('');
        setGoogleLoading(true);
        try {
            const { auth, googleProvider, signInWithPopup } = await getFirebaseAuth();
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            const response = await fetch(`${API}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: idToken, heard_from: localStorage.getItem('heardFrom'),}),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Google signup failed');
            }

            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);

            const userResponse = await fetch(`${API}/auth/me`, {
                headers: { Authorization: `Bearer ${data.access_token}` },
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                onSignupSuccess(userData);
            } else {
                onSignupSuccess();
            }

            const { auth: a } = await getFirebaseAuth();
            await a.signOut();
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setPasswordError(err.message);
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGitHubSignup = () => {
        setPasswordError('GitHub signup is not configured yet. Please use email or Google.');
    };

    const strengthColor = () => {
        if (passwordStrength < 2) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
        if (passwordStrength === 2) return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
        if (passwordStrength === 3) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
        return 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]';
    };

    const strengthText = () => {
        if (passwordStrength < 2) return 'Weak';
        if (passwordStrength === 2) return 'Fair';
        if (passwordStrength === 3) return 'Good';
        return 'Strong';
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex bg-[#050505] text-white selection:bg-violet-500/30">
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 relative z-10 w-full lg:w-1/2 max-w-[600px]">
                
                {/* Background ambient glow setup */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="mx-auto w-full max-w-sm lg:w-96 relative">
                    <div className="mb-8">
                        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">Create an account</h2>
                        <p className="text-white/50 text-base">
                            Join the community of top-tier developers.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-white/70">Full Name</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={18} className="text-white/30" />
                                </div>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white shadow-sm placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70">Email address</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-white/30" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white shadow-sm placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="you@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70">Password</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-white/30" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white shadow-sm placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-1 mb-2">
                                        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${passwordStrength >= 1 ? strengthColor() : 'bg-white/10'}`}></div>
                                        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${passwordStrength >= 2 ? strengthColor() : 'bg-white/10'}`}></div>
                                        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${passwordStrength >= 3 ? strengthColor() : 'bg-white/10'}`}></div>
                                        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${passwordStrength >= 4 ? strengthColor() : 'bg-white/10'}`}></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className={`${passwordStrength < 3 ? 'text-white/40' : 'text-emerald-400'}`}>
                                            Strength: {strengthText()}
                                        </span>
                                        <span className="text-white/30 font-mono text-[10px]">Min 8 chars, 1 num & sym</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/70">Confirm Password</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-white/30" />
                                </div>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white shadow-sm placeholder:text-white/30 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {passwordError && (
                            <div className="rounded-xl bg-red-900/20 p-3 text-red-400 text-sm flex items-center gap-2 border border-red-500/30">
                                <X size={16} /> {passwordError}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center items-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-3.5 text-sm font-bold leading-6 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Create Account <ArrowRight size={16} className="ml-2 mt-0.5" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-sm font-medium leading-6">
                                <span className="bg-[#050505] px-6 text-white/40 rounded-full">Or sign up with</span>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={handleGitHubSignup}
                                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-white hover:bg-white/10 border border-white/10 transition-all shadow-sm"
                            >
                                <Github size={20} />
                                <span className="text-sm font-semibold">GitHub</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleGoogleSignup}
                                disabled={googleLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-white hover:bg-white/10 border border-white/10 transition-all shadow-sm disabled:opacity-50"
                            >
                                <Globe size={20} className="text-blue-400" />
                                <span className="text-sm font-semibold">{googleLoading ? 'Signing up...' : 'Google'}</span>
                            </button>
                        </div>
                    </div>

                    <p className="mt-10 text-center text-sm text-white/50">
                        Already have an account?{' '}
                        <button onClick={onLogin} className="font-bold leading-6 text-violet-400 hover:text-violet-300">
                            Sign in
                        </button>
                    </p>
                </div>
            </div>

            {/* Right Side - Visuals */}
            <AuthVisual />
        </div>
    );
}
