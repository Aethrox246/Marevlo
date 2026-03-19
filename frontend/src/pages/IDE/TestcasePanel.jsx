import React from 'react';
import { Play, Upload } from 'lucide-react';

/**
 * TestcasePanel - Theme-aware test cases and results panel
 */
const TestcasePanel = ({
    testcases, activeTestcase, onTestcaseChange,
    activeTab, onTabChange, testResults,
    onRun, onSubmit, isRunning
}) => {
    const s = {
        root: { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface, #0f172a)' },
        tabRow: { display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--color-border, #334155)', gap: 0, background: 'color-mix(in srgb, var(--color-surface) 60%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
        tabActive: { fontSize: 13, fontWeight: 600, color: 'var(--color-primary-text, #f8fafc)', padding: '14px 4px', marginRight: 24, background: 'none', border: 'none', borderBottom: '2px solid #818cf8', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', top: '1px' },
        tabInactive: { fontSize: 13, fontWeight: 500, color: 'var(--color-muted-text, #94a3b8)', padding: '14px 4px', marginRight: 24, background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', transition: 'color 0.2s', position: 'relative', top: '1px' },
        caseRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--color-border, #334155)', overflowX: 'auto', background: 'var(--color-surface)' },
        caseActive: { padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'color-mix(in srgb, #818cf8 15%, transparent)', color: '#818cf8', border: '1px solid color-mix(in srgb, #818cf8 30%, transparent)', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px -2px rgba(129, 140, 248, 0.15)' },
        caseInactive: { padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--color-surface-hover, #1e293b)', color: 'var(--color-muted-text, #94a3b8)', border: '1px solid var(--color-border, #334155)', cursor: 'pointer', transition: 'all 0.2s ease' },
        content: { flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 },
        label: { fontSize: 13, fontWeight: 600, color: 'var(--color-primary-text, #f8fafc)', opacity: 0.9, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
        codeBox: {
            background: 'color-mix(in srgb, var(--color-primary-text) 3%, var(--color-surface))',
            borderRadius: 12,
            padding: 16,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontSize: 13,
            color: 'var(--color-primary-text)',
            overflowX: 'auto',
            border: '1px solid var(--color-border)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', lineHeight: 1.5 },
    };

    return (
        <div style={s.root}>
            {/* Tab row with Run/Submit on right */}
            <div style={s.tabRow}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <button style={activeTab === 'testcase' ? s.tabActive : s.tabInactive} onClick={() => onTabChange?.('testcase')}
                        onMouseEnter={e => activeTab !== 'testcase' && (e.currentTarget.style.color = 'var(--color-primary-text)')}
                        onMouseLeave={e => activeTab !== 'testcase' && (e.currentTarget.style.color = 'var(--color-muted-text)')}
                    >
                        Testcase
                    </button>
                    <button style={activeTab === 'result' ? s.tabActive : s.tabInactive} onClick={() => onTabChange?.('result')}
                        onMouseEnter={e => activeTab !== 'result' && (e.currentTarget.style.color = 'var(--color-primary-text)')}
                        onMouseLeave={e => activeTab !== 'result' && (e.currentTarget.style.color = 'var(--color-muted-text)')}
                    >
                        Test Result
                    </button>
                </div>
                {/* Run / Submit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 4 }}>
                    <button
                        onClick={onRun} disabled={isRunning}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            background: 'var(--color-surface-hover, #1e293b)',
                            color: isRunning ? 'var(--color-muted-text, #94a3b8)' : 'var(--color-primary-text, #f8fafc)',
                            border: '1px solid var(--color-border, #334155)', cursor: isRunning ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={e => !isRunning && (e.currentTarget.style.background = 'var(--color-border)')}
                        onMouseLeave={e => !isRunning && (e.currentTarget.style.background = 'var(--color-surface-hover)')}
                    >
                        <Play size={14} fill={isRunning ? 'none' : 'currentColor'} /> Run
                    </button>
                    <button
                        onClick={onSubmit} disabled={isRunning}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            background: isRunning ? '#059669' : 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff', border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                        }}
                        onMouseEnter={e => !isRunning && (e.currentTarget.style.transform = 'translateY(-1px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.35)')}
                        onMouseLeave={e => !isRunning && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)')}
                    >
                        <Upload size={14} /> Submit
                    </button>
                </div>
            </div>

            {/* Case selector row */}
            <div style={s.caseRow}>
                {testcases && testcases.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => onTestcaseChange(index)}
                        style={activeTestcase === index ? s.caseActive : s.caseInactive}
                    >
                        Case {index + 1}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={s.content} className="premium-scrollbar">
                {activeTab === 'testcase' ? (
                    testcases && testcases[activeTestcase] ? (
                        <>
                            <div>
                                <div style={s.label}>Input</div>
                                <div style={s.codeBox}>{testcases[activeTestcase].input || '(empty)'}</div>
                            </div>
                            <div>
                                <div style={s.label}>Expected Output</div>
                                <div style={s.codeBox}>{testcases[activeTestcase].expected_output || '(empty)'}</div>
                            </div>
                        </>
                    ) : (
                        <div style={{ color: 'var(--color-muted-text)', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>
                            📋 No test cases available for this problem.
                        </div>
                    )
                ) : (
                    testResults && testResults.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {testResults.map((r, idx) => (
                                <div key={idx} style={{
                                    borderRadius: 12, padding: 20,
                                    background: r.passed ? 'color-mix(in srgb, #10b981 12%, var(--color-surface))' : 'color-mix(in srgb, #ef4444 12%, var(--color-surface))',
                                    border: `1px solid ${r.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: r.passed ? '#10b981' : '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            Case {idx + 1}: {r.passed ? 'PASSED' : 'FAILED'}
                                        </span>
                                        {r.category && (
                                            <span style={{ fontSize: 12, fontWeight: 600, color: r.passed ? '#10b981' : '#ef4444', opacity: 0.8 }}>
                                                {r.category === 'error' ? 'Runtime Error' : r.category === 'stderr' ? 'Exec Error' : r.category === 'mismatch' ? 'Wrong Answer' : r.category === 'no-expected' ? 'No Expected Output' : ''}
                                            </span>
                                        )}
                                    </div>
                                    {r.message && (
                                        <pre style={{ fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, color: 'var(--color-primary-text, #f8fafc)', background: '#111827', padding: '16px', borderRadius: 10, maxHeight: 180, overflow: 'auto', border: '1px solid var(--color-border)', lineHeight: 1.5 }}>
                                            {r.message}
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--color-muted-text)', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>
                            📋 No test results yet. Click Submit to run all test cases.
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default TestcasePanel;
