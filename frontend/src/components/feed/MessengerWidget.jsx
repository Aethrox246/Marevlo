import React, { useState } from 'react';
import { MessageSquare, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MessengerWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {/* Chat Window (Popup) */}
            {isOpen && (
                <div className="w-80 bg-surface border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up origin-bottom-right">
                    {/* Header */}
                    <div className="bg-neutral-50 p-4 border-b border-neutral-100 flex justify-between items-center">
                        <h3 className="font-bold text-primary-text flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            Messages
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-muted-text hover:text-black transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-neutral-100 bg-white">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-neutral-100 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none"
                        />
                    </div>

                    {/* List - Empty State */}
                    <div className="max-h-80 overflow-y-auto p-8 bg-white flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={24} className="text-neutral-400" />
                        </div>
                        <h4 className="text-sm font-bold text-primary-text mb-1">No Recent Messages</h4>
                        <p className="text-xs text-muted-text max-w-[200px] mb-4">
                            Connect with other developers to start a conversation.
                        </p>
                        <button
                            onClick={() => navigate('/messages')}
                            className="px-4 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-neutral-800 transition-colors"
                        >
                            Start Messaging
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-center">
                        <button onClick={() => navigate('/messages')} className="text-xs font-bold text-black hover:underline">
                            View all messages
                        </button>
                    </div>
                </div>
            )}

            {/* FAB (Floating Action Button) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-neutral-100 text-black border border-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
            >
                {isOpen ? (
                    <ChevronDown size={28} />
                ) : (
                    <>
                        <MessageSquare size={24} fill="currentColor" />
                        {/* Notification Badge */}
                        <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
                        </span>
                    </>
                )}
            </button>
        </div>
    );
}
