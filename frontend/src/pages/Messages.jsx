import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// Smart relative timestamp — handles ISO strings and already-formatted strings
const formatChatTimestamp = (ts) => {
    if (!ts) return '';
    if (/ago|just now|now/i.test(ts)) return ts;
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts;
    const diff = (Date.now() - date) / 1000;
    if (diff < 60) return 'Now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800) return 'Yesterday';
    if (diff < 604800) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Skeleton row used while initial chats load
function ChatRowSkeleton() {
    return (
        <div className="p-3 rounded-xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex-shrink-0 msg-shimmer" />
            <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3 rounded-full w-5/12 msg-shimmer" />
                <div className="h-3 rounded-full w-4/5 msg-shimmer" />
            </div>
            <div className="h-3 w-10 rounded-full msg-shimmer" />
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
    const [activeFilter, setActiveFilter] = useState('all');
    // Tracks which user IDs are currently typing (by user_id key)
    const [typingSet, setTypingSet] = useState({});
    const typingTimeoutsRef = useRef({});
    const [onlineSet, setOnlineSet] = useState({});
    const token = localStorage.getItem('access_token');
    // Ref so WS handlers always read the current selected chat without re-subscribing
    const selectedChatIdRef = useRef(selectedChatId);
    const refetchTimerRef = useRef(null);

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

    // Listen to WebSocket events and update the chat list without full refetches
    useEffect(() => {
        const handleWsMessage = (event) => {
            const data = event.detail;

            if (data.type === 'new_message') {
                const chatId = data.chat_id;
                const msg = data.message;
                setChats(prev => {
                    const idx = prev.findIndex(c => c.id === chatId);
                    if (idx === -1) {
                        // First message in a brand-new conversation — need the full ChatOut shape
                        fetchChats();
                        return prev;
                    }
                    const isActive = selectedChatIdRef.current === chatId;
                    const isOwn = msg.sender_id === user?.id;
                    const updated = [...prev];
                    const chat = {
                        ...updated[idx],
                        last_message_preview: msg.is_deleted ? '[deleted]' : (msg.content || '').slice(0, 100),
                        last_message_at: msg.time_ago || 'Just now',
                        unread_count: (!isOwn && !isActive)
                            ? (updated[idx].unread_count || 0) + 1
                            : updated[idx].unread_count,
                    };
                    updated.splice(idx, 1);
                    updated.unshift(chat); // bubble to top
                    return updated;
                });
            } else if (data.type === 'message_edited' || data.type === 'message_deleted') {
                // These mutations may change the last preview; debounce a single refetch
                if (!refetchTimerRef.current) {
                    refetchTimerRef.current = setTimeout(() => {
                        refetchTimerRef.current = null;
                        fetchChats();
                    }, 1500);
                }
            }
            // read_receipt: tells us the other user read our outbound message — no sidebar change needed

            if (data.type === 'typing_indicator' && data.user_id) {
                const uid = data.user_id;
                setTypingSet(prev => ({ ...prev, [uid]: true }));
                clearTimeout(typingTimeoutsRef.current[uid]);
                typingTimeoutsRef.current[uid] = setTimeout(() => {
                    setTypingSet(prev => {
                        const next = { ...prev };
                        delete next[uid];
                        return next;
                    });
                }, 3000);
            }

            if (data.type === 'status_update' && data.user_id) {
                const uid = data.user_id;
                if (data.status === 'online') {
                    setOnlineSet(prev => ({ ...prev, [uid]: true }));
                } else {
                    setOnlineSet(prev => { const next = { ...prev }; delete next[uid]; return next; });
                }
            }
        };

        window.addEventListener('ws_message', handleWsMessage);
        return () => window.removeEventListener('ws_message', handleWsMessage);
    }, [fetchChats, user?.id]);

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

    useEffect(() => { selectedChatIdRef.current = selectedChatId; }, [selectedChatId]);

    // Clear the unread badge the moment the user opens a conversation
    useEffect(() => {
        if (!selectedChatId) return;
        setChats(prev => prev.map(c =>
            c.id === selectedChatId ? { ...c, unread_count: 0 } : c
        ));
    }, [selectedChatId]);

    // Cleanup lingering timers on unmount
    useEffect(() => {
        return () => {
            if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
            Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
        };
    }, []);

    // Filter chats by search query and active filter tab
    const filteredChats = chats.filter(chat => {
        const otherUserName = chat.user_1_id === user?.id
            ? chat.user_2_username
            : chat.user_1_username;
        const matchesSearch = otherUserName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            activeFilter === 'all' ||
            (activeFilter === 'unread' && chat.unread_count > 0) ||
            activeFilter === 'connections'; // treat as "all" until backend adds this
        return matchesSearch && matchesFilter;
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

            <div className="relative z-10 w-full h-full overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] gap-0 h-full overflow-hidden">

                    {/* ─────────────── CHATS LIST PANEL ─────────────── */}
                    <aside
                        className={`flex flex-col h-full min-h-0 border-r ${showChatPanel ? 'hidden lg:flex' : 'flex'}`}
                        style={{
                            borderColor: 'var(--color-border)',
                            background: 'var(--color-surface)',
                        }}
                    >
                        {/* ── LinkedIn-style Messaging Header ── */}
                        <div
                            className="flex-shrink-0 px-4 pt-4 pb-3 border-b"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                        >
                            {/* Title row */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold" style={{ color: 'var(--color-primary-text)' }}>Messaging</h1>
                                    {totalUnread > 0 && (
                                        <span
                                            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                                            style={{
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                boxShadow: '0 2px 6px rgba(99,102,241,0.45)',
                                            }}
                                        >
                                            {totalUnread > 9 ? '9+' : totalUnread}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowUserSearch(true)}
                                    aria-label="New chat"
                                    className="p-2 rounded-xl transition-all"
                                    style={{ color: 'var(--color-muted-text)' }}
                                    title="New message"
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)';
                                        e.currentTarget.style.color = '#6366f1';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = 'var(--color-muted-text)';
                                    }}
                                >
                                    <PenSquare size={18} />
                                </button>
                            </div>

                            {/* Search box */}
                            <div className="relative mb-3">
                                <Search
                                    size={15}
                                    className="absolute left-3 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--color-muted-text)' }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search messages"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-9 py-2 rounded-full text-sm focus:outline-none transition-all"
                                    style={{
                                        backgroundColor: 'var(--color-surface-hover)',
                                        color: 'var(--color-primary-text)',
                                        border: `1.5px solid ${searchQuery ? '#6366f1' : 'transparent'}`,
                                        boxShadow: searchQuery ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Clear search"
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full"
                                        style={{ color: 'var(--color-muted-text)' }}
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Filter tabs */}
                            <div className="flex gap-1.5">
                                {[
                                    { id: 'all', label: 'Inbox', badge: chats.length > 0 ? chats.length : null },
                                    { id: 'unread', label: 'Unread', badge: totalUnread > 0 ? totalUnread : null },
                                    { id: 'connections', label: 'Connected' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveFilter(tab.id)}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
                                        style={{
                                            background: activeFilter === tab.id
                                                ? 'linear-gradient(135deg, #6366f1, #7c3aed)'
                                                : 'transparent',
                                            color: activeFilter === tab.id ? '#fff' : 'var(--color-muted-text)',
                                            border: activeFilter === tab.id ? 'none' : '1px solid var(--color-border)',
                                            boxShadow: activeFilter === tab.id ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                                        }}
                                    >
                                        {tab.label}
                                        {tab.badge != null && (
                                            <span
                                                className="inline-flex items-center justify-center rounded-full text-[9px] font-bold px-1.5 min-w-[16px] h-4"
                                                style={{
                                                    background: activeFilter === tab.id ? 'rgba(255,255,255,0.25)' : 'rgba(99,102,241,0.15)',
                                                    color: activeFilter === tab.id ? '#fff' : '#6366f1',
                                                }}
                                            >
                                                {tab.badge > 99 ? '99+' : tab.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chats List */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 pb-3">
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
                                <div className="px-6 py-14 text-center flex flex-col items-center">
                                    <div
                                        className="w-20 h-20 rounded-[1.5rem] mx-auto mb-5 flex items-center justify-center relative"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))',
                                            boxShadow: '0 8px 24px rgba(99,102,241,0.15)',
                                        }}
                                    >
                                        <MessageCircle size={32} style={{ color: '#8b5cf6' }} />
                                        {!searchQuery && (
                                            <span className="absolute -top-2 -right-2 text-xl animate-bounce">✨</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-sm mb-1.5" style={{ color: 'var(--color-primary-text)' }}>
                                        {searchQuery ? `No results for "${searchQuery}"` : 'No conversations yet'}
                                    </h3>
                                    <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--color-muted-text)' }}>
                                        {searchQuery
                                            ? 'Try a different name or username'
                                            : 'Connect with classmates and start chatting!'}
                                    </p>
                                    {!searchQuery && (
                                        <button
                                            onClick={() => setShowUserSearch(true)}
                                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
                                            style={{
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                                            }}
                                        >
                                            Start your first chat
                                        </button>
                                    )}
                                </div>
                            )}

                            {filteredChats.length > 0 && (
                                <div className="space-y-0.5 p-1">
                                    {filteredChats.map((chat, idx) => {
                                        const otherUserId = chat.user_1_id === user?.id ? chat.user_2_id : chat.user_1_id;
                                        const otherUsername = chat.user_1_id === user?.id ? chat.user_2_username : chat.user_1_username;
                                        const avatar = otherUsername?.[0]?.toUpperCase() || '?';
                                        const isSelected = selectedChatId === chat.id;
                                        const hasUnread = chat.unread_count > 0;
                                        const isDeletedPreview = chat.last_message_preview === '[deleted]';
                                        // Online: API-sourced from ChatOut, overridden by live WS status_update events
                                        const isOnline = onlineSet[otherUserId] ?? chat.other_user_online ?? false;

                                        return (
                                            <div
                                                key={chat.id}
                                                onClick={() => handleSelectChat(chat.id, otherUserId)}
                                                className="relative group p-3 rounded-2xl cursor-pointer flex items-center gap-3 chat-row-enter"
                                                style={{
                                                    backgroundColor: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                                                    border: isSelected ? '1px solid rgba(99,102,241,0.22)' : '1px solid transparent',
                                                    boxShadow: isSelected ? '0 2px 12px rgba(99,102,241,0.1)' : 'none',
                                                    transition: 'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
                                                    animationDelay: `${idx * 40}ms`,
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                                                        e.currentTarget.style.transform = 'translateX(2px)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.transform = 'translateX(0)';
                                                    }
                                                }}
                                            >
                                                {/* Selected accent bar */}
                                                {isSelected && (
                                                    <span
                                                        aria-hidden
                                                        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                                                        style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
                                                    />
                                                )}

                                                {/* Avatar with online ring */}
                                                <div className="relative flex-shrink-0">
                                                    <div
                                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold text-white"
                                                        style={{
                                                            background: getGradientFromUsername(otherUsername),
                                                            boxShadow: isSelected
                                                                ? '0 4px 14px rgba(99,102,241,0.35)'
                                                                : hasUnread
                                                                    ? '0 0 0 2px rgba(99,102,241,0.4)'
                                                                    : '0 2px 8px rgba(0,0,0,0.12)',
                                                        }}
                                                    >
                                                        {avatar}
                                                    </div>
                                                    {/* Online indicator */}
                                                    {isOnline && (
                                                        <span
                                                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                                                            style={{
                                                                backgroundColor: '#10b981',
                                                                borderColor: 'var(--color-surface)',
                                                                boxShadow: '0 0 5px rgba(16,185,129,0.6)',
                                                            }}
                                                        />
                                                    )}
                                                    {/* Unread glow ring (when no online dot) */}
                                                    {hasUnread && !isOnline && (
                                                        <span
                                                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                                                            style={{
                                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                                borderColor: 'var(--color-surface)',
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Chat Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                                        <h3
                                                            className="text-sm truncate"
                                                            style={{
                                                                color: 'var(--color-primary-text)',
                                                                fontWeight: hasUnread ? 700 : 600,
                                                            }}
                                                        >
                                                            {otherUsername}
                                                        </h3>
                                                        <span
                                                            className="text-[10px] flex-shrink-0"
                                                            style={{
                                                                color: hasUnread ? '#6366f1' : 'var(--color-muted-text)',
                                                                fontWeight: hasUnread ? 600 : 400,
                                                            }}
                                                        >
                                                            {formatChatTimestamp(chat.last_message_at)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        {typingSet[otherUserId] ? (
                                                            <span className="flex items-center gap-1" style={{ color: '#6366f1' }}>
                                                                <span className="typing-dot-sm" style={{ animation: 'typingBounce 1.4s infinite' }} />
                                                                <span className="typing-dot-sm" style={{ animation: 'typingBounce 1.4s infinite 0.2s' }} />
                                                                <span className="typing-dot-sm" style={{ animation: 'typingBounce 1.4s infinite 0.4s' }} />
                                                                <span className="font-medium" style={{ fontSize: '11px' }}>typing…</span>
                                                            </span>
                                                        ) : (
                                                            <p
                                                                className="text-xs truncate"
                                                                style={{
                                                                    color: hasUnread ? 'var(--color-primary-text)' : 'var(--color-muted-text)',
                                                                    fontWeight: hasUnread ? 500 : 400,
                                                                    fontStyle: isDeletedPreview ? 'italic' : 'normal',
                                                                    opacity: isDeletedPreview ? 0.6 : 1,
                                                                }}
                                                            >
                                                                {chat.last_message_preview || 'Say hi 👋'}
                                                            </p>
                                                        )}
                                                        {hasUnread && (
                                                            <span
                                                                className="px-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0"
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                                    boxShadow: '0 2px 6px rgba(99,102,241,0.4)',
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
                    <main className={`flex flex-col h-full overflow-hidden ${!showChatPanel ? 'hidden lg:flex' : 'flex'}`}>
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
                                {/* Floating orbs behind icon */}
                                <div className="relative mb-8">
                                    <div
                                        className="absolute inset-0 rounded-full opacity-30"
                                        style={{
                                            background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
                                            width: '160px', height: '160px',
                                            top: '50%', left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            animation: 'emptyPulse 3s ease-in-out infinite',
                                        }}
                                    />
                                    <div
                                        className="w-28 h-28 rounded-[2rem] flex items-center justify-center relative"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.2))',
                                            boxShadow: '0 12px 40px rgba(99,102,241,0.2)',
                                            border: '1px solid rgba(99,102,241,0.15)',
                                        }}
                                    >
                                        <MessageCircle size={44} style={{ color: '#8b5cf6' }} />
                                        <Sparkles
                                            size={20}
                                            className="absolute -top-2 -right-2"
                                            style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 6px #f59e0b)' }}
                                        />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-primary-text)' }}>
                                    Your messages
                                </h2>
                                <p className="text-sm max-w-[260px] leading-relaxed" style={{ color: 'var(--color-muted-text)' }}>
                                    Pick a conversation from the left, or start a new one to connect with a classmate.
                                </p>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={() => setShowUserSearch(true)}
                                        className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
                                        style={{
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                                        }}
                                    >
                                        <PenSquare size={15} />
                                        New chat
                                    </button>
                                </div>

                                <div
                                    className="mt-8 px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2"
                                    style={{
                                        background: 'rgba(99,102,241,0.07)',
                                        border: '1px solid rgba(99,102,241,0.14)',
                                        color: 'var(--color-muted-text)',
                                    }}
                                >
                                    <span>🔒</span>
                                    <span>Messages are private between you and the other person</span>
                                </div>
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

                @keyframes msgShimmer {
                    0%   { background-position: -300px 0; }
                    100% { background-position:  300px 0; }
                }
                .msg-shimmer {
                    background: linear-gradient(
                        90deg,
                        var(--color-surface-hover) 0%,
                        rgba(255,255,255,0.07) 50%,
                        var(--color-surface-hover) 100%
                    );
                    background-size: 300px 100%;
                    animation: msgShimmer 1.5s linear infinite;
                }

                @keyframes emptyPulse {
                    0%, 100% { transform: translate(-50%,-50%) scale(1);   opacity: 0.3; }
                    50%       { transform: translate(-50%,-50%) scale(1.18); opacity: 0.15; }
                }

                @keyframes typingBounce {
                    0%, 60%, 100% { opacity: 0.45; transform: translateY(0); }
                    30%           { opacity: 1;    transform: translateY(-4px); }
                }
                .typing-dot-sm {
                    display: inline-block;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: currentColor;
                }

                @keyframes chatRowIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .chat-row-enter {
                    animation: chatRowIn 0.22s ease-out both;
                }
            `}</style>
        </div>
    );
}
