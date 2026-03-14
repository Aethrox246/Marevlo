import React, { useState } from 'react';
import {
    MoreHorizontal, ThumbsUp, MessageSquare, Repeat, Send,
    Trash2, Calendar, MapPin, Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function FeedPost({ post, onLike, onDelete, onRepost }) {
    const { user } = useAuth();
    const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(false);


    const handleAddComment = () => {
        if (!commentInput.trim()) return;

        if (post.onAddComment) {
            post.onAddComment(post.id, commentInput);
        }
        setCommentInput("");
    };

    return (
        <div className="bg-surface border border-neutral-200 rounded-xl overflow-hidden hover:border-neutral-300 transition-all duration-300 shadow-sm hover:shadow-md">
            {/* Post Header */}
            <div className="p-4 flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-700 shrink-0 border border-neutral-200">
                    {post.avatar}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-bold text-primary-text hover:text-black cursor-pointer hover:underline transition-colors truncate">
                                {post.author}
                            </h3>
                            <p className="text-xs text-muted-text truncate">{post.role}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-text mt-0.5">
                                <span>{post.time}</span>
                                <span>•</span>
                                <Globe size={10} />
                            </div>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setActiveDropdown(!activeDropdown)}
                                className="text-muted-text hover:text-primary-text p-2 rounded-full hover:bg-neutral-100 transition-colors"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                            {activeDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(false)}></div>
                                    <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-neutral-200 rounded-xl shadow-xl z-20 overflow-hidden animate-fade-in-up">
                                        <button
                                            onClick={() => onDelete && onDelete(post.id)}
                                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Post Content */}
            <div className="px-5 pb-3">
                {post.title && (
                    <h2 className="text-xl font-bold text-primary-text mb-2 leading-tight">{post.title}</h2>
                )}

                {/* EVENT CARD */}
                {post.isEvent && post.eventDetails && (
                    <div className="mb-4 bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200">
                        <div className="h-1 bg-black"></div>
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-primary-text mb-2">{post.eventDetails.title}</h3>
                            <div className="flex flex-col gap-2 text-sm text-muted-text">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-neutral-600" />
                                    <span>{new Date(post.eventDetails.date).toLocaleString()}</span>
                                </div>
                                {post.eventDetails.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-neutral-600" />
                                        <span>{post.eventDetails.location}</span>
                                    </div>
                                )}
                            </div>
                            <button className="mt-4 w-full py-2.5 bg-white hover:bg-neutral-50 text-primary-text rounded-lg text-sm font-bold transition-colors border border-neutral-200 shadow-sm">
                                RSVP Now
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-[15px] text-primary-text leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Post Image Attachment */}
            {post.image && (
                <div className="mt-3">
                    <img src={post.image} alt="Post content" className="w-full h-auto max-h-[600px] object-cover border-y border-white/5" />
                </div>
            )}

            {/* Engagement Stats */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-neutral-100 text-xs text-muted-text">
                <div className="flex items-center gap-1 hover:text-black hover:underline cursor-pointer transition-colors">
                    <div className={`p-1 rounded-full ${post.likedByMe ? 'bg-neutral-100' : 'bg-white'}`}>
                        <ThumbsUp size={10} className={post.likedByMe ? "text-black fill-black" : "text-muted-text"} />
                    </div>
                    <span>{post.likes} likes</span>
                </div>
                <div className="flex gap-4">
                    <span onClick={() => setIsCommentsExpanded(!isCommentsExpanded)} className="hover:text-primary-text hover:underline cursor-pointer transition-colors">{post.comments} comments</span>
                    <span className="hover:text-primary-text hover:underline cursor-pointer transition-colors">{post.reposts || 0} reposts</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-3 py-1.5 flex items-center justify-between">
                <button
                    onClick={() => onLike && onLike(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg hover:bg-neutral-50 transition-all group ${post.likedByMe ? 'text-black' : 'text-muted-text hover:text-primary-text'}`}
                >
                    <ThumbsUp size={18} className={`group-hover:scale-110 transition-transform ${post.likedByMe ? 'fill-black' : ''}`} />
                    <span className="text-sm font-medium">Like</span>
                </button>
                <button
                    onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg hover:bg-neutral-50 text-muted-text hover:text-primary-text transition-all group"
                >
                    <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Comment</span>
                </button>
                <button
                    onClick={() => onRepost && onRepost(post)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg hover:bg-neutral-50 text-muted-text hover:text-primary-text transition-all group"
                >
                    <Repeat size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Repost</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg hover:bg-neutral-50 text-muted-text hover:text-primary-text transition-all group">
                    <Send size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Send</span>
                </button>
            </div>

            {/* Comment Section */}
            {isCommentsExpanded && (
                <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-200 animate-fade-in">
                    <div className="space-y-4 mb-4">
                        {post.commentsList && post.commentsList.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700 shrink-0 border border-neutral-300">
                                    {comment.author[0]}
                                </div>
                                <div className="bg-white border border-neutral-200 p-3 rounded-r-xl rounded-bl-xl flex-1 shadow-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-primary-text">{comment.author}</span>
                                        <span className="text-[10px] text-muted-text">{comment.time}</span>
                                    </div>
                                    <p className="text-xs text-neutral-700 leading-relaxed">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                        {(!post.commentsList || post.commentsList.length === 0) && (
                            <div className="text-center py-4">
                                <p className="text-xs text-muted-text">No comments yet. Be the first to start the conversation!</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {user ? user.name[0].toUpperCase() : "U"}
                        </div>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                className="w-full bg-white border border-neutral-300 rounded-full pl-4 pr-10 py-2.5 text-sm text-primary-text focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder-muted-text"
                            />
                            <button
                                onClick={handleAddComment}
                                className="absolute right-1.5 top-1.5 p-1.5 bg-black hover:bg-neutral-800 rounded-full text-white transition-colors"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
