import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

export default function ChatWindow({ chatId: chatIdProp, userId, onBack }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [otherUser, setOtherUser] = useState(null);
    const [sending, setSending] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const token = localStorage.getItem('access_token');

    // Mutable ref for chatId so the WS listener always has the latest value
    const chatIdRef = useRef(chatIdProp);
    useEffect(() => { chatIdRef.current = chatIdProp; }, [chatIdProp]);

    // Auto-grow textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            const newHeight = Math.min(inputRef.current.scrollHeight, 120);
            inputRef.current.style.height = newHeight + 'px';
        }
    }, [input]);

    // Fetch chat on initial load
    useEffect(() => {
        if (userId) {
            fetchChat();
        }
    }, [userId]);

    // WebSocket listener
    useEffect(() => {
        const handleWsMessage = (event) => {
            const data = event.detail;

            if (data.type === 'new_message') {
                const currentChatId = chatIdRef.current;
                const msg = data.message;

                const isThisChat =
                    (currentChatId && String(data.chat_id) === String(currentChatId)) ||
                    msg.sender_id === userId ||
                    msg.receiver_id === userId;

                if (!isThisChat) return;

                if (!currentChatId && data.chat_id) {
                    chatIdRef.current = data.chat_id;
                }

                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev;

                    if (msg.sender_id === user?.id) {
                        const optimisticIdx = prev.findIndex(m =>
                            m._optimistic && m.content === msg.content && m.sender_id === msg.sender_id
                        );
                        if (optimisticIdx !== -1) {
                            const updated = [...prev];
                            updated[optimisticIdx] = msg;
                            return updated;
                        }
                    }

                    return [...prev, msg];
                });

                if (msg.sender_id !== user?.id && data.chat_id) {
                    fetch(`${API_BASE}/chat/chats/${data.chat_id}/messages/${msg.id}/read`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }).catch(() => {});
                }
            } else if (data.type === 'status_update') {
                if (data.user_id === userId) {
                    setOtherUser(prev => prev ? { ...prev, isOnline: data.status === 'online' } : prev);
                }
            } else if (data.type === 'typing_indicator') {
                if (data.user_id === userId) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 3000);
                }
            }
        };

        window.addEventListener('ws_message', handleWsMessage);
        return () => window.removeEventListener('ws_message', handleWsMessage);
    }, [userId, user?.id, token]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchChat = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE}/chat/chats/${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages);
                // Store the resolved chatId
                if (data.id) chatIdRef.current = data.id;
                setOtherUser({
                    id: data.user_1_id === user?.id ? data.user_2_id : data.user_1_id,
                    username: data.user_1_id === user?.id ? data.user_2_username : data.user_1_username
                });
            }
        } catch (err) {
            console.error('Failed to load chat:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !userId) return;

        const messageContent = input;
        setInput('');
        setSending(true);

        // Optimistic: show the message immediately
        const optimisticMsg = {
            id: `_opt_${Date.now()}`,
            sender_id: user?.id,
            content: messageContent,
            created_at: new Date().toISOString(),
            time_ago: 'Just now',
            _optimistic: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            // Resolve chatId if we don't have one yet (new chat)
            let currentChatId = chatIdRef.current;

            if (!currentChatId) {
                const chatResponse = await fetch(
                    `${API_BASE}/chat/chats/${userId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                if (chatResponse.ok) {
                    const chatData = await chatResponse.json();
                    currentChatId = chatData.id;
                    chatIdRef.current = currentChatId;
                }
            }

            // Send message via REST
            const response = await fetch(
                `${API_BASE}/chat/chats/${currentChatId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ content: messageContent })
                }
            );

            if (response.ok) {
                const newMessage = await response.json();
                // Replace optimistic message with the real server response
                setMessages(prev => prev.map(m =>
                    m.id === optimisticMsg.id ? newMessage : m
                ));
            } else {
                // Remove optimistic message on failure
                setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
                setInput(messageContent);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setInput(messageContent);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* ── Header ── */}
            <div
                className="p-4 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:opacity-70 transition-opacity lg:hidden"
                        style={{ backgroundColor: 'var(--color-surface-hover)' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: getGradientFromUsername(otherUser?.username || '?') }}
                    >
                        {otherUser?.username?.[0]?.toUpperCase() || '?'}
                    </div>

                    <div>
                        <h2 className="font-semibold text-base">{otherUser?.username || 'User'}</h2>
                        <p className="text-xs flex items-center gap-1" style={{ color: otherUser?.isOnline ? '#10b981' : 'var(--color-muted-text)' }}>
                            {otherUser?.isOnline && (
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}></span>
                            )}
                            {otherUser?.isOnline ? 'Online now' : 'Offline'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="p-2.5 rounded-lg hover:opacity-70 transition-opacity"
                        style={{ backgroundColor: 'var(--color-surface-hover)' }}
                    >
                        <Phone size={18} style={{ color: '#6366f1' }} />
                    </button>
                    <button
                        className="p-2.5 rounded-lg hover:opacity-70 transition-opacity"
                        style={{ backgroundColor: 'var(--color-surface-hover)' }}
                    >
                        <Video size={18} style={{ color: '#6366f1' }} />
                    </button>
                    <button
                        className="p-2.5 rounded-lg hover:opacity-70 transition-opacity"
                        style={{ backgroundColor: 'var(--color-surface-hover)' }}
                    >
                        <MoreVertical size={18} style={{ color: 'var(--color-muted-text)' }} />
                    </button>
                </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {loading && !messages.length && (
                    <div className="flex justify-center py-8">
                        <Loader size={24} className="animate-spin" style={{ color: '#6366f1' }} />
                    </div>
                )}

                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                            style={{ background: getGradientFromUsername(otherUser?.username || '?') }}
                        >
                            <span className="text-2xl font-bold text-white">
                                {otherUser?.username?.[0]?.toUpperCase() || '?'}
                            </span>
                        </div>
                        <h3 className="font-semibold mb-1">
                            {otherUser?.username}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--color-muted-text)' }}>
                            Start the conversation by sending a message
                        </p>
                    </div>
                )}

                {messages.map((message, idx) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'} message-entrance`}
                        style={{
                            animation: `messageSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.05}s both`,
                        }}
                    >
                        <div
                            className="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl"
                            style={{
                                background: message.sender_id === user?.id
                                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                    : 'var(--color-surface)',
                                color: message.sender_id === user?.id ? '#fff' : 'var(--color-primary-text)',
                                boxShadow: message.sender_id === user?.id
                                    ? '0 4px 12px rgba(99,102,241,0.3)'
                                    : 'none',
                                opacity: message._optimistic ? 0.7 : 1,
                            }}
                        >
                            <p className="break-words text-sm">{message.content}</p>
                            <p
                                className="text-xs mt-1"
                                style={{
                                    color: message.sender_id === user?.id
                                        ? 'rgba(255,255,255,0.7)'
                                        : 'var(--color-muted-text)'
                                }}
                            >
                                {message._optimistic
                                    ? 'Sending...'
                                    : message.time_ago && message.time_ago !== 'null'
                                        ? message.time_ago
                                        : message.created_at
                                            ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : ''}
                            </p>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div
                            className="px-4 py-3 rounded-2xl"
                            style={{
                                background: 'var(--color-surface)',
                                display: 'flex',
                                gap: '6px',
                                alignItems: 'center',
                            }}
                        >
                            <span className="typing-dot" style={{ animation: 'typingBounce 1.4s infinite' }} />
                            <span className="typing-dot" style={{ animation: 'typingBounce 1.4s infinite 0.2s' }} />
                            <span className="typing-dot" style={{ animation: 'typingBounce 1.4s infinite 0.4s' }} />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <div
                className="p-4 border-t transition-all duration-300"
                style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    boxShadow: isInputFocused ? '0 -4px 12px rgba(99,102,241,0.15)' : 'none',
                }}
            >
                <div className="flex gap-3 items-flex-end">
                    <div style={{ flex: 1, position: 'relative' }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            placeholder="Type a message..."
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none transition-all resize-none custom-scrollbar"
                            style={{
                                backgroundColor: 'var(--color-surface-hover)',
                                color: 'var(--color-primary-text)',
                                border: `2px solid ${isInputFocused ? '#6366f1' : 'var(--color-border)'}`,
                                minHeight: '44px',
                                maxHeight: '120px',
                                boxShadow: isInputFocused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                            }}
                            disabled={sending}
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || sending}
                        className="px-4 py-3 rounded-full font-semibold text-white transition-all duration-200 flex items-center justify-center flex-shrink-0"
                        style={{
                            background: input.trim() && !sending
                                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                : 'var(--color-border)',
                            boxShadow: input.trim() && !sending
                                ? '0 4px 12px rgba(99,102,241,0.3)'
                                : 'none',
                            cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                            opacity: input.trim() && !sending ? 1 : 0.5,
                            minWidth: '44px',
                            height: '44px',
                            transform: sending ? 'scale(0.95)' : 'scale(1)',
                        }}
                    >
                        {sending ? (
                            <Loader size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes messageSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes typingBounce {
                    0%, 60%, 100% {
                        opacity: 0.5;
                        transform: translateY(0);
                    }
                    30% {
                        opacity: 1;
                        transform: translateY(-10px);
                    }
                }
                
                .typing-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: var(--color-muted-text);
                }
                
                textarea::-webkit-scrollbar {
                    width: 6px;
                }
                
                textarea::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                textarea::-webkit-scrollbar-thumb {
                    background: #999;
                    border-radius: 3px;
                }
            `}</style>
        </div>
    );
}
