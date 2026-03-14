import React, { useState, useRef, useEffect } from 'react';
import {
    Camera, Edit2, Save, X, MapPin, Briefcase, FileText,
    Zap, Trophy, Github, Linkedin, ArrowUpRight,
    Code2, BookOpen, CheckCircle, Flame, Star,
    ChevronRight, User, Link as LinkIcon, Shield, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ════════════════════════════════════════════
   TINY REUSABLE PRIMITIVES
   ════════════════════════════════════════════ */

/** Accent: always indigo-based, auto safe on both modes */
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
    };
    const focus = (e) => (e.currentTarget.style.borderColor = accent.indigo);
    const blur = (e) => (e.currentTarget.style.borderColor = 'var(--color-border)');

    return multiline
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
            style={shared} onFocus={focus} onBlur={blur} />
        : <input value={value} onChange={onChange} placeholder={placeholder}
            style={shared} onFocus={focus} onBlur={blur} />;
}

/* ════════════════════════════════════════════
   STAT PILL
   ════════════════════════════════════════════ */
function StatPill({ icon: Icon, value, label, color }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '14px 20px', borderRadius: 16, flex: 1, minWidth: 80,
            background: `${color}0d`, border: `1px solid ${color}25`,
        }}>
            <Icon size={18} style={{ color, marginBottom: 6 }} />
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-text)', lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>{label}</span>
        </div>
    );
}

/* ════════════════════════════════════════════
   XP PROGRESS BAR
   ════════════════════════════════════════════ */
function XpBar({ points }) {
    const level = Math.floor(points / 100) + 1;
    const xpInLevel = points % 100;
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
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: color, transition: 'width 0.9s ease' }} />
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════
   LINK ROW
   ════════════════════════════════════════════ */
