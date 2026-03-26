import React, { useState } from 'react';
import { Layers, ArrowRight, User, Mail, Lock, X, Github, Globe } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

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
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            
            const response = await fetch(`${API}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: idToken }),
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
            
            await auth.signOut();
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setPasswordError(err.message);
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const getInitials = (name) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'U';
    };

    const strengthColor = () => {
        if (passwordStrength < 2) return 'bg-neutral-300';
        if (passwordStrength === 2) return 'bg-neutral-400';
        if (passwordStrength === 3) return 'bg-neutral-600';
        return 'bg-black';
    };

    const strengthText = () => {
        if (passwordStrength < 2) return 'Weak';
        if (passwordStrength === 2) return 'Fair';
        if (passwordStrength === 3) return 'Good';
        return 'Strong';
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex bg-app-bg text-primary-text">
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 border-r border-neutral-200 bg-surface z-10 w-full lg:w-1/2 max-w-[600px]">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black text-white shadow-lg mb-6">
                            <Layers size={24} />
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight text-primary-text mb-2">Create an account</h2>
                        <p className="text-muted-text text-lg">
                            Join the community of top-tier developers.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700">Full Name</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-neutral-400" />
                                </div>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 text-primary-text shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700">Email address</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-neutral-400" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 text-primary-text shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                    placeholder="you@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700">Password</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-neutral-400" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 text-primary-text shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                                    <div className="flex items-center gap-1 mb-2">
                                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 1 ? strengthColor() : 'bg-neutral-200'}`}></div>
                                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 2 ? strengthColor() : 'bg-neutral-200'}`}></div>
                                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 3 ? strengthColor() : 'bg-neutral-200'}`}></div>
                                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passwordStrength >= 4 ? strengthColor() : 'bg-neutral-200'}`}></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className={`${passwordStrength < 3 ? 'text-neutral-500' : 'text-black'}`}>
                                            Strength: {strengthText()}
                                        </span>
                                        <span className="text-neutral-500">Min 8 chars, numbers & symbols</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700">Confirm Password</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-neutral-400" />
                                </div>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 text-primary-text shadow-sm ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {passwordError && (
                            <div className="rounded-lg bg-red-900/20 p-3 text-red-300 text-sm flex items-center gap-2 border border-red-500/20">
                                <X size={14} /> {passwordError}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-xl bg-black px-3 py-3.5 text-sm font-semibold leading-6 text-white shadow-lg hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Create Account <ArrowRight size={16} className="ml-2 mt-0.5" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-neutral-200" />
                            </div>
                            <div className="relative flex justify-center text-sm font-medium leading-6">
                                <span className="bg-white px-6 text-neutral-500 rounded-full">Or sign up with</span>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleMockSocialSignup('GitHub')}
                                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-3 py-2.5 text-primary-text hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black border border-neutral-200 transition-all hover:border-neutral-300 shadow-sm"
                            >
                                <Github size={20} />
                                <span className="text-sm font-semibold">GitHub</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleGoogleSignup}
                                disabled={googleLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-3 py-2.5 text-primary-text hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black border border-neutral-200 transition-all hover:border-neutral-300 shadow-sm disabled:opacity-60"
                            >
                                <Globe size={20} />
                                <span className="text-sm font-semibold">{googleLoading ? 'Signing up...' : 'Google'}</span>
                            </button>
                        </div>
                    </div>

                    <p className="mt-10 text-center text-sm text-neutral-500">
                        Already have an account?{' '}
                        <button onClick={onLogin} className="font-semibold leading-6 text-black hover:text-neutral-700">
                            Sign in
                        </button>
                    </p>
                </div>
            </div>

            {/* Right Side - Visuals */}
            <div className="relative hidden w-0 flex-1 lg:block overflow-hidden bg-neutral-50">
                {/* Background Gradients */}
                <div className="absolute inset-0 h-full w-full bg-neutral-50">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neutral-200 rounded-full blur-[120px] animate-pulse opacity-60"></div>
                </div>

                {/* Grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-center p-20">
                    <div className="relative w-full max-w-lg">
                        {/* Central Hub Card */}
                        <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6 relative z-10 animate-float">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
                                    U
                                </div>
                                <div>
                                    <div className="font-bold text-primary-text text-lg">User</div>
                                    <div className="text-muted-text text-sm">Senior Software Engineer</div>
                                </div>
                                <div className="ml-auto">
                                    <div className="px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs rounded-full font-bold">Open to Work</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-text">Problem Solving</span>
                                    <span className="text-primary-text font-bold">Top 1%</span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-2">
                                    <div className="bg-violet-600 h-2 rounded-full w-[95%] shadow-[0_0_10px_rgba(124,58,237,0.3)]"></div>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-text">System Design</span>
                                    <span className="text-primary-text font-bold">Top 5%</span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-2">
                                    <div className="bg-amber-500 h-2 rounded-full w-[88%] shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Connected Peers (Floating) */}
                        <div className="absolute -top-12 -right-12 bg-white border border-neutral-200 p-3 rounded-xl shadow-xl flex items-center gap-3 animate-float animation-delay-2000">
                            <div className="flex -space-x-3">
                                <div className="w-8 h-8 rounded-full bg-rose-500 border-2 border-white"></div>
                                <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-white"></div>
                                <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white"></div>
                            </div>
                            <div className="text-xs font-bold text-start text-neutral-600">
                                +420 Connections
                            </div>
                        </div>

                        {/* Recent Activity Badge */}
                        <div className="absolute -bottom-8 -left-8 bg-white border border-neutral-200 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-float animation-delay-4000">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Globe size={20} />
                            </div>
                            <div>
                                <div className="text-xs text-muted-text uppercase tracking-wider font-bold">Just Joined</div>
                                <div className="text-sm font-bold text-primary-text">Software Engineer</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
