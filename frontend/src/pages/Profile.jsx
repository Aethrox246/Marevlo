import React, { useState, useRef, useEffect } from 'react';
import {
    Camera, Edit2, Save, X, MapPin, Briefcase, FileText,
    Zap, Trophy, Github, Linkedin, ArrowUpRight,
    Code2, BookOpen, CheckCircle, Flame, Star,
    ChevronRight, User, Link as LinkIcon, Shield, Activity,
    Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ════════════════════════════════════════════
   TINY REUSABLE PRIMITIVES
   ════════════════════════════════════════════ */

const accent = {
    indigo: '#6366f1',
    violet: '#8b5cf6',
    cyan: '#06b6d4',
    green: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b',
};

function Tag({ children, color = accent.indigo }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 999,
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em',
            background: `${color}1a`, color, border: `1px solid ${color}35`,
        }}>
            {children}
        </span>
    );
}

function SectionCard({ children, style }) {
    return (
        <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 4px 32px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.08)',
            transition: 'box-shadow 0.2s',
            ...style,
        }}>
            {children}
        </div>
    );
}

function SectionTitle({ children, icon: Icon, accentColor = accent.indigo }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `${accentColor}18`,
                border: `1.5px solid ${accentColor}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <Icon size={15} style={{ color: accentColor }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary-text)' }}>{children}</span>
        </div>
    );
}

function InlineInput({ value, onChange, placeholder, multiline, rows = 4 }) {
    const shared = {
        width: '100%', borderRadius: 12, padding: '10px 14px',
        fontSize: '0.85rem', color: 'var(--color-primary-text)',
        background: 'var(--color-surface-hover)',
        border: '1.5px solid var(--color-border)',
        outline: 'none', transition: 'border-color 0.2s',
        fontFamily: 'inherit',
        resize: multiline ? 'vertical' : undefined,
        boxSizing: 'border-box',
    };
    const focus = (e) => (e.currentTarget.style.borderColor = accent.indigo);
    const blur = (e) => (e.currentTarget.style.borderColor = 'var(--color-border)');

    return multiline
        ? <textarea value={value || ''} onChange={onChange} placeholder={placeholder} rows={rows}
            style={shared} onFocus={focus} onBlur={blur} />
        : <input value={value || ''} onChange={onChange} placeholder={placeholder}
            style={shared} onFocus={focus} onBlur={blur} />;
}

/* ════════════════════════════════════════════
   STAT PILL
   ════════════════════════════════════════════ */
function StatPill({ icon: Icon, value, label, color, loading }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '14px 20px', borderRadius: 16, flex: 1, minWidth: 80,
                background: hov ? `${color}1a` : `${color}0d`,
                border: `1px solid ${hov ? color + '50' : color + '25'}`,
                boxShadow: hov ? `0 6px 24px ${color}30` : 'none',
                transform: hov ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
                cursor: 'default',
            }}>
            <Icon size={18} style={{ color, marginBottom: 6 }} />
            {loading
                ? <Loader size={16} style={{ color, animation: 'spin 1s linear infinite' }} />
                : <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-text)', lineHeight: 1 }}>{value}</span>
            }
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>{label}</span>
        </div>
    );
}

/* ════════════════════════════════════════════
   XP PROGRESS BAR
   ════════════════════════════════════════════ */
function XpBar({ xp, level }) {
    const xpInLevel = xp % 100;
    const nextLevelXp = 100;
    const pct = (xpInLevel / nextLevelXp) * 100;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted-text)' }}>
                    Level {level}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: accent.indigo }}>
                    {xpInLevel} / {nextLevelXp} XP
                </span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: 'var(--color-surface-hover)', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: 999,
                    background: `linear-gradient(90deg, ${accent.indigo}, ${accent.violet})`,
                    boxShadow: `0 0 10px ${accent.indigo}80`,
                    transition: 'width 0.8s ease',
                }} />
            </div>
            <div style={{ textAlign: 'right', marginTop: 4, fontSize: '0.65rem', color: 'var(--color-muted-text)' }}>
                {(nextLevelXp - xpInLevel)} XP to Level {level + 1}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════
   SKILL BAR
   ════════════════════════════════════════════ */
function SkillBar({ label, pct, color }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary-text)' }}>{label}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color }}>{pct}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--color-surface-hover)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: color, boxShadow: `0 0 8px ${color}80`, transition: 'width 0.9s ease' }} />
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════
   LINK ROW
   ════════════════════════════════════════════ */
function LinkRow({ label, href, color, icon: Icon }) {
    const [hov, setHov] = useState(false);
    if (!href) return (
        <div style={{ padding: '10px 14px', borderRadius: 12, color: 'var(--color-muted-text)', fontSize: '0.8rem', fontStyle: 'italic', background: 'var(--color-surface-hover)' }}>
            {label} not added
        </div>
    );
    return (
        <a href={href} target="_blank" rel="noopener noreferrer"
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
                background: hov ? `${color}14` : 'var(--color-surface-hover)',
                border: `1px solid ${hov ? color + '40' : 'transparent'}`,
                transition: 'all 0.2s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {Icon ? <Icon size={16} style={{ color: hov ? color : 'var(--color-primary-text)', transition: 'color 0.2s', flexShrink: 0 }} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />}
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: hov ? color : 'var(--color-primary-text)' }}>{label}</span>
            </div>
            <ArrowUpRight size={14} style={{ color: hov ? color : 'var(--color-muted-text)', transition: 'color 0.2s' }} />
        </a>
    );
}

/* ════════════════════════════════════════════
   ACHIEVEMENT BADGE
   ════════════════════════════════════════════ */
function AchievementBadge({ icon, label, description, color, earned_at }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            title={`${description}\nEarned: ${earned_at ? new Date(earned_at).toLocaleDateString() : ''}`}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 10px', borderRadius: 14, cursor: 'default',
                background: hov ? `${color}20` : `${color}0d`,
                border: `1.5px solid ${hov ? color + '70' : color + '30'}`,
                boxShadow: hov ? `0 6px 20px ${color}35` : 'none',
                transform: hov ? 'translateY(-4px) scale(1.04)' : 'translateY(0) scale(1)',
                transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)', flex: '0 0 calc(33% - 8px)',
            }}
        >
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
        </div>
    );
}

/* ════════════════════════════════════════════
   ACTIVITY GRID
   ════════════════════════════════════════════ */
function ActivityGrid({ activityData }) {
    // activityData: [{date, count}, ...] for last 70 days
    const today = new Date();
    const cells = [];
    for (let i = 69; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const entry = activityData.find(a => a.date === key);
        const count = entry ? entry.count : 0;
        cells.push({ key, count });
    }

    const getColor = (count) => {
        if (count === 0) return 'var(--color-surface-hover)';
        if (count <= 2) return `${accent.green}40`;
        if (count <= 5) return `${accent.green}70`;
        return accent.green;
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
                {cells.map(({ key, count }) => (
                    <div
                        key={key}
                        title={`${key}: ${count} activities`}
                        style={{
                            width: '100%', aspectRatio: '1', borderRadius: 3,
                            background: getColor(count),
                            cursor: 'default',
                            transition: 'background 0.2s',
                        }}
                    />
                ))}
            </div>
            <p style={{ marginTop: 10, fontSize: '0.7rem', color: 'var(--color-muted-text)', textAlign: 'center' }}>
                Last 70 days of activity
            </p>
        </div>
    );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function Profile() {
    const { user, profileStats, achievements, profileData, updateUser, uploadResume, refreshStats, apiCall } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [activityData, setActivityData] = useState([]);
    const [saveLoading, setSaveLoading] = useState(false);
    const [resumeLoading, setResumeLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const fileRef = useRef(null);
    const resumeRef = useRef(null);

    // Form mirrors what's in the profile (backend profileData + user)
    const buildForm = () => ({
        name: profileData?.name || user?.name || '',
        headline: profileData?.headline || user?.headline || 'Aspiring Developer',
        bio: profileData?.bio || user?.bio || '',
        location: profileData?.location || user?.location || '',
        email: user?.email || '',
        avatar: profileData?.avatar_url || user?.avatar || null,
        github: profileData?.github_url || user?.github || '',
        linkedin: profileData?.linkedin_url || user?.linkedin || '',
        resumeName: profileData?.resume_url ? profileData.resume_url.split('/').pop() : null,
        resumeUrl: profileData?.resume_url || null,
    });

    const [form, setForm] = useState(buildForm());

    useEffect(() => {
        if (!isEditing) setForm(buildForm());
    }, [profileData, user, isEditing]);

    // Fetch activity data
    useEffect(() => {
        if (user?.id) {
            apiCall('/profile/activity')
                .then(data => setActivityData(data))
                .catch(() => setActivityData([]));
        }
    }, [user?.id, apiCall]);

    // Fetch profile stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                setStatsLoading(true);
                const res = await fetch(`${import.meta.env.VITE_API_URL}/profile/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch stats');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch profile stats:', err);
                // Fallback to profileStats from context if API fails
                if (profileStats) setStats(profileStats);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, [profileStats]);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleAvatar = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        if (file.size > 2e6) return alert('Max 2 MB');
        const r = new FileReader();
        r.onloadend = () => {
            set('avatar', r.result);
            if (!isEditing) updateUser({ avatar: r.result });
        };
        r.readAsDataURL(file);
    };

    const handleResume = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setResumeLoading(true);
        try {
            const data = await uploadResume(file);
            set('resumeName', file.name);
            set('resumeUrl', data.resume_url);
        } catch (err) {
            alert('Resume upload failed: ' + err.message);
        } finally {
            setResumeLoading(false);
        }
    };

    const save = async () => {
        setSaveLoading(true);
        try {
            await updateUser({
                name: form.name,
                headline: form.headline,
                bio: form.bio,
                location: form.location,
                github_url: form.github,
                linkedin_url: form.linkedin,
            });
            // Refresh achievements (profile_complete badge may be earned)
            await refreshStats();
            setIsEditing(false);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err) {
            alert('Save failed: ' + err.message);
        } finally {
            setSaveLoading(false);
        }
    };

    const cancel = () => { setForm(buildForm()); setIsEditing(false); };

    const dp = form; // display profile
    const initials = dp.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const displayStats = stats || profileStats || { xp: 0, level: 1, streak: 0, rank: '—', courses_completed: 0, problems_solved: 0 };

    const memberYear = user?.id
        ? (profileData?.created_at ? new Date(profileData.created_at).getFullYear() : new Date().getFullYear())
        : new Date().getFullYear();

    const TABS = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'skills', label: 'Skills', icon: Code2 },
        { id: 'links', label: 'Links', icon: LinkIcon },
    ];

    const SKILLS = [
        { label: 'Python', pct: 80, color: accent.indigo },
        { label: 'Machine Learning', pct: 65, color: accent.violet },
        { label: 'Data Science', pct: 70, color: accent.cyan },
        { label: 'RAG / LLMs', pct: 55, color: accent.amber },
        { label: 'React', pct: 60, color: accent.rose },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-app-bg)', color: 'var(--color-primary-text)', overflowY: 'auto', position: 'relative' }}
            className="custom-scrollbar">

            {/* Toast Notification */}
            <div style={{
                position: 'fixed', bottom: 30, right: 30, zIndex: 100,
                background: 'var(--color-surface)', border: `1px solid ${accent.green}50`,
                padding: '12px 20px', borderRadius: 12, boxShadow: `0 8px 32px ${accent.green}25`,
                display: 'flex', alignItems: 'center', gap: 10,
                transform: showToast ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
                opacity: showToast ? 1 : 0, pointerEvents: showToast ? 'auto' : 'none',
                transition: 'all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
            }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${accent.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={14} style={{ color: accent.green }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-text)' }}>Profile saved successfully</span>
            </div>
            {/* Spinner keyframe */}
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

            {/* Ambient background orbs */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div className="profile-orb profile-orb-1" />
                <div className="profile-orb profile-orb-2" />
                <div className="profile-orb profile-orb-3" />
            </div>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 16px 60px', position: 'relative', zIndex: 1 }}>

                {/* ━━━━━━━ TOP IDENTITY BANNER ━━━━━━━ */}
                <div className="profile-fade-in" style={{
                    borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    boxShadow: '0 8px 40px rgba(99,102,241,0.10), 0 2px 8px rgba(0,0,0,0.08)',
                }}>
                    <div style={{ height: 5, background: `linear-gradient(90deg, ${accent.indigo}, ${accent.violet}, ${accent.cyan})` }} />

                    <div style={{ padding: '32px 32px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>

                            {/* Left: Avatar + name block */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>

                                {/* Avatar */}
                                <div
                                    style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                                    onClick={() => fileRef.current?.click()}
                                    className="group"
                                >
                                    <div style={{
                                        width: 88, height: 88, borderRadius: '50%',
                                        border: `3px solid ${accent.indigo}50`,
                                        overflow: 'hidden', position: 'relative',
                                        background: `linear-gradient(135deg, ${accent.indigo}, ${accent.violet})`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 0 0 4px var(--color-surface), 0 4px 20px ${accent.indigo}30`,
                                    }}>
                                        {form.avatar
                                            ? <img src={form.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{initials}</span>
                                        }
                                        <div style={{
                                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            opacity: 0, transition: 'opacity 0.18s',
                                        }} className="group-hover:opacity-100">
                                            <Camera size={20} style={{ color: '#fff' }} />
                                        </div>
                                    </div>
                                    {/* Green dot */}
                                    <div style={{
                                        position: 'absolute', bottom: 4, right: 4,
                                        width: 14, height: 14, borderRadius: '50%',
                                        background: accent.green,
                                        border: '2.5px solid var(--color-surface)',
                                    }} />
                                    <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleAvatar} />
                                </div>

                                {/* Name / headline */}
                                <div>
                                    {isEditing
                                        ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
                                            <InlineInput value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
                                            <InlineInput value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="Headline" />
                                            <InlineInput value={form.location} onChange={e => set('location', e.target.value)} placeholder="📍 Location" />
                                        </div>
                                        : <div>
                                            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-text)', lineHeight: 1.2, marginBottom: 4, letterSpacing: '-0.02em' }}>
                                                {dp.name || user?.username || 'User'}
                                            </h1>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-muted-text)', marginBottom: 10 }}>{dp.headline}</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {dp.location && <Tag color={accent.indigo}><MapPin size={10} style={{ marginRight: 3 }} />{dp.location}</Tag>}
                                                <Tag color={accent.green}>● Available</Tag>
                                                <Tag color={accent.violet}><Briefcase size={10} style={{ marginRight: 3 }} />Developer</Tag>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>

                            {/* Right: Action buttons */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
                                {isEditing ? (
                                    <>
                                        <button onClick={cancel} style={{
                                            padding: '9px 18px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600,
                                            border: '1px solid var(--color-border)',
                                            color: 'var(--color-muted-text)', background: 'transparent', cursor: 'pointer',
                                        }}>Cancel</button>
                                        <button onClick={save} disabled={saveLoading} style={{
                                            padding: '9px 22px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700,
                                            color: '#fff', cursor: 'pointer',
                                            background: `linear-gradient(135deg, ${accent.indigo}, ${accent.violet})`,
                                            border: 'none', boxShadow: `0 4px 14px ${accent.indigo}40`,
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            opacity: saveLoading ? 0.7 : 1,
                                        }}>
                                            {saveLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                                            Save
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} style={{
                                        padding: '9px 20px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600,
                                        color: 'var(--color-primary-text)', cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.07)',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex', alignItems: 'center', gap: 7,
                                        transition: 'all 0.18s',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = accent.indigo + '60'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                                    >
                                        <Edit2 size={13} /> Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* XP bar */}
                        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
                            <XpBar xp={displayStats.xp} level={displayStats.level} />
                        </div>
                    </div>
                </div>

                {/* ━━━━━━━ STAT ROW ━━━━━━━ */}
                <div className="profile-fade-in-delay" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    <StatPill icon={Zap} value={displayStats.xp} label="XP" color={accent.amber} />
                    <StatPill icon={Flame} value={displayStats.streak > 0 ? `${displayStats.streak}d` : '0d'} label="Streak" color={accent.rose} />
                    <StatPill icon={Trophy} value={displayStats.rank != null ? `#${displayStats.rank}` : '—'} label="Rank" color={accent.indigo} />
                    <StatPill icon={BookOpen} value={displayStats.courses_completed} label="Courses" color={accent.cyan} />
                    <StatPill icon={CheckCircle} value={displayStats.problems_solved} label="Solved" color={accent.green} />
                </div>

                {/* ━━━━━━━ TAB BAR ━━━━━━━ */}
                <div className="profile-fade-in-delay-2" style={{
                    display: 'flex', padding: 5, marginBottom: 20,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(99,102,241,0.08)',
                    position: 'relative',
                }}>
                    {/* Sliding pill */}
                    <div style={{
                        position: 'absolute',
                        top: 5, bottom: 5,
                        width: `calc(${100 / TABS.length}% - ${10 / TABS.length}px)`,
                        background: `linear-gradient(135deg, ${accent.indigo}22, ${accent.violet}18)`,
                        border: `1.5px solid ${accent.indigo}40`,
                        borderRadius: 11,
                        boxShadow: `0 2px 12px ${accent.indigo}25`,
                        transform: `translateX(calc(${TABS.findIndex(t => t.id === activeTab)} * (100% + ${10 / TABS.length}px)))`,
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
                        pointerEvents: 'none',
                        zIndex: 0,
                    }} />
                    {TABS.map(({ id, label, icon: Icon }) => {
                        const active = activeTab === id;
                        return (
                            <button key={id} onClick={() => setActiveTab(id)} style={{
                                flex: 1, padding: '10px 14px', borderRadius: 11, border: 'none', cursor: 'pointer',
                                fontWeight: active ? 700 : 600, fontSize: '0.82rem',
                                background: 'transparent',
                                color: active ? accent.indigo : 'var(--color-muted-text)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                transition: 'color 0.2s',
                                position: 'relative', zIndex: 1,
                            }}>
                                <Icon size={14} /> {label}
                            </button>
                        );
                    })}
                </div>

                {/* ━━━━━━━ TAB PANELS ━━━━━━━ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

                    {/* Main panel */}
                    <div>
                        {activeTab === 'overview' && (
                            <SectionCard>
                                <SectionTitle icon={User} accentColor={accent.indigo}>About Me</SectionTitle>
                                {isEditing
                                    ? <InlineInput multiline value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell us about yourself..." />
                                    : <p style={{ fontSize: '0.88rem', lineHeight: 1.75, color: dp.bio ? 'var(--color-primary-text)' : 'var(--color-muted-text)', fontStyle: dp.bio ? 'normal' : 'italic' }}>
                                        {dp.bio || 'No bio added yet. Click Edit Profile to introduce yourself!'}
                                    </p>
                                }

                                {/* Quick facts row */}
                                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {[
                                        { label: 'Email', value: dp.email, color: accent.indigo },
                                        { label: 'Location', value: dp.location || '—', color: accent.cyan },
                                        { label: 'Status', value: 'Available', color: accent.green },
                                        { label: 'Member since', value: memberYear, color: accent.violet },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-text)', marginBottom: 4 }}>{label}</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-text)' }}>{value}</div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {activeTab === 'skills' && (
                            <SectionCard>
                                <SectionTitle icon={Code2} accentColor={accent.violet}>Skills &amp; Proficiency</SectionTitle>
                                {SKILLS.map(s => <SkillBar key={s.label} {...s} />)}

                                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-text)', marginBottom: 10 }}>Tags</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {[
                                            { label: 'Python', color: accent.indigo },
                                            { label: 'Pandas', color: accent.violet },
                                            { label: 'NumPy', color: accent.cyan },
                                            { label: 'Scikit-learn', color: accent.green },
                                            { label: 'PyTorch', color: accent.rose },
                                            { label: 'RAG', color: accent.amber },
                                            { label: 'React', color: accent.indigo },
                                            { label: 'SQL', color: accent.cyan },
                                        ].map(s => <Tag key={s.label} color={s.color}>{s.label}</Tag>)}
                                    </div>
                                </div>
                            </SectionCard>
                        )}

                        {activeTab === 'links' && (
                            <SectionCard>
                                <SectionTitle icon={LinkIcon} accentColor={accent.rose}>Social Links</SectionTitle>
                                {isEditing
                                    ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <InlineInput value={form.github || ''} onChange={e => set('github', e.target.value)} placeholder="GitHub profile URL" />
                                        <InlineInput value={form.linkedin || ''} onChange={e => set('linkedin', e.target.value)} placeholder="LinkedIn profile URL" />
                                    </div>
                                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <LinkRow label="GitHub" href={dp.github} color="#333333" icon={Github} />
                                        <LinkRow label="LinkedIn" href={dp.linkedin} color="#0077b5" icon={Linkedin} />
                                    </div>
                                }
                            </SectionCard>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Achievements card */}
                        <SectionCard>
                            <SectionTitle icon={Trophy} accentColor={accent.amber}>Achievements</SectionTitle>
                            {achievements.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: '50%', margin: '0 auto 12px',
                                        background: `linear-gradient(135deg, ${accent.amber}30, ${accent.rose}30)`,
                                        border: `1.5px dashed ${accent.amber}60`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Trophy size={22} style={{ color: accent.amber, opacity: 0.5 }} />
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-muted-text)' }}>No achievements yet</p>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)', marginTop: 4, opacity: 0.7 }}>
                                        Solve problems to earn badges
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {achievements.map(a => (
                                        <AchievementBadge key={a.badge_key} {...a} />
                                    ))}
                                </div>
                            )}
                        </SectionCard>

                        {/* Resume card */}
                        <SectionCard>
                            <SectionTitle icon={FileText} accentColor={accent.cyan}>Resume</SectionTitle>
                            {dp.resumeUrl
                                ? <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px', borderRadius: 12, marginBottom: 12,
                                    background: `${accent.cyan}12`, border: `1px solid ${accent.cyan}30`,
                                }}>
                                    <a
                                        href={`${import.meta.env.VITE_API_URL.replace(/\/$/, '')}${dp.resumeUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textDecoration: 'none' }}
                                    >
                                        <FileText size={14} style={{ color: accent.cyan, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: accent.cyan, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {dp.resumeName}
                                        </span>
                                    </a>
                                    <button onClick={async () => {
                                        await updateUser({ resume_url: null });
                                        set('resumeName', null);
                                        set('resumeUrl', null);
                                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                                        <X size={14} style={{ color: accent.rose }} />
                                    </button>
                                </div>
                                : <div style={{
                                    padding: '18px 0', textAlign: 'center', borderRadius: 12, marginBottom: 12,
                                    border: `1.5px dashed ${accent.cyan}40`, background: `${accent.cyan}06`,
                                }}>
                                    <FileText size={22} style={{ color: accent.cyan, opacity: 0.4, margin: '0 auto 6px' }} />
                                    <p style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)' }}>No resume uploaded</p>
                                </div>
                            }
                            <input type="file" ref={resumeRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleResume} />
                            <button onClick={() => resumeRef.current?.click()} disabled={resumeLoading} style={{
                                width: '100%', padding: '10px 0', borderRadius: 12,
                                background: `${accent.cyan}18`, color: accent.cyan,
                                fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                                border: `1.5px solid ${accent.cyan}35`,
                                transition: 'all 0.18s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                opacity: resumeLoading ? 0.7 : 1,
                            }}>
                                {resumeLoading
                                    ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</>
                                    : (dp.resumeUrl ? '↑ Update Resume' : '↑ Upload Resume')
                                }
                            </button>
                        </SectionCard>

                        {/* Activity grid */}
                        <SectionCard>
                            <SectionTitle icon={Activity} accentColor={accent.green}>Activity</SectionTitle>
                            <ActivityGrid activityData={activityData} />
                        </SectionCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
