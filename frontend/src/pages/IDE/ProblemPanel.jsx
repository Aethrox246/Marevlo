import React, { useMemo, memo, useState } from 'react';
import { ThumbsUp, ThumbsDown, Lock, Unlock, ChevronDown, ChevronRight, Lightbulb, Code, CheckCircle2, BookOpen, Clock, HardDrive, Sparkles, Zap, BrainCircuit, Bug, Maximize2, ArrowLeft } from 'lucide-react';
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
    const [shakeRung, setShakeRung] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [readerModeRung, setReaderModeRung] = useState(null); // { rung, index, approach }

    const getApproachIcon = (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('brute')) return <Bug size={14} />;
        if (lower.includes('optimal')) return <Zap size={14} />;
        if (lower.includes('dynamic') || lower.includes('memo')) return <BrainCircuit size={14} />;
        return <Lightbulb size={14} />;
    };

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

    // Smart explanation renderer — splits text into visual sections
    const ExplanationRenderer = ({ text }) => {
        if (!text) return null;

        // Split on double newlines first, then detect section types
        const rawSections = text.split(/\n{2,}/);

        const sections = rawSections.map((section, i) => {
            const trimmed = section.trim();

            // Step-by-step algorithm section
            if (/^step-by-step algorithm/i.test(trimmed)) {
                const lines = trimmed.split('\n');
                const steps = lines.slice(1).filter(l => l.trim());
                return (
                    <div key={i} style={{
                        background: 'var(--color-surface-hover)',
                        borderRadius: 12, padding: '16px',
                        border: '1px solid var(--color-border)',
                        marginTop: 8
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-text)', marginBottom: 10 }}>Step-by-Step Algorithm</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {steps.map((step, si) => {
                                const isSubStep = /^\s{3,}/.test(step);
                                const isNumbered = /^\s*\d+\./.test(step);
                                return (
                                    <div key={si} style={{
                                        display: 'flex', gap: 8, alignItems: 'flex-start',
                                        paddingLeft: isSubStep ? 20 : 0,
                                    }}>
                                        {isNumbered && !isSubStep && (
                                            <span style={{
                                                flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                                                background: 'color-mix(in srgb, var(--color-primary-text) 15%, transparent)',
                                                color: 'var(--color-primary-text)',
                                                fontSize: 10, fontWeight: 800,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                marginTop: 2
                                            }}>
                                                {step.trim().match(/^(\d+)/)?.[1]}
                                            </span>
                                        )}
                                        {!isNumbered && !isSubStep && (
                                            <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: 'var(--color-muted-text)', marginTop: 7 }} />
                                        )}
                                        <span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-primary-text)', fontFamily: /[={}()|]/.test(step) ? 'monospace' : 'inherit' }}>
                                            {step.replace(/^\s*\d+\.\s*/, '').trim()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            // Time/Space complexity standalone line
            if (/^time:|^space:/i.test(trimmed) || /^time: O\(/i.test(trimmed)) {
                const lines = trimmed.split('\n').filter(l => l.trim());
                return (
                    <div key={i} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        {lines.map((line, li) => {
                            const isTime = /time/i.test(line);
                            return (
                                <span key={li} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                    background: isTime ? 'color-mix(in srgb, #10b981 12%, var(--color-surface))' : 'color-mix(in srgb, #f59e0b 12%, var(--color-surface))',
                                    color: isTime ? '#10b981' : '#f59e0b',
                                    border: isTime ? '1px solid color-mix(in srgb, #10b981 30%, transparent)' : '1px solid color-mix(in srgb, #f59e0b 30%, transparent)',
                                    fontFamily: 'monospace'
                                }}>
                                    {line.trim()}
                                </span>
                            );
                        })}
                    </div>
                );
            }

            // Standalone code block starting with def/function
            if (/^(real code pattern|def |function |class )/i.test(trimmed) || /`{3}/.test(trimmed)) {
                const codeLines = trimmed.replace(/^real code pattern[:\s]*/i, '');
                return (
                    <div key={i} style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10, overflow: 'hidden', marginTop: 8
                    }}>
                        <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-text)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-hover)' }}>Code Pattern</div>
                        <pre style={{ margin: 0, padding: '12px', fontSize: 12, lineHeight: 1.7, color: 'var(--color-primary-text)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{codeLines}</pre>
                    </div>
                );
            }

            // Standalone Common mistakes section
            if (/^common mistakes/i.test(trimmed)) {
                const lines = trimmed.split('\n');
                const mistakes = lines.slice(1).filter(l => l.trim());
                return (
                    <div key={i} style={{
                        background: 'color-mix(in srgb, #ef4444 5%, var(--color-surface))',
                        border: '1px solid color-mix(in srgb, #ef4444 20%, transparent)',
                        borderRadius: 10, padding: '14px', marginTop: 8
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ef4444', marginBottom: 8 }}>⚠ Common Mistakes</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {mistakes.map((m, mi) => (
                                <div key={mi} style={{ fontSize: 13, color: 'var(--color-primary-text)', lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <span style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}>•</span>
                                    <span>{m.replace(/^\d+\)\s*/, '').trim()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            // Default paragraph: robustly split out embedded sections
            if (trimmed) {
                // We use a unique separator '|||' to cleanly split the paragraph into typed blocks.
                // This ensures we never drop or orphan text like "The".
                const parsedText = trimmed
                    // Extract Time & Space complexity sentences
                    .replace(/(Time(?:\s*complexity is|:)\s*O\([^)]+\)[^.]*\.\s*Space(?:\s*complexity is|:)\s*O\([^)]+\)[^.]*\.?)/gi, '|||COMPLEXITY:$1|||')
                    // Extract Common mistakes section
                    .replace(/(Common mistakes include:?\s*)/gi, '|||MISTAKES:')
                    // Extract Code pattern sentence, deliberately swallowing "The " to prevent orphans!
                    .replace(/(The real code pattern(?: involves| is)?:?\s*|Real code pattern:?\s*)/gi, '|||CODE:');

                const parts = parsedText.split('|||');

                const subParts = parts.map((part, pIdx) => {
                    if (!part.trim()) return null;

                    if (part.startsWith('COMPLEXITY:')) {
                        const content = part.replace('COMPLEXITY:', '').trim();
                        const timePart = content.match(/Time.*?O\([^)]+\)[^.]*/i)?.[0];
                        const spacePart = content.match(/Space.*?O\([^)]+\)[^.]*/i)?.[0];
                        return (
                            <div key={`comp-${pIdx}`} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, marginBottom: 12 }}>
                                {timePart && <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'color-mix(in srgb, #10b981 12%, var(--color-surface))', color: '#10b981', border: '1px solid color-mix(in srgb, #10b981 30%, transparent)', fontFamily: 'monospace' }}>{timePart.trim()}</span>}
                                {spacePart && <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'color-mix(in srgb, #f59e0b 12%, var(--color-surface))', color: '#f59e0b', border: '1px solid color-mix(in srgb, #f59e0b 30%, transparent)', fontFamily: 'monospace' }}>{spacePart.trim()}</span>}
                            </div>
                        );
                    }

                    if (part.startsWith('MISTAKES:')) {
                        const content = part.replace('MISTAKES:', '').trim();
                        // Split by "1) ", "2) " etc.
                        const items = content.split(/(?=\d+\))/).filter(Boolean);
                        return (
                            <div key={`mistakes-${pIdx}`} style={{
                                background: 'color-mix(in srgb, #ef4444 5%, var(--color-surface))',
                                border: '1px solid color-mix(in srgb, #ef4444 20%, transparent)',
                                borderRadius: 10, padding: '14px', marginTop: 12, marginBottom: 12
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ef4444', marginBottom: 10 }}>⚠ Common Mistakes</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {items.map((item, mi) => (
                                        <div key={mi} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                            <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'color-mix(in srgb, #ef4444 15%, transparent)', color: '#ef4444', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{mi + 1}</span>
                                            <span style={{ fontSize: 13, color: 'var(--color-primary-text)', lineHeight: 1.65 }}>{item.replace(/^\d+\)\s*/, '').trim()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    if (part.startsWith('CODE:')) {
                        const content = part.replace('CODE:', '').trim();
                        return (
                            <div key={`code-${pIdx}`} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', marginTop: 12, marginBottom: 12 }}>
                                <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-text)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-hover)' }}>Code Pattern</div>
                                <pre style={{ margin: 0, padding: '12px', fontSize: 12, lineHeight: 1.7, color: 'var(--color-primary-text)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</pre>
                            </div>
                        );
                    }

                    // Otherwise, it's just regular prose
                    return (
                        <p key={`prose-${pIdx}`} style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--color-primary-text)', margin: '8px 0' }}>
                            {part.trim()}
                        </p>
                    );
                });

                return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                        {subParts}
                    </div>
                );
            }
            return null;
        }).filter(Boolean);

        return <div style={{ display: 'flex', flexDirection: 'column' }}>{sections}</div>;
    };

    // Format hint text: insert line breaks before step markers if data has none
    const formatHint = (text) => {
        if (!text) return text;
        if (text.includes('\n')) return text;
        return text
            .replace(/(\s)(Step \d+:)/g, '\n$2')
            .replace(/(\s)(Result:)/g, '\n\n$2')
            .replace(/(\s)(Compare )/g, '\n  $2')
            .replace(/(\s)(Check element)/g, '\n$2')
            .trim();
    };

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
                    background-color: var(--color-primary-text);
                    opacity: 0.8;
                    border: 1px solid transparent; /* 10px width - (1px * 2) = 8px visible thumb */
                }

                @keyframes pulse-ring {
                    0% { transform: scale(0.85); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.85); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-3px); }
                    75% { transform: translateX(3px); }
                }

                .shake-animation {
                    animation: shake 0.2s ease-in-out;
                }
                
                @keyframes float-up {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            {/* Tab Bar (Hidden in Reader Mode) */}
            {!readerModeRung && <TabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />}

            {/* Problem Header (Hidden in Reader Mode to save vertical space) */}
            {!readerModeRung && (
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
            )}

            {/* ─── Description Tab ─── */}
            {activeTab === 'description' && !readerModeRung && (
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
                                            color: 'var(--color-primary-text)', 
                                            padding: '3px 6px', 
                                            borderRadius: '6px', 
                                            fontSize: '0.9em',
                                            fontFamily: 'monospace',
                                            border: '1px solid var(--color-border)'
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
                                                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-muted-text)', width: '60px', flexShrink: 0, paddingTop: 2 }}>Hint:</span>
                                                        <div style={{
                                                            fontSize: 13, lineHeight: 1.7, color: 'var(--color-primary-text)',
                                                            background: 'var(--color-surface-hover)', borderRadius: 8,
                                                            padding: '10px 12px', whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                                                            flex: 1, opacity: 0.9, wordBreak: 'break-word'
                                                        }}>
                                                            {formatHint(ex.explanation)}
                                                        </div>
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
                                        color: 'var(--color-primary-text)',
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
                    
                    {/* Reader Mode View (Full Screen Content) */}
                    {readerModeRung ? (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'var(--color-surface)', height: '100%', animation: 'float-up 0.3s ease-out' }}>
                            <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '16px 24px', background: 'color-mix(in srgb, var(--color-surface) 90%, transparent)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
                                <button
                                    onClick={() => setReaderModeRung(null)}
                                    style={{
                                        width: 32, height: 32, borderRadius: 8, background: 'var(--color-surface-hover)', 
                                        border: '1px solid var(--color-border)', color: 'var(--color-primary-text)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                                    }}
                                    onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'color-mix(in srgb, var(--color-surface-hover) 80%, var(--color-primary-text))' })}
                                    onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'var(--color-surface-hover)' })}
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {readerModeRung.approach.name} • Step {readerModeRung.index + 1}
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary-text)' }}>
                                        {readerModeRung.rung.title}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ padding: '32px 40px', maxWidth: '800px', margin: '0' }}>
                                {readerModeRung.rung.desc && (
                                    <p style={{ fontSize: 15, color: 'var(--color-muted-text)', marginBottom: 24, lineHeight: 1.8 }}>
                                        {readerModeRung.rung.desc}
                                    </p>
                                )}
                                {readerModeRung.rung.explanation && (
                                    <div style={{ fontSize: 15, lineHeight: 1.8 }}>
                                        <ExplanationRenderer text={readerModeRung.rung.explanation} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : approaches.length === 0 ? (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted-text)', fontSize: 14 }}>
                            No approaches available for this problem yet.
                        </div>
                    ) : (
                        <>
                            {/* Approach selector (Segmented Control style) */}
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                                <div style={{
                                    display: 'flex', background: 'var(--color-surface-hover)', borderRadius: '12px', padding: 4,
                                    position: 'relative', overflowX: 'auto', gap: 4
                                }} className="premium-scrollbar">
                                    {approaches.map((approach, index) => (
                                        <button
                                            key={approach.id}
                                            onClick={() => setSelectedApproach(index)}
                                            style={{
                                                flex: 1, minWidth: 'max-content', padding: '10px 16px', borderRadius: '8px',
                                                fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                background: selectedApproach === index ? 'var(--color-surface)' : 'transparent',
                                                color: selectedApproach === index ? 'var(--color-primary-text)' : 'var(--color-muted-text)',
                                                boxShadow: selectedApproach === index ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
                                                zIndex: 1
                                            }}
                                        >
                                            <span style={{ color: selectedApproach === index ? 'var(--color-primary-text)' : 'currentColor' }}>
                                                {getApproachIcon(approach.name)}
                                            </span>
                                            {approach.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Complexity row (Visual Metric Cards) */}
                            {approaches[selectedApproach] && (
                                <div style={{
                                    padding: '16px', borderBottom: '1px solid var(--color-border)',
                                    display: 'flex', gap: 16, flexWrap: 'wrap', background: 'color-mix(in srgb, var(--color-surface-hover) 30%, transparent)'
                                }}>
                                    <div style={{
                                        flex: 1, minWidth: 140, padding: '12px 16px', borderRadius: 12,
                                        background: 'color-mix(in srgb, #10b981 8%, var(--color-surface))',
                                        border: '1px solid color-mix(in srgb, #10b981 20%, transparent)',
                                        display: 'flex', alignItems: 'center', gap: 12
                                    }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Time</div>
                                            <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>{approaches[selectedApproach].timeComplexity}</div>
                                        </div>
                                    </div>
                                    <div style={{
                                        flex: 1, minWidth: 140, padding: '12px 16px', borderRadius: 12,
                                        background: 'color-mix(in srgb, #f59e0b 8%, var(--color-surface))',
                                        border: '1px solid color-mix(in srgb, #f59e0b 20%, transparent)',
                                        display: 'flex', alignItems: 'center', gap: 12
                                    }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f59e0b20', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <HardDrive size={16} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Space</div>
                                            <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>{approaches[selectedApproach].spaceComplexity}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            {approaches[selectedApproach]?.summary && (
                                <div style={{ padding: '20px 24px', fontSize: 14, color: 'var(--color-primary-text)', lineHeight: 1.6, borderBottom: '1px solid var(--color-border)' }}>
                                    {approaches[selectedApproach].summary}
                                </div>
                            )}

                            {/* Progress bar across ladder levels */}
                            {approaches[selectedApproach] && (
                                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-text)', marginBottom: 16 }}>
                                        Journey Progress (<span style={{ color: '#10b981' }}>{unlockedLevels[approaches[selectedApproach].id] || 1}</span> / {approaches[selectedApproach].ladders?.length || 0})
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {(approaches[selectedApproach].ladders || []).map((_, i) => {
                                            const current = unlockedLevels[approaches[selectedApproach].id] || 1;
                                            const isUnlocked = (i + 1) <= current;
                                            const isNext = (i + 1) === current + 1;
                                            
                                            return (
                                                <React.Fragment key={i}>
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 12, fontWeight: 700,
                                                        background: isUnlocked ? '#10b981' : 'var(--color-surface-hover)',
                                                        color: isUnlocked ? '#fff' : 'var(--color-muted-text)',
                                                        border: isUnlocked ? 'none' : '1px solid var(--color-border)',
                                                        boxShadow: isUnlocked ? '0 0 12px rgba(16,185,129,0.3)' : 'none',
                                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        flexShrink: 0,
                                                        position: 'relative'
                                                    }}>
                                                        {isNext && (
                                                            <div style={{
                                                                position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #10b981',
                                                                animation: 'pulse-ring 2s infinite cubic-bezier(0.25, 0.8, 0.25, 1)'
                                                            }}></div>
                                                        )}
                                                        <span style={{ zIndex: 1 }}>{isUnlocked ? '✓' : i + 1}</span>
                                                    </div>
                                                    {i < (approaches[selectedApproach].ladders?.length - 1) && (
                                                        <div style={{ 
                                                            flex: 1, height: 3, borderRadius: 2,
                                                            background: isUnlocked ? '#10b981' : 'var(--color-border)', 
                                                            transition: 'background 0.4s ease',
                                                            boxShadow: isUnlocked ? '0 0 8px rgba(16,185,129,0.2)' : 'none'
                                                        }} />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Ladder rungs */}
                            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {(approaches[selectedApproach]?.ladders || []).map((rung, i) => {
                                    const approachId = approaches[selectedApproach].id;
                                    const current = unlockedLevels[approachId] || 1;
                                    const isUnlocked = (i + 1) <= current;
                                    const isNext = (i + 1) === current + 1;
                                    const expandKey = `${approachId}-${i}`;
                                    const isExpanded = expandedLadder[expandKey];
                                    const isShaking = shakeRung === expandKey;

                                    return (
                                        <div key={i} style={{
                                            borderRadius: 16, border: '1px solid var(--color-border)',
                                            background: isUnlocked ? 'var(--color-surface)' : 'color-mix(in srgb, var(--color-surface-hover) 40%, transparent)',
                                            backdropFilter: isUnlocked ? 'none' : 'blur(4px)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            transform: isUnlocked && isExpanded ? 'scale(1.01)' : 'scale(1)',
                                            boxShadow: isUnlocked && isExpanded ? '0 12px 32px -8px rgba(0,0,0,0.12)' : 'none',
                                            overflow: 'hidden',
                                        }}>
                                            {/* Rung header */}
                                            <div
                                                onClick={() => {
                                                    if (isUnlocked) toggleLadder(expandKey);
                                                    else {
                                                        setShakeRung(expandKey);
                                                        setTimeout(() => setShakeRung(null), 300);
                                                    }
                                                }}
                                                style={{
                                                    width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
                                                    background: 'none', border: 'none', cursor: isUnlocked ? 'pointer' : 'not-allowed', textAlign: 'left',
                                                    opacity: isUnlocked ? 1 : 0.7
                                                }}
                                            >
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: isUnlocked ? '#10b98120' : 'var(--color-surface-hover)',
                                                    color: isUnlocked ? '#10b981' : 'var(--color-muted-text)',
                                                    border: isUnlocked ? '1px solid #10b98130' : '1px solid var(--color-border)'
                                                }}>
                                                    {getLevelTypeIcon(rung.level, isUnlocked)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: isUnlocked ? 'var(--color-primary-text)' : 'var(--color-muted-text)' }}>
                                                        Step {i + 1}: {rung.title}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: 'var(--color-muted-text)', marginTop: 2 }}>
                                                        {getLevelTypeLabel(rung.level)}
                                                    </div>
                                                </div>
                                                {isUnlocked && (
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReaderModeRung({ rung, index: i, approach: approaches[selectedApproach] });
                                                            }}
                                                            style={{
                                                                width: 28, height: 28, borderRadius: '8px', background: 'transparent',
                                                                border: '1px solid var(--color-border)', color: 'var(--color-muted-text)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                                cursor: 'pointer', transition: 'all 0.2s'
                                                            }}
                                                            title="Read in Focus Mode"
                                                            onMouseEnter={el => { el.currentTarget.style.color = 'var(--color-primary-text)'; el.currentTarget.style.background = 'var(--color-surface)'; }}
                                                            onMouseLeave={el => { el.currentTarget.style.color = 'var(--color-muted-text)'; el.currentTarget.style.background = 'transparent'; }}
                                                        >
                                                            <Maximize2 size={13} />
                                                        </button>
                                                        <div style={{
                                                            width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-hover)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease'
                                                        }}>
                                                            <ChevronDown size={14} style={{ color: 'var(--color-primary-text)' }} />
                                                        </div>
                                                    </div>
                                                )}
                                                {!isUnlocked && (
                                                    <Lock size={16} className={isShaking ? "shake-animation" : ""} style={{ color: 'var(--color-muted-text)', flexShrink: 0 }} />
                                                )}
                                            </div>

                                            {/* Rung content (collapsible) */}
                                            {isUnlocked && isExpanded && (
                                                <div style={{ padding: '0 16px 20px 16px', animation: 'float-up 0.4s ease forwards' }}>
                                                    {rung.desc && (
                                                        <p style={{ fontSize: 13, color: 'var(--color-muted-text)', marginBottom: 12, lineHeight: 1.6 }}>
                                                            {rung.desc}
                                                        </p>
                                                    )}
                                                    {rung.explanation && (
                                                        <div style={{ padding: '4px 0' }}>
                                                            <ExplanationRenderer text={rung.explanation} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Unlock button for the next locked rung */}
                                            {isNext && (
                                                <div style={{ padding: '0 16px 16px', borderTop: '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)', paddingTop: 16, marginTop: isExpanded ? 0 : 4 }}>
                                                    <button
                                                        onClick={() => {
                                                            setShowConfetti(true);
                                                            setTimeout(() => setShowConfetti(false), 1500);
                                                            unlockNext();
                                                        }}
                                                        style={{
                                                            width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none',
                                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                                                            position: 'relative', overflow: 'hidden'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.4)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)'; }}
                                                    >
                                                        <Sparkles size={16} /> 
                                                        Unlock Step {i + 1}
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
