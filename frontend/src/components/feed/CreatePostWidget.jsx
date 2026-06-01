import React, { useState, useRef } from 'react';
import { Image, Calendar, Newspaper, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MAX_IMAGES = 10;
const MAX_SIZE = 5 * 1024 * 1024;

export default function CreatePostWidget({ onPost, onOpenEventModal, onOpenArticleModal }) {
    const { user, uploadFeedImage } = useAuth();
    const [content, setContent] = useState("");
    // Each entry: { file, previewUrl }
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageSelect = (e) => {
        const picked = Array.from(e.target.files || []);
        e.target.value = ''; // allow re-picking the same file
        if (picked.length === 0) return;

        const remainingSlots = MAX_IMAGES - images.length;
        const accepted = [];
        for (const file of picked.slice(0, remainingSlots)) {
            if (!file.type.startsWith('image/')) continue;
            if (file.size > MAX_SIZE) {
                alert(`${file.name} is over 5 MB and was skipped`);
                continue;
            }
            accepted.push({ file, previewUrl: URL.createObjectURL(file) });
        }
        if (accepted.length === 0) return;
        setImages(prev => [...prev, ...accepted]);
    };

    const removeImage = (idx) => {
        setImages(prev => {
            const next = [...prev];
            const [removed] = next.splice(idx, 1);
            if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
            return next;
        });
    };

    const handleSubmit = async () => {
        if (uploading) return;
        if (!content.trim() && images.length === 0) return;

        let imageObjectKeys = [];
        if (images.length > 0) {
            setUploading(true);
            try {
                imageObjectKeys = await Promise.all(images.map(({ file }) => uploadFeedImage(file)));
            } catch (err) {
                alert('Image upload failed: ' + err.message);
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        await onPost({
            content,
            imageObjectKeys,
        });

        // Cleanup local previews
        images.forEach(img => URL.revokeObjectURL(img.previewUrl));
        setContent("");
        setImages([]);
    };

    const canSubmit = !uploading && (content.trim() || images.length > 0);

    return (
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-border transition-all duration-300">
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
                        className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-1 focus:ring-black focus:border-black outline-none placeholder-muted-text min-h-[80px] resize-none transition-all focus:bg-muted"
                    />
                </div>
            </div>

            {/* Selected images preview — horizontal scroll for multi-image */}
            {images.length > 0 && (
                <div className="mb-4 ml-16 mr-2 flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative shrink-0">
                            <img
                                src={img.previewUrl}
                                alt={`Preview ${idx + 1}`}
                                className="w-32 h-32 object-cover rounded-xl border border-white/10"
                            />
                            <button
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-between items-center px-2 pt-2 border-t border-border">
                <div className="flex gap-1 md:gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || images.length >= MAX_IMAGES}
                        className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors group hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Image size={18} className="text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold hidden md:inline">
                            Media{images.length > 0 ? ` (${images.length}/${MAX_IMAGES})` : ''}
                        </span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageSelect}
                    />

                    <button
                        onClick={onOpenEventModal}
                        className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors group hover:text-foreground"
                    >
                        <Calendar size={18} className="text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold hidden md:inline">Event</span>
                    </button>

                    <button
                        onClick={onOpenArticleModal}
                        className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors group hover:text-foreground"
                    >
                        <Newspaper size={18} className="text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold hidden md:inline">Article</span>
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${canSubmit
                        ? 'bg-black text-white hover:bg-neutral-800 shadow-md hover:-translate-y-0.5'
                        : 'bg-muted text-muted-foreground/70 cursor-not-allowed'
                        }`}
                >
                    {uploading ? 'Uploading…' : 'Post'}
                </button>
            </div>
        </div>
    );
}