function LinkRow({ label, href, color }) {
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
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: hov ? color : 'var(--color-primary-text)' }}>{label}</span>
            </div>
            <ArrowUpRight size={14} style={{ color: hov ? color : 'var(--color-muted-text)', transition: 'color 0.2s' }} />
        </a>
    );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function Profile() {
    const { user, updateUser, userPoints } = useAuth();

    const defaults = {
        name: 'User', headline: 'Aspiring Developer', bio: '',
        location: '', email: 'user@example.com', avatar: null,
        resumeName: null, github: '', linkedin: ''
    };
    const dp = { ...defaults, ...user }; // display profile

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(dp);
    const [activeTab, setActiveTab] = useState('overview');
    const fileRef = useRef(null);
    const resumeRef = useRef(null);

    useEffect(() => { if (!isEditing) setForm(dp); }, [user, isEditing]);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleAvatar = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        if (file.size > 2e6) return alert('Max 2 MB');
        const r = new FileReader();
        r.onloadend = () => { set('avatar', r.result); if (!isEditing) updateUser({ avatar: r.result }); };
        r.readAsDataURL(file);
    };

    const handleResume = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!isEditing) updateUser({ resumeName: file.name }); else set('resumeName', file.name);
    };

    const save = () => { updateUser(form); setIsEditing(false); };
    const cancel = () => { setForm(dp); setIsEditing(false); };

    const initials = dp.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const pts = userPoints || 0;

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
        <div style={{ minHeight: '100vh', background: 'var(--color-app-bg)', color: 'var(--color-primary-text)', overflowY: 'auto' }}
            className="custom-scrollbar">
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 16px 60px' }}>

                {/* ━━━━━━━ TOP IDENTITY BANNER ━━━━━━━ */}
                <div style={{
                    borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                }}>
                    {/* Thin accent top stripe — matches both modes */}
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
                                                {dp.name}
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
                                        <button onClick={save} style={{
                                            padding: '9px 22px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700,
                                            color: '#fff', cursor: 'pointer',
                                            background: `linear-gradient(135deg, ${accent.indigo}, ${accent.violet})`,
                                            border: 'none', boxShadow: `0 4px 14px ${accent.indigo}40`,
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}>
                                            <Save size={14} /> Save
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} style={{
                                        padding: '9px 20px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 600,
                                        color: 'var(--color-primary-text)', cursor: 'pointer',
                                        background: 'var(--color-surface-hover)',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex', alignItems: 'center', gap: 7,
                                    }}>
                                        <Edit2 size={13} /> Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* XP bar */}
                        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
                            <XpBar points={pts} />
                        </div>
                    </div>
                </div>

                {/* ━━━━━━━ STAT ROW ━━━━━━━ */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    <StatPill icon={Zap} value={pts} label="XP" color={accent.amber} />
                    <StatPill icon={Flame} value="0d" label="Streak" color={accent.rose} />
                    <StatPill icon={Trophy} value="—" label="Rank" color={accent.indigo} />
                    <StatPill icon={BookOpen} value="0" label="Courses" color={accent.cyan} />
                    <StatPill icon={CheckCircle} value="0" label="Solved" color={accent.green} />
                </div>

                {/* ━━━━━━━ TAB BAR ━━━━━━━ */}
                <div style={{
                    display: 'flex', gap: 4, padding: 5, marginBottom: 20,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16,
                }}>
                    {TABS.map(({ id, label, icon: Icon }) => {
                        const active = activeTab === id;
                        return (
                            <button key={id} onClick={() => setActiveTab(id)} style={{
                                flex: 1, padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                fontWeight: active ? 700 : 600, fontSize: '0.82rem',
                                background: active ? `${accent.indigo}18` : 'transparent',
                                color: active ? accent.indigo : 'var(--color-muted-text)',
                                borderBottom: active ? `2px solid ${accent.indigo}` : '2px solid transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                transition: 'all 0.18s',
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
                                        { label: 'Member since', value: '2025', color: accent.violet },
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
                                <SectionTitle icon={Code2} accentColor={accent.violet}>Skills & Proficiency</SectionTitle>
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
                                        <LinkRow label="GitHub" href={dp.github} color="#333" />
                                        <LinkRow label="LinkedIn" href={dp.linkedin} color="#0077b5" />
                                    </div>
                                }
                            </SectionCard>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Achievements mini card */}
                        <SectionCard>
                            <SectionTitle icon={Trophy} accentColor={accent.amber}>Achievements</SectionTitle>
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
                        </SectionCard>

                        {/* Resume card */}
                        <SectionCard>
                            <SectionTitle icon={FileText} accentColor={accent.cyan}>Resume</SectionTitle>
                            {dp.resumeName
                                ? <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px', borderRadius: 12, marginBottom: 12,
                                    background: `${accent.cyan}12`, border: `1px solid ${accent.cyan}30`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                        <FileText size={14} style={{ color: accent.cyan, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: accent.cyan, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {dp.resumeName}
                                        </span>
                                    </div>
                                    <button onClick={() => updateUser({ resumeName: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
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
                            <button onClick={() => resumeRef.current?.click()} style={{
                                width: '100%', padding: '10px 0', borderRadius: 12, border: 'none',
                                background: `${accent.cyan}18`, color: accent.cyan,
                                fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                                border: `1.5px solid ${accent.cyan}35`,
                                transition: 'all 0.18s',
                            }}>
                                {dp.resumeName ? '↑ Update Resume' : '↑ Upload Resume'}
                            </button>
                        </SectionCard>

                        {/* Activity placeholder */}
                        <SectionCard>
                            <SectionTitle icon={Activity} accentColor={accent.green}>Activity</SectionTitle>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
                                {Array.from({ length: 70 }, (_, i) => {
                                    const intensity = Math.random();
                                    const filled = intensity > 0.6;
                                    const mid = intensity > 0.75 && intensity <= 0.9;
                                    return (
                                        <div key={i} style={{
                                            width: '100%', aspectRatio: '1',
                                            borderRadius: 3,
                                            background: filled
                                                ? mid ? `${accent.green}80` : `${accent.green}40`
                                                : 'var(--color-surface-hover)',
                                        }} />
                                    );
                                })}
                            </div>
                            <p style={{ marginTop: 10, fontSize: '0.7rem', color: 'var(--color-muted-text)', textAlign: 'center' }}>
                                Activity tracked here
                            </p>
                        </SectionCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
