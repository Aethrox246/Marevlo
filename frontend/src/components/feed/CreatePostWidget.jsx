import React, { useState, useRef } from 'react';
import { Image, Calendar, Newspaper, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CreatePostWidget({ onPost, onOpenEventModal, onOpenArticleModal }) {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
        }
    };

    const handleSubmit = () => {
        if (!content.trim() && !selectedImage) return;

        onPost({
            content,
            image: selectedImage
        });

        setContent("");
        setSelectedImage(null);
    };

    return (
        <div className="bg-surface border border-neutral-200 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-neutral-300 transition-all duration-300">
            {/* Glow Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neutral-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center font-bold text-white text-lg shrink-0 border-2 border-surface shadow-md">
                    {user ? user.name[0].toUpperCase() : "U"}
                </div>
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full bg-transparent border border-neutral-200 rounded-xl px-4 py-3 text-sm text-primary-text focus:ring-1 focus:ring-black focus:border-black outline-none placeholder-muted-text min-h-[80px] resize-none transition-all focus:bg-neutral-50"
                    />
                </div>
            </div>

            {/* Selected Image Preview */}
            {selectedImage && (
                <div className="relative mb-4 ml-16 mr-2">
                    <img src={selectedImage} alt="Preview" className="w-full max-h-80 object-cover rounded-xl border border-white/10" />
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center px-2 pt-2 border-t border-neutral-100">
                <div className="flex gap-1 md:gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 text-muted-text hover:bg-neutral-100 rounded-lg transition-colors group hover:text-primary-text"
                    >
                        <Image size={18} className="text-neutral-500 group-hover:text-black group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold hidden md:inline">Media</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                    />

                    <button
                        onClick={onOpenEventModal}
                        className="flex items-center gap-2 px-3 py-2 text-muted-text hover:bg-neutral-100 rounded-lg transition-colors group hover:text-primary-text"
                    >
                        <Calendar size={18} className="text-neutral-500 group-hover:text-black group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold hidden md:inline">Event</span>
                    </button>

                    <button
                        onClick={onOpenArticleModal}
                        className="flex items-center gap-2 px-3 py-2 text-muted-text hover:bg-neutral-100 rounded-lg transition-colors group hover:text-primary-text"
                    >
                        <Newspaper size={18} className="text-neutral-500 group-hover:text-black group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold hidden md:inline">Article</span>
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!content.trim() && !selectedImage}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${content.trim() || selectedImage
                        ? 'bg-black text-white hover:bg-neutral-800 shadow-md hover:-translate-y-0.5'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        }`}
                >
                    Post
                </button>
            </div>
        </div>
    );
}
