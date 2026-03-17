import React, { useState, useEffect } from 'react';
import { Search, Send, X, MessageCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/chat/ChatWindow';
import UserSearch from '../components/chat/UserSearch';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Messages({ setView }) {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const token = localStorage.getItem('access_token');

    // Fetch chats
    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [page]);

    const fetchChats = async () => {
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
            }
        } catch (err) {
            setError('Failed to load chats');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectChat = (chatId, userId) => {
        setSelectedChatId(chatId);
        setSelectedUserId(userId);
        setShowUserSearch(false);
    };

    const handleUserSelected = (userId) => {
        setSelectedUserId(userId);
        setShowUserSearch(false);
    };

    const handleBackToList = () => {
        setSelectedChatId(null);
        setSelectedUserId(null);
        fetchChats(); // Refresh chats when returning
    };

    // Filter chats by search query
    const filteredChats = chats.filter(chat => {
        const otherUserName = chat.user_1_id === user?.id 
            ? chat.user_2_username 
            : chat.user_1_username;
        return otherUserName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div
            className="min-h-screen w-full flex overflow-hidden custom-scrollbar"
            style={{
                backgroundColor: 'var(--color-app-bg)',
                color: 'var(--color-primary-text)',
                transition: 'background-color 0.3s ease'
            }}
        >
            {/* ── Animated ambient background orbs ── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="feed-orb feed-orb-1" />
                <div className="feed-orb feed-orb-2" />
                <div className="feed-orb feed-orb-3" />
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-0 h-screen">
                    
                    {/* ══════════════ CHATS LIST PANEL ══════════════ */}
                    {!selectedChatId && !selectedUserId && (
                        <div className="lg:col-span-1 flex flex-col h-screen border-r" style={{ borderColor: 'var(--color-border)' }}>
                            {/* Header */}
                            <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                                <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary-text)' }}>
                                    Messages
                                </h1>
                                
                                {/* Search Box */}
                                <div className="relative mb-3">
                                    <Search size={18} className="absolute left-3 top-3" style={{ color: 'var(--color-muted-text)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search chats..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                                        style={{
                                            backgroundColor: 'var(--color-surface-hover)',
                                            color: 'var(--color-primary-text)',
                                            border: `1.5px solid ${searchQuery ? '#6366f1' : 'var(--color-border)'}`
                                        }}
                                    />
                                </div>

                                {/* New Chat Button */}
                                <button
                                    onClick={() => setShowUserSearch(true)}
                                    className="w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <MessageCircle size={16} /> New Chat
                                </button>
                            </div>

                            {/* Chats List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {loading && !chats.length && (
                                    <div className="p-4 text-center" style={{ color: 'var(--color-muted-text)' }}>
                                        <div className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
                                    </div>
                                )}

                                {error && (
                                    <div className="m-3 p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                        <AlertCircle size={16} />
                                        <span className="text-xs">{error}</span>
                                    </div>
                                )}

                                {filteredChats.length === 0 && !loading ? (
                                    <div className="p-6 text-center">
                                        <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
                                        <p style={{ color: 'var(--color-muted-text)' }} className="text-sm">
                                            {searchQuery ? 'No chats found' : 'No chats yet. Start a new one!'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1 p-2">
                                        {filteredChats.map((chat) => {
                                            const otherUserId = chat.user_1_id === user?.id ? chat.user_2_id : chat.user_1_id;
                                            const otherUsername = chat.user_1_id === user?.id ? chat.user_2_username : chat.user_1_username;
                                            const avatar = otherUsername[0].toUpperCase();

                                            return (
                                                <div
                                                    key={chat.id}
                                                    onClick={() => handleSelectChat(chat.id, otherUserId)}
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
                                                        {avatar}
                                                    </div>

                                                    {/* Chat Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm truncate">
                                                            {otherUsername}
                                                        </h3>
                                                        <p 
                                                            className="text-xs truncate"
                                                            style={{ color: 'var(--color-muted-text)' }}
                                                        >
                                                            {chat.last_message_preview || 'No messages yet'}
                                                        </p>
                                                    </div>

                                                    {/* Time & Unread */}
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span 
                                                            className="text-xs"
                                                            style={{ color: 'var(--color-muted-text)' }}
                                                        >
                                                            {chat.last_message_at}
                                                        </span>
                                                        {chat.unread_count > 0 && (
                                                            <span 
                                                                className="px-2 py-1 rounded-full text-xs font-bold text-white"
                                                                style={{ background: '#ef4444' }}
                                                            >
                                                                {chat.unread_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══════════════ CHAT WINDOW OR SELECT SCREEN ══════════════ */}
                    <div className="lg:col-span-1 flex flex-col h-screen">
                        {selectedChatId && selectedUserId ? (
                            <ChatWindow
                                chatId={selectedChatId}
                                userId={selectedUserId}
                                onBack={handleBackToList}
                            />
                        ) : selectedUserId && !selectedChatId ? (
                            <ChatWindow
                                userId={selectedUserId}
                                onBack={handleBackToList}
                            />
                        ) : showUserSearch ? (
                            <UserSearch
                                onUserSelected={handleUserSelected}
                                onBack={() => setShowUserSearch(false)}
                            />
                        ) : (
                            <div className="hidden lg:flex flex-col items-center justify-center h-full">
                                <MessageCircle size={64} className="mb-4 opacity-30" />
                                <h2 className="text-xl font-bold mb-2">Select a chat to start messaging</h2>
                                <p style={{ color: 'var(--color-muted-text)' }}>
                                    Choose an existing chat or start a new one
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes feedSlideIn {
                    from { transform: translateY(120%) scale(0.9); opacity: 0; }
                    to   { transform: translateY(0) scale(1); opacity: 1; }
                }
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
