import React, { useRef, useEffect, useState } from 'react';
import { Play, Upload, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

/**
 * TestcasePanel — Premium scrollable test case panel.
 * Props:
 *   testcases: [{ input, expected_output|expected }]
 *   activeTestcase, onTestcaseChange
 *   activeTab ('testcase'|'result'), onTabChange
 *   testResults: [{ passed, message, category }]
 *   onRun, onSubmit, isRunning
 */
const TestcasePanel = ({
    testcases = [], activeTestcase = 0, onTestcaseChange,
    activeTab = 'testcase', onTabChange, testResults = [],
    onRun, onSubmit, isRunning
}) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) el.addEventListener('scroll', checkScroll, { passive: true });
        return () => el?.removeEventListener('scroll', checkScroll);
    }, [testcases]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el?.children[activeTestcase]) {
            el.children[activeTestcase].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeTestcase]);

    const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });

    const getStatus = (idx) => {
        if (!testResults || !testResults[idx]) return 'pending';
        return testResults[idx].passed ? 'passed' : 'failed';
    };

    const statusColor = { passed: '#10b981', failed: '#ef4444', pending: 'var(--color-muted-text)' };
    const hasResults = testResults && testResults.length > 0;

    // Normalize: testcases might have expected_output OR expected
    const getExpected = (tc) => tc?.expected_output || tc?.expected || '';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface)' }}>
            <style>{`
                .tc-scroll::-webkit-scrollbar{display:none}
                .tc-scroll{-ms-overflow-style:none;scrollbar-width:none}
                @keyframes tc-pulse{0%,100%{opacity:1}50%{opacity:.55}}
                .tc-running{animation:tc-pulse 1.2s ease-in-out infinite}
            `}</style>

            {/* ── Header: Tabs + Run/Submit ── */}
            <div style={{
                display: 'flex', alignItems: 'center', padding: '0 16px',
                borderBottom: '1px solid var(--color-border)',
                background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)',
                backdropFilter: 'blur(12px)', minHeight: 42,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 2 }}>
                    {['testcase', 'result'].map(tab => {
                        const isActive = activeTab === tab;
                        const label = tab === 'testcase' ? 'Testcase' : 'Test Result';
                        const allPassed = hasResults && testResults.every(r => r.passed);
                        return (
                            <button key={tab} onClick={() => onTabChange?.(tab)} style={{
                                fontSize: 13, fontWeight: 600, padding: '11px 14px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: isActive ? 'var(--color-primary-text)' : 'var(--color-muted-text)',
                                position: 'relative', transition: 'color 0.2s', outline: 'none',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                {label}
                                {tab === 'result' && hasResults && (
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: allPassed ? '#10b981' : '#ef4444', boxShadow: `0 0 6px ${allPassed ? 'rgba(16,185,129,.5)' : 'rgba(239,68,68,.5)'}` }} />
                                )}
                                {isActive && <div style={{ position: 'absolute', bottom: -1, left: 14, right: 14, height: 2, background: '#818cf8', borderRadius: '2px 2px 0 0', boxShadow: '0 -2px 8px rgba(129,140,248,.35)' }} />}
                            </button>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={onRun} disabled={isRunning} className={isRunning ? 'tc-running' : ''}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--color-surface-hover)', color: isRunning ? 'var(--color-muted-text)' : 'var(--color-primary-text)', border: '1px solid var(--color-border)', cursor: isRunning ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                        <Play size={13} fill={isRunning ? 'none' : 'currentColor'} /> Run
                    </button>
                    <button onClick={onSubmit} disabled={isRunning} className={isRunning ? 'tc-running' : ''}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: isRunning ? '#059669' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(16,185,129,.25)' }}>
                        <Upload size={13} /> Submit
                    </button>
                </div>
            </div>

            {/* ── Scrollable Case Chips ── */}
            <div style={{ position: 'relative', borderBottom: '1px solid var(--color-border)', padding: '8px 0' }}>
                {canScrollLeft && (
                    <button onClick={() => scroll(-1)} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 30, zIndex: 5, background: 'linear-gradient(to right, var(--color-surface) 60%, transparent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-text)' }}>
                        <ChevronLeft size={15} />
                    </button>
                )}
                {canScrollRight && (
                    <button onClick={() => scroll(1)} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 30, zIndex: 5, background: 'linear-gradient(to left, var(--color-surface) 60%, transparent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted-text)' }}>
                        <ChevronRight size={15} />
                    </button>
                )}
                <div ref={scrollRef} className="tc-scroll" style={{ display: 'flex', gap: 7, padding: '0 14px', overflowX: 'auto' }}>
                    {testcases.map((_, idx) => {
                        const isActive = activeTestcase === idx;
                        const status = getStatus(idx);
                        const color = statusColor[status];
                        return (
                            <button key={idx} onClick={() => onTestcaseChange(idx)} style={{
                                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 7,
                                fontSize: 12, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.15s',
                                background: isActive ? 'color-mix(in srgb, #818cf8 14%, transparent)' : status !== 'pending' ? `color-mix(in srgb, ${color} 10%, transparent)` : 'var(--color-surface-hover)',
                                color: isActive ? '#818cf8' : color,
                                border: isActive ? '1px solid color-mix(in srgb, #818cf8 30%, transparent)' : `1px solid ${status !== 'pending' ? `color-mix(in srgb, ${color} 22%, transparent)` : 'var(--color-border)'}`,
                            }}>
                                {status === 'passed' && <Check size={11} strokeWidth={3} />}
                                {status === 'failed' && <X size={11} strokeWidth={3} />}
                                {status === 'pending' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#818cf8' : 'var(--color-border)' }} />}
                                Case {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }} className="premium-scrollbar">
                {activeTab === 'testcase' ? (
                    testcases && testcases[activeTestcase] ? (
                        <>
                            {[{ label: 'Input', val: testcases[activeTestcase].input, c: '#818cf8' },
                              { label: 'Expected Output', val: getExpected(testcases[activeTestcase]), c: '#10b981' }
                            ].map(({ label, val, c }) => (
                                <div key={label}>
                                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{ width: 3, height: 12, borderRadius: 1, background: c }} />{label}
                                    </div>
                                    <div style={{ background: 'color-mix(in srgb, var(--color-primary-text) 3%, var(--color-surface))', borderRadius: 8, padding: '10px 12px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13, color: 'var(--color-primary-text)', border: '1px solid var(--color-border)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                        {val || '(empty)'}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div style={{ color: 'var(--color-muted-text)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
                            No test cases available.
                        </div>
                    )
                ) : (
                    hasResults ? (
                        <>
                            {(() => {
                                const passed = testResults.filter(r => r.passed).length;
                                const total = testResults.length;
                                const allPassed = passed === total;
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: allPassed ? 'color-mix(in srgb, #10b981 8%, var(--color-surface))' : 'color-mix(in srgb, #ef4444 8%, var(--color-surface))', border: `1px solid ${allPassed ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}` }}>
                                        <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: allPassed ? '#10b98120' : '#ef444420', color: allPassed ? '#10b981' : '#ef4444' }}>
                                            {allPassed ? <Check size={17} strokeWidth={3} /> : <X size={17} strokeWidth={3} />}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: allPassed ? '#10b981' : '#ef4444' }}>{allPassed ? 'All Tests Passed' : `${total - passed} of ${total} Failed`}</div>
                                            <div style={{ fontSize: 12, color: 'var(--color-muted-text)', marginTop: 2 }}>{passed}/{total} passed</div>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {testResults.map((r, idx) => (
                                    <div key={idx} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${r.passed ? 'rgba(16,185,129,.18)' : 'rgba(239,68,68,.18)'}`, background: 'var(--color-surface)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: r.passed ? 'color-mix(in srgb, #10b981 5%, var(--color-surface))' : 'color-mix(in srgb, #ef4444 5%, var(--color-surface))', borderBottom: r.message ? `1px solid ${r.passed ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)'}` : 'none' }}>
                                            <span style={{ width: 20, height: 20, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: r.passed ? '#10b981' : '#ef4444', color: '#fff' }}>
                                                {r.passed ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-text)' }}>Case {idx + 1}</span>
                                            {r.category && r.category !== 'success' && (
                                                <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 3, background: 'color-mix(in srgb, #ef4444 10%, transparent)', color: '#ef4444', marginLeft: 'auto' }}>
                                                    {r.category === 'error' ? 'Runtime Error' : r.category === 'stderr' ? 'Exec Error' : r.category === 'mismatch' ? 'Wrong Answer' : r.category === 'no-expected' ? 'No Expected' : ''}
                                                </span>
                                            )}
                                        </div>
                                        {r.message && (
                                            <pre style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', margin: 0, color: 'var(--color-primary-text)', padding: '10px 12px', lineHeight: 1.5, maxHeight: 120, overflow: 'auto' }}>
                                                {r.message}
                                            </pre>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ color: 'var(--color-muted-text)', fontSize: 13, textAlign: 'center', paddingTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <Upload size={26} style={{ opacity: 0.3 }} />
                            Click <strong>Submit</strong> to run all test cases.
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default TestcasePanel;
