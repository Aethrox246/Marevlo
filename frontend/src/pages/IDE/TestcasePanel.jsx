import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Play, Upload, ChevronLeft, ChevronRight, Check, X, Copy, Eye, EyeOff, ArrowLeftRight, Clock } from 'lucide-react';

/**
 * DiffViewer - Inline diff view for expected vs actual output
 */
const DiffViewer = memo(({ expected, actual }) => {
    if (!expected && !actual) return null;
    
    const expectedLines = (expected || '').split('\n');
    const actualLines = (actual || '').split('\n');
    const maxLines = Math.max(expectedLines.length, actualLines.length);
    
    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 8,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
        }}>
            <div>
                <div style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    color: '#10b981', 
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}>
                    <span style={{ width: 3, height: 10, borderRadius: 1, background: '#10b981' }} />
                    Expected
                </div>
                <div style={{ 
                    background: 'color-mix(in srgb, #10b981 5%, var(--color-surface))',
                    border: '1px solid color-mix(in srgb, #10b981 20%, transparent)',
                    borderRadius: 6,
                    padding: 10,
                    minHeight: 40,
                }}>
                    {expectedLines.map((line, i) => (
                        <div key={i} style={{ 
                            color: line === actualLines[i] ? 'var(--color-primary-text)' : '#10b981',
                            background: line !== actualLines[i] ? 'color-mix(in srgb, #10b981 10%, transparent)' : 'transparent',
                            padding: '1px 4px',
                            borderRadius: 2,
                            margin: '1px 0',
                        }}>
                            {line || '\u00A0'}
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <div style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    color: '#ef4444', 
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}>
                    <span style={{ width: 3, height: 10, borderRadius: 1, background: '#ef4444' }} />
                    Your Output
                </div>
                <div style={{ 
                    background: 'color-mix(in srgb, #ef4444 5%, var(--color-surface))',
                    border: '1px solid color-mix(in srgb, #ef4444 20%, transparent)',
                    borderRadius: 6,
                    padding: 10,
                    minHeight: 40,
                }}>
                    {actualLines.map((line, i) => (
                        <div key={i} style={{ 
                            color: line === expectedLines[i] ? 'var(--color-primary-text)' : '#ef4444',
                            background: line !== expectedLines[i] ? 'color-mix(in srgb, #ef4444 10%, transparent)' : 'transparent',
                            padding: '1px 4px',
                            borderRadius: 2,
                            margin: '1px 0',
                        }}>
                            {line || '\u00A0'}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

/**
 * TestcasePanel — Enhanced premium scrollable test case panel.
 * Features:
 *   - Visual diff viewer for expected vs actual output
 *   - Smooth animations and transitions
 *   - Copy input/output functionality
 *   - Progress indicator for test results
 *   - Keyboard shortcuts hints
 */
const TestcasePanel = memo(({
    testcases = [], activeTestcase = 0, onTestcaseChange,
    activeTab = 'testcase', onTabChange, testResults = [],
    onRun, onSubmit, isRunning
}) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [showDiff, setShowDiff] = useState(true);
    const [copiedField, setCopiedField] = useState(null);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) el.addEventListener('scroll', checkScroll, { passive: true });
        return () => el?.removeEventListener('scroll', checkScroll);
    }, [testcases, checkScroll]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el?.children[activeTestcase]) {
            el.children[activeTestcase].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeTestcase]);

    const scroll = useCallback((dir) => scrollRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' }), []);

    const getStatus = useCallback((idx) => {
        if (!testResults || !testResults[idx]) return 'pending';
        return testResults[idx].passed ? 'passed' : 'failed';
    }, [testResults]);

    const handleCopy = useCallback((text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    }, []);

    const statusColor = { passed: '#10b981', failed: '#ef4444', pending: 'var(--color-muted-text)' };
    const hasResults = testResults && testResults.length > 0;
    const passedCount = testResults.filter(r => r?.passed).length;
    const totalCount = testResults.length;

    // Normalize: testcases might have expected_output OR expected
    const getExpected = useCallback((tc) => tc?.expected_output || tc?.expected || '', []);

    // Extract actual output from result message for diff view
    const getActualFromResult = useCallback((result) => {
        if (!result?.message) return '';
        const gotMatch = result.message.match(/Got:\n([\s\S]*?)$/);
        return gotMatch ? gotMatch[1].trim() : '';
    }, []);

    const getExpectedFromResult = useCallback((result) => {
        if (!result?.message) return '';
        const expectedMatch = result.message.match(/Expected:\n([\s\S]*?)\n\nGot:/);
        return expectedMatch ? expectedMatch[1].trim() : '';
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface)' }}>
            <style>{`
                .tc-scroll::-webkit-scrollbar{display:none}
                .tc-scroll{-ms-overflow-style:none;scrollbar-width:none}
                @keyframes tc-pulse{0%,100%{opacity:1}50%{opacity:.55}}
                @keyframes tc-success{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
                @keyframes tc-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}
                .tc-running{animation:tc-pulse 1.2s ease-in-out infinite}
                .tc-btn{
                    display:flex;align-items:center;gap:6px;
                    padding:6px 14px;border-radius:8px;
                    font-size:13px;font-weight:600;
                    cursor:pointer;transition:all 0.2s ease;
                    border:1px solid transparent;
                }
                .tc-btn:active:not(:disabled){transform:scale(0.97)}
                .tc-btn-run{
                    background:var(--color-surface-hover);
                    color:var(--color-primary-text);
                    border-color:var(--color-border);
                }
                .tc-btn-run:hover:not(:disabled){
                    background:color-mix(in srgb, var(--color-primary-text) 8%, var(--color-surface));
                    border-color:var(--color-primary-text);
                }
                .tc-btn-submit{
                    background:linear-gradient(135deg, #10b981, #059669);
                    color:#fff;
                    box-shadow:0 2px 12px rgba(16,185,129,.3);
                }
                .tc-btn-submit:hover:not(:disabled){
                    box-shadow:0 4px 16px rgba(16,185,129,.4);
                    transform:translateY(-1px);
                }
                .tc-btn:disabled{
                    opacity:0.6;
                    cursor:not-allowed;
                }
                .tc-copy-btn{
                    padding:4px 8px;border-radius:4px;
                    background:transparent;border:none;
                    color:var(--color-muted-text);cursor:pointer;
                    display:flex;align-items:center;gap:4px;
                    font-size:10px;transition:all 0.15s ease;
                }
                .tc-copy-btn:hover{
                    background:var(--color-surface-hover);
                    color:var(--color-primary-text);
                }
            `}</style>

            {/* ── Header: Tabs + Run/Submit ── */}
            <div style={{
                display: 'flex', alignItems: 'center', padding: '0 16px',
                borderBottom: '1px solid var(--color-border)',
                background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)',
                backdropFilter: 'blur(12px)', minHeight: 46,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 4 }}>
                    {['testcase', 'result'].map(tab => {
                        const isActive = activeTab === tab;
                        const label = tab === 'testcase' ? 'Testcase' : 'Test Result';
                        const allPassed = hasResults && testResults.every(r => r.passed);
                        return (
                            <button key={tab} onClick={() => onTabChange?.(tab)} style={{
                                fontSize: 13, fontWeight: 600, padding: '12px 16px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: isActive ? 'var(--color-primary-text)' : 'var(--color-muted-text)',
                                position: 'relative', transition: 'all 0.2s', outline: 'none',
                                display: 'flex', alignItems: 'center', gap: 8,
                                borderRadius: '8px 8px 0 0',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) e.currentTarget.style.background = 'var(--color-surface-hover)';
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) e.currentTarget.style.background = 'none';
                            }}
                            >
                                {label}
                                {tab === 'result' && hasResults && (
                                    <span style={{ 
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        background: allPassed 
                                            ? 'color-mix(in srgb, #10b981 15%, transparent)' 
                                            : 'color-mix(in srgb, #ef4444 15%, transparent)',
                                        color: allPassed ? '#10b981' : '#ef4444',
                                    }}>
                                        {passedCount}/{totalCount}
                                    </span>
                                )}
                                {isActive && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        bottom: -1, 
                                        left: 12, 
                                        right: 12, 
                                        height: 2, 
                                        background: '#818cf8', 
                                        borderRadius: '2px 2px 0 0', 
                                        boxShadow: '0 -2px 8px rgba(129,140,248,.35)',
                                        transition: 'all 0.2s ease',
                                    }} />
                                )}
                            </button>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Keyboard shortcut hints */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        marginRight: 8,
                        opacity: 0.7,
                    }}>
                        <span style={{ fontSize: 10, color: 'var(--color-muted-text)' }}>Ctrl+Enter</span>
                    </div>
                    <button 
                        onClick={onRun} 
                        disabled={isRunning} 
                        className={`tc-btn tc-btn-run ${isRunning ? 'tc-running' : ''}`}
                    >
                        <Play size={13} fill={isRunning ? 'none' : 'currentColor'} /> 
                        Run
                    </button>
                    <button 
                        onClick={onSubmit} 
                        disabled={isRunning} 
                        className={`tc-btn tc-btn-submit ${isRunning ? 'tc-running' : ''}`}
                    >
                        <Upload size={13} /> 
                        Submit
                    </button>
                </div>
            </div>

            {/* ── Scrollable Case Chips ── */}
            <div style={{ position: 'relative', borderBottom: '1px solid var(--color-border)', padding: '10px 0' }}>
                {canScrollLeft && (
                    <button 
                        onClick={() => scroll(-1)} 
                        style={{ 
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: 36, zIndex: 5, 
                            background: 'linear-gradient(to right, var(--color-surface) 70%, transparent)', 
                            border: 'none', cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: 'var(--color-muted-text)',
                            transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-text)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-muted-text)'}
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
                {canScrollRight && (
                    <button 
                        onClick={() => scroll(1)} 
                        style={{ 
                            position: 'absolute', right: 0, top: 0, bottom: 0, width: 36, zIndex: 5, 
                            background: 'linear-gradient(to left, var(--color-surface) 70%, transparent)', 
                            border: 'none', cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: 'var(--color-muted-text)',
                            transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-text)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-muted-text)'}
                    >
                        <ChevronRight size={16} />
                    </button>
                )}
                <div ref={scrollRef} className="tc-scroll" style={{ display: 'flex', gap: 8, padding: '0 16px', overflowX: 'auto' }}>
                    {testcases.map((_, idx) => {
                        const isActive = activeTestcase === idx;
                        const status = getStatus(idx);
                        const color = statusColor[status];
                        return (
                            <button 
                                key={idx} 
                                onClick={() => onTestcaseChange(idx)} 
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, 
                                    padding: '6px 12px', borderRadius: 8,
                                    fontSize: 12, fontWeight: 600, flexShrink: 0, 
                                    whiteSpace: 'nowrap', cursor: 'pointer', 
                                    transition: 'all 0.15s ease',
                                    background: isActive 
                                        ? 'color-mix(in srgb, #818cf8 15%, transparent)' 
                                        : status !== 'pending' 
                                            ? `color-mix(in srgb, ${color} 10%, transparent)` 
                                            : 'var(--color-surface-hover)',
                                    color: isActive ? '#818cf8' : color,
                                    border: isActive 
                                        ? '1px solid color-mix(in srgb, #818cf8 35%, transparent)' 
                                        : `1px solid ${status !== 'pending' ? `color-mix(in srgb, ${color} 25%, transparent)` : 'var(--color-border)'}`,
                                    boxShadow: isActive ? '0 2px 8px rgba(129, 140, 248, 0.15)' : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.borderColor = status !== 'pending' ? color : '#818cf8';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.borderColor = status !== 'pending' 
                                            ? `color-mix(in srgb, ${color} 25%, transparent)` 
                                            : 'var(--color-border)';
                                        e.currentTarget.style.transform = 'none';
                                    }
                                }}
                            >
                                {status === 'passed' && (
                                    <Check size={12} strokeWidth={3} style={{ animation: 'tc-success 0.3s ease' }} />
                                )}
                                {status === 'failed' && (
                                    <X size={12} strokeWidth={3} style={{ animation: 'tc-shake 0.3s ease' }} />
                                )}
                                {status === 'pending' && (
                                    <span style={{ 
                                        width: 6, height: 6, borderRadius: '50%', 
                                        background: isActive ? '#818cf8' : 'var(--color-border)',
                                        transition: 'background 0.15s',
                                    }} />
                                )}
                                Case {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }} className="premium-scrollbar">
                {activeTab === 'testcase' ? (
                    testcases && testcases[activeTestcase] ? (
                        <>
                            {[
                                { label: 'Input', val: testcases[activeTestcase].input, c: '#818cf8', field: 'input' },
                                { label: 'Expected Output', val: getExpected(testcases[activeTestcase]), c: '#10b981', field: 'expected' }
                            ].map(({ label, val, c, field }) => (
                                <div key={label}>
                                    <div style={{ 
                                        fontSize: 10, fontWeight: 700, 
                                        textTransform: 'uppercase', letterSpacing: '0.06em', 
                                        color: 'var(--color-muted-text)', marginBottom: 8, 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ width: 3, height: 14, borderRadius: 1, background: c }} />
                                            {label}
                                        </span>
                                        {val && (
                                            <button 
                                                className="tc-copy-btn"
                                                onClick={() => handleCopy(val, field)}
                                                title="Copy to clipboard"
                                            >
                                                {copiedField === field ? (
                                                    <><Check size={10} style={{ color: '#10b981' }} /> Copied</>
                                                ) : (
                                                    <><Copy size={10} /> Copy</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ 
                                        background: 'color-mix(in srgb, var(--color-primary-text) 3%, var(--color-surface))', 
                                        borderRadius: 8, padding: '12px 14px', 
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace", 
                                        fontSize: 12.5, color: 'var(--color-primary-text)', 
                                        border: '1px solid var(--color-border)', 
                                        lineHeight: 1.6, whiteSpace: 'pre-wrap',
                                        minHeight: 40,
                                    }}>
                                        {val || <span style={{ color: 'var(--color-muted-text)', fontStyle: 'italic' }}>(empty)</span>}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div style={{ 
                            color: 'var(--color-muted-text)', fontSize: 13, 
                            textAlign: 'center', paddingTop: 50,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        }}>
                            <div style={{ 
                                width: 48, height: 48, borderRadius: 12,
                                background: 'var(--color-surface-hover)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 8,
                            }}>
                                <Eye size={24} style={{ opacity: 0.3 }} />
                            </div>
                            <p style={{ margin: 0, fontWeight: 500 }}>No test cases available</p>
                            <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Test cases will appear here when loaded</p>
                        </div>
                    )
                ) : (
                    hasResults ? (
                        <>
                            {/* Summary Card */}
                            {(() => {
                                const passed = testResults.filter(r => r.passed).length;
                                const total = testResults.length;
                                const allPassed = passed === total;
                                const percentage = Math.round((passed / total) * 100);
                                return (
                                    <div style={{ 
                                        display: 'flex', alignItems: 'center', gap: 14, 
                                        padding: '14px 16px', borderRadius: 12, 
                                        background: allPassed 
                                            ? 'color-mix(in srgb, #10b981 8%, var(--color-surface))' 
                                            : 'color-mix(in srgb, #ef4444 8%, var(--color-surface))', 
                                        border: `1px solid ${allPassed ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}`,
                                    }}>
                                        <div style={{ 
                                            width: 40, height: 40, borderRadius: 10, 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                            background: allPassed ? '#10b98120' : '#ef444420', 
                                            color: allPassed ? '#10b981' : '#ef4444',
                                        }}>
                                            {allPassed ? (
                                                <Check size={20} strokeWidth={3} style={{ animation: 'tc-success 0.4s ease' }} />
                                            ) : (
                                                <X size={20} strokeWidth={3} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ 
                                                fontSize: 15, fontWeight: 700, 
                                                color: allPassed ? '#10b981' : '#ef4444',
                                            }}>
                                                {allPassed ? 'All Tests Passed!' : `${total - passed} of ${total} Failed`}
                                            </div>
                                            <div style={{ 
                                                fontSize: 12, color: 'var(--color-muted-text)', marginTop: 3,
                                                display: 'flex', alignItems: 'center', gap: 8,
                                            }}>
                                                <span>{passed}/{total} passed</span>
                                                <span style={{ opacity: 0.5 }}>|</span>
                                                <span>{percentage}% success rate</span>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ 
                                            width: 60, height: 6, borderRadius: 3, 
                                            background: 'var(--color-border)', overflow: 'hidden',
                                        }}>
                                            <div style={{ 
                                                width: `${percentage}%`, height: '100%', 
                                                background: allPassed ? '#10b981' : '#ef4444',
                                                borderRadius: 3,
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })()}
                            
                            {/* Toggle diff view */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                    onClick={() => setShowDiff(!showDiff)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '4px 10px', borderRadius: 6,
                                        background: showDiff ? 'color-mix(in srgb, #818cf8 12%, transparent)' : 'transparent',
                                        border: '1px solid',
                                        borderColor: showDiff ? 'color-mix(in srgb, #818cf8 30%, transparent)' : 'var(--color-border)',
                                        color: showDiff ? '#818cf8' : 'var(--color-muted-text)',
                                        fontSize: 11, fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <ArrowLeftRight size={12} />
                                    {showDiff ? 'Hide' : 'Show'} Diff View
                                </button>
                            </div>

                            {/* Test Results */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {testResults.map((r, idx) => (
                                    <div 
                                        key={idx} 
                                        style={{ 
                                            borderRadius: 10, overflow: 'hidden', 
                                            border: `1px solid ${r.passed ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}`, 
                                            background: 'var(--color-surface)',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <div style={{ 
                                            display: 'flex', alignItems: 'center', gap: 10, 
                                            padding: '10px 14px', 
                                            background: r.passed 
                                                ? 'color-mix(in srgb, #10b981 5%, var(--color-surface))' 
                                                : 'color-mix(in srgb, #ef4444 5%, var(--color-surface))', 
                                            borderBottom: r.message ? `1px solid ${r.passed ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)'}` : 'none',
                                        }}>
                                            <span style={{ 
                                                width: 22, height: 22, borderRadius: 6, 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                background: r.passed ? '#10b981' : '#ef4444', color: '#fff',
                                            }}>
                                                {r.passed ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                                            </span>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary-text)' }}>
                                                Test Case {idx + 1}
                                            </span>
                                            {r.category && r.category !== 'success' && (
                                                <span style={{ 
                                                    fontSize: 10, fontWeight: 600, 
                                                    padding: '2px 8px', borderRadius: 4, 
                                                    background: 'color-mix(in srgb, #ef4444 12%, transparent)', 
                                                    color: '#ef4444', marginLeft: 'auto',
                                                }}>
                                                    {r.category === 'error' ? 'Runtime Error' : 
                                                     r.category === 'stderr' ? 'Execution Error' : 
                                                     r.category === 'mismatch' ? 'Wrong Answer' : 
                                                     r.category === 'no-expected' ? 'No Expected' : ''}
                                                </span>
                                            )}
                                        </div>
                                        {r.message && (
                                            <div style={{ padding: '12px 14px' }}>
                                                {showDiff && r.category === 'mismatch' ? (
                                                    <DiffViewer 
                                                        expected={getExpectedFromResult(r)} 
                                                        actual={getActualFromResult(r)} 
                                                    />
                                                ) : (
                                                    <pre style={{ 
                                                        fontSize: 12, 
                                                        fontFamily: "'JetBrains Mono', monospace", 
                                                        whiteSpace: 'pre-wrap', margin: 0, 
                                                        color: 'var(--color-primary-text)', 
                                                        lineHeight: 1.6, maxHeight: 150, 
                                                        overflow: 'auto',
                                                    }} className="premium-scrollbar">
                                                        {r.message}
                                                    </pre>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ 
                            color: 'var(--color-muted-text)', fontSize: 13, 
                            textAlign: 'center', paddingTop: 50, 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                        }}>
                            <div style={{ 
                                width: 56, height: 56, borderRadius: 14,
                                background: 'color-mix(in srgb, #10b981 8%, var(--color-surface))',
                                border: '1px solid color-mix(in srgb, #10b981 15%, transparent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 8,
                            }}>
                                <Upload size={26} style={{ color: '#10b981', opacity: 0.6 }} />
                            </div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Ready to Submit</p>
                            <p style={{ margin: 0, fontSize: 12, opacity: 0.7, maxWidth: 200 }}>
                                Click <strong>Submit</strong> to run all test cases and see your results
                            </p>
                            <div style={{ 
                                display: 'flex', alignItems: 'center', gap: 4,
                                marginTop: 8, opacity: 0.5, fontSize: 11,
                            }}>
                                <span>Press</span>
                                <span style={{ 
                                    padding: '2px 6px', borderRadius: 3,
                                    background: 'var(--color-surface-hover)',
                                    border: '1px solid var(--color-border)',
                                    fontFamily: 'system-ui',
                                    fontWeight: 600,
                                }}>Ctrl</span>
                                <span>+</span>
                                <span style={{ 
                                    padding: '2px 6px', borderRadius: 3,
                                    background: 'var(--color-surface-hover)',
                                    border: '1px solid var(--color-border)',
                                    fontFamily: 'system-ui',
                                    fontWeight: 600,
                                }}>Shift</span>
                                <span>+</span>
                                <span style={{ 
                                    padding: '2px 6px', borderRadius: 3,
                                    background: 'var(--color-surface-hover)',
                                    border: '1px solid var(--color-border)',
                                    fontFamily: 'system-ui',
                                    fontWeight: 600,
                                }}>Enter</span>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
});

TestcasePanel.displayName = 'TestcasePanel';

export default TestcasePanel;
