import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, X, Send, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL;

export default function MessengerWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [chats, setChats] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = localStorage.getItem('access_token');

    // Fetch initial chats
    useEffect(() => {
        if (token) {
            fetchChats();
        }
    }, [token]);

    // Listen to WebSocket events to refresh chats
    useEffect(() => {
        const handleWsMessage = (event) => {
            const data = event.detail;
            if (data.type === 'new_message' || data.type === 'read_receipt') {
                if (token) {
                    fetchChats();
                }
            }
        };

        window.addEventListener('ws_message', handleWsMessage);
        return () => window.removeEventListener('ws_message', handleWsMessage);
    }, [token]);

    const fetchChats = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE}/chat/chats?limit=5`,
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
                const total = data.chats.reduce((sum, chat) => sum + chat.unread_count, 0);
                setUnreadCount(total);
            }
        } catch (err) {
            console.error('Failed to load chats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenMessages = () => {
        navigate('/messages');
        setIsOpen(false);
    };

    const handleChatClick = (userId) => {
        navigate(`/messages?user=${userId}`);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {/* Chat Popup */}
            {isOpen && (
                <div 
                    className="w-96 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up origin-bottom-right"
                    style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    {/* Header */}
                    <div 
                        className="p-4 border-b flex justify-between items-center"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <h3 className="font-bold text-base flex items-center gap-2">
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                    style={{ backgroundColor: '#10b981' }}></span>
                                <span className="relative inline-flex rounded-full h-3 w-3"
                                    style={{ backgroundColor: '#10b981' }}></span>
                            </div>
                            <span style={{ color: 'var(--color-primary-text)' }}>Messages</span>
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 rounded-lg hover:opacity-70 transition-opacity"
                            style={{ backgroundColor: 'var(--color-surface-hover)' }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-2.5" style={{ color: 'var(--color-muted-text)' }} />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none transition-all"
                                style={{
                                    backgroundColor: 'var(--color-surface-hover)',
                                    color: 'var(--color-primary-text)',
                                    border: '1.5px solid var(--color-border)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                        {loading && chats.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <div className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                                    style={{ color: '#6366f1' }}></div>
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <MessageSquare size={32} className="mb-3 opacity-30" />
                                <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--color-primary-text)' }}>No chats yet</h4>
                                <p className="text-xs" style={{ color: 'var(--color-muted-text)' }}>
                                    Start a conversation with someone
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1 p-2">
                                {chats.map((chat) => {
                                    const otherUserId = chat.user_1_id === user?.id ? chat.user_2_id : chat.user_1_id;
                                    const otherUsername = chat.user_1_id === user?.id ? chat.user_2_username : chat.user_1_username;
                                    const avatar = otherUsername[0].toUpperCase();

                                    return (
                                        <div
                                            key={chat.id}
                                            onClick={() => handleChatClick(otherUserId)}
                                            className="p-3 rounded-xl cursor-pointer transition-all flex items-center gap-2"
                                            style={{ backgroundColor: 'var(--color-surface)' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                                        >
                                            {/* Avatar */}
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                            >
                                                {avatar}
                                            </div>

                                            {/* Chat Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold truncate">
                                                    {otherUsername}
                                                </h4>
                                                <p className="text-xs truncate" style={{ color: 'var(--color-muted-text)' }}>
                                                    {chat.last_message_preview || 'No message'}
                                                </p>
                                            </div>

                                            {/* Unread Badge */}
                                            {chat.unread_count > 0 && (
                                                <div
                                                    className="px-2 py-1 rounded-full text-xs font-bold text-white flex-shrink-0"
                                                    style={{ backgroundColor: '#ef4444' }}
                                                >
                                                    {chat.unread_count > 9 ? '9+' : chat.unread_count}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div 
                        className="p-3 border-t text-center"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <button 
                            onClick={handleOpenMessages}
                            className="w-full px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Send size={16} /> Full Messages
                        </button>
                    </div>
                </div>
            )}

            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                style={{
                    background: isOpen 
                        ? 'var(--color-surface)' 
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: isOpen ? '2px solid var(--color-border)' : 'none',
                    color: isOpen ? 'var(--color-primary-text)' : '#fff',
                    boxShadow: isOpen 
                        ? '0 4px 20px rgba(99,102,241,0.2)'
                        : '0 8px 30px rgba(99,102,241,0.4)'
                }}
                title="Messages"
            >
                {isOpen ? (
                    <ChevronDown size={28} />
                ) : (
                    <>
                        <MessageSquare size={24} fill="currentColor" />
                        {unreadCount > 0 && (
                            <div
                                className="absolute top-0 right-0 flex items-center justify-center"
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: '#ef4444',
                                    borderRadius: '50%',
                                    border: '2px solid white',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </>
                )}
            </button>
        </div>
    );
}
