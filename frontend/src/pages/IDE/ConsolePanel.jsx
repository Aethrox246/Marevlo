import React from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * ConsolePanel - Theme-aware collapsible console output
 */
const ConsolePanel = ({
    output, status, isExpanded, onToggle,
    stdin, onStdinChange,
    useCustomInput, onToggleCustomInput,
    autoWrapReturn, onToggleAutoWrap
}) => {
    const getOutputColor = () => {
        switch (status) {
            case 'error': return '#ef4444';
            case 'success': return '#10b981';
            case 'running': return '#f59e0b';
            default: return 'var(--color-primary-text)';
        }
    };

    return (
        <div style={{
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            flexShrink: 0,
            height: isExpanded ? 256 : 48,
            transition: 'height 0.2s',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <button
                onClick={onToggle}
                style={{
                    width: '100%', height: 48, flexShrink: 0,
                    padding: '0 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--color-primary-text)'
                }}
                aria-label={isExpanded ? "Collapse console" : "Expand console"}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Terminal size={15} style={{ color: 'var(--color-muted-text)' }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Console</span>
                    {output && !isExpanded && (
                        <span style={{ fontSize: 12, color: getOutputColor(), maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {output.slice(0, 50)}...
                        </span>
                    )}
                </div>
                {isExpanded
                    ? <ChevronDown size={15} style={{ color: 'var(--color-muted-text)' }} />
                    : <ChevronUp size={15} style={{ color: 'var(--color-muted-text)' }} />
                }
            </button>

            {/* Output body */}
            {isExpanded && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 16px' }}>
                    {output ? (
                        <pre style={{ fontFamily: 'monospace', fontSize: 13, color: getOutputColor(), whiteSpace: 'pre-wrap', margin: 0 }}>
                            {output}
                        </pre>
                    ) : (
                        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, color: 'var(--color-muted-text)' }}>
                            <Terminal size={22} style={{ opacity: 0.4 }} />
                            <p style={{ fontSize: 13, margin: 0 }}>Run your code to see output here</p>
                        </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STDIN</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-muted-text)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={useCustomInput} onChange={e => onToggleCustomInput?.(e.target.checked)} />
                                    Use custom input
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-muted-text)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={autoWrapReturn} onChange={e => onToggleAutoWrap?.(e.target.checked)} />
                                    Auto print return
                                </label>
                            </div>
                        </div>
                        <textarea
                            value={stdin}
                            onChange={e => onStdinChange?.(e.target.value)}
                            disabled={!useCustomInput}
                            placeholder="Enter input for the program (passed as STDIN)"
                            style={{
                                width: '100%', height: 80, borderRadius: 8,
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-input-bg)',
                                color: 'var(--color-primary-text)',
                                fontSize: 13, fontFamily: 'monospace',
                                padding: 8, resize: 'none', outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsolePanel;
