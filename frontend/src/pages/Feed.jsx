import React, { useState, useRef } from 'react';
import {
    Zap, Newspaper, Image, Calendar, MapPin, PenTool, X
} from 'lucide-react';
import FeedPost from '../components/feed/FeedPost';
import CreatePostWidget from '../components/feed/CreatePostWidget';
import MessengerWidget from '../components/feed/MessengerWidget';
import { useAuth } from '../context/AuthContext';

const INITIAL_POSTS = [];

export default function Feed({ setView }) {
    const { user } = useAuth();
    const [posts, setPosts] = useState(INITIAL_POSTS);
    const [sortBy, setSortBy] = useState('latest');

    // Article Modal State
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [articleTitle, setArticleTitle] = useState("");
    const [articleContent, setArticleContent] = useState("");
    const [articleImage, setArticleImage] = useState(null);
    const articleFileInputRef = useRef(null);

    // Event Modal State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [eventLocation, setEventLocation] = useState("");
    const [eventDescription, setEventDescription] = useState("");

    // --- Actions ---

    const handleCreatePost = (postData) => {
        const newPost = {
            id: Date.now(),
            author: user ? user.name : "User",
            role: "Developer",
            avatar: user ? user.name[0].toUpperCase() : "U",
            content: postData.content,
            image: postData.image,
            likes: 0,
            comments: 0,
            reposts: 0,
            time: "Just now",
            likedByMe: false,
            commentsList: []
        };
        setPosts([newPost, ...posts]);
    };

    const handleLike = (postId) => {
        setPosts(posts.map(post => {
            if (post.id === postId) {
                const isLiked = !post.likedByMe;
                return {
                    ...post,
                    likedByMe: isLiked,
                    likes: isLiked ? post.likes + 1 : post.likes - 1
                };
            }
            return post;
        }));
    };

    const handleDeletePost = (postId) => {
        setPosts(posts.filter(p => p.id !== postId));
    };

    const handleRepost = (post) => {
        const repost = {
            ...post,
            id: Date.now(),
            author: user ? user.name : "User",
            role: "Developer",
            avatar: user ? user.name[0].toUpperCase() : "U",
            time: "Just now",
            content: `Reposted: ${post.content}`,
            likes: 0,
            comments: 0,
            reposts: 0,
            likedByMe: false,
            commentsList: []
        };

        const updatedPosts = posts.map(p => {
            if (p.id === post.id) {
                return { ...p, reposts: (p.reposts || 0) + 1 };
            }
            return p;
        });

        setPosts([repost, ...updatedPosts]);
    };

    const handleAddComment = (postId, commentText) => {
        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    comments: post.comments + 1,
                    commentsList: [
                        ...(post.commentsList || []),
                        {
                            id: Date.now(),
                            author: user ? user.name : "User",
                            content: commentText,
                            time: "Just now"
                        }
                    ]
                };
            }
            return post;
        }));
    }

    // Modal Handlers 
    const handleImageSelect = (e, setImgState) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setImgState(imageUrl);
        }
    };

    const handlePublishArticle = () => {
        if (!articleTitle.trim() || !articleContent.trim()) {
            alert("Please provide both a title and content for your article.");
            return;
        }

        const newArticle = {
            id: Date.now(),
            author: user ? user.name : "User",
            role: "Developer",
            avatar: user ? user.name[0].toUpperCase() : "U",
            title: articleTitle,
            content: articleContent,
            image: articleImage,
            likes: 0,
            comments: 0,
            time: "Just now",
            isArticle: true,
            likedByMe: false,
            commentsList: []
        };

        setPosts([newArticle, ...posts]);
        setArticleTitle("");
        setArticleContent("");
        setArticleImage(null);
        setIsArticleModalOpen(false);
    };

    const handleCreateEvent = () => {
        if (!eventTitle.trim() || !eventDate.trim()) return;

        const newEvent = {
            id: Date.now(),
            author: user ? user.name : "User",
            role: "Developer",
            avatar: user ? user.name[0].toUpperCase() : "U",
            content: eventDescription,
            eventDetails: {
                title: eventTitle,
                date: eventDate,
                location: eventLocation
            },
            likes: 0,
            comments: 0,
            time: "Just now",
            isEvent: true,
            likedByMe: false,
            commentsList: []
        };

        setPosts([newEvent, ...posts]);
        setEventTitle("");
        setEventDate("");
        setEventLocation("");
        setEventDescription("");
        setIsEventModalOpen(false);
    }

    const getSortedPosts = () => {
        if (sortBy === 'top') {
            return [...posts].sort((a, b) => b.likes - a.likes);
        }
        return posts;
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 h-full overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                {/* LEFT COLUMN - FEED */}
                <div className="max-w-[720px] mx-auto w-full space-y-6">

                    {/* SECTION LABEL */}
                    <div className="flex items-center justify-between px-1">
                        <h6 className="text-xs font-bold text-muted-text/70 uppercase tracking-widest">Share an update</h6>
                    </div>

                    <CreatePostWidget
                        onPost={handleCreatePost}
                        onOpenEventModal={() => setIsEventModalOpen(true)}
                        onOpenArticleModal={() => setIsArticleModalOpen(true)}
                    />

                    {/* FEED HEADER */}
                    <div className="flex items-center justify-between px-1 mt-8">
                        <h6 className="text-xs font-bold text-muted-text uppercase tracking-widest">Recent Posts</h6>
                        <button
                            onClick={() => setSortBy(sortBy === 'latest' ? 'top' : 'latest')}
                            className="text-xs font-medium flex items-center gap-1.5 cursor-pointer text-muted-text hover:text-black transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-100"
                        >
                            Sort by: <span className="font-bold text-primary-text capitalize">{sortBy}</span> <Zap size={14} className={sortBy === 'top' ? 'text-black fill-black' : ''} />
                        </button>
                    </div>

                    {/* POSTS LIST */}
                    <div className="space-y-6">
                        {posts.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <div className="inline-flex items-center justify-center p-4 rounded-full bg-white/5 mb-4">
                                    <Newspaper size={32} className="text-muted-text" />
                                </div>
                                <p className="text-muted-text">Your feed is empty. Start following people or create a post!</p>
                            </div>
                        )}

                        {getSortedPosts().map(post => (
                            <FeedPost
                                key={post.id}
                                post={{ ...post, onAddComment: handleAddComment }}
                                onLike={handleLike}
                                onDelete={handleDeletePost}
                                onRepost={handleRepost}
                            />
                        ))}
                    </div>
                </div >

                {/* RIGHT COLUMN - SIDEBAR */}
                <div className="hidden lg:block space-y-6">
                    {/* Trending Problems Card */}
                    <div className="bg-surface border border-neutral-200 rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-primary-text mb-4 flex items-center gap-2">
                            <Zap size={16} className="text-black fill-black" />
                            Trending Problems
                        </h3>
                        <div className="space-y-4">
                            <p className="text-sm text-neutral-500">No trending problems.</p>
                        </div>
                        <button className="w-full mt-4 text-xs font-bold text-black hover:text-neutral-700 transition-colors">View all</button>
                    </div>

                    {/* Suggested People Card */}
                    <div className="bg-surface border border-neutral-200 rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-primary-text mb-4">People you may know</h3>
                        <div className="space-y-4">
                            <p className="text-sm text-neutral-500">No suggestions available.</p>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-text/60 px-2">
                        <span className="hover:underline cursor-pointer">About</span>
                        <span className="hover:underline cursor-pointer">Accessibility</span>
                        <span className="hover:underline cursor-pointer">Help Center</span>
                        <span className="hover:underline cursor-pointer">Privacy & Terms</span>
                        <span>© 2026 AlgoSphere</span>
                    </div>
                </div>
            </div>

            {/* WRITE ARTICLE MODAL */}
            {isArticleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface border border-neutral-200 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-primary-text flex items-center gap-2">
                                <PenTool size={18} className="text-black" />
                                Write Article
                            </h2>
                            <button onClick={() => setIsArticleModalOpen(false)} className="text-muted-text hover:text-primary-text">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-text mb-1">Cover Image</label>
                                {articleImage ? (
                                    <div className="relative">
                                        <img src={articleImage} alt="Cover" className="w-full h-48 object-cover rounded-xl border border-neutral-200" />
                                        <button
                                            onClick={() => setArticleImage(null)}
                                            className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-black/80"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => articleFileInputRef.current?.click()}
                                        className="w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-black/50 hover:bg-neutral-50 transition-all group"
                                    >
                                        <Image size={24} className="text-muted-text group-hover:text-black" />
                                        <span className="text-sm text-muted-text">Click to upload cover image</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={articleFileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImageSelect(e, setArticleImage)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-text mb-1">Article Title *</label>
                                <input
                                    type="text"
                                    placeholder="Enter your headline..."
                                    value={articleTitle}
                                    onChange={(e) => setArticleTitle(e.target.value)}
                                    className="w-full bg-transparent border-b border-neutral-200 py-2 text-lg font-bold text-primary-text placeholder-neutral-400 focus:border-black outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-text mb-1">Content *</label>
                                <textarea
                                    placeholder="Write your thoughts..."
                                    value={articleContent}
                                    onChange={(e) => setArticleContent(e.target.value)}
                                    className="w-full bg-transparent border border-neutral-200 rounded-xl p-4 min-h-[200px] text-primary-text placeholder-neutral-400 focus:border-black outline-none resize-y transition-colors"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-neutral-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsArticleModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-muted-text hover:text-primary-text hover:bg-neutral-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePublishArticle}
                                disabled={!articleTitle.trim() || !articleContent.trim()}
                                className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${articleTitle.trim() && articleContent.trim()
                                    ? 'bg-black hover:bg-neutral-800 shadow-lg'
                                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                    }`}
                            >
                                Publish Article
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EVENT MODAL */}
            {isEventModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface border border-neutral-200 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-primary-text flex items-center gap-2">
                                <Calendar size={18} className="text-black" />
                                Create Event
                            </h2>
                            <button onClick={() => setIsEventModalOpen(false)} className="text-muted-text hover:text-primary-text">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <input
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                className="w-full bg-transparent border border-neutral-200 rounded-lg px-4 py-3 text-primary-text placeholder-neutral-400 focus:border-black outline-none"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-muted-text mb-1">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full bg-white border border-neutral-200 rounded-lg px-4 py-2 text-primary-text text-sm focus:border-black outline-none"
                                        style={{ colorScheme: 'light' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-muted-text mb-1">Location</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Remote / NYC"
                                        value={eventLocation}
                                        onChange={(e) => setEventLocation(e.target.value)}
                                        className="w-full bg-white border border-neutral-200 rounded-lg px-4 py-2 text-primary-text text-sm focus:border-black outline-none"
                                    />
                                </div>
                            </div>

                            <textarea
                                placeholder="Event Details..."
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                className="w-full bg-transparent border border-neutral-200 rounded-lg p-3 min-h-[100px] text-sm text-primary-text placeholder-neutral-400 focus:border-black outline-none resize-none"
                            />
                        </div>

                        <div className="p-4 border-t border-neutral-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEventModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-muted-text hover:text-primary-text hover:bg-neutral-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateEvent}
                                disabled={!eventTitle.trim() || !eventDate}
                                className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${eventTitle.trim() && eventDate
                                    ? 'bg-black hover:bg-neutral-800 shadow-lg'
                                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                    }`}
                            >
                                Create Event
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MessengerWidget />
        </div>
    );
}
