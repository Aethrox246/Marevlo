import React, { useMemo, memo, useState } from 'react';
import { ThumbsUp, ThumbsDown, Lock, Unlock, ChevronDown, ChevronRight, Lightbulb, Code, CheckCircle2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import TabBar from './TabBar';

/**
 * ProblemPanel - Renders problem description and approaches from JSON data
 */
const ProblemPanel = memo(({ problem, onBack }) => {
    const [activeTab, setActiveTab] = useState('description');
    const [selectedApproach, setSelectedApproach] = useState(0);
    const [unlockedLevels, setUnlockedLevels] = useState({});
    const [expandedLadder, setExpandedLadder] = useState({});
    const [vote, setVote] = useState(null); // 'up' | 'down' | null

    const tabs = [
        { id: 'description', label: 'Description' },
        { id: 'approaches', label: 'Approaches' },
    ];

    // Use real approaches from the JSON, fallback to empty
    const approaches = useMemo(() => problem?.approaches || [], [problem]);

    // Initialize unlocked levels when approaches load
    React.useEffect(() => {
        if (approaches.length > 0) {
            const init = {};
            approaches.forEach(a => { init[a.id] = 1; });
            setUnlockedLevels(init);
        }
    }, [approaches]);

    // Build the description markdown from real JSON fields
    const fullDescription = useMemo(() => {
        if (!problem) return '';
        let desc = `${problem.description || ''}\n\n`;

        desc += `### Judge Input Format\n\n`;
        desc += `> Each test case field is passed as **one JSON-serialized line** on stdin.\n`;
        desc += `> Your code must read from **stdin** and print the answer to **stdout**.\n`;
        desc += `> Click **Submit** to run against all test cases. Click **Run** to test with custom input.\n`;

        return desc;
    }, [problem]);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return '#10b981';
            case 'Medium': return '#f59e0b';
            case 'Hard': return '#ef4444';
            default: return 'var(--color-muted-text)';
        }
    };

    const getLevelTypeIcon = (level, isUnlocked) => {
        if (!isUnlocked) return <Lock size={14} />;
        if (level === 0) return <BookOpen size={14} />;
        if (level <= 2) return <Lightbulb size={14} />;
        return <Code size={14} />;
    };

    const getLevelTypeLabel = (level) => {
        if (level === 0) return 'Full Problem';
        if (level === 1) return 'Key Sub-routine';
        if (level === 2) return 'Hint';
        if (level === 3) return 'Pseudocode';
        if (level === 4) return 'Partial Solution';
        return 'Deep Dive';
    };

    const unlockNext = () => {
        const approach = approaches[selectedApproach];
        if (!approach) return;
        const total = approach.ladders?.length || 0;
        const current = unlockedLevels[approach.id] || 1;
        if (current < total) {
            setUnlockedLevels(prev => ({ ...prev, [approach.id]: current + 1 }));
        }
    };

    const toggleLadder = (key) =>
        setExpandedLadder(prev => ({ ...prev, [key]: !prev[key] }));

    const handleVote = (type) => {
        // Here you would also call your backend API: api.post(`/problem/${problem.id}/vote`, { type })
        setVote(prev => prev === type ? null : type);
    };

    if (!problem) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted-text)' }}>
                Select a problem to begin
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <style>{`
                /* Floating Capsule with Dynamic Expansion */
                .premium-scrollbar::-webkit-scrollbar {
                    width: 10px; /* Slimmer hit-box area */
                    height: 10px;
                }
                .premium-scrollbar::-webkit-scrollbar-track {
                    background: transparent; /* No ugly background gutter */
                }
                .premium-scrollbar::-webkit-scrollbar-thumb {
                    /* The actual visible portion sits inside invisible borders */
                    background-color: var(--color-border);
                    border-radius: 10px;
                    border: 3px solid transparent; /* 10px width - (3px * 2) = 4px visible thumb */
                    background-clip: padding-box; 
                }
                .premium-scrollbar::-webkit-scrollbar-thumb:hover {
                    /* On hover, shrink the invisible borders, causing the visible color to organically swell */
                    background-color: #818cf8;
                    border: 1px solid transparent; /* 10px width - (1px * 2) = 8px visible thumb */
                }
            `}</style>
            {/* Tab Bar */}
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

            {/* Problem Header (Slim & Compact) */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                padding: '16px 24px', borderBottom: '1px solid var(--color-border)', flexShrink: 0,
                background: 'color-mix(in srgb, var(--color-surface) 85%, transparent)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 4px 24px -4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                display: 'flex', flexDirection: 'column', gap: 10
            }}>
                {/* Row 1: Title & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary-text)', margin: 0, lineHeight: 1.3 }}>
                        {problem.title}
                    </h1>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <button 
                            onClick={() => handleVote('up')}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 6, 
                                background: vote === 'up' ? '#10b98120' : 'var(--color-surface-hover)', 
                                color: vote === 'up' ? '#10b981' : 'var(--color-muted-text)',
                                border: '1px solid', borderColor: vote === 'up' ? '#10b98150' : 'var(--color-border)',
                                padding: '4px 10px', borderRadius: '6px', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                            }}
                        >
                            <ThumbsUp size={14} fill={vote === 'up' ? 'currentColor' : 'none'} /> 
                            {(problem.likes || 0) + (vote === 'up' ? 1 : 0)}
                        </button>
                        <button 
                            onClick={() => handleVote('down')}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 6, 
                                background: vote === 'down' ? '#ef444420' : 'var(--color-surface-hover)', 
                                color: vote === 'down' ? '#ef4444' : 'var(--color-muted-text)',
                                border: '1px solid', borderColor: vote === 'down' ? '#ef444450' : 'var(--color-border)',
                                padding: '4px 10px', borderRadius: '6px', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                            }}
                        >
                            <ThumbsDown size={14} fill={vote === 'down' ? 'currentColor' : 'none'} /> 
                            {(problem.dislikes || 0) + (vote === 'down' ? 1 : 0)}
                        </button>
                    </div>
                </div>

                {/* Row 2: Micro Metadata Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: getDifficultyColor(problem.difficulty), padding: '2px 8px', background: `color-mix(in srgb, ${getDifficultyColor(problem.difficulty)} 15%, transparent)`, borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {problem.difficulty}
                    </span>
                    
                    {problem.tags && problem.tags.length > 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-border)' }} />}
                    
                    {problem.tags && problem.tags.map(tag => (
                        <span key={tag} style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                            background: 'var(--color-surface-hover)',
                            color: 'var(--color-muted-text)',
                            border: '1px solid var(--color-border)'
                        }}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* ─── Description Tab ─── */}
            {activeTab === 'description' && (
                <div className="problem-tab-content premium-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', scrollBehavior: 'smooth' }}>
                    <div style={{ color: 'var(--color-primary-text)', fontSize: 15, lineHeight: 1.8 }}>
                        <ReactMarkdown
                            components={{
                                code({node, inline, className, children, ...props}) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <div style={{ background: 'color-mix(in srgb, var(--color-primary-text) 4%, var(--color-surface))', borderRadius: '12px', overflow: 'hidden', margin: '20px 0', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                            <div style={{ background: 'color-mix(in srgb, var(--color-primary-text) 8%, var(--color-surface))', padding: '8px 16px', fontSize: '12px', color: 'var(--color-muted-text)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Code size={14} /> {match[1]}
                                            </div>
                                            <pre style={{ margin: 0, padding: '16px', overflowX: 'auto', fontSize: '14px', lineHeight: 1.5, color: 'var(--color-primary-text)' }}>
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            </pre>
                                        </div>
                                    ) : (
                                        <code style={{ 
                                            background: 'var(--color-surface-hover)', 
                                            color: '#818cf8', // tinted indigo variable
                                            padding: '3px 6px', 
                                            borderRadius: '6px', 
                                            fontSize: '0.9em',
                                            fontFamily: 'monospace',
                                            border: '1px solid rgba(129, 140, 248, 0.15)'
                                        }} {...props}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                        >
                            {fullDescription}
                        </ReactMarkdown>
                    </div>

                    {/* Tabular Examples */}
                    {problem.examples?.length > 0 && (
                        <div style={{ marginTop: 40 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary-text)', marginBottom: 20 }}>Examples</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {problem.examples.map((ex, i) => (
                                    <div key={i} style={{
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 16, overflow: 'hidden',
                                        boxShadow: '0 4px 20px -4px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ padding: '10px 20px', background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)', fontSize: 14, fontWeight: 600, color: 'var(--color-primary-text)' }}>
                                            Example {i + 1}
                                        </div>
                                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div style={{ display: 'flex', gap: 16 }}>
                                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-muted-text)', width: '60px', flexShrink: 0 }}>Input:</span>
                                                <code style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--color-primary-text)', whiteSpace: 'pre-wrap', flex: 1 }}>{ex.input}</code>
                                            </div>
                                            <div style={{ height: 1, background: 'var(--color-border)' }} />
                                            <div style={{ display: 'flex', gap: 16 }}>
                                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-muted-text)', width: '60px', flexShrink: 0 }}>Output:</span>
                                                <code style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--color-primary-text)', whiteSpace: 'pre-wrap', flex: 1 }}>{ex.output}</code>
                                            </div>
                                            {ex.explanation && (
                                                <>
                                                    <div style={{ height: 1, background: 'var(--color-border)', borderStyle: 'dashed' }} />
                                                    <div style={{ display: 'flex', gap: 16 }}>
                                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-muted-text)', width: '60px', flexShrink: 0 }}>Hint:</span>
                                                        <span style={{ fontSize: 14, color: 'var(--color-primary-text)', lineHeight: 1.6, flex: 1, opacity: 0.9 }}>{ex.explanation}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Constraints Pills */}
                    {problem.constraints?.length > 0 && (
                        <div style={{ marginTop: 40 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary-text)', marginBottom: 20 }}>Constraints</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                {problem.constraints.map((c, i) => (
                                    <div key={i} style={{
                                        padding: '8px 16px',
                                        background: 'color-mix(in srgb, var(--color-surface-hover) 50%, transparent)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 24,
                                        fontSize: 14,
                                        fontFamily: 'monospace',
                                        color: '#818cf8', // match tinted variable
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        transition: 'transform 0.2s',
                                        cursor: 'default'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        {c}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Approaches Tab ─── */}
            {activeTab === 'approaches' && (
                <div className="premium-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', scrollBehavior: 'smooth' }}>
                    {approaches.length === 0 ? (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted-text)', fontSize: 14 }}>
                            No approaches available for this problem yet.
                        </div>
                    ) : (
                        <>
                            {/* Approach selector */}
                            <div style={{
                                display: 'flex', gap: 8, padding: '12px 16px',
                                borderBottom: '1px solid var(--color-border)',
                                background: 'var(--color-surface)', flexWrap: 'wrap',
                            }}>
                                {approaches.map((approach, index) => (
                                    <button
                                        key={approach.id}
                                        onClick={() => setSelectedApproach(index)}
                                        style={{
                                            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                            border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                                            background: selectedApproach === index
                                                ? 'var(--color-primary-text)'
                                                : 'var(--color-surface-hover)',
                                            color: selectedApproach === index
                                                ? 'var(--color-surface)'
                                                : 'var(--color-muted-text)',
                                        }}
                                    >
                                        {approach.name}
                                    </button>
                                ))}
                            </div>

                            {/* Complexity row */}
                            {approaches[selectedApproach] && (
                                <div style={{
                                    padding: '10px 16px',
                                    background: 'var(--color-surface-hover)',
                                    borderBottom: '1px solid var(--color-border)',
                                    display: 'flex', gap: 24, fontSize: 13,
                                }}>
                                    <span style={{ color: 'var(--color-muted-text)' }}>
                                        Time: <span style={{ color: '#10b981', fontWeight: 600 }}>{approaches[selectedApproach].timeComplexity}</span>
                                    </span>
                                    <span style={{ color: 'var(--color-muted-text)' }}>
                                        Space: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{approaches[selectedApproach].spaceComplexity}</span>
                                    </span>
                                </div>
                            )}

                            {/* Summary */}
                            {approaches[selectedApproach]?.summary && (
                                <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-muted-text)', lineHeight: 1.6, borderBottom: '1px solid var(--color-border)' }}>
                                    {approaches[selectedApproach].summary}
                                </div>
                            )}

                            {/* Progress bar across ladder levels */}
                            {approaches[selectedApproach] && (
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                                    <div style={{ fontSize: 11, color: 'var(--color-muted-text)', marginBottom: 8 }}>
                                        Unlocked {unlockedLevels[approaches[selectedApproach].id] || 1} / {approaches[selectedApproach].ladders?.length || 0} levels
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {(approaches[selectedApproach].ladders || []).map((_, i) => {
                                            const current = unlockedLevels[approaches[selectedApproach].id] || 1;
                                            const isUnlocked = (i + 1) <= current;
                                            return (
                                                <React.Fragment key={i}>
                                                    <div style={{
                                                        width: 24, height: 24, borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 11, fontWeight: 700,
                                                        background: isUnlocked ? '#10b981' : 'var(--color-surface-hover)',
                                                        color: isUnlocked ? '#fff' : 'var(--color-muted-text)',
                                                        border: isUnlocked ? 'none' : '1px solid var(--color-border)',
                                                        transition: 'all 0.3s',
                                                        flexShrink: 0,
                                                    }}>
                                                        {isUnlocked ? '✓' : i + 1}
                                                    </div>
                                                    {i < (approaches[selectedApproach].ladders?.length - 1) && (
                                                        <div style={{ flex: 1, height: 2, background: isUnlocked ? '#10b981' : 'var(--color-border)', transition: 'background 0.3s' }} />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Ladder rungs */}
                            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(approaches[selectedApproach]?.ladders || []).map((rung, i) => {
                                    const approachId = approaches[selectedApproach].id;
                                    const current = unlockedLevels[approachId] || 1;
                                    const isUnlocked = (i + 1) <= current;
                                    const isNext = (i + 1) === current + 1;
                                    const expandKey = `${approachId}-${i}`;
                                    const isExpanded = expandedLadder[expandKey];

                                    return (
                                        <div key={i} style={{
                                            borderRadius: 12, border: '1px solid var(--color-border)',
                                            background: isUnlocked ? 'var(--color-surface)' : 'var(--color-surface-hover)',
                                            opacity: isUnlocked ? 1 : 0.55,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            transform: isUnlocked && isExpanded ? 'scale(1.02)' : 'scale(1)',
                                            boxShadow: isUnlocked && isExpanded ? '0 12px 32px -8px rgba(0,0,0,0.15)' : 'none',
                                            overflow: 'hidden',
                                            marginTop: isUnlocked && isExpanded ? '8px' : '0',
                                            marginBottom: isUnlocked && isExpanded ? '8px' : '0'
                                        }}>
                                            {/* Rung header (always visible) */}
                                            <button
                                                onClick={() => isUnlocked && toggleLadder(expandKey)}
                                                disabled={!isUnlocked}
                                                style={{
                                                    width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
                                                    background: 'none', border: 'none', cursor: isUnlocked ? 'pointer' : 'default', textAlign: 'left',
                                                }}
                                            >
                                                <div style={{
                                                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: isUnlocked ? '#10b98120' : 'var(--color-border)',
                                                    color: isUnlocked ? '#10b981' : 'var(--color-muted-text)',
                                                }}>
                                                    {getLevelTypeIcon(rung.level, isUnlocked)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: isUnlocked ? 'var(--color-primary-text)' : 'var(--color-muted-text)' }}>
                                                        L{i}: {rung.title}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--color-muted-text)' }}>
                                                        {getLevelTypeLabel(rung.level)}
                                                    </div>
                                                </div>
                                                {isUnlocked && (
                                                    isExpanded
                                                        ? <ChevronDown size={15} style={{ color: 'var(--color-muted-text)', flexShrink: 0 }} />
                                                        : <ChevronRight size={15} style={{ color: 'var(--color-muted-text)', flexShrink: 0 }} />
                                                )}
                                                {!isUnlocked && <Lock size={14} style={{ color: 'var(--color-muted-text)', flexShrink: 0 }} />}
                                            </button>

                                            {/* Rung content (collapsible) */}
                                            {isUnlocked && isExpanded && (
                                                <div style={{ padding: '0 16px 16px' }}>
                                                    {rung.desc && (
                                                        <p style={{ fontSize: 13, color: 'var(--color-muted-text)', marginBottom: 10, lineHeight: 1.6 }}>
                                                            {rung.desc}
                                                        </p>
                                                    )}
                                                    {rung.explanation && (
                                                        <div style={{
                                                            fontSize: 13, lineHeight: 1.7, color: 'var(--color-primary-text)',
                                                            background: 'var(--color-surface-hover)', borderRadius: 8,
                                                            padding: '12px', whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                                                        }}>
                                                            {rung.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Unlock button for the next locked rung */}
                                            {isNext && (
                                                <div style={{ padding: '0 16px 16px' }}>
                                                    <button
                                                        onClick={unlockNext}
                                                        style={{
                                                            width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none',
                                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                                            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.4)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                    >
                                                        <Unlock size={14} /> Unlock Level {i + 1}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
});

ProblemPanel.displayName = 'ProblemPanel';
export default ProblemPanel;
