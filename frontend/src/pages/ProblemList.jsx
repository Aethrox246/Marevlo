import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, BookOpen, Zap, Target, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadAllTopics } from '../utils/topicsLoader';

function FeatureCard({ icon, title, desc, color, horizontal = false }) {
    const cardRef = useRef(null);
    const glareRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;
        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
        if (glareRef.current) {
            glareRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, color-mix(in srgb, ${color} 25%, white 15%), transparent 65%)`;
        }
    };

    const handleMouseLeave = () => {
        setHovered(false);
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    };

    const baseStyle = {
        background: `color-mix(in srgb, ${color} 6%, var(--color-surface))`,
        border: `1px solid color-mix(in srgb, ${color} 25%, var(--color-border))`,
        transition: hovered ? 'transform 0.1s ease-out, box-shadow 0.3s ease' : 'all 0.5s ease',
        boxShadow: hovered ? `0 20px 40px color-mix(in srgb, ${color} 20%, transparent), 0 0 15px color-mix(in srgb, ${color} 30%, transparent)` : 'none',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        cursor: 'pointer',
    };

    if (horizontal) {
        return (
            <div
                ref={cardRef}
                className="relative rounded-xl p-3 overflow-hidden flex items-start gap-3"
                style={{ ...baseStyle, transform }}
                onMouseEnter={() => setHovered(true)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    ref={glareRef}
                    className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-300 z-10"
                    style={{ opacity: hovered ? 1 : 0 }}
                />
                <div style={{ fontSize: 20, flexShrink: 0, position: 'relative', zIndex: 2, lineHeight: 1 }}>{icon}</div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div className="text-xs font-bold mb-0.5" style={{ color: 'var(--color-primary-text)' }}>{title}</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'var(--color-muted-text)' }}>{desc}</div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={cardRef}
            className="relative rounded-xl p-4 overflow-hidden"
            style={{ ...baseStyle, transform }}
            onMouseEnter={() => setHovered(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={glareRef}
                className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-300 z-10"
                style={{ opacity: hovered ? 1 : 0 }}
            />
            <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="text-xl mb-2">{icon}</div>
                <div className="text-sm font-bold mb-1" style={{ color: 'var(--color-primary-text)' }}>{title}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--color-muted-text)' }}>{desc}</div>
            </div>
        </div>
    );
}

const FEATURES = [
    { icon: '💡', title: 'Multiple Approaches', desc: 'Brute Force, Optimal, Divide & Conquer — solve each problem multiple ways.', color: '#6366f1' },
    { icon: '🪜', title: '6-Level Ladder',      desc: 'Each approach has 6 sub-problems — from full solution down to basic concepts.', color: '#06b6d4' },
    { icon: '🎯', title: '10 Test Cases / Level', desc: 'Every ladder level has its own examples, explanations, and 10 test cases.', color: '#6366f1' },
];

const LADDER_RUNGS = [
    { label: 'L0', type: 'Full Problem',       color: '#818cf8', state: 'solved'   },
    { label: 'L1', type: 'Key Sub-routine',    color: '#10b981', state: 'solved'   },
    { label: 'L2', type: 'Core Logic',         color: '#f59e0b', state: 'unlocked' },
    { label: 'L3', type: 'Building Block',     color: '#ec4899', state: 'locked'   },
    { label: 'L4', type: 'Basic Operation',    color: '#06b6d4', state: 'locked'   },
    { label: 'L5', type: 'Concept Foundation', color: '#8b5cf6', state: 'locked'   },
];

const topicAccents = [
    '#6366f1', '#06b6d4', '#8b5cf6', '#ec4899',
    '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
];
const topicAccentPairs = [
    ['#6366f1', '#06b6d4'],
    ['#06b6d4', '#10b981'],
    ['#8b5cf6', '#ec4899'],
    ['#ec4899', '#f59e0b'],
    ['#f59e0b', '#ef4444'],
    ['#10b981', '#6366f1'],
    ['#ef4444', '#8b5cf6'],
    ['#3b82f6', '#06b6d4'],
];

function SkeletonCard() {
    return (
        <div className="rounded-2xl overflow-hidden animate-pulse" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <div style={{ height: 4, background: 'var(--color-surface-hover)' }} />
            <div className="p-5 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl" style={{ background: 'var(--color-surface-hover)' }} />
                <div className="w-28 h-4 rounded-full" style={{ background: 'var(--color-surface-hover)' }} />
                <div className="w-20 h-3 rounded-full" style={{ background: 'var(--color-surface-hover)' }} />
                <div className="flex gap-2 mt-1">
                    <div className="w-12 h-4 rounded-full" style={{ background: 'var(--color-surface-hover)' }} />
                    <div className="w-12 h-4 rounded-full" style={{ background: 'var(--color-surface-hover)' }} />
                    <div className="w-12 h-4 rounded-full" style={{ background: 'var(--color-surface-hover)' }} />
                </div>
                <div className="w-full h-2 rounded-full mt-1" style={{ background: 'var(--color-surface-hover)' }} />
            </div>
        </div>
    );
}

function TopicCard({ topic, accent, accentPair, onClick }) {
    const [hovered, setHovered] = useState(false);
    const count  = topic.problems?.length || 0;
    const easy   = topic.problems?.filter(p => p.difficulty === 'Easy').length   || 0;
    const medium = topic.problems?.filter(p => p.difficulty === 'Medium').length || 0;
    const hard   = topic.problems?.filter(p => p.difficulty === 'Hard').length   || 0;

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background:    'var(--color-surface)',
                border:        `1px solid ${hovered ? accent + '66' : 'var(--color-border)'}`,
                borderRadius:  20,
                overflow:      'hidden',
                cursor:        'pointer',
                transition:    'all 0.22s ease',
                transform:     hovered ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow:     hovered ? `0 16px 40px ${accent}28, 0 0 0 1px ${accent}22` : '0 1px 4px rgba(0,0,0,0.05)',
                textAlign:     'left',
                display:       'flex',
                flexDirection: 'column',
                width:         '100%',
            }}
        >
            {/* Gradient top bar */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${accentPair[0]}, ${accentPair[1]})`, transition: 'height 0.2s', ...(hovered ? { height: 5 } : {}) }} />

            <div style={{ padding: '20px 20px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Arrow row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <ArrowRight
                        size={16}
                        style={{
                            color: hovered ? accent : 'var(--color-muted-text)',
                            transition: 'all 0.2s',
                            transform: hovered ? 'translateX(3px)' : 'translateX(0)',
                        }}
                    />
                </div>

                {/* Name + count */}
                <div style={{ fontWeight: 800, fontSize: '0.97rem', color: 'var(--color-primary-text)', marginBottom: 3, lineHeight: 1.3 }}>
                    {topic.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)', marginBottom: 14 }}>
                    {count} problems
                </div>

                {/* Difficulty dots */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    {easy > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 700, color: '#10b981' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
                            {easy} Easy
                        </span>
                    )}
                    {medium > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', flexShrink: 0 }} />
                            {medium} Med
                        </span>
                    )}
                    {hard > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 700, color: '#ef4444' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                            {hard} Hard
                        </span>
                    )}
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--color-muted-text)', marginBottom: 5, fontWeight: 600 }}>
                        <span>0 solved</span>
                        <span>{count} total</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: 'var(--color-surface-hover)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', width: '0%',
                            background: `linear-gradient(90deg, ${accentPair[0]}, ${accentPair[1]})`,
                            borderRadius: 999,
                        }} />
                    </div>
                </div>
            </div>
        </button>
    );
}

