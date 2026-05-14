import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, MessageCircle, AlertCircle, PenSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import ChatWindow from '../components/chat/ChatWindow';
import UserSearch from '../components/chat/UserSearch';

const API_BASE = import.meta.env.VITE_API_URL;

// Utility: Generate gradient color from username
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

// Skeleton row used while initial chats load
function ChatRowSkeleton() {
    return (
        <div className="p-3 rounded-xl flex items-center gap-3 animate-pulse">
            <div
                className="w-12 h-12 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'var(--color-surface-hover)' }}
            />
            <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3 rounded w-1/2" style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                <div className="h-3 rounded w-4/5" style={{ backgroundColor: 'var(--color-surface-hover)' }} />
            </div>
            <div className="h-3 w-8 rounded" style={{ backgroundColor: 'var(--color-surface-hover)' }} />
        </div>
    );
}

export default function Messages() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [error, setError] = useState(null);
    const [page] = useState(1);
    const token = localStorage.getItem('access_token');

    const fetchChats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE}/chat/chats?page=${page}&limit=20`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response.ok) {
                const data = await response.json();
                setChats(data.chats);
                setError(null);
            }
        } catch (err) {
            setError('Failed to load chats');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, token]);

    // Fetch chats on mount and when page changes
    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    // Listen to WebSocket events to refresh chat list in real-time
    useEffect(() => {
        const handleWsMessage = (event) => {
            const data = event.detail;
            if (
                data.type === 'new_message' ||
                data.type === 'read_receipt' ||
                data.type === 'message_edited' ||
                data.type === 'message_deleted'
            ) {
                fetchChats();
            }
        };

        window.addEventListener('ws_message', handleWsMessage);
        return () => window.removeEventListener('ws_message', handleWsMessage);
    }, [fetchChats]);

    // Handle ?user= URL parameter (from MessengerWidget navigation)
    useEffect(() => {
        const userParam = searchParams.get('user');
        if (userParam) {
            setSelectedUserId(parseInt(userParam, 10));
            // Clean the param so it doesn't re-trigger
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const handleSelectChat = (chatId, userId) => {
        setSelectedChatId(chatId);
        setSelectedUserId(userId);
        setShowUserSearch(false);
    };

    const handleUserSelected = (userId) => {
        setSelectedUserId(userId);
        setSelectedChatId(null);
        setShowUserSearch(false);
    };

    const handleBackToList = () => {
        setSelectedChatId(null);
        setSelectedUserId(null);
        fetchChats();
    };

    // Filter chats by search query
    const filteredChats = chats.filter(chat => {
        const otherUserName = chat.user_1_id === user?.id
            ? chat.user_2_username
            : chat.user_1_username;
        return otherUserName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const totalUnread = chats.reduce((sum, c) => sum + (c.unread_count || 0), 0);

    // On mobile, show either the list or the chat — on desktop, show both
    const showChatPanel = selectedChatId || selectedUserId || showUserSearch;

    return (
        <div
            className="h-full w-full flex overflow-hidden relative"
            style={{
                backgroundColor: 'var(--color-app-bg)',
                color: 'var(--color-primary-text)',
                transition: 'background-color 0.3s ease'
            }}
        >
            {/* Animated ambient background orbs */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="feed-orb feed-orb-1" />
                <div className="feed-orb feed-orb-2" />
                <div className="feed-orb feed-orb-3" />
            </div>

            <div className="relative z-10 w-full h-full">
                <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] gap-0 h-full">

                    {/* ─────────────── CHATS LIST PANEL ─────────────── */}
                    <aside
                        className={`flex flex-col h-full border-r ${showChatPanel ? 'hidden lg:flex' : 'flex'}`}
                        style={{
                            borderColor: 'var(--color-border)',
                            backgroundColor: 'color-mix(in srgb, var(--color-surface) 60%, transparent)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        {/* Header */}
                        <div className="px-5 pt-6 pb-4">
                            <div className="flex items-center justify-between mb-1">
                                <h1
                                    className="text-2xl font-bold tracking-tight"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    Messages
                                </h1>
                                <button
                                    onClick={() => setShowUserSearch(true)}
                                    aria-label="New chat"
                                    className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                        color: '#fff',
                                    }}
                                >
                                    <PenSquare size={18} />
                                </button>
                            </div>
                            <p className="text-xs mb-4" style={{ color: 'var(--color-muted-text)' }}>
                                {chats.length === 0 && !loading
                                    ? 'No conversations yet'
                                    : `${chats.length} conversation${chats.length === 1 ? '' : 's'}${totalUnread > 0 ? ` · ${totalUnread} unread` : ''}`}
                            </p>

                            {/* Search Box */}
                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--color-muted-text)' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                                    style={{
                                        backgroundColor: 'var(--color-surface-hover)',
                                        color: 'var(--color-primary-text)',
                                        border: `1.5px solid ${searchQuery ? '#6366f1' : 'transparent'}`,
                                        boxShadow: searchQuery ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Clear search"
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:opacity-80"
                                        style={{ color: 'var(--color-muted-text)' }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Chats List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-3">
                            {error && (
                                <div
                                    className="mx-2 mb-2 p-3 rounded-lg flex items-center gap-2"
                                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}
                                >
                                    <AlertCircle size={16} />
                                    <span className="text-xs">{error}</span>
                                </div>
                            )}

                            {loading && chats.length === 0 && (
                                <div className="space-y-1 p-2">
                                    {[0, 1, 2, 3].map((i) => <ChatRowSkeleton key={i} />)}
                                </div>
                            )}

                            {!loading && filteredChats.length === 0 && (
                                <div className="px-6 py-12 text-center">
                                    <div
                                        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                                        }}
                                    >
                                        <MessageCircle size={28} style={{ color: '#8b5cf6' }} />
                                    </div>
                                    <h3 className="font-semibold text-sm mb-1">
                                        {searchQuery ? 'No matches' : 'Your inbox is quiet'}
                                    </h3>
                                    <p className="text-xs" style={{ color: 'var(--color-muted-text)' }}>
                                        {searchQuery
                                            ? `Nothing matched "${searchQuery}"`
                                            : 'Tap the pencil icon to start a chat'}
                                    </p>
                                </div>
                            )}

                            {filteredChats.length > 0 && (
                                <div className="space-y-0.5 p-1">
                                    {filteredChats.map((chat) => {
                                        const otherUserId = chat.user_1_id === user?.id ? chat.user_2_id : chat.user_1_id;
                                        const otherUsername = chat.user_1_id === user?.id ? chat.user_2_username : chat.user_1_username;
                                        const avatar = otherUsername?.[0]?.toUpperCase() || '?';
                                        const isSelected = selectedChatId === chat.id;
                                        const hasUnread = chat.unread_count > 0;
                                        const isDeletedPreview = chat.last_message_preview === '[deleted]';

                                        return (
                                            <div
                                                key={chat.id}
                                                onClick={() => handleSelectChat(chat.id, otherUserId)}
                                                className="relative group p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-3"
                                                style={{
                                                    backgroundColor: isSelected
                                                        ? 'rgba(99,102,241,0.12)'
                                                        : 'transparent',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }
                                                }}
                                            >
                                                {/* Active accent bar */}
                                                {isSelected && (
                                                    <span
                                                        aria-hidden
                                                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                                                        style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
                                                    />
                                                )}

                                                {/* Avatar */}
                                                <div className="relative flex-shrink-0">
                                                    <div
                                                        className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white"
                                                        style={{
                                                            background: getGradientFromUsername(otherUsername),
                                                            boxShadow: hasUnread
                                                                ? '0 0 0 2px rgba(99,102,241,0.4)'
                                                                : 'none',
                                                        }}
                                                    >
                                                        {avatar}
                                                    </div>
                                                </div>

                                                {/* Chat Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                                        <h3
                                                            className="font-semibold text-sm truncate"
                                                            style={{
                                                                color: 'var(--color-primary-text)',
                                                                fontWeight: hasUnread ? 700 : 600,
                                                            }}
                                                        >
                                                            {otherUsername}
                                                        </h3>
                                                        <span
                                                            className="text-[11px] flex-shrink-0"
                                                            style={{
                                                                color: hasUnread ? '#6366f1' : 'var(--color-muted-text)',
                                                                fontWeight: hasUnread ? 600 : 400,
                                                            }}
                                                        >
                                                            {chat.last_message_at || ''}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p
                                                            className="text-xs truncate"
                                                            style={{
                                                                color: hasUnread
                                                                    ? 'var(--color-primary-text)'
                                                                    : 'var(--color-muted-text)',
                                                                fontWeight: hasUnread ? 500 : 400,
                                                                fontStyle: isDeletedPreview ? 'italic' : 'normal',
                                                                opacity: isDeletedPreview ? 0.7 : 1,
                                                            }}
                                                        >
                                                            {chat.last_message_preview || 'Say hi 👋'}
                                                        </p>
                                                        {hasUnread && (
                                                            <span
                                                                className="px-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0"
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                                }}
                                                            >
                                                                {chat.unread_count > 99 ? '99+' : chat.unread_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* ─────────────── CHAT WINDOW OR EMPTY STATE ─────────────── */}
                    <main className={`flex flex-col h-full ${!showChatPanel ? 'hidden lg:flex' : 'flex'}`}>
                        {(selectedChatId || selectedUserId) && !showUserSearch ? (
                            <ChatWindow
                                key={selectedUserId || selectedChatId}
                                chatId={selectedChatId}
                                userId={selectedUserId}
                                onBack={handleBackToList}
                            />
                        ) : showUserSearch ? (
                            <UserSearch
                                onUserSelected={handleUserSelected}
                                onBack={() => setShowUserSearch(false)}
                            />
                        ) : (
                            <div className="hidden lg:flex flex-col items-center justify-center h-full px-8 text-center">
                                <div
                                    className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 relative"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                                    }}
                                >
                                    <MessageCircle size={40} style={{ color: '#8b5cf6' }} />
                                    <Sparkles
                                        size={18}
                                        className="absolute -top-1 -right-1"
                                        style={{ color: '#f59e0b' }}
                                    />
                                </div>
                                <h2 className="text-xl font-bold mb-2">Pick up where you left off</h2>
                                <p className="text-sm max-w-xs" style={{ color: 'var(--color-muted-text)' }}>
                                    Select a conversation from the list, or start a new one to chat with someone.
                                </p>
                                <button
                                    onClick={() => setShowUserSearch(true)}
                                    className="mt-6 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 flex items-center gap-2 hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                    }}
                                >
                                    <PenSquare size={16} />
                                    Start a new chat
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <style>{`
                @keyframes feedOrbFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -40px) scale(1.08); }
                    66% { transform: translate(-20px, 20px) scale(0.94); }
                }
                .feed-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                    animation: feedOrbFloat 10s ease-in-out infinite;
                }
                .feed-orb-1 {
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%);
                    top: -100px; left: -100px;
                    animation-delay: 0s;
                }
                .feed-orb-2 {
                    width: 350px; height: 350px;
                    background: radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%);
                    bottom: 10%; right: -80px;
                    animation-delay: -4s;
                }
                .feed-orb-3 {
                    width: 250px; height: 250px;
                    background: radial-gradient(circle, rgba(244,63,94,0.12), transparent 70%);
                    top: 40%; left: 40%;
                    animation-delay: -7s;
                }
            `}</style>
        </div>
    );
}
