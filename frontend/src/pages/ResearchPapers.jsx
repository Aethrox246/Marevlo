import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ExternalLink, Search, BookOpen, Star, Tag,
    Bookmark, BookmarkCheck, ArrowUpDown, CheckCircle2, Clock, Circle,
} from 'lucide-react';

const STATUS_OPTIONS = [
    { key: 'to-read',  label: 'To Read',  color: '#f59e0b', Icon: Circle },
    { key: 'reading',  label: 'Reading',  color: '#06b6d4', Icon: Clock },
    { key: 'done',     label: 'Done',     color: '#10b981', Icon: CheckCircle2 },
];

const SORT_OPTIONS = [
    { key: 'newest',   label: 'Newest' },
    { key: 'oldest',   label: 'Oldest' },
    { key: 'top',      label: 'Top Rated' },
    { key: 'az',       label: 'A → Z' },
];

const PAPERS = [
    {
        id: 1,
        title: 'BudgetMem — Query-Aware Budget-Tier Routing for Runtime Agent Memory',
        authors: ['Zhang, Y.', 'Liu, X.', 'Wang, Z.'],
        year: 2026,
        venue: 'arXiv',
        tags: ['Agentic AI', 'AI'],
        abstract: 'We propose BudgetMem, a query-aware routing mechanism that dynamically selects optimal memory tiers for agents at runtime, balancing performance and computational cost.',
        url: '#',
        stars: 92,
        color: '#d4a017',
        slug: 'budgetmem',
    },
    {
        id: 2,
        title: 'DiskANN — Fast Accurate Billion-point Nearest Neighbor Search on a Single Node',
        authors: ['Subramanya, S.', 'Devvrit, F.', 'Simhadri, H. V.'],
        year: 2019,
        venue: 'NeurIPS',
        tags: ['AI', 'Software Engineering'],
        abstract: 'We present DiskANN, an efficient method for approximate nearest neighbor search that scales to a billion points on a single machine using solid-state drives.',
        url: '#',
        stars: 89,
        color: '#d4a017',
        slug: 'diskann',
    },
    {
        id: 3,
        title: 'DyTopo — Dynamic Topology Routing for Multi-Agent Reasoning via Semantic Matching',
        authors: ['Lu, C.', 'Wang, H.', 'Chen, L.'],
        year: 2026,
        venue: 'arXiv',
        tags: ['Agentic AI', 'AI'],
        abstract: 'We introduce DyTopo, a framework that dynamically adjusts communication topologies between agents based on semantic similarity, improving reasoning performance in multi-agent systems.',
        url: '#',
        stars: 91,
        color: '#d4a017',
        slug: 'dytopo',
    },
    {
        id: 4,
        title: 'Graph-based Agent Memory — Taxonomy, Techniques, Applications',
        authors: ['Yang, Q.', 'Kumar, R.', 'Patel, S.'],
        year: 2026,
        venue: 'arXiv',
        tags: ['Agentic AI', 'gen AI'],
        abstract: 'A comprehensive survey of graph-based memory systems for AI agents, covering architectural patterns, implementation techniques, and real-world applications.',
        url: '#',
        stars: 88,
        color: '#d4a017',
        slug: 'graphmem',
    },
    {
        id: 5,
        title: 'Multi-Agent Teams Hold Experts Back',
        authors: ['Pappu, A.', 'Fragkiadaki, K.', 'Guestrin, C.'],
        year: 2026,
        venue: 'NeurIPS',
        tags: ['Agentic AI', 'Software Engineering'],
        abstract: 'We challenge the assumption that multi-agent systems always improve performance, showing empirical evidence that heterogeneous agent teams can underperform specialized experts.',
        url: '#',
        stars: 87,
        color: '#d4a017',
        slug: 'experts',
    },
    {
        id: 6,
        title: 'Efficient and robust approximate nearest-neighbour search using Hierarchical Navigable Small World graphs',
        authors: ['Malkov, Y. A.', 'Yashunin, D. A.'],
        year: 2018,
        venue: 'IEEE TPAMI',
        tags: ['AI', 'Software Engineering'],
        abstract: 'HNSW introduces a novel hierarchical approach to approximate nearest neighbor search, providing fast and accurate results with logarithmic complexity.',
        url: '#',
        stars: 90,
        color: '#d4a017',
        slug: 'hnsw',
    },
    {
        id: 7,
        title: 'ORCH — Many Analyses, One Merge',
        authors: ['Zhou, H.', 'Chan, H. Y.'],
        year: 2026,
        venue: 'arXiv',
        tags: ['gen AI', 'Software Engineering'],
        abstract: 'ORCH provides a unified framework for merging outputs from multiple analysis pipelines, improving robustness, auditability, and performance in complex reasoning workflows.',
        url: 'https://arxiv.org/pdf/2602.01797',
        stars: 86,
        color: '#d4a017',
        slug: 'orch',
    },
    {
        id: 8,
        title: 'ProcMEM — Learning Reusable Procedural Memory via Non-Parametric PPO',
        authors: ['Agent Learning Team'],
        year: 2026,
        venue: 'arXiv',
        tags: ['RL', 'Agentic AI'],
        abstract: 'We propose ProcMEM, a method for learning reusable procedural memory and skill reuse in reinforcement learning agents through non-parametric policy optimization.',
        url: 'https://arxiv.org/pdf/2602.01869',
        stars: 85,
        color: '#d4a017',
        slug: 'procmem',
    },
    {
        id: 9,
        title: 'ROMA — Recursive Open Meta-Agent Framework for Long-Horizon Multi-Agent Systems',
        authors: ['Alzu\'bi, O.', 'Karaman, S.', 'Newman, P.'],
        year: 2026,
        venue: 'arXiv',
        tags: ['Agentic AI', 'RL'],
        abstract: 'ROMA introduces a recursive meta-agent framework that enables efficient coordination and planning in long-horizon multi-agent systems with hierarchical task decomposition.',
        url: 'https://arxiv.org/pdf/2602.01848',
        stars: 89,
        color: '#d4a017',
        slug: 'roma',
    },
    {
        id: 10,
        title: 'Adaptation of Agentic AI — Post-Training, Memory, Skills',
        authors: ['Jiang, P.', 'Lin, J.', 'Shi, Z.'],
        year: 2026,
        venue: 'arXiv',
        tags: ['Agentic AI', 'RL'],
        abstract: 'A comprehensive study on adapting agentic AI systems through post-training techniques, memory augmentation, and skill acquisition for improved real-world performance.',
        url: 'https://arxiv.org/abs/2512.16301',
        stars: 93,
        color: '#d4a017',
        slug: 'adapt',
    },
    {
        id: 11,
        title: 'CRAVE · Teaching LLMs to Remember, in Words',
        authors: ['Zhu, Y.', 'Steck, H.', 'Liang, D.'],
        year: 2025,
        venue: 'EMNLP',
        tags: ['Recommender system'],
        abstract: 'CRAVE teaches LLM recommenders to improve through natural-language experience memory, retrieving preference-relevant lessons from past conversations instead of updating model weights.',
        url: 'https://aclanthology.org/2025.findings-emnlp.119.pdf',
        stars: 90,
        color: '#d4a017',
        slug: 'crave',
    },
    {
        id: 12,
        title: 'RESA · A Playlist Born From Its Title',
        authors: ['Charolois-Pasqua, G.', 'Vellard, M.', 'Rebboud, M.'],
        year: 2025,
        venue: 'RecSys',
        tags: ['Recommender system'],
        abstract: 'RESA shows that playlist generation can work from title semantics alone by clustering one million playlists, fine-tuning a sentence transformer, and ranking tracks with similarity plus voting.',
        url: 'https://www.eurecom.fr/publication/8304/download/data-publi-8304.pdf',
        stars: 84,
        color: '#d4a017',
        slug: 'resa',
    },
];

