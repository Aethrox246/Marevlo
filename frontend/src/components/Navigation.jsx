import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NavItem from './NavItem';
import NotificationBell from './NotificationBell';
import BugReportModal from './BugReportModal';

function getInitials(name) {
    return name
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'AU';
}

export default function Navigation() {
    const { user, userPoints, logout, profileData } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showBugReport, setShowBugReport] = useState(false);
    const [showHeardFromModal, setShowHeardFromModal] = useState(false);
    const [heardFrom, setHeardFrom] = useState('');
    const profileMenuRef = useRef(null);

    const heardFromOptions = [
        'Friend or colleague',
        'Google Search',
        'YouTube',
        'Instagram',
        'LinkedIn',
        'College or university',
        'Teacher or mentor',
        'Hackathon or event',
        'Blog or article',
        'GitHub',
        'Other',
    ];

    const handleGetStartedClick = () => {
        setHeardFrom('');
        setShowHeardFromModal(true);
    };

    const handleHeardFromContinue = () => {
        if (!heardFrom) return;
        localStorage.setItem('heardFrom', heardFrom);
        setShowHeardFromModal(false);
        navigate('/signup');
    };

    useEffect(() => {
        if (!showProfileMenu) return;
        const handleClickOutside = (e) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-surface/95 backdrop-blur-xl transition-all duration-200" style={{ borderColor: 'var(--color-border)' }}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-black/5 pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 h-[68px] flex items-center justify-between">
                    <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
                        <img src="/logo/logo marevlo.svg" alt="Marevlo" className="h-10 w-auto group-hover:scale-105 transition-transform duration-300" />
                    </div>

                    {user && (
                        <div className="hidden md:flex items-center gap-6">
                            <div className="flex items-center gap-6">
                                <NavItem label="Project" to="/project" />
                                <NavItem label="Jobs" to="/jobs" />
                                <NavItem label="Feed" to="/feed" />
                            </div>
                            <div className="flex items-center gap-4">
                                <NavItem label="Plan" to="/plan" />
                                <NavItem label="Courses" to="/courses" />
                                <NavItem label="Problems" to="/problems" />
                                <NavItem label="Research" to="/research" />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="relative p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                            style={{ backgroundColor: isDark ? '#262626' : '#f5f5f5', border: `1px solid ${isDark ? '#404040' : '#e5e5e5'}` }}
                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <div className="relative w-5 h-5">
                                <Sun size={20} className={`absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 text-yellow-400' : 'opacity-0 rotate-90 text-yellow-500'}`} />
                                <Moon size={20} className={`absolute inset-0 transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90 text-slate-400' : 'opacity-100 rotate-0 text-slate-700'}`} />
                            </div>
                        </button>

                        {user ? (
                            <>
                                <div
                                    className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full shadow-sm"
                                    style={{ backgroundColor: isDark ? '#262626' : '#f5f5f5', border: `1px solid ${isDark ? '#404040' : '#e5e5e5'}`, color: 'var(--color-primary-text)' }}
                                >
                                    <Zap size={14} fill="currentColor" />
                                    <span className="font-mono font-bold text-xs">{userPoints} XP</span>
                                </div>

                                <NotificationBell />

                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setShowProfileMenu(prev => !prev)}
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg hover:ring-2 transition-all overflow-hidden"
                                        style={{ backgroundColor: isDark ? '#ffffff' : '#000000', color: isDark ? '#000000' : '#ffffff' }}
                                    >
                                        {profileData?.avatar_url
                                            ? <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" />
                                            : getInitials(user.name)
                                        }
                                    </button>

                                    {showProfileMenu && (
                                        <div
                                            className="absolute right-0 top-12 w-48 rounded-xl shadow-2xl py-2 z-50"
                                            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                        >
                                            <div className="px-4 py-2 mb-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <p className="text-sm font-bold truncate" style={{ color: 'var(--color-primary-text)' }}>{user.name}</p>
                                                <p className="text-xs truncate" style={{ color: 'var(--color-muted-text)' }}>{user.handle || user.email}</p>
                                            </div>
                                            <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} className="nav-dropdown-item">Profile</button>
                                            <button className="nav-dropdown-item" disabled>Settings</button>
                                            <button onClick={() => { navigate('/about'); setShowProfileMenu(false); }} className="nav-dropdown-item">About Us</button>
                                            <div className="h-px my-1" style={{ backgroundColor: 'var(--color-border)' }} />
                                            <button onClick={() => { setShowBugReport(true); setShowProfileMenu(false); }} className="nav-dropdown-item">Report a Bug</button>
                                            <div className="h-px my-1" style={{ backgroundColor: 'var(--color-border)' }} />
                                            <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">Sign Out</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button onClick={() => navigate('/login')} className="nav-dropdown-item px-5 py-2.5 rounded-xl text-sm font-medium">
                                    Sign in
                                </button>
                                <button
                                    onClick={handleGetStartedClick}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:-translate-y-0.5"
                                    style={{ backgroundColor: isDark ? '#ffffff' : '#000000', color: isDark ? '#000000' : '#ffffff' }}
                                >
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {showBugReport && <BugReportModal isDark={isDark} onClose={() => setShowBugReport(false)} />}

            {showHeardFromModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
                        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-primary-text)' }}>
                            How did you hear about us?
                        </h2>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {heardFromOptions.map((option) => (
                                <label
                                    key={option}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer"
                                    style={{ backgroundColor: 'var(--color-surface-hover)' }}
                                >
                                    <input
                                        type="radio"
                                        name="heardFrom"
                                        value={option}
                                        checked={heardFrom === option}
                                        onChange={(event) => setHeardFrom(event.target.value)}
                                    />
                                    <span className="text-sm" style={{ color: 'var(--color-primary-text)' }}>
                                        {option}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <button
                            onClick={handleHeardFromContinue}
                            disabled={!heardFrom}
                            className="mt-6 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: isDark ? '#ffffff' : '#000000',
                                color: isDark ? '#000000' : '#ffffff',
                            }}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .nav-dropdown-item {
                    display: block;
                    width: 100%;
                    text-align: left;
                    padding: 8px 16px;
                    font-size: 14px;
                    color: var(--color-muted-text);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: background-color 150ms ease, color 150ms ease;
                }
                .nav-dropdown-item:hover:not(:disabled) {
                    background-color: var(--color-surface-hover);
                    color: var(--color-primary-text);
                }
                .nav-dropdown-item:disabled {
                    cursor: default;
                }
            `}</style>
        </>
    );
}
