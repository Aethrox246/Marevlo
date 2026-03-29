import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL;

export default function ChatWindow({ chatId: chatIdProp, userId, onBack }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [otherUser, setOtherUser] = useState(null);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('access_token');

    // Mutable ref for chatId so the WS listener always has the latest value
    // (chatIdProp can be null on first render for new chats)
    const chatIdRef = useRef(chatIdProp);
    useEffect(() => { chatIdRef.current = chatIdProp; }, [chatIdProp]);

    // Fetch chat on initial load
    useEffect(() => {
        if (userId) {
            fetchChat();
        }
    }, [userId]);

    // WebSocket listener — uses refs, not stale closure values
    useEffect(() => {
        const handleWsMessage = (event) => {
            const data = event.detail;

            if (data.type === 'new_message') {
                const currentChatId = chatIdRef.current;
                const msg = data.message;

                // Match if: same chat_id, OR the message involves the user we're chatting with
                const isThisChat =
                    (currentChatId && String(data.chat_id) === String(currentChatId)) ||
                    msg.sender_id === userId ||
                    msg.receiver_id === userId;

                if (!isThisChat) return;

                // Update chatIdRef if we learned the chat_id (new chat scenario)
                if (!currentChatId && data.chat_id) {
                    chatIdRef.current = data.chat_id;
                }

                setMessages(prev => {
                    // Skip if we already have this exact message id
                    if (prev.find(m => m.id === msg.id)) return prev;

                    // If this is our own message echoed back via WS, replace the optimistic version
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

                // Mark as read if I'm the receiver
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
            }
            // read_receipt handling can be added here
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
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
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
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
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

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
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

                <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <div
                className="p-4 border-t"
                style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)'
                }}
            >
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 rounded-full text-sm focus:outline-none transition-all"
                        style={{
                            backgroundColor: 'var(--color-surface-hover)',
                            color: 'var(--color-primary-text)',
                            border: `1.5px solid ${input ? '#6366f1' : 'var(--color-border)'}`
                        }}
                        disabled={sending}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || sending}
                        className="px-4 py-3 rounded-full font-semibold text-white transition-all duration-200 flex items-center justify-center"
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
                            height: '44px'
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
        </div>
    );
}