const ALL_TAGS = ['RL', 'gen AI', 'Agentic AI', 'Software Engineering', 'AI', 'computer vision', 'Maths', 'Recommender system', 'Time series'];
const ALL_YEARS = [...new Set(PAPERS.map(p => p.year))].sort((a, b) => b - a);

const TAG_COLORS = {
    'RL': '#6366f1',
    'gen AI': '#f59e0b',
    'Agentic AI': '#8b5cf6',
    'Software Engineering': '#06b6d4',
    'AI': '#ec4899',
    'computer vision': '#10b981',
    'Maths': '#f97316',
    'Recommender system': '#06d4b6',
    'Time series': '#f597d4',
    'Foundation Models': '#6366f1',
    'The Agent Stack': '#f59e0b',
    'Memory & Retrieval': '#8b5cf6',
    'Seeing & Generating': '#06b6d4',
    'The Alignment Problem': '#ec4899',
    'Reasoning Machines': '#10b981',
    'The Efficiency Lab': '#f97316',
};

function PaperCard({ paper, bookmarked, status, onToggleBookmark, onSetStatus, index }) {
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();
    const accentColor = '#d4a017';

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 60 * (index || 0));
        return () => clearTimeout(timer);
    }, [index]);

    return (
        <div
            onClick={() => paper.slug && navigate(`/research/paper/${paper.slug}`)}
            className="rp-card"
            style={{
                position: 'relative', overflow: 'hidden',
                borderRadius: '20px',
                background: `linear-gradient(160deg, #0a0a0a 0%, #111110 50%, #0a0a0a 100%)`,
                boxShadow: `0 6px 30px ${accentColor}12`,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '22px',
                cursor: paper.slug ? 'pointer' : 'default',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(.34,1.56,.64,1), box-shadow 0.45s ease',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.003)';
                e.currentTarget.style.boxShadow = `0 30px 80px ${accentColor}28`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = visible ? 'translateY(0) scale(1)' : 'translateY(24px)';
                e.currentTarget.style.boxShadow = `0 6px 30px ${accentColor}12`;
            }}
        >
            {/* Glow orb top-right */}
            <div style={{
                position: 'absolute', top: '-30px', right: '-30px',
                width: '120px', height: '120px', borderRadius: '50%',
                background: `radial-gradient(circle, ${accentColor}28 0%, transparent 70%)`,
                filter: 'blur(35px)', pointerEvents: 'none',
            }} />
            {/* Glow orb bottom-left */}
            <div style={{
                position: 'absolute', bottom: '-20px', left: '-20px',
                width: '80px', height: '80px', borderRadius: '50%',
                background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
                filter: 'blur(30px)', pointerEvents: 'none',
            }} />

            {/* Top content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Icon badge + bookmark/link row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '11px',
                        background: `${accentColor}15`,
                        border: `1px solid ${accentColor}35`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 16px ${accentColor}18`,
                    }}>
                        <BookOpen size={16} color={accentColor} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleBookmark(paper.id); }}
                            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                            style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: bookmarked ? `${accentColor}20` : 'transparent',
                                border: `1px solid ${bookmarked ? accentColor + '55' : 'rgba(255,255,255,0.08)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = `${accentColor}20`}
                            onMouseLeave={e => e.currentTarget.style.background = bookmarked ? `${accentColor}20` : 'transparent'}
                        >
                            {bookmarked
                                ? <BookmarkCheck size={11} color={accentColor} />
                                : <Bookmark size={11} color="rgba(255,255,255,0.35)" />
                            }
                        </button>
                        <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="Open paper"
                            style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: `${accentColor}12`,
                                border: `1px solid ${accentColor}35`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = `${accentColor}25`}
                            onMouseLeave={e => e.currentTarget.style.background = `${accentColor}12`}
                        >
                            <ExternalLink size={11} color={accentColor} />
                        </a>
                    </div>
                </div>

                {/* Venue + year pill */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '3px 10px', borderRadius: '100px',
                    background: `${accentColor}10`,
                    border: `1px solid ${accentColor}25`,
                    marginBottom: '12px',
                }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: accentColor }} />
                    <span style={{
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: accentColor,
                    }}>
                        {paper.venue} · {paper.year}
                    </span>
                </div>

                {/* Title */}
                <h3 style={{
                    fontSize: '0.95rem', fontWeight: 800, color: '#eeeef6',
                    lineHeight: 1.3, marginBottom: '8px', letterSpacing: '-0.01em',
                }}>
                    {paper.title}
                </h3>

                {/* Authors */}
                <p style={{ fontSize: '11px', color: 'rgba(200,200,230,0.4)', marginBottom: '10px' }}>
                    {paper.authors.join(', ')}{paper.authors.length >= 4 ? ' et al.' : ''}
                </p>

                {/* Abstract (always visible, clamped) */}
                <p style={{
                    fontSize: '12px', color: 'rgba(200,200,230,0.45)', lineHeight: 1.65,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', marginBottom: '12px',
                }}>
                    {paper.abstract}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {paper.tags.map(tag => {
                        const c = TAG_COLORS[tag] || accentColor;
                        return (
                            <span key={tag} className="rp-tag" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                fontSize: '9.5px', fontWeight: 600, padding: '3px 9px',
                                borderRadius: '100px', color: c,
                                background: `${c}0c`, border: `1px solid ${c}22`,
                                letterSpacing: '0.02em',
                                transition: 'all 0.25s ease',
                            }}
                            onMouseEnter={e => {
                                e.stopPropagation();
                                e.currentTarget.style.background = `${c}1a`;
                                e.currentTarget.style.borderColor = `${c}44`;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = `${c}0c`;
                                e.currentTarget.style.borderColor = `${c}22`;
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            >{tag}</span>
                        );
                    })}
                </div>
            </div>

            {/* Bottom section */}
            <div style={{ position: 'relative', zIndex: 1, marginTop: '14px' }}>
                <div style={{
                    width: '100%', height: '1px',
                    background: `linear-gradient(90deg, ${accentColor}40, transparent)`,
                    marginBottom: '12px',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Status + stars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={11} color="#fbbf24" fill="#fbbf24" />
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{paper.stars}</span>
                        </div>
                        {STATUS_OPTIONS.map(opt => {
                            const active = status === opt.key;
                            return (
                                <button
                                    key={opt.key}
                                    onClick={(e) => { e.stopPropagation(); onSetStatus(paper.id, active ? null : opt.key); }}
                                    title={active ? `Remove "${opt.label}"` : `Mark as ${opt.label}`}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                                        padding: '3px 9px', borderRadius: '100px', fontSize: '10px',
                                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                        background: active ? `${opt.color}20` : 'transparent',
                                        color: active ? opt.color : 'rgba(255,255,255,0.3)',
                                        border: active ? `1px solid ${opt.color}44` : '1px solid rgba(255,255,255,0.08)',
                                    }}
                                    onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = `${opt.color}44`; }}
                                    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                >
                                    <opt.Icon size={9} />
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                    {/* Arrow icon */}
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: `${accentColor}12`,
                        border: `1px solid ${accentColor}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <ExternalLink size={12} color={accentColor} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function useLocalStorage(key, initial) {
    const [value, setValue] = useState(() => {
        try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; }
        catch { return initial; }
    });
    useEffect(() => {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch { /* Storage can be unavailable in private browsing. */ }
    }, [key, value]);
    return [value, setValue];
}

export default function ResearchPapers() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState('All');
    const [activeYear, setActiveYear] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [activeTab, setActiveTab] = useState('all');
    const [bookmarks, setBookmarks] = useLocalStorage('rp_bookmarks', []);
    const [statuses, setStatuses] = useLocalStorage('rp_statuses', {});
    const searchRef = useRef(null);

    // Ctrl+K shortcut to focus search
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const toggleBookmark = (id) => {
        setBookmarks(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        );
    };

    const setStatus = (id, status) => {
        setStatuses(prev => {
            const next = { ...prev };
            if (status === null) { delete next[id]; } else { next[id] = status; }
            return next;
        });
    };

    const sortPapers = (list) => {
        const copy = [...list];
        if (sortBy === 'newest') return copy.sort((a, b) => b.year - a.year);
        if (sortBy === 'oldest') return copy.sort((a, b) => a.year - b.year);
        if (sortBy === 'top')    return copy.sort((a, b) => b.stars - a.stars);
        if (sortBy === 'az')     return copy.sort((a, b) => a.title.localeCompare(b.title));
        return copy;
    };

    const baseFiltered = PAPERS.filter(p => {
        const matchesSearch = !search ||
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.authors.some(a => a.toLowerCase().includes(search.toLowerCase())) ||
            p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        const matchesTag = activeTag === 'All' || p.tags.includes(activeTag);
        const matchesYear = activeYear === 'All' || p.year === Number(activeYear);
        return matchesSearch && matchesTag && matchesYear;
    });

    const filtered = sortPapers(
        activeTab === 'saved' ? baseFiltered.filter(p => bookmarks.includes(p.id)) : baseFiltered
    );

    return (
        <div className="overflow-y-auto h-full" style={{ backgroundColor: 'var(--color-app-bg)', color: 'var(--color-primary-text)' }}>
            {/* Keyframes */}
            <style>{`
                @keyframes rpOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.15)} }
                @keyframes rpOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-25px,15px) scale(1.08)} }
                @keyframes rpShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
                @keyframes rpPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.82)} }
                @keyframes rpFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                .rp-back-btn:hover { background: linear-gradient(135deg,rgba(245,158,11,0.16) 0%,rgba(245,158,11,0.07) 100%) !important; border-color: rgba(245,158,11,0.38) !important; transform: translateX(-3px) !important; box-shadow: 0 0 0 1px rgba(245,158,11,0.1) inset, 0 8px 24px rgba(245,158,11,0.12) !important; }
                .rp-stat-card:hover { transform: translateY(-2px) !important; border-color: var(--sc) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px var(--sc) inset !important; }
            `}</style>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 96px' }}>

                {/* ── Back button ───────────────────────────────────────── */}
                <button
                    className="rp-back-btn"
                    onClick={() => navigate('/research')}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '9px',
                        marginBottom: '40px', padding: '10px 20px',
                        borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600,
                        letterSpacing: '0.01em',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.04) 100%)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        boxShadow: '0 0 0 1px rgba(245,158,11,0.06) inset, 0 4px 16px rgba(0,0,0,0.25)',
                        color: '#f59e0b', cursor: 'pointer',
                        transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
                    }}
                >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                    Back to Research
                </button>

                {/* ── Hero Section ──────────────────────────────────────── */}
                <div style={{ marginBottom: '52px', position: 'relative', overflow: 'visible', animation: 'rpFadeUp 0.5s ease both' }}>
                    {/* Ambient glow orbs */}
                    <div style={{
                        position: 'absolute', top: '-40px', right: '20px', width: '260px', height: '260px',
                        borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.13) 0%, transparent 65%)',
                        animation: 'rpOrb1 9s ease-in-out infinite', pointerEvents: 'none', zIndex: 0,
                        filter: 'blur(8px)',
                    }} />
                    <div style={{
                        position: 'absolute', top: '20px', right: '200px', width: '160px', height: '160px',
                        borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)',
                        animation: 'rpOrb2 12s ease-in-out infinite', pointerEvents: 'none', zIndex: 0,
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* Eyebrow label */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '5px 14px 5px 8px', borderRadius: '100px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.14)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b', display: 'inline-block', animation: 'rpPulse 2.6s ease-in-out infinite' }} />
                            <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b' }}>
                                Curated Research
                            </span>
                        </div>

                        {/* Title */}
                        <h1 style={{
                            fontSize: 'clamp(2.2rem,4.5vw,3.6rem)', fontWeight: 900, lineHeight: 1.06,
                            letterSpacing: '-0.035em', marginBottom: '14px',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f5f5ff 30%, #fbbf24 72%, #f59e0b 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                            Research Papers
                        </h1>

                        {/* Subtitle */}
                        <p style={{ color: 'rgba(180,185,210,0.65)', fontSize: '1rem', maxWidth: '480px', lineHeight: 1.72, marginBottom: '28px' }}>
                            {PAPERS.length} foundational and cutting-edge papers across AI, ML, and systems research. Filter, search, and read.
                        </p>

                        {/* Stats strip */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Total Papers', value: PAPERS.length, icon: BookOpen, color: '#f59e0b' },
                                { label: 'Bookmarked',   value: bookmarks.length, icon: Bookmark, color: '#8b5cf6' },
                                { label: 'Reading',      value: Object.values(statuses).filter(s => s === 'reading').length, icon: Clock, color: '#06b6d4' },
                                { label: 'Completed',    value: Object.values(statuses).filter(s => s === 'done').length, icon: CheckCircle2, color: '#10b981' },
                            ].map(stat => (
                                <div key={stat.label} className="rp-stat-card" style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 18px', borderRadius: '14px',
                                    background: `linear-gradient(135deg, ${stat.color}0d 0%, ${stat.color}05 100%)`,
                                    border: `1px solid ${stat.color}1e`,
                                    boxShadow: `0 4px 16px rgba(0,0,0,0.2)`,
                                    transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
                                    '--sc': `${stat.color}38`,
                                }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${stat.color}12`, border: `1px solid ${stat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <stat.icon size={15} color={stat.color} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: stat.color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
                                        <div style={{ fontSize: '10px', color: 'rgba(180,185,210,0.45)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '1px' }}>{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Search + Filters ─────────────────────────────────── */}
                <div style={{ marginBottom: '36px' }}>
                    {/* Search bar */}
                    <div style={{ position: 'relative', marginBottom: '18px' }}>
                        {/* Search icon */}
                        <div style={{
                            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.14)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'none',
                        }}>
                            <Search size={14} color="#f59e0b" />
                        </div>
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search by title, author, or topic..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 110px 14px 58px',
                                borderRadius: '16px', fontSize: '14px',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'var(--color-primary-text)',
                                outline: 'none', boxSizing: 'border-box',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.04) inset',
                                transition: 'border-color 0.22s, box-shadow 0.22s',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = 'rgba(245,158,11,0.35)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1), 0 4px 20px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.04) inset';
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.04) inset';
                            }}
                        />
                        {/* Ctrl+K hint */}
                        <div style={{
                            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                            display: 'flex', alignItems: 'center', gap: '3px', pointerEvents: 'none',
                        }}>
                            <kbd style={{
                                fontSize: '9.5px', fontWeight: 700, padding: '3px 7px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.05)', color: 'rgba(180,185,210,0.45)',
                                border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'inherit', letterSpacing: '0.02em',
                            }}>Ctrl</kbd>
                            <span style={{ fontSize: '9px', color: 'rgba(180,185,210,0.3)' }}>+</span>
                            <kbd style={{
                                fontSize: '9.5px', fontWeight: 700, padding: '3px 7px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.05)', color: 'rgba(180,185,210,0.45)',
                                border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'inherit',
                            }}>K</kbd>
                        </div>
                    </div>

                    {/* Tag filters */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        {['All', ...ALL_TAGS].map(tag => {
                            const active = activeTag === tag;
                            const c = TAG_COLORS[tag] || '#f59e0b';
                            return (
                                <button
                                    key={tag}
                                    onClick={() => setActiveTag(tag)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '100px', fontSize: '12px',
                                        fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.25s ease',
                                        background: active ? (tag === 'All' ? '#f59e0b' : c) : 'var(--color-surface)',
                                        color: active ? (tag === 'All' ? '#000' : '#fff') : 'var(--color-muted-text)',
                                        border: active ? `1px solid ${tag === 'All' ? '#f59e0b' : c}` : '1px solid var(--color-border)',
                                    }}
                                    onMouseEnter={e => {
                                        if (!active) {
                                            e.currentTarget.style.borderColor = `${c}66`;
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = `0 4px 14px ${c}25`;
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!active) {
                                            e.currentTarget.style.borderColor = 'var(--color-border)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>

                    {/* Year filters */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                            <Tag size={12} color="var(--color-muted-text)" />
                            <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', fontWeight: 600 }}>Year:</span>
                        </div>
                        {['All', ...ALL_YEARS].map(y => {
                            const active = activeYear === String(y);
                            return (
                                <button
                                    key={y}
                                    onClick={() => setActiveYear(String(y))}
                                    style={{
                                        padding: '4px 12px', borderRadius: '100px', fontSize: '12px',
                                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                        background: active ? '#f59e0b' : 'var(--color-surface)',
                                        color: active ? '#000' : 'var(--color-muted-text)',
                                        border: active ? '1px solid #f59e0b' : '1px solid var(--color-border)',
                                    }}
                                >
                                    {y}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tabs + Sort row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '4px' }}>
                        {[{ key: 'all', label: `All Papers (${baseFiltered.length})` }, { key: 'saved', label: `Saved (${PAPERS.filter(p => bookmarks.includes(p.id)).length})` }].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '6px 16px', borderRadius: '8px', fontSize: '13px',
                                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                                    background: activeTab === tab.key ? '#f59e0b' : 'transparent',
                                    color: activeTab === tab.key ? '#000' : 'var(--color-muted-text)',
                                }}
                            >{tab.label}</button>
                        ))}
                    </div>

                    {/* Sort controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowUpDown size={13} color="var(--color-muted-text)" />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted-text)', marginRight: '4px' }}>Sort:</span>
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setSortBy(opt.key)}
                                style={{
                                    padding: '5px 12px', borderRadius: '100px', fontSize: '12px',
                                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                    background: sortBy === opt.key ? 'var(--color-primary-text)' : 'var(--color-surface)',
                                    color: sortBy === opt.key ? 'var(--color-app-bg)' : 'var(--color-muted-text)',
                                    border: sortBy === opt.key ? '1px solid transparent' : '1px solid var(--color-border)',
                                }}
                            >{opt.label}</button>
                        ))}
                    </div>
                </div>

                {/* Results count */}
                <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginBottom: '20px' }}>
                    Showing <strong style={{ color: 'var(--color-primary-text)' }}>{filtered.length}</strong> paper{filtered.length !== 1 ? 's' : ''}
                </p>

                {/* Papers grid */}
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-muted-text)' }}>
                        <BookOpen size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p style={{ fontSize: '16px', fontWeight: 600 }}>
                            {activeTab === 'saved' ? 'No saved papers yet' : 'No papers match your search'}
                        </p>
                        <p style={{ fontSize: '13px', marginTop: '6px' }}>
                            {activeTab === 'saved' ? 'Bookmark papers using the bookmark icon on each card' : 'Try a different keyword or clear the filters'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
                        {filtered.map((paper, idx) => (
                            <PaperCard
                                key={paper.id}
                                paper={paper}
                                index={idx}
                                bookmarked={bookmarks.includes(paper.id)}
                                status={statuses[paper.id] || null}
                                onToggleBookmark={toggleBookmark}
                                onSetStatus={setStatus}
                            />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
