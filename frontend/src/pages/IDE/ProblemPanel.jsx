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

        if (problem.examples?.length > 0) {
            desc += `### Examples\n\n`;
            problem.examples.forEach((ex, i) => {
                desc += `**Example ${i + 1}:**\n`;
                desc += `- **Input:** \`${ex.input}\`\n`;
                desc += `- **Output:** \`${ex.output}\`\n`;
                if (ex.explanation) {
                    desc += `- **Explanation:** ${ex.explanation}\n`;
                }
                desc += '\n';
            });
        }

        if (problem.constraints?.length > 0) {
            desc += `### Constraints\n\n`;
            desc += problem.constraints.map(c => `- \`${c}\``).join('\n');
            desc += '\n\n';
        }

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

    if (!problem) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted-text)' }}>
                Select a problem to begin
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            {/* Tab Bar */}
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

            {/* Problem Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
                <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-primary-text)', marginBottom: 12, lineHeight: 1.4 }}>
                    {problem.title}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: getDifficultyColor(problem.difficulty) }}>
                        {problem.difficulty}
                    </span>
                    {problem.tags && problem.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                            background: 'var(--color-surface-hover)',
                            color: 'var(--color-muted-text)',
                            border: '1px solid var(--color-border)'
                        }}>
                            {tag}
                        </span>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--color-muted-text)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ThumbsUp size={15} /> {problem.likes ?? '—'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ThumbsDown size={15} /> {problem.dislikes ?? '—'}
                    </span>
                </div>
            </div>

            {/* ─── Description Tab ─── */}
            {activeTab === 'description' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    <div style={{ color: 'var(--color-primary-text)', fontSize: 14, lineHeight: 1.7 }}>
                        <ReactMarkdown>{fullDescription}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* ─── Approaches Tab ─── */}
            {activeTab === 'approaches' && (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                                            transition: 'all 0.25s',
                                            overflow: 'hidden',
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
