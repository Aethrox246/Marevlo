import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, BookOpen, Zap, Target } from 'lucide-react';
import { loadAllTopics } from '../utils/topicsLoader';

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
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100" />
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
    const [reactions, setReactions]           = useState({});

    useEffect(() => {
        loadAllTopics()
            .then(setTopics)
            .catch((err) => console.error('Failed to load topics:', err))
            .finally(() => setLoading(false));
    }, []);

    const toggleTopic = (id) => {
        setExpandedTopics((prev) => {
            const willOpen = !prev[id];
            if (willOpen) {
                // Fetch reactions for all problems in this topic when expanding
                const topic = topics.find(t => t.id === id);
                if (topic && topic.problems) {
                    topic.problems.forEach(p => {
                        if (!reactions[p.id]) {
                            fetchReactions(p.id);
                        }
                    });
                }
            }
            return { ...prev, [id]: willOpen };
        });
        if (!visibleCounts[id]) {
            setVisibleCounts((prev) => ({ ...prev, [id]: 10 }));
        }
    };

    const fetchReactions = async (problemId) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/problems/${problemId}/reactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch reactions');
            const data = await res.json();
            setReactions(prev => ({ ...prev, [problemId]: data }));
        } catch (err) {
            console.error(`Failed to fetch reactions for problem ${problemId}:`, err);
        }
    };

    const handleReact = async (problemId, type) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/problems/${problemId}/react`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            if (!res.ok) throw new Error('Failed to react to problem');
            const data = await res.json();
            setReactions(prev => ({ ...prev, [problemId]: { ...prev[problemId], myReaction: data.reaction, likes: data.likes, dislikes: data.dislikes } }));
        } catch (err) {
            console.error(`Failed to react to problem ${problemId}:`, err);
        }
    };

    const totalProblems = topics.reduce((s, t) => s + (t.problems?.length || 0), 0);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* ── Hero Header ─────────────────────────────────────────── */}
            <div
                className="relative overflow-hidden border-b"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
                {/* Dot-grid background */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                        backgroundImage: 'radial-gradient(circle, var(--color-border) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                />
                {/* Blurred orbs */}
                <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #6366f1, #8b5cf6)', filter: 'blur(60px)' }} />
                <div className="absolute -bottom-10 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #06b6d4, #0ea5e9)', filter: 'blur(50px)' }} />

                <div className="relative max-w-4xl mx-auto px-8 py-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                        style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', color: 'var(--color-muted-text)' }}>
                        <Zap size={11} style={{ color: '#6366f1' }} />
                        Algorithm Practice
                    </div>

                    <h1
                        className="text-4xl font-extrabold tracking-tight mb-3"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primary-text) 40%, #6366f1 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Practice Problems
                    </h1>
                    <p className="text-sm mb-6" style={{ color: 'var(--color-muted-text)' }}>
                        Master data structures and algorithms — one problem at a time.
                    </p>

                    {/* Stat chips */}
                    <div className="flex flex-wrap items-center gap-3">
                        {[
                            { icon: <BookOpen size={13} />, label: `${loading ? '—' : totalProblems} Problems` },
                            { icon: <Target    size={13} />, label: `${loading ? '—' : topics.length} Topics`   },
                        ].map(({ icon, label }) => (
                            <div key={label}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-transform hover:-translate-y-0.5"
                                style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', color: 'var(--color-primary-text)' }}>
                                {icon}{label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Approaches & Ladder Feature Callout ─────────────────── */}
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
                            ].map(({ icon, title, desc, color }) => (
                                <div
                                    key={title}
                                    className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                                    style={{
                                        background: `color-mix(in srgb, ${color} 6%, var(--color-surface))`,
                                        border: `1px solid color-mix(in srgb, ${color} 25%, var(--color-border))`,
                                    }}
                                >
                                    <div className="text-xl mb-2">{icon}</div>
                                    <div className="text-sm font-bold mb-1" style={{ color: 'var(--color-primary-text)' }}>{title}</div>
                                    <div className="text-xs leading-relaxed" style={{ color: 'var(--color-muted-text)' }}>{desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Topic list ──────────────────────────────────────────── */}
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
                                    <div className="flex items-center gap-4">
                                        {/* Icon box */}
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 transition-transform group-hover:scale-110"
                                            style={{ background: accent + '20', color: accent }}
                                        >
                                            {topic.icon || '📁'}
                                        </div>
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
                                                        paddingLeft: '4.5rem',
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
                                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => handleReact(problem.id, 'like')}
                                                                title="Like"
                                                                style={{ color: reactions[problem.id]?.myReaction === 'like' ? '#3b82f6' : 'var(--color-muted-text)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: '0.75rem', fontWeight: 600 }}
                                                            >👍 {reactions[problem.id]?.likes ?? ''}</button>
                                                            <button
                                                                onClick={() => handleReact(problem.id, 'dislike')}
                                                                title="Dislike"
                                                                style={{ color: reactions[problem.id]?.myReaction === 'dislike' ? '#ef4444' : 'var(--color-muted-text)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: '0.75rem', fontWeight: 600 }}
                                                            >👎 {reactions[problem.id]?.dislikes ?? ''}</button>
                                                        </div>
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
                                            <div className="px-5 py-6 pl-20 text-sm italic" style={{ color: 'var(--color-muted-text)' }}>
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
