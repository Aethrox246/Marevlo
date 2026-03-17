import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Zap, Newspaper, Image, Calendar, MapPin, PenTool, X, TrendingUp, Users, Plus, ArrowRight, Sparkles, Flame, Star
} from 'lucide-react';
import FeedPost from '../components/feed/FeedPost';
import CreatePostWidget from '../components/feed/CreatePostWidget';
import MessengerWidget from '../components/feed/MessengerWidget';
import { useAuth } from '../context/AuthContext';

const INITIAL_POSTS = [];
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Feed({ setView }) {
    const { user } = useAuth();
    const token = localStorage.getItem('access_token');
    const [posts, setPosts] = useState(INITIAL_POSTS);
    const [sortBy, setSortBy] = useState('latest');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false }), 3000);
    }, []);

    const fetchPosts = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(
                `${API_BASE}/feed/posts?sort=${sortBy}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!response.ok) {
                throw new Error('Failed to load feed');
            }
            const data = await response.json();
            setPosts(data.posts || []);
        } catch (err) {
            console.error(err);
            showToast('Failed to load feed', 'error');
        }
    }, [sortBy, token, showToast]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const createPost = useCallback(async (payload, successMessage) => {
        if (!token) {
            showToast('Please login to post', 'error');
            return null;
        }
        try {
            const response = await fetch(
                `${API_BASE}/feed/posts`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                }
            );
            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                throw new Error(errBody.detail || 'Failed to create post');
            }
            const created = await response.json();
            setPosts(prev => [created, ...prev]);
            showToast(successMessage, 'success');
            return created;
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Failed to create post', 'error');
            return null;
        }
    }, [token, showToast]);

    const handleCreatePost = async (postData) => {
        await createPost(
            {
                content: postData.content,
                image: postData.image,
                type: 'post'
            },
            'Post shared!'
        );
    };

    const handleLike = async (postId) => {
        if (!token) return;
        try {
            const response = await fetch(
                `${API_BASE}/feed/posts/${postId}/like`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!response.ok) {
                throw new Error('Failed to like post');
            }
            const data = await response.json();
            setPosts(prev => prev.map(post => (
                post.id === postId
                    ? { ...post, likes: data.likes, likedByMe: data.likedByMe }
                    : post
            )));
        } catch (err) {
            console.error(err);
            showToast('Failed to like post', 'error');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!token) return;
        try {
            const response = await fetch(
                `${API_BASE}/feed/posts/${postId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!response.ok) {
                throw new Error('Failed to delete post');
            }
            setPosts(prev => prev.filter(p => p.id !== postId));
            showToast('Post deleted', 'info');
        } catch (err) {
            console.error(err);
            showToast('Failed to delete post', 'error');
        }
    };

    const handleRepost = async (post) => {
        const repost = await createPost(
            {
                content: `Reposted: ${post.content}`,
                type: 'repost'
            },
            'Reposted!'
        );
        if (repost) {
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, reposts: (p.reposts || 0) + 1 } : p));
        }
    };

    const handleAddComment = async (postId, commentText) => {
        if (!token) return;
        try {
            const response = await fetch(
                `${API_BASE}/feed/posts/${postId}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ content: commentText })
                }
            );
            if (!response.ok) {
                throw new Error('Failed to add comment');
            }
            const comment = await response.json();
            setPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        comments: (post.comments || 0) + 1,
                        commentsList: [
                            ...(post.commentsList || []),
                            comment
                        ]
                    };
                }
                return post;
            }));
        } catch (err) {
            console.error(err);
            showToast('Failed to add comment', 'error');
        }
    };

    const handleImageSelect = (e, setImgState) => {
        const file = e.target.files[0];
        if (file) setImgState(URL.createObjectURL(file));
    };

    const handlePublishArticle = async () => {
        if (!articleTitle.trim() || !articleContent.trim()) { showToast('Please fill in title and content', 'error'); return; }
        const created = await createPost(
            {
                type: 'article',
                title: articleTitle,
                content: articleContent,
                image: articleImage
            },
            'Article published!'
        );
        if (created) {
            setArticleTitle("");
            setArticleContent("");
            setArticleImage(null);
            setIsArticleModalOpen(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!eventTitle.trim() || !eventDate.trim()) { showToast('Please fill in title and date', 'error'); return; }
        const created = await createPost(
            {
                type: 'event',
                title: eventTitle,
                content: eventDescription,
                event_date: eventDate,
                event_location: eventLocation
            },
            'Event created!'
        );
        if (created) {
            setEventTitle("");
            setEventDate("");
            setEventLocation("");
            setEventDescription("");
            setIsEventModalOpen(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full overflow-y-auto custom-scrollbar"
            style={{
                backgroundColor: 'var(--color-app-bg)',
                color: 'var(--color-primary-text)',
                transition: 'background-color 0.3s ease'
            }}
        >
            {/* ── Animated ambient background orbs ── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="feed-orb feed-orb-1" />
                <div className="feed-orb feed-orb-2" />
                <div className="feed-orb feed-orb-3" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8">

                    {/* ══════════════ LEFT COLUMN ══════════════ */}
                    <div className="space-y-5">

                        {/* ── Gradient Hero Header ── */}
                        <div className="relative rounded-2xl overflow-hidden p-6 sm:p-7" style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 45%, #06b6d4 100%)',
                            boxShadow: '0 8px 32px rgba(99,102,241,0.35)'
                        }}>
                            {/* Decorative shapes */}
                            <div style={{
                                position: 'absolute', top: '-30px', right: '-30px',
                                width: '160px', height: '160px',
                                borderRadius: '50%', opacity: 0.2,
                                background: 'rgba(255,255,255,0.3)'
                            }} />
                            <div style={{
                                position: 'absolute', bottom: '-20px', left: '30%',
                                width: '80px', height: '80px',
                                borderRadius: '50%', opacity: 0.15,
                                background: 'rgba(255,255,255,0.4)'
                            }} />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles size={16} style={{ color: 'rgba(255,255,255,0.85)' }} />
                                        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                            Marevlo Community
                                        </span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                                        Your Feed
                                    </h1>
                                    <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '4px', fontSize: '0.9rem' }}>
                                        Share ideas, connect with peers &amp; inspire the community
                                    </p>
                                </div>
                                <div className="hidden sm:flex items-center justify-center"
                                    style={{
                                        width: 64, height: 64, borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        backdropFilter: 'blur(8px)'
                                    }}>
                                    <Zap size={28} style={{ color: '#fff' }} />
                                </div>
                            </div>
                        </div>

                        {/* ── Create Post Widget ── */}
                        <div className="transition-all duration-300 hover:shadow-xl" style={{ borderRadius: '1rem' }}>
                            <CreatePostWidget
                                onPost={handleCreatePost}
                                onOpenEventModal={() => setIsEventModalOpen(true)}
                                onOpenArticleModal={() => setIsArticleModalOpen(true)}
                            />
                        </div>

                        {/* ── Feed Controls ── */}
                        <div className="flex items-center justify-between px-1 flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <div style={{
                                    width: 3, height: 18, borderRadius: 999,
                                    background: 'linear-gradient(180deg, #6366f1, #06b6d4)'
                                }} />
                                <h6 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted-text)' }}>
                                    Recent Posts
                                </h6>
                            </div>

                            {/* Segmented sort control */}
                            <div className="flex items-center gap-1 p-1 rounded-full" style={{
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                boxShadow: '0 2px 8px rgba(99,102,241,0.08)'
                            }}>
                                {[
                                    { key: 'latest', label: '⏱ Latest', icon: null },
                                    { key: 'top', label: '⚡ Trending', icon: null }
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setSortBy(key)}
                                        className="px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200"
                                        style={{
                                            background: sortBy === key
                                                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                                : 'transparent',
                                            color: sortBy === key ? '#fff' : 'var(--color-muted-text)',
                                            boxShadow: sortBy === key ? '0 2px 10px rgba(99,102,241,0.4)' : 'none',
                                            border: 'none',
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Posts List ── */}
                        <div className="space-y-4">
                            {posts.length === 0 ? (
                                <div className="text-center py-16 sm:py-20 rounded-2xl" style={{
                                    border: '1px dashed var(--color-border)',
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 100%)'
                                }}>
                                    {/* Icon row */}
                                    <div className="flex items-center justify-center gap-4 mb-5">
                                        {[
                                            { icon: <PenTool size={22} />, bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: 'rgba(99,102,241,0.4)' },
                                            { icon: <Newspaper size={30} />, bg: 'linear-gradient(135deg,#06b6d4,#0ea5e9)', shadow: 'rgba(6,182,212,0.4)' },
                                            { icon: <Calendar size={22} />, bg: 'linear-gradient(135deg,#f43f5e,#ec4899)', shadow: 'rgba(244,63,94,0.4)' },
                                        ].map(({ icon, bg, shadow }, i) => (
                                            <div key={i} style={{
                                                width: i === 1 ? 68 : 48,
                                                height: i === 1 ? 68 : 48,
                                                borderRadius: '50%',
                                                background: bg,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff',
                                                boxShadow: `0 8px 20px ${shadow}`,
                                                transform: i === 0 ? 'rotate(-8deg) translateY(6px)' : i === 2 ? 'rotate(8deg) translateY(6px)' : 'none',
                                                transition: 'transform 0.3s'
                                            }}>
                                                {icon}
                                            </div>
                                        ))}
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--color-primary-text)' }}>
                                        Your feed is empty
                                    </h3>
                                    <p style={{ color: 'var(--color-muted-text)', maxWidth: 340, margin: '0 auto', fontSize: '0.9rem' }}>
                                        Be the first to share something amazing with the community!
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                                        <button
                                            onClick={() => setIsArticleModalOpen(true)}
                                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                boxShadow: '0 4px 16px rgba(99,102,241,0.4)'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <PenTool size={16} /> Write Article
                                        </button>
                                        <button
                                            onClick={() => setIsEventModalOpen(true)}
                                            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                                                color: '#fff',
                                                boxShadow: '0 4px 16px rgba(244,63,94,0.35)'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <Calendar size={16} /> Create Event
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                posts
                                    .sort((a, b) => sortBy === 'top' ? (b.likes - a.likes) : 0)
                                    .map(post => (
                                        <div
                                            key={post.id}
                                            className="transition-all duration-300"
                                            style={{ borderRadius: '1rem' }}
                                        >
                                            <FeedPost
                                                post={{ ...post, onAddComment: handleAddComment }}
                                                onLike={handleLike}
                                                onDelete={handleDeletePost}
                                                onRepost={handleRepost}
                                            />
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>

                    {/* ══════════════ RIGHT SIDEBAR ══════════════ */}
                    <aside className="hidden lg:flex flex-col gap-5 h-fit sticky top-24">

                        {/* ── Trending Problems Card ── */}
                        <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl" style={{
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                        }}>
                            {/* Color top stripe */}
                            <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} />
                            <div className="p-5 sm:p-6">
                                <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 30, height: 30, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        color: '#fff'
                                    }}>
                                        <Flame size={15} />
                                    </span>
                                    <span style={{ color: 'var(--color-primary-text)' }}>Trending Problems</span>
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { num: '#1', title: 'Two Sum', diff: 'Easy', color: '#10b981' },
                                        { num: '#2', title: 'LRU Cache', diff: 'Hard', color: '#ef4444' },
                                        { num: '#3', title: 'Binary Tree Paths', diff: 'Medium', color: '#f59e0b' },
                                    ].map(({ num, title, diff, color }) => (
                                        <div key={num} className="flex items-center justify-between py-2 px-3 rounded-xl transition-all duration-200" style={{
                                            backgroundColor: 'var(--color-surface-hover)',
                                            cursor: 'pointer'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span style={{ color: 'var(--color-muted-text)', fontSize: '0.7rem', fontWeight: 700, width: 24 }}>{num}</span>
                                                <span style={{ color: 'var(--color-primary-text)', fontSize: '0.82rem', fontWeight: 600 }}>{title}</span>
                                            </div>
                                            <span style={{
                                                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em',
                                                color, background: `${color}18`, padding: '2px 8px', borderRadius: 999
                                            }}>
                                                {diff}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="w-full mt-4 text-xs font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
                                        color: '#6366f1',
                                        border: '1px solid rgba(99,102,241,0.25)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)' || (e.currentTarget.style.color = '#fff')}
                                    onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))' || (e.currentTarget.style.color = '#6366f1')}
                                >
                                    View all problems <ArrowRight size={13} />
                                </button>
                            </div>
                        </div>

                        {/* ── Suggested People Card (Empty State for Backend) ── */}
                        <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl" style={{
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                        }}>
                            <div style={{ height: 4, background: 'linear-gradient(90deg, #f43f5e, #ec4899, #8b5cf6)' }} />
                            <div className="p-5 sm:p-6">
                                <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 30, height: 30, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                                        color: '#fff'
                                    }}>
                                        <Users size={15} />
                                    </span>
                                    <span style={{ color: 'var(--color-primary-text)' }}>People You May Know</span>
                                </h3>
                                <div className="text-center py-4" style={{ color: 'var(--color-muted-text)' }}>
                                    <p className="text-xs italic">Sync suggestions will appear here soon.</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Quick Actions Card ── */}
                        <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl" style={{
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                        }}>
                            <div style={{ height: 4, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
                            <div className="p-5 sm:p-6">
                                <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 30, height: 30, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                                        color: '#fff'
                                    }}>
                                        <Zap size={15} />
                                    </span>
                                    <span style={{ color: 'var(--color-primary-text)' }}>Quick Actions</span>
                                </h3>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setIsArticleModalOpen(true)}
                                        className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200"
                                        style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                    >
                                        <PenTool size={16} /> Write an Article
                                    </button>
                                    <button
                                        onClick={() => setIsEventModalOpen(true)}
                                        className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200"
                                        style={{ backgroundColor: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(244,63,94,0.2)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(244,63,94,0.1)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                    >
                                        <Calendar size={16} /> Host an Event
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Links */}
                        <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11px] px-2">
                            {['About', 'Accessibility', 'Help Center', 'Privacy & Terms'].map((link) => (
                                <span
                                    key={link}
                                    className="cursor-pointer hover:underline transition-colors duration-200"
                                    style={{ color: 'var(--color-muted-text)' }}
                                >
                                    {link}
                                </span>
                            ))}
                            <div style={{ color: 'var(--color-muted-text)', opacity: 0.6 }} className="text-[11px]">
                                © 2026 Marevlo
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* ── TOAST NOTIFICATION ── */}
            {toast.show && (
                <div
                    className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 z-50"
                    style={{
                        background: toast.type === 'error'
                            ? 'linear-gradient(135deg,#ef4444,#f43f5e)'
                            : toast.type === 'info'
                                ? 'linear-gradient(135deg,#3b82f6,#06b6d4)'
                                : 'linear-gradient(135deg,#10b981,#06b6d4)',
                        color: '#fff',
                        borderRadius: '1rem',
                        padding: '1rem 1.25rem',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
                        animation: 'feedSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                        display: 'flex', alignItems: 'center', gap: '0.75rem'
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>{toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
                    <p className="text-sm font-semibold">{toast.message}</p>
                </div>
            )}

            {/* ══════════════ WRITE ARTICLE MODAL ══════════════ */}
            {isArticleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div
                        className="w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '1.5rem',
                            animation: 'feedModalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
                        }}
                    >
                        {/* Modal header with gradient */}
                        <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)', borderRadius: '1.5rem 1.5rem 0 0' }} />
                        <div className="p-5 sm:p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <h2 className="text-xl font-bold flex items-center gap-2.5" style={{ color: 'var(--color-primary-text)' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff'
                                }}>
                                    <PenTool size={18} />
                                </span>
                                Write Article
                            </h2>
                            <button
                                onClick={() => setIsArticleModalOpen(false)}
                                className="p-2 rounded-xl hover:opacity-70 transition-opacity"
                                style={{ backgroundColor: 'var(--color-surface-hover)' }}
                            >
                                <X size={20} style={{ color: 'var(--color-primary-text)' }} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">
                            {/* Cover Image */}
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted-text)' }}>
                                    Cover Image
                                </label>
                                {articleImage ? (
                                    <div className="relative group">
                                        <img src={articleImage} alt="Cover" className="w-full h-48 object-cover rounded-2xl" style={{ border: '1px solid var(--color-border)' }} />
                                        <button
                                            onClick={() => setArticleImage(null)}
                                            className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => articleFileInputRef.current?.click()}
                                        className="w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200"
                                        style={{ borderColor: 'rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.04)' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.04)'; }}
                                    >
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '50%',
                                            background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Image size={20} style={{ color: '#6366f1' }} />
                                        </div>
                                        <span className="text-sm font-medium" style={{ color: '#6366f1' }}>
                                            Click to upload cover image
                                        </span>
                                    </div>
                                )}
                                <input type="file" ref={articleFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setArticleImage)} />
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted-text)' }}>
                                    Title <span style={{ color: '#f43f5e' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your headline..."
                                    value={articleTitle}
                                    onChange={(e) => setArticleTitle(e.target.value)}
                                    className="w-full py-3 text-lg font-bold focus:outline-none transition-colors"
                                    style={{
                                        background: 'transparent',
                                        color: 'var(--color-primary-text)',
                                        borderBottom: `2px solid ${articleTitle ? '#6366f1' : 'var(--color-border)'}`
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted-text)' }}>
                                    Content <span style={{ color: '#f43f5e' }}>*</span>
                                </label>
                                <textarea
                                    placeholder="Write your thoughts..."
                                    value={articleContent}
                                    onChange={(e) => setArticleContent(e.target.value)}
                                    className="w-full rounded-2xl p-4 min-h-[200px] focus:outline-none transition-all resize-none"
                                    style={{
                                        color: 'var(--color-primary-text)',
                                        backgroundColor: 'var(--color-surface-hover)',
                                        border: `1.5px solid ${articleContent ? '#6366f1' : 'var(--color-border)'}`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="p-5 sm:p-6 flex justify-end gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                            <button
                                onClick={() => setIsArticleModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                                style={{ color: 'var(--color-muted-text)', background: 'var(--color-surface-hover)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePublishArticle}
                                disabled={!articleTitle.trim() || !articleContent.trim()}
                                className="px-7 py-2.5 rounded-xl font-bold text-white text-sm transition-all duration-200"
                                style={{
                                    background: articleTitle.trim() && articleContent.trim()
                                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                        : 'var(--color-border)',
                                    boxShadow: articleTitle.trim() && articleContent.trim()
                                        ? '0 4px 16px rgba(99,102,241,0.4)'
                                        : 'none',
                                    opacity: articleTitle.trim() && articleContent.trim() ? 1 : 0.5,
                                    cursor: articleTitle.trim() && articleContent.trim() ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Publish ✨
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ CREATE EVENT MODAL ══════════════ */}
            {isEventModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div
                        className="w-full max-w-lg shadow-2xl flex flex-col"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '1.5rem',
                            animation: 'feedModalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
                        }}
                    >
                        <div style={{ height: 4, background: 'linear-gradient(90deg, #f43f5e, #ec4899, #8b5cf6)', borderRadius: '1.5rem 1.5rem 0 0' }} />
                        <div className="p-5 sm:p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <h2 className="text-xl font-bold flex items-center gap-2.5" style={{ color: 'var(--color-primary-text)' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: 'linear-gradient(135deg,#f43f5e,#ec4899)', color: '#fff'
                                }}>
                                    <Calendar size={18} />
                                </span>
                                Create Event
                            </h2>
                            <button
                                onClick={() => setIsEventModalOpen(false)}
                                className="p-2 rounded-xl hover:opacity-70 transition-opacity"
                                style={{ backgroundColor: 'var(--color-surface-hover)' }}
                            >
                                <X size={20} style={{ color: 'var(--color-primary-text)' }} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <input
                                placeholder="Event title *"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                                style={{
                                    color: 'var(--color-primary-text)',
                                    backgroundColor: 'var(--color-surface-hover)',
                                    border: `1.5px solid ${eventTitle ? '#f43f5e' : 'var(--color-border)'}`
                                }}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted-text)' }}>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                                        style={{
                                            color: 'var(--color-primary-text)',
                                            backgroundColor: 'var(--color-surface-hover)',
                                            border: `1.5px solid ${eventDate ? '#f43f5e' : 'var(--color-border)'}`
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: 'var(--color-muted-text)' }}>Location</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Remote / NYC"
                                        value={eventLocation}
                                        onChange={(e) => setEventLocation(e.target.value)}
                                        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                                        style={{
                                            color: 'var(--color-primary-text)',
                                            backgroundColor: 'var(--color-surface-hover)',
                                            border: '1.5px solid var(--color-border)'
                                        }}
                                    />
                                </div>
                            </div>

                            <textarea
                                placeholder="Event details (optional)..."
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                className="w-full rounded-xl p-3.5 min-h-[100px] text-sm focus:outline-none transition-all resize-none"
                                style={{
                                    color: 'var(--color-primary-text)',
                                    backgroundColor: 'var(--color-surface-hover)',
                                    border: '1.5px solid var(--color-border)'
                                }}
                            />
                        </div>

                        <div className="p-5 sm:p-6 flex justify-end gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                            <button
                                onClick={() => setIsEventModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                                style={{ color: 'var(--color-muted-text)', background: 'var(--color-surface-hover)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateEvent}
                                disabled={!eventTitle.trim() || !eventDate}
                                className="px-7 py-2.5 rounded-xl font-bold text-white text-sm transition-all duration-200"
                                style={{
                                    background: eventTitle.trim() && eventDate
                                        ? 'linear-gradient(135deg, #f43f5e, #ec4899)'
                                        : 'var(--color-border)',
                                    boxShadow: eventTitle.trim() && eventDate
                                        ? '0 4px 16px rgba(244,63,94,0.4)'
                                        : 'none',
                                    opacity: eventTitle.trim() && eventDate ? 1 : 0.5,
                                    cursor: eventTitle.trim() && eventDate ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Create Event 🎉
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MessengerWidget />

            <style>{`
                @keyframes feedSlideIn {
                    from { transform: translateY(120%) scale(0.9); opacity: 0; }
                    to   { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes feedModalIn {
                    from { transform: scale(0.85) translateY(20px); opacity: 0; }
                    to   { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes feedOrbFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -40px) scale(1.08); }
                    66% { transform: translate(-20px, 20px) scale(0.94); }
                }
                .feed-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                    animation: feedOrbFloat 10s ease-in-out infinite;
                }
                .feed-orb-1 {
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%);
                    top: -100px; left: -100px;
                    animation-delay: 0s;
                }
                .feed-orb-2 {
                    width: 350px; height: 350px;
                    background: radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%);
                    bottom: 10%; right: -80px;
                    animation-delay: -4s;
                }
                .feed-orb-3 {
                    width: 250px; height: 250px;
                    background: radial-gradient(circle, rgba(244,63,94,0.12), transparent 70%);
                    top: 40%; left: 40%;
                    animation-delay: -7s;
                }
            `}</style>
        </div>
    );
}
