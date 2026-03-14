import React, { useState } from 'react';
import { Search, Send, MoreVertical, Phone, Video, Smile, Paperclip, MessageSquare } from 'lucide-react';

const MESSAGES = [];

export default function Messages() {
    const [selectedId, setSelectedId] = useState(null);
    const activeMsg = MESSAGES.find(m => m.id === selectedId);

    return (
        <div className="h-full flex text-primary-text overflow-hidden">
            {/* Sidebar List */}
            <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-neutral-200 bg-white`}>
                <div className="p-4 border-b border-neutral-200">
                    <h2 className="text-xl font-bold text-primary-text mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-muted-text" size={18} />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-black outline-none text-primary-text"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {MESSAGES.length > 0 ? (
                        MESSAGES.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => setSelectedId(msg.id)}
                                className={`p-4 hover:bg-neutral-50 cursor-pointer transition-colors border-b border-neutral-100 ${selectedId === msg.id ? 'bg-neutral-100' : ''}`}
                            >
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center font-bold text-white shadow-sm">
                                            {msg.avatar}
                                        </div>
                                        {msg.unread > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-black border-2 border-white shadow-sm">
                                                {msg.unread}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-primary-text truncate">{msg.name}</h3>
                                            <span className="text-xs text-muted-text">{msg.time}</span>
                                        </div>
                                        <p className={`text-sm truncate ${msg.unread > 0 ? 'text-primary-text font-bold' : 'text-muted-text'}`}>
                                            {msg.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-text">
                            <p>No messages found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-app-bg`}>
                {activeMsg ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-white shadow-sm">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="md:hidden text-muted-text hover:text-primary-text"
                                >
                                    ←
                                </button>
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-bold text-white shadow-sm">
                                    {activeMsg.avatar}
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary-text">{activeMsg.name}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-black"></div>
                                        <span className="text-xs text-muted-text">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 text-muted-text">
                                <Phone size={20} className="hover:text-primary-text cursor-pointer" />
                                <Video size={20} className="hover:text-primary-text cursor-pointer" />
                                <MoreVertical size={20} className="hover:text-primary-text cursor-pointer" />
                            </div>
                        </div>

                        {/* Messages List - Placeholder content */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-app-bg/50">
                            <div className="flex justify-center my-4">
                                <span className="text-xs text-muted-text bg-neutral-200 px-2 py-1 rounded-full">Today</span>
                            </div>
                            {/* In a real app, map through activeMsg.history */}
                            <div className="flex justify-end">
                                <div className="bg-black text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md">
                                    <p>Hey! How's the project going?</p>
                                    <span className="text-[10px] text-white/70 block text-right mt-1">10:42 AM</span>
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <div className="bg-white border border-neutral-200 text-primary-text px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm">
                                    <p>Making good progress! Just updating the color palette now.</p>
                                    <span className="text-[10px] text-muted-text block text-right mt-1">10:45 AM</span>
                                </div>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-neutral-200">
                            <div className="flex gap-3 items-center">
                                <button className="text-muted-text hover:text-primary-text p-2 hover:bg-neutral-100 rounded-full transition-colors">
                                    <Paperclip size={20} />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-full py-3 pl-4 pr-10 text-primary-text focus:border-black outline-none"
                                    />
                                    <button className="absolute right-3 top-3 text-muted-text hover:text-black">
                                        <Smile size={20} />
                                    </button>
                                </div>
                                <button className="p-3 bg-black hover:bg-neutral-800 text-white rounded-full transition-colors shadow-lg">
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-text bg-app-bg">
                        <div className="w-20 h-20 bg-neutral-200 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={32} className="text-neutral-400" />
                        </div>
                        <h3 className="text-xl font-bold text-primary-text mb-2">Select a message</h3>
                        <p>Choose from your existing conversations or start a new one.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
