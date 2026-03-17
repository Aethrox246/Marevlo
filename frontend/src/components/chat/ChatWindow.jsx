import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ChatWindow({ chatId, userId, onBack }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [otherUser, setOtherUser] = useState(null);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('access_token');

    // Fetch chat or create new one
    useEffect(() => {
        if (userId) {
            fetchChat();
            const interval = setInterval(fetchChat, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
        }
    }, [userId]);

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

        try {
            // First create chat if it doesn't exist (by fetching)
            let currentChatId = chatId;
            
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
                }
            }

            // Send message
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
                setMessages(prev => [...prev, newMessage]);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setInput(messageContent); // Restore input on error
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
                        {otherUser?.username?.[0].toUpperCase()}
                    </div>

                    <div>
                        <h2 className="font-semibold text-base">{otherUser?.username || 'User'}</h2>
                        <p className="text-xs" style={{ color: 'var(--color-muted-text)' }}>
                            Active now
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
                                {otherUser?.username?.[0].toUpperCase()}
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
                                    : 'none'
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
                                {message.time_ago}
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
                        onKeyPress={handleKeyPress}
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
