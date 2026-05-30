import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Target, ChevronDown } from 'lucide-react';
import { loadAllTopics } from '../utils/topicsLoader';
import { useTheme } from '../context/ThemeContext';

const difficultyConfig = {
    Easy:   { label: 'Easy',   classes: 'bg-green-100 text-green-700 border border-green-200' },
    Medium: { label: 'Medium', classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
    Hard:   { label: 'Hard',   classes: 'bg-red-100   text-red-700   border border-red-200'   },
};

const DIFFICULTY_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

function SkeletonRow() {
    return (
        <div className="flex items-center justify-between px-6 py-4 animate-pulse border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="w-48 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            </div>
            <div className="w-16 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>
    );
}

export default function TopicProblems() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const [topic, setTopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        loadAllTopics()
            .then(topics => {
                const found = topics.find(t => t.id === topicId);
                setTopic(found || null);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [topicId]);

    const problems = topic?.problems || [];

    const filtered = filter === 'All'
        ? problems
        : problems.filter(p => p.difficulty === filter);

    const counts = {
        All:    problems.length,
        Easy:   problems.filter(p => p.difficulty === 'Easy').length,
        Medium: problems.filter(p => p.difficulty === 'Medium').length,
        Hard:   problems.filter(p => p.difficulty === 'Hard').length,
    };

    const filterColors = {
        All:    { active: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)' },
        Easy:   { active: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
        Medium: { active: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)'  },
        Hard:   { active: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)'   },
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: 'var(--color-app-bg)', color: 'var(--color-primary-text)' }}>

            {/* Header bar */}
            <div
                className="sticky top-0 z-30 px-8 py-3 flex items-center gap-4 backdrop-blur-xl border-b"
                style={{
                    background: isDark ? 'rgba(9,9,15,0.85)' : 'rgba(255,255,255,0.85)',
                    borderColor: 'var(--color-border)',
                }}
            >
                <button
                    onClick={() => navigate('/problems')}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-70"
                    style={{ color: 'var(--color-muted-text)' }}
                >
                    <ArrowLeft size={16} />
                    All Topics
                </button>
                <span style={{ color: 'var(--color-border)' }}>/</span>
                <span className="text-sm font-bold" style={{ color: 'var(--color-primary-text)' }}>
                    {loading ? '…' : (topic?.icon + ' ' + topic?.name)}
                </span>
            </div>

            <div style={{ width: '90%', margin: '0 auto', padding: '32px 0 64px' }}>

                {/* Topic hero */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span style={{ fontSize: 36 }}>{topic?.icon}</span>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-primary-text)' }}>
                                {loading ? 'Loading…' : topic?.name}
                            </h1>
                            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-text)' }}>
                                {counts.All} problems · {counts.Easy} easy · {counts.Medium} medium · {counts.Hard} hard
                            </p>
                        </div>
                    </div>
                </div>

                {/* Difficulty filter pills */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {['All', 'Easy', 'Medium', 'Hard'].map(d => {
                        const fc = filterColors[d];
                        const isActive = filter === d;
                        return (
                            <button
                                key={d}
                                onClick={() => setFilter(d)}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all"
                                style={{
                                    background: isActive ? fc.bg : 'var(--color-surface)',
                                    border: `1px solid ${isActive ? fc.border : 'var(--color-border)'}`,
                                    color: isActive ? fc.active : 'var(--color-muted-text)',
                                    transform: isActive ? 'scale(1.04)' : 'scale(1)',
                                }}
                            >
                                {d}
                                <span
                                    className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                                    style={{
                                        background: isActive ? fc.active + '22' : 'var(--color-surface-hover)',
                                        color: isActive ? fc.active : 'var(--color-muted-text)',
                                    }}
                                >
                                    {counts[d]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Problem list */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                >
                    {/* Table header */}
                    <div
                        className="grid px-6 py-3 text-xs font-bold uppercase tracking-wider"
                        style={{
                            gridTemplateColumns: '48px 1fr 110px 60px',
                            color: 'var(--color-muted-text)',
                            borderBottom: '1px solid var(--color-border)',
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        }}
                    >
                        <span>#</span>
                        <span>Title</span>
                        <span>Difficulty</span>
                        <span></span>
                    </div>

                    {loading
                        ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                        : filtered.length === 0
                            ? (
                                <div className="text-center py-16" style={{ color: 'var(--color-muted-text)' }}>
                                    <div className="text-4xl mb-3">🔍</div>
                                    <p className="text-sm font-semibold">No {filter} problems yet</p>
                                </div>
                            )
                            : filtered.map((problem, idx) => {
                                const dc = difficultyConfig[problem.difficulty] || difficultyConfig.Hard;
                                return (
                                    <button
                                        key={problem.id}
                                        onClick={() => navigate(`/problems/${topicId}/${problem.id}`)}
                                        className="w-full grid items-center px-6 py-4 text-left group transition-all"
                                        style={{
                                            gridTemplateColumns: '48px 1fr 110px 60px',
                                            borderTop: idx > 0 ? '1px solid var(--color-border)' : 'none',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {/* Number */}
                                        <span
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{
                                                background: 'var(--color-surface-hover)',
                                                color: 'var(--color-muted-text)',
                                                border: '1px solid var(--color-border)',
                                            }}
                                        >
                                            {idx + 1}
                                        </span>

                                        {/* Title */}
                                        <span className="font-medium text-sm pr-4" style={{ color: 'var(--color-primary-text)' }}>
                                            {problem.title}
                                        </span>

                                        {/* Difficulty */}
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold w-fit ${dc.classes}`}>
                                            {dc.label}
                                        </span>

                                        {/* Arrow */}
                                        <ArrowRight
                                            size={15}
                                            className="transition-transform duration-200 group-hover:translate-x-1 ml-auto"
                                            style={{ color: 'var(--color-muted-text)' }}
                                        />
                                    </button>
                                );
                            })
                    }
                </div>

                {!loading && filtered.length > 0 && (
                    <p className="text-xs mt-4 text-center" style={{ color: 'var(--color-muted-text)' }}>
                        Showing {filtered.length} of {counts.All} problems
                    </p>
                )}
            </div>
        </div>
    );
}
