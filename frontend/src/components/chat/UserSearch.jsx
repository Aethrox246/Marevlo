import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function UserSearch({ onUserSelected, onBack }) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('access_token');

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

    const handleSelectUser = (userId) => {
        onUserSelected(userId);
    };

    return (
        <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-app-bg)' }}>
            {/* ── Header ── */}
            <div
                className="p-5 border-b"
                style={{ borderColor: 'var(--color-border)' }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                        style={{ backgroundColor: 'var(--color-surface-hover)' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold">Start a new chat</h2>
                </div>

                {/* Search Box */}
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-3.5" style={{ color: 'var(--color-muted-text)' }} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                        style={{
                            backgroundColor: 'var(--color-surface-hover)',
                            color: 'var(--color-primary-text)',
                            border: `1.5px solid ${searchQuery ? '#6366f1' : 'var(--color-border)'}`
                        }}
                    />
                </div>
            </div>

            {/* ── Results ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {error && (
                    <div className="m-4 p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <AlertCircle size={18} />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {loading && searchQuery.length >= 2 && (
                    <div className="p-8 flex flex-col items-center justify-center">
                        <Loader size={32} className="animate-spin mb-2" style={{ color: '#6366f1' }} />
                        <p className="text-sm" style={{ color: 'var(--color-muted-text)' }}>
                            Searching...
                        </p>
                    </div>
                )}

                {!loading && searchQuery.length === 0 && (
                    <div className="p-8 flex flex-col items-center justify-center h-full">
                        <Search size={48} className="mb-4 opacity-30" />
                        <h3 className="font-semibold mb-1">Search for users</h3>
                        <p className="text-sm text-center" style={{ color: 'var(--color-muted-text)' }}>
                            Type at least 2 characters to find users
                        </p>
                    </div>
                )}

                {!loading && searchQuery.length >= 2 && results.length === 0 && (
                    <div className="p-8 flex flex-col items-center justify-center">
                        <AlertCircle size={40} className="mb-3 opacity-30" />
                        <h3 className="font-semibold mb-1">No users found</h3>
                        <p className="text-sm" style={{ color: 'var(--color-muted-text)' }}>
                            Try searching with a different name
                        </p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="space-y-2 p-4">
                        {results.map((searchUser) => (
                            <div
                                key={searchUser.id}
                                onClick={() => handleSelectUser(searchUser.id)}
                                className="p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-3"
                                style={{ backgroundColor: 'var(--color-surface)' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                            >
                                {/* Avatar */}
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                >
                                    {searchUser.username[0].toUpperCase()}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm">
                                        {searchUser.username}
                                    </h3>
                                    <p
                                        className="text-xs truncate"
                                        style={{ color: 'var(--color-muted-text)' }}
                                    >
                                        {searchUser.email}
                                    </p>
                                </div>

                                {/* Action */}
                                <button
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        color: '#fff',
                                        boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    Chat
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
