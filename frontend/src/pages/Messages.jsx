import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, AlertCircle, Edit, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/chat/ChatWindow';
import UserSearch from '../components/chat/UserSearch';

const API_BASE = import.meta.env.VITE_API_URL;

// Feed page gradient palette
const G = {
    primary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    cyan:    'linear-gradient(135deg, #06b6d4, #0ea5e9)',
    rose:    'linear-gradient(135deg, #f43f5e, #ec4899)',
    green:   '#10b981',
    indigo:  '#6366f1',
    violet:  '#8b5cf6',
    teal:    '#06b6d4',
};

export default function Messages({ setView }) {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [error, setError] = useState(null);
    const [page] = useState(1);
    const token = localStorage.getItem('access_token');

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString + (!dateString.endsWith('Z') ? 'Z' : ''));
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
        return date.toLocaleDateString();
    };

    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 5000);
        return () => clearInterval(interval);
    }, [page]);

    const fetchChats = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE}/chat/chats?page=${page}&limit=20`,
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            if (response.ok) {
                const data = await response.json();
                setChats(data.chats);
            }
        } catch (err) {
            setError('Failed to load chats');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectChat   = (chatId, userId) => { setSelectedChatId(chatId); setSelectedUserId(userId); setShowUserSearch(false); };
    const handleUserSelected = (userId) => { setSelectedUserId(userId); setShowUserSearch(false); };
    const handleBackToList   = () => { setSelectedChatId(null); setSelectedUserId(null); setShowUserSearch(false); fetchChats(); };

    const filteredChats = chats.filter(chat => {
        const name = chat.user_1_id === user?.id ? chat.user_2_username : chat.user_1_username;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const isPanelOpen = selectedChatId || selectedUserId || showUserSearch;

    return (
        <div className="min-h-screen w-full flex overflow-hidden" style={{ backgroundColor: 'var(--color-app-bg)', color: 'var(--color-primary-text)' }}>

            {/* Ambient orbs — same as Feed */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="msg-orb msg-orb-1" />
                <div className="msg-orb msg-orb-2" />
                <div className="msg-orb msg-orb-3" />
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] h-screen relative overflow-hidden">

                    {/* ══════════════ LEFT PANEL ══════════════ */}
                    <div
                        className={`flex flex-col h-screen absolute lg:relative w-full lg:w-auto z-20 transition-transform duration-300 ease-in-out ${isPanelOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}
                        style={{ backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
                    >
                        {/* Gradient top accent bar — same as Feed cards */}
                        <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)', borderRadius: '0' }} />

                        {/* ── Hero Header ── */}
                        <div className="relative overflow-hidden px-5 py-5" style={{
                            background: G.primary,
                            boxShadow: '0 4px 20px rgba(99,102,241,0.25)'
                        }}>
                            {/* decorative circles - same style as Feed hero */}
                            <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.15)', pointerEvents:'none' }} />
                            <div style={{ position:'absolute', bottom:-15, left:'40%', width:50, height:50, borderRadius:'50%', background:'rgba(255,255,255,0.1)', pointerEvents:'none' }} />

                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Sparkles size={13} style={{ color: 'rgba(255,255,255,0.8)' }} />
                                        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                            Direct Messages
                                        </span>
                                    </div>
                                    <h1 className="text-xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>
                                        {user?.username || 'Messages'}
                                    </h1>
                                </div>

                                {/* Compose button */}
                                <button
                                    onClick={() => setShowUserSearch(true)}
                                    title="New Chat"
                                    className="flex items-center justify-center transition-all duration-200"
                                    style={{
                                        width: 38, height: 38, borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)',
                                        border: '1.5px solid rgba(255,255,255,0.35)',
                                        color: '#fff',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                >
                                    <Edit size={16} />
                                </button>
                            </div>
                        </div>

                        {/* ── Search ── */}
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <div className="relative">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted-text)' }} />
                                <input
                                    type="text"
                                    placeholder="Search messages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-full text-sm focus:outline-none transition-all"
                                    style={{
                                        backgroundColor: 'var(--color-surface-hover)',
                                        color: 'var(--color-primary-text)',
                                        border: '1.5px solid transparent',
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = G.indigo}
                                    onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                                />
                            </div>
                        </div>

                        {/* ── Chat List ── */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">

                            {/* Error */}
                            {error && (
                                <div className="mx-4 my-2 px-3 py-2.5 rounded-xl flex items-center gap-2"
                                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                    <AlertCircle size={14} style={{ color: G.indigo }} />
                                    <span className="text-xs" style={{ color: 'var(--color-muted-text)' }}>{error}</span>
                                </div>
                            )}

                            {/* Skeleton */}
                            {loading && !chats.length && (
                                <div className="px-3 pt-3 space-y-1">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl animate-pulse">
                                            <div className="w-11 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-24 rounded-full" style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                                                <div className="h-2.5 w-36 rounded-full" style={{ backgroundColor: 'var(--color-surface-hover)' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty state */}
                            {filteredChats.length === 0 && !loading && (
                                <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
                                    <div style={{
                                        width: 56, height: 56, borderRadius: '50%',
                                        background: 'rgba(99,102,241,0.12)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <MessageCircle size={26} style={{ color: G.indigo }} />
                                    </div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary-text)' }}>
                                        {searchQuery ? 'No chats found' : 'No conversations yet'}
                                    </p>
                                    {!searchQuery && (
                                        <button
                                            onClick={() => setShowUserSearch(true)}
                                            className="px-4 py-1.5 rounded-full text-xs font-semibold text-white transition-all duration-200"
                                            style={{ background: G.primary, boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            Start a conversation
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Section label */}
                            {!loading && filteredChats.length > 0 && (
                                <div className="px-5 pt-3 pb-1 flex items-center gap-2">
                                    <div style={{ width: 3, height: 14, borderRadius: 999, background: 'linear-gradient(180deg, #6366f1, #06b6d4)' }} />
                                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted-text)' }}>
                                        Recent
                                    </span>
                                </div>
                            )}

                            {/* Chat rows */}
                            <div className="px-2 pb-4">
                                {filteredChats.map((chat) => {
                                    const otherUserId   = chat.user_1_id === user?.id ? chat.user_2_id       : chat.user_1_id;
                                    const otherUsername = chat.user_1_id === user?.id ? chat.user_2_username : chat.user_1_username;
                                    const avatar   = otherUsername[0].toUpperCase();
                                    const isUnread = chat.unread_count > 0;
                                    const isActive = selectedChatId === chat.id;

                                    return (
                                        <div
                                            key={chat.id}
                                            onClick={() => handleSelectChat(chat.id, otherUserId)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
                                            style={{ backgroundColor: isActive ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                            {/* Avatar with story-ring gradient when unread */}
                                            <div className="relative flex-shrink-0">
                                                <div
                                                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                                    style={{
                                                        background: G.primary,
                                                        boxShadow: isUnread
                                                            ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${G.indigo}`
                                                            : '0 2px 8px rgba(99,102,241,0.25)'
                                                    }}
                                                >
                                                    {avatar}
                                                </div>
                                                {/* Online dot */}
                                                <div style={{
                                                    position:'absolute', bottom:0, right:0,
                                                    width:11, height:11, borderRadius:'50%',
                                                    backgroundColor: G.green,
                                                    border: '2px solid var(--color-surface)'
                                                }} />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm truncate" style={{ fontWeight: isUnread ? 700 : 500, color: 'var(--color-primary-text)' }}>
                                                        {otherUsername}
                                                    </span>
                                                    <span className="text-xs flex-shrink-0" style={{ color: isUnread ? G.indigo : 'var(--color-muted-text)', fontWeight: isUnread ? 600 : 400 }}>
                                                        {formatTime(chat.last_message_at)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                                    <p className="text-xs truncate" style={{ color: isUnread ? 'var(--color-primary-text)' : 'var(--color-muted-text)', fontWeight: isUnread ? 500 : 400 }}>
                                                        {chat.last_message_preview || 'No messages yet'}
                                                    </p>
                                                    {isUnread && (
                                                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                            style={{ background: G.primary }}>
                                                            {chat.unread_count > 9 ? '9+' : chat.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ══════════════ RIGHT PANEL ══════════════ */}
                    <div
                        className={`flex flex-col h-screen absolute lg:relative w-full lg:w-auto z-10 transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
                        style={{ backgroundColor: 'var(--color-app-bg)' }}
                    >
                        {selectedChatId && selectedUserId ? (
                            <ChatWindow chatId={selectedChatId} userId={selectedUserId} onBack={handleBackToList} />
                        ) : selectedUserId && !selectedChatId ? (
                            <ChatWindow userId={selectedUserId} onBack={handleBackToList} />
                        ) : showUserSearch ? (
                            <UserSearch onUserSelected={handleUserSelected} onBack={() => setShowUserSearch(false)} />
                        ) : (
                            <div className="hidden lg:flex flex-col items-center justify-center h-full gap-4">
                                {/* Icon cluster — same pattern as Feed empty state */}
                                <div className="flex items-center gap-3 mb-2">
                                    <div style={{ width:44, height:44, borderRadius:'50%', background:G.rose, display:'flex', alignItems:'center', justifyContent:'center', transform:'rotate(-8deg) translateY(4px)', boxShadow:'0 6px 16px rgba(244,63,94,0.35)' }}>
                                        <MessageCircle size={20} style={{ color:'#fff' }} />
                                    </div>
                                    <div style={{ width:60, height:60, borderRadius:'50%', background:G.primary, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 20px rgba(99,102,241,0.4)' }}>
                                        <MessageCircle size={28} style={{ color:'#fff' }} />
                                    </div>
                                    <div style={{ width:44, height:44, borderRadius:'50%', background:G.cyan, display:'flex', alignItems:'center', justifyContent:'center', transform:'rotate(8deg) translateY(4px)', boxShadow:'0 6px 16px rgba(6,182,212,0.35)' }}>
                                        <MessageCircle size={20} style={{ color:'#fff' }} />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary-text)' }}>Your messages</h2>
                                <p className="text-sm text-center max-w-xs" style={{ color: 'var(--color-muted-text)' }}>
                                    Send private messages to a friend or start a new conversation
                                </p>
                                <button
                                    onClick={() => setShowUserSearch(true)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all duration-200 flex items-center gap-2"
                                    style={{ background: G.primary, boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <Edit size={15} /> Send message
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes msgOrbFloat {
                    0%, 100% { transform: translate(0,0) scale(1); }
                    33% { transform: translate(25px,-35px) scale(1.07); }
                    66% { transform: translate(-15px,18px) scale(0.95); }
                }
                .msg-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                    animation: msgOrbFloat 10s ease-in-out infinite;
                }
                .msg-orb-1 {
                    width: 380px; height: 380px;
                    background: radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%);
                    top: -100px; left: -80px;
                    animation-delay: 0s;
                }
                .msg-orb-2 {
                    width: 300px; height: 300px;
                    background: radial-gradient(circle, rgba(6,182,212,0.14), transparent 70%);
                    bottom: 8%; right: -60px;
                    animation-delay: -4s;
                }
                .msg-orb-3 {
                    width: 200px; height: 200px;
                    background: radial-gradient(circle, rgba(244,63,94,0.1), transparent 70%);
                    top: 45%; left: 38%;
                    animation-delay: -7s;
                }
            `}</style>
        </div>
    );
}
