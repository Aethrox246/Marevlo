import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowLeft, Loader, AlertCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL;

const getGradientFromUsername = (username) => {
    if (!username) return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = ((hash << 5) - hash) + username.charCodeAt(i);
        hash = hash & hash;
    }
    const colors = [
        'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'linear-gradient(135deg, #10b981, #14b8a6)',
        'linear-gradient(135deg, #f59e0b, #f97316)',
        'linear-gradient(135deg, #ef4444, #ec4899)',
        'linear-gradient(135deg, #06b6d4, #0ea5e9)',
        'linear-gradient(135deg, #8b5cf6, #a78bfa)',
        'linear-gradient(135deg, #14b8a6, #06b6d4)',
        'linear-gradient(135deg, #f97316, #fb923c)',
    ];
    return colors[Math.abs(hash) % colors.length];
};

export default function UserSearch({ onUserSelected, onBack }) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [visible, setVisible] = useState(false);
    const inputRef = useRef(null);
    const token = localStorage.getItem('access_token');

    // Mount fade-in
    useEffect(() => {
        const t = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                searchUsers();
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const searchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(
                `${API_BASE}/chat/users/search?q=${encodeURIComponent(searchQuery)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response.ok) {
                const data = await response.json();
                setResults(data);
            }
        } catch (err) {
            setError('Failed to search users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="h-full flex flex-col transition-opacity duration-200"
            style={{
                background: 'var(--color-app-bg)',
                opacity: visible ? 1 : 0,
            }}
        >
            {/* ── Header ── */}
            <div
                className="flex-shrink-0 px-4 pt-4 pb-3 relative"
                style={{
                    background: 'var(--color-surface)',
                    borderBottom: '1px solid var(--color-border)',
                    boxShadow: '0 4px 20px -8px rgba(99,102,241,0.18)',
                }}
            >
                {/* Gradient accent line */}
                <span
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }}
                />

                <div className="flex items-center gap-3 mb-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl transition-all hover:scale-105 flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-primary-text)' }}
                        aria-label="Back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--color-primary-text)' }}>New message</h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-text)' }}>
                            Search for a classmate to chat with
                        </p>
                    </div>
                </div>

                {/* Search box */}
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: searchQuery ? '#6366f1' : 'var(--color-muted-text)' }}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search by username…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:outline-none transition-all"
                        style={{
                            backgroundColor: 'var(--color-surface-hover)',
                            color: 'var(--color-primary-text)',
                            border: `1.5px solid ${searchQuery ? '#6366f1' : 'transparent'}`,
                            boxShadow: searchQuery ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                        }}
                    />
                    {loading && searchQuery.length >= 2 && (
                        <Loader
                            size={14}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin"
                            style={{ color: '#6366f1' }}
                        />
                    )}
                </div>
            </div>

            {/* ── Results / States ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {error && (
                    <div className="m-4 p-4 rounded-2xl flex items-center gap-2.5"
                        style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
                    >
                        <AlertCircle size={16} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Empty — prompt to start typing */}
                {!loading && searchQuery.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full pb-16 gap-5 px-8 text-center">
                        <div
                            className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center relative"
                            style={{
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.18))',
                                boxShadow: '0 8px 24px rgba(99,102,241,0.12)',
                            }}
                        >
                            <Search size={30} style={{ color: '#8b5cf6', opacity: 0.85 }} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--color-primary-text)' }}>
                                Find someone
                            </h3>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-text)' }}>
                                Type at least 2 characters to find classmates
                            </p>
                        </div>
                    </div>
                )}

                {/* No results */}
                {!loading && searchQuery.length >= 2 && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 px-8 text-center">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'var(--color-surface-hover)' }}
                        >
                            <AlertCircle size={26} style={{ color: 'var(--color-muted-text)', opacity: 0.5 }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--color-primary-text)' }}>
                                No users found
                            </h3>
                            <p className="text-xs" style={{ color: 'var(--color-muted-text)' }}>
                                Try a different username
                            </p>
                        </div>
                    </div>
                )}

                {/* Results list */}
                {results.length > 0 && (
                    <div className="p-3 space-y-1.5">
                        {results.map((searchUser, idx) => (
                            <div
                                key={searchUser.id}
                                onClick={() => onUserSelected(searchUser.id)}
                                className="p-3 rounded-2xl cursor-pointer flex items-center gap-3 transition-all duration-150 group"
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    border: '1px solid transparent',
                                    animation: `userResultIn 0.2s ease-out ${idx * 50}ms both`,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.07)';
                                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)';
                                    e.currentTarget.style.transform = 'translateX(2px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                            >
                                {/* Avatar */}
                                <div
                                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                                    style={{
                                        background: getGradientFromUsername(searchUser.username),
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    {searchUser.username[0].toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-primary-text)' }}>
                                        {searchUser.username}
                                    </h3>
                                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-muted-text)' }}>
                                        @{searchUser.username}
                                    </p>
                                </div>

                                {/* CTA button */}
                                <div
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all group-hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                                    }}
                                >
                                    <MessageCircle size={12} />
                                    Chat
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes userResultIn {
                    from { opacity: 0; transform: translateY(10px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
