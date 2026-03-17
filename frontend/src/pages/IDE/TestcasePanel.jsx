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
        root: { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface)' },
        tabRow: { display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid var(--color-border)', gap: 0 },
        tabActive: { fontSize: 13, fontWeight: 600, color: 'var(--color-primary-text)', borderBottom: '2px solid var(--color-primary-text)', paddingBottom: 4, marginRight: 16, background: 'none', border: 'none', borderBottom: '2px solid var(--color-primary-text)', cursor: 'pointer' },
        tabInactive: { fontSize: 13, fontWeight: 500, color: 'var(--color-muted-text)', paddingBottom: 4, marginRight: 16, background: 'none', border: 'none', cursor: 'pointer' },
        caseRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--color-border)' },
        caseActive: { padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: 'var(--color-surface-hover)', color: 'var(--color-primary-text)', border: '1px solid var(--color-border)', cursor: 'pointer' },
        caseInactive: { padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, background: 'transparent', color: 'var(--color-muted-text)', border: '1px solid transparent', cursor: 'pointer' },
        content: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
        label: { fontSize: 12, fontWeight: 600, color: 'var(--color-muted-text)', marginBottom: 6 },
        codeBox: { background: 'var(--color-surface-hover)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: 'var(--color-primary-text)', border: '1px solid var(--color-border)', whiteSpace: 'pre-wrap' },
    };

    return (
        <div style={s.root}>
            {/* Tab row with Run/Submit on right */}
            <div style={s.tabRow}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <button style={activeTab === 'testcase' ? s.tabActive : s.tabInactive} onClick={() => onTabChange?.('testcase')}>
                        Testcase
                    </button>
                    <button style={activeTab === 'result' ? s.tabActive : s.tabInactive} onClick={() => onTabChange?.('result')}>
                        Test Result
                    </button>
                </div>
                {/* Run / Submit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        onClick={onRun} disabled={isRunning}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                            background: isRunning ? 'var(--color-surface-hover)' : 'var(--color-surface-hover)',
                            color: isRunning ? 'var(--color-muted-text)' : 'var(--color-primary-text)',
                            border: '1px solid var(--color-border)', cursor: isRunning ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Play size={12} fill={isRunning ? 'none' : 'currentColor'} /> Run
                    </button>
                    <button
                        onClick={onSubmit} disabled={isRunning}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                            background: isRunning ? '#6ee7b7' : '#10b981',
                            color: '#fff', border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Upload size={12} /> Submit
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
            <div style={s.content}>
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
                        testResults.map((r, idx) => (
                            <div key={idx} style={{
                                borderRadius: 8, padding: 14,
                                background: r.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                border: `1px solid ${r.passed ? '#10b981' : '#ef4444'}`,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: r.passed ? '#10b981' : '#ef4444', color: '#fff' }}>
                                        Case {idx + 1}: {r.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                    {r.category && (
                                        <span style={{ fontSize: 11, color: 'var(--color-muted-text)' }}>
                                            {r.category === 'error' ? '(Runtime Error)' : r.category === 'stderr' ? '(Exec Error)' : r.category === 'mismatch' ? '(Wrong Answer)' : r.category === 'no-expected' ? '(No Expected Output)' : ''}
                                        </span>
                                    )}
                                </div>
                                {r.message && (
                                    <pre style={{ fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, color: 'var(--color-primary-text)', background: 'var(--color-surface-hover)', padding: '8px', borderRadius: 6, maxHeight: 160, overflow: 'auto' }}>
                                        {r.message}
                                    </pre>
                                )}
                            </div>
                        ))
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
