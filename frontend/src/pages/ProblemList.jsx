import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronDown, BookOpen, Zap, Target, Sparkles } from 'lucide-react';
import { loadAllTopics } from '../utils/topicsLoader';

function FeatureCard({ icon, title, desc, color }) {
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

    return (
        <div
            ref={cardRef}
            className="relative rounded-xl p-4 overflow-hidden"
            style={{
                background: `color-mix(in srgb, ${color} 6%, var(--color-surface))`,
                border: `1px solid color-mix(in srgb, ${color} 25%, var(--color-border))`,
                transform: transform,
                transition: hovered ? 'transform 0.1s ease-out, box-shadow 0.3s ease' : 'all 0.5s ease',
                boxShadow: hovered ? `0 20px 40px color-mix(in srgb, ${color} 20%, transparent), 0 0 15px color-mix(in srgb, ${color} 30%, transparent)` : 'none',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                cursor: 'pointer'
            }}
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

const difficultyConfig = {
    Easy:   { label: 'Easy',   classes: 'bg-green-100 text-green-700 border border-green-200' },
    Medium: { label: 'Medium', classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
    Hard:   { label: 'Hard',   classes: 'bg-red-100   text-red-700   border border-red-200'   },
};

// Two-colour gradient pairs per topic (cycles if more topics than pairs)
const topicAccents = [
    '#6366f1', '#06b6d4', '#8b5cf6', '#ec4899',
    '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
];
// Paired end-colors for the gradient line
const topicAccentPairs = [
    ['#6366f1', '#06b6d4'], // indigo → cyan
    ['#06b6d4', '#10b981'], // cyan → emerald
    ['#8b5cf6', '#ec4899'], // violet → pink
    ['#ec4899', '#f59e0b'], // pink → amber
    ['#f59e0b', '#ef4444'], // amber → red
    ['#10b981', '#6366f1'], // emerald → indigo
    ['#ef4444', '#8b5cf6'], // red → violet
    ['#3b82f6', '#06b6d4'], // blue → cyan
];

function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-neutral-100 overflow-hidden animate-pulse mb-3">
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-40 h-4 rounded-full bg-neutral-100" />
                </div>
                <div className="w-20 h-6 rounded-full bg-neutral-100" />
            </div>
        </div>
    );
}

export default function ProblemList({ onSelect }) {
    const [topics, setTopics]                 = useState([]);
    const [expandedTopics, setExpandedTopics] = useState({ arrays: true });
    const [visibleCounts, setVisibleCounts]   = useState({ arrays: 10 });
    const [loading, setLoading]               = useState(true);

    useEffect(() => {
        loadAllTopics()
            .then(setTopics)
            .catch((err) => console.error('Failed to load topics:', err))
            .finally(() => setLoading(false));
    }, []);

    const toggleTopic = (id) => {
        setExpandedTopics((prev) => {
            const willOpen = !prev[id];
            return { ...prev, [id]: willOpen };
        });
        if (!visibleCounts[id]) {
            setVisibleCounts((prev) => ({ ...prev, [id]: 10 }));
        }
    };



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

            {/* Hero Header — full-width, animated glows matching Projects / Courses pages */}
            <div className="relative overflow-hidden border-b bg-white dark:bg-black border-black/[0.06] dark:border-white/[0.06]" style={{minHeight:'340px'}}>
                {/* Centre top glow */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full pointer-events-none" style={{background:'radial-gradient(ellipse,rgba(99,102,241,0.28) 0%,transparent 70%)',filter:'blur(60px)',animation:'heroGlow 8s ease-in-out infinite'}} />
                {/* Teal glow left */}
                <div className="absolute top-1/2 -left-32 -translate-y-1/2 w-[380px] h-[380px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle,rgba(6,182,212,0.45) 0%,transparent 65%)',filter:'blur(80px)',animation:'heroPulse 7s ease-in-out infinite'}} />
                {/* Violet glow right */}
                <div className="absolute top-1/2 -right-32 -translate-y-1/2 w-[360px] h-[360px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle,rgba(139,92,246,0.4) 0%,transparent 65%)',filter:'blur(80px)',animation:'heroPulse 9s ease-in-out 1.5s infinite'}} />

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '48px 24px 44px' }}>
                    {/* Pill badge */}
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
                        fontSize: 'clamp(1.9rem, 5vw, 2.8rem)',
                        fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1,
                        color: '#ffffff',
                    }}>
                        Practice Problems
                    </h1>

                    <p style={{
                        margin: '0 auto 26px',
                        fontSize: '0.93rem',
                        color: 'rgba(255,255,255,0.38)',
                        lineHeight: 1.7, maxWidth: 420,
                    }}>
                        Master data structures and algorithms — one problem at a time.
                    </p>

                    {/* Stat chips */}
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
                                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{icon}</span>
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Approaches & Ladder Feature Callout */}
            <div className="max-w-4xl mx-auto px-8 pt-8 pb-2">
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    {/* Gradient top bar */}
                    <div style={{ height: 3, background: 'linear-gradient(90deg, #6366f1, #06b6d4, #10b981)' }} />

                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: 18 }}>🧠</span>
                            <h2 className="text-base font-bold" style={{ color: 'var(--color-primary-text)' }}>
                                Learn Smarter, Not Faster
                            </h2>
                        </div>
                        <p className="text-sm mb-5" style={{ color: 'var(--color-muted-text)', lineHeight: 1.6 }}>
                            Every problem comes with multiple solution approaches. Each approach breaks down into <strong style={{ color: 'var(--color-primary-text)' }}>6 ladder levels</strong> — from the full problem (L0) down to the foundational concept (L5). Each level is its own coding problem with test cases.
                        </p>

                        {/* Ladder System Visual */}
                        <div
                            className="rounded-xl p-4 mb-5"
                            style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}
                        >
                            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-muted-text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Ladder System — Each level is a coding problem
                            </div>
                            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                                {[
                                    { label: 'L0', type: 'Full Problem',      color: '#818cf8', state: 'solved'   },
                                    { label: 'L1', type: 'Key Sub-routine',   color: '#10b981', state: 'solved'   },
                                    { label: 'L2', type: 'Core Logic',        color: '#f59e0b', state: 'unlocked' },
                                    { label: 'L3', type: 'Building Block',    color: '#ec4899', state: 'locked'   },
                                    { label: 'L4', type: 'Basic Operation',   color: '#06b6d4', state: 'locked'   },
                                    { label: 'L5', type: 'Concept Foundation',color: '#8b5cf6', state: 'locked'   },
                                ].map((rung, i, arr) => (
                                    <React.Fragment key={rung.label}>
                                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 10, fontWeight: 800,
                                                background: rung.state === 'solved' ? '#f59e0b' : rung.state === 'unlocked' ? '#10b981' : 'var(--color-surface)',
                                                color: rung.state === 'locked' ? 'var(--color-muted-text)' : '#fff',
                                                border: rung.state === 'locked' ? '1.5px dashed var(--color-muted-text)' : 'none',
                                                boxShadow: rung.state === 'solved' ? '0 0 10px rgba(245,158,11,0.3)' : 'none',
                                                transition: 'all 0.3s',
                                            }}>
                                                {rung.state === 'solved' ? '✓' : rung.state === 'unlocked' ? rung.label : '🔒'}
                                            </div>
                                            <span className="text-center" style={{ fontSize: 8, color: rung.state === 'solved' ? '#f59e0b' : rung.state === 'unlocked' ? '#10b981' : 'var(--color-muted-text)', fontWeight: 600, maxWidth: 64, lineHeight: 1.3 }}>
                                                {rung.label}<br />{rung.type}
                                            </span>
                                        </div>
                                        {i < arr.length - 1 && (
                                            <div style={{ flex: 1, height: 2, minWidth: 8, background: rung.state === 'solved' ? '#f59e0b' : rung.state === 'unlocked' ? '#10b981' : 'var(--color-border)', borderRadius: 2 }} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                            <div className="mt-3 flex items-center gap-4" style={{ fontSize: 10, color: 'var(--color-muted-text)' }}>
                                <span className="flex items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> Solved</span>
                                <span className="flex items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Unlocked</span>
                                <span className="flex items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px dashed var(--color-muted-text)', display: 'inline-block' }} /> Locked</span>
                            </div>
                        </div>

                        {/* 3 Feature cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                {
                                    icon: '💡',
                                    title: 'Multiple Approaches',
                                    desc: 'Brute Force, Optimal, Divide & Conquer — solve each problem multiple ways.',
                                    color: '#6366f1',
                                },
                                {
                                    icon: '🪜',
                                    title: '6-Level Ladder',
                                    desc: 'Each approach has 6 sub-problems — from full solution down to basic concepts.',
                                    color: '#10b981',
                                },
                                {
                                    icon: '🎯',
                                    title: '10 Test Cases Per Level',
                                    desc: 'Every ladder level has its own examples, explanations, and 10 test cases.',
                                    color: '#f59e0b',
                                },
                            ].map((feature) => (
                                <FeatureCard key={feature.title} {...feature} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Topic list */}
            <div className="max-w-4xl mx-auto px-8 py-8 space-y-3">
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                    : topics.map((topic, ti) => {
                        const accent  = topicAccents[ti % topicAccents.length];
                        const isOpen  = !!expandedTopics[topic.id];
                        const count   = topic.problems?.length || 0;

                        return (
                            <div
                                key={topic.id}
                                className="rounded-2xl overflow-hidden transition-all duration-200"
                                style={{
                                    background:   'var(--color-surface)',
                                    border:       `1px solid ${isOpen ? accent + '55' : 'var(--color-border)'}`,
                                    boxShadow:    isOpen ? `0 4px 24px ${accent}18` : '0 1px 4px rgba(0,0,0,0.04)',
                                }}
                            >
                                {/* Gradient accent line */}
                                {(() => {
                                    const [c1, c2] = topicAccentPairs[ti % topicAccentPairs.length];
                                    return (
                                        <div style={{
                                            height: '3px',
                                            background: `linear-gradient(90deg, ${c1}, ${c2})`,
                                        }} />
                                    );
                                })()}
                                {/* Topic header */}
                                <button
                                    onClick={() => toggleTopic(topic.id)}
                                    className="w-full p-5 flex items-center justify-between text-left group transition-colors"
                                    style={{ background: isOpen ? accent + '08' : 'transparent' }}
                                >
                                    <div className="flex items-center">
                                        <div>
                                            <span className="font-bold text-base block" style={{ color: 'var(--color-primary-text)' }}>
                                                {topic.name}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--color-muted-text)' }}>
                                                {count} problem{count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
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
                                                    onClick={() => onSelect(problem)}
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
            </div>
        </div>
    );
}