function FeatureSidebar() {
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
            {/* Gradient top bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #6366f1, #06b6d4, #10b981)' }} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 16 }}>🧠</span>
                    <h2 className="text-sm font-bold" style={{ color: 'var(--color-primary-text)' }}>
                        Learn Smarter, Not Faster
                    </h2>
                </div>
                <p className="text-xs mb-4" style={{ color: 'var(--color-muted-text)', lineHeight: 1.6 }}>
                    Every problem comes with multiple approaches, each broken into{' '}
                    <strong style={{ color: 'var(--color-primary-text)' }}>6 ladder levels</strong> — from the full problem down to the foundational concept.
                </p>

                {/* Ladder visual */}
                <div
                    className="rounded-xl p-3 mb-4"
                    style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}
                >
                    <div
                        className="text-xs font-semibold mb-2"
                        style={{ color: 'var(--color-muted-text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                    >
                        Ladder System
                    </div>

                    {/* Horizontal rung row */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {LADDER_RUNGS.map((rung, i, arr) => (
                            <React.Fragment key={rung.label}>
                                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 9, fontWeight: 800,
                                        background: rung.state === 'solved' ? '#f59e0b' : rung.state === 'unlocked' ? '#10b981' : 'var(--color-surface)',
                                        color: rung.state === 'locked' ? 'var(--color-muted-text)' : '#fff',
                                        border: rung.state === 'locked' ? '1.5px dashed var(--color-muted-text)' : 'none',
                                        boxShadow: rung.state === 'solved' ? '0 0 8px rgba(245,158,11,0.35)' : 'none',
                                        transition: 'all 0.3s',
                                    }}>
                                        {rung.state === 'solved' ? '✓' : rung.state === 'unlocked' ? rung.label : '🔒'}
                                    </div>
                                    <span className="text-center" style={{
                                        fontSize: 7,
                                        color: rung.state === 'solved' ? '#f59e0b' : rung.state === 'unlocked' ? '#10b981' : 'var(--color-muted-text)',
                                        fontWeight: 600, maxWidth: 52, lineHeight: 1.3,
                                    }}>
                                        {rung.label}<br />{rung.type}
                                    </span>
                                </div>
                                {i < arr.length - 1 && (
                                    <div style={{
                                        flex: 1, height: 2, minWidth: 4,
                                        background: rung.state === 'solved' ? '#f59e0b' : rung.state === 'unlocked' ? '#10b981' : 'var(--color-border)',
                                        borderRadius: 2,
                                    }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-2.5 flex items-center gap-3" style={{ fontSize: 9, color: 'var(--color-muted-text)' }}>
                        <span className="flex items-center gap-1">
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> Solved
                        </span>
                        <span className="flex items-center gap-1">
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Unlocked
                        </span>
                        <span className="flex items-center gap-1">
                            <span style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px dashed var(--color-muted-text)', display: 'inline-block' }} /> Locked
                        </span>
                    </div>
                </div>

                {/* Feature cards — horizontal layout */}
                <div className="flex flex-col gap-2">
                    {FEATURES.map(f => (
                        <FeatureCard key={f.title} {...f} horizontal />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ProblemList({ onSelect }) {
    const [topics, setTopics]                 = useState([]);
const [expandedTopics, setExpandedTopics] = useState(() => {
    const saved = sessionStorage.getItem('problemListExpandedTopics');
    return saved ? JSON.parse(saved) : { arrays: true };
});
    const [visibleCounts, setVisibleCounts] = useState(() => {
    const saved = sessionStorage.getItem('problemListVisibleCounts');
    return saved ? JSON.parse(saved) : { arrays: 10 };
});
    const [loading, setLoading]               = useState(true);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
    sessionStorage.setItem(
        'problemListExpandedTopics',
        JSON.stringify(expandedTopics)
    );
}, [expandedTopics]);

useEffect(() => {
    sessionStorage.setItem(
        'problemListVisibleCounts',
        JSON.stringify(visibleCounts)
    );
}, [visibleCounts]);

    useEffect(() => {
        loadAllTopics()
            .then(setTopics)
            .catch((err) => console.error('Failed to load topics:', err))
            .finally(() => setLoading(false));
    }, []);

    const totalProblems = topics.reduce((s, t) => s + (t.problems?.length || 0), 0);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <style>{`
                @keyframes heroPulse {
                    0%,100% { opacity:0.55; transform:scale(1); }
                    50%     { opacity:0.75; transform:scale(1.06); }
                }
                @keyframes heroGlow {
                    0%,100% { opacity:0.4; transform:scale(1) translateY(0); }
                    50%     { opacity:0.65; transform:scale(1.08) translateY(-8px); }
                }
            `}</style>

            {/* Hero — unchanged */}
            <div className="relative overflow-hidden border-b bg-white dark:bg-black border-black/[0.06] dark:border-white/[0.06]" style={{ minHeight: '340px' }}>
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse,rgba(99,102,241,0.28) 0%,transparent 70%)', filter: 'blur(60px)', animation: 'heroGlow 8s ease-in-out infinite' }} />
                <div className="absolute top-1/2 -left-32 -translate-y-1/2 w-[380px] h-[380px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(6,182,212,0.45) 0%,transparent 65%)', filter: 'blur(80px)', animation: 'heroPulse 7s ease-in-out infinite' }} />
                <div className="absolute top-1/2 -right-32 -translate-y-1/2 w-[360px] h-[360px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 65%)', filter: 'blur(80px)', animation: 'heroPulse 9s ease-in-out 1.5s infinite' }} />

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '48px 24px 44px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '5px 14px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.055)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '0.68rem', fontWeight: 700,
                        color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        marginBottom: 20, backdropFilter: 'blur(8px)',
                    }}>
                        <Sparkles size={10} style={{ color: '#06b6d4' }} />
                        Algorithm Practice
                    </div>

                    <h1 style={{
                        margin: '0 0 12px',
                        fontSize: 'clamp(2.8rem, 5vw, 3.75rem)',
                        fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1,
                        color: '#ffffff',
                    }}>
                        Practice Problems
                    </h1>

                    <p style={{
                        margin: '0 auto 26px',
                        fontSize: '0.93rem',
                        color: 'rgba(255,255,255,0.62)',
                        lineHeight: 1.7, maxWidth: 420,
                    }}>
                        Master data structures and algorithms — one problem at a time.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {[
                            { icon: <BookOpen size={13} />, label: `${loading ? '…' : totalProblems} Problems` },
                            { icon: <Target    size={13} />, label: `${loading ? '…' : topics.length} Topics`   },
                            { icon: <Zap      size={13} />, label: '6-Level Ladder' },
                        ].map(({ icon, label }) => (
                            <div key={label} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 999,
                                background: 'rgba(255,255,255,0.055)',
                                border: '1px solid rgba(255,255,255,0.09)',
                                fontSize: '0.76rem', fontWeight: 600,
                                color: 'rgba(255,255,255,0.6)',
                                backdropFilter: 'blur(8px)',
                            }}>
                                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{icon}</span>
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '7fr 3fr',
                    gap: 24,
                    width: '70%',
                    margin: '0 auto',
                    padding: '32px 0 48px',
                    alignItems: 'start',
                }}
            >
                {/* Left — topic card grid (70%) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {loading
                        ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
                        : topics.map((topic, ti) => (
                            <TopicCard
                                key={topic.id}
                                topic={topic}
                                accent={topicAccents[ti % topicAccents.length]}
                                accentPair={topicAccentPairs[ti % topicAccentPairs.length]}
                                onClick={() => navigate(`/problems/${topic.id}`)}
                            />
                        ))
                    }
                </div>

                                    <div className="flex items-center gap-3">
                                        <span
                                            className="text-xs px-3 py-1 rounded-full font-bold hidden sm:inline-block"
                                            style={{ background: accent + '18', color: accent }}
                                        >
                                            {count}
                                        </span>
                                        <ChevronDown
                                            size={18}
                                            className="transition-transform duration-300 flex-shrink-0"
                                            style={{ color: 'var(--color-muted-text)', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                                        />
                                    </div>
                                </button>

                                {/* Problem rows */}
                                {isOpen && (
                                    <div style={{ borderTop: `1px solid ${accent}33` }}>
                                        {count > 0 ? (
                                            <>
                                                {topic.problems.slice(0, visibleCounts[topic.id] || 10).map((problem, idx) => {
                                                    const dc = difficultyConfig[problem.difficulty] || difficultyConfig.Hard;
                                                    return (
                                                <button
                                                    key={problem.id}
                                                   onClick={() => {
    const mainElement = document.querySelector('main');

    if (mainElement) {
        sessionStorage.setItem(
            'problemListScroll',
            mainElement.scrollTop
        );
    }

    onSelect(problem);
}}
                                                    className="w-full flex items-center justify-between px-5 py-3.5 text-left group transition-all"
                                                    style={{
                                                        borderTop: idx > 0 ? '1px solid var(--color-border)' : 'none',
                                                        paddingLeft: '2.5rem',
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Index badge */}
                                                        <span
                                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                            style={{ background: 'var(--color-surface-hover)', color: 'var(--color-muted-text)', border: '1px solid var(--color-border)' }}
                                                        >
                                                            {idx + 1}
                                                        </span>
                                                        <span
                                                            className="font-medium text-sm"
                                                            style={{ color: 'var(--color-primary-text)' }}
                                                        >
                                                            {problem.title}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 flex-shrink-0">
                                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${dc.classes}`}>
                                                            {dc.label}
                                                        </span>
                                                        <ArrowRight
                                                            size={15}
                                                            className="transition-transform duration-200 group-hover:translate-x-1"
                                                            style={{ color: 'var(--color-muted-text)' }}
                                                        />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {(visibleCounts[topic.id] || 10) < count && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setVisibleCounts(prev => ({
                                                        ...prev,
                                                        [topic.id]: (prev[topic.id] || 10) + 10
                                                    }));
                                                }}
                                                className="w-full text-center py-4 text-sm font-semibold transition-colors flex justify-center items-center gap-2 group"
                                                style={{ color: accent, background: accent + '08', borderTop: '1px solid var(--color-border)' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = accent + '15'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = accent + '08'; }}
                                            >
                                                <span>Load Next {Math.min(10, count - (visibleCounts[topic.id] || 10))} Problems</span>
                                                <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 'normal' }}>
                                                    ({count - (visibleCounts[topic.id] || 10)} total remaining)
                                                </span>
                                                <ChevronDown size={14} className="transition-transform group-hover:translate-y-0.5" />
                                            </button>
                                        )}
                                        </>
                                        ) : (
                                            <div className="px-5 py-6 pl-10 text-sm italic" style={{ color: 'var(--color-muted-text)' }}>
                                                No problems found for this topic yet.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                }
                {/* Right — sticky feature sidebar (30%) */}
                <aside style={{ position: 'sticky', top: 16 }}>
                    <FeatureSidebar />
                </aside>
            </div>
        </div>
    );
}
