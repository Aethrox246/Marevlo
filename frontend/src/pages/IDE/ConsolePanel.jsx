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
                    background: 'color-mix(in srgb, var(--color-surface) 60%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: 'none', cursor: 'pointer',
                    color: 'var(--color-primary-text)',
                    borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none'
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
                <div className="premium-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
                    {output ? (
                        <div style={{ flex: 1, minHeight: 60 }}>
                            <pre style={{ fontFamily: 'monospace', fontSize: 13, color: getOutputColor(), whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>
                                {output}
                            </pre>
                        </div>
                    ) : (
                        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--color-muted-text)', flex: 1 }}>
                            <Terminal size={26} style={{ opacity: 0.3 }} />
                            <p style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>Run your code to see output here</p>
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
                            className="premium-scrollbar"
                            value={stdin}
                            onChange={e => onStdinChange?.(e.target.value)}
                            disabled={!useCustomInput}
                            placeholder="Enter input for the program (passed as STDIN)"
                            style={{
                                width: '100%', height: 100, borderRadius: 12,
                                border: '1px solid var(--color-border)',
                                background: 'color-mix(in srgb, var(--color-primary-text) 3%, var(--color-surface))',
                                color: 'var(--color-primary-text)',
                                fontSize: 13, fontFamily: 'monospace',
                                padding: 16, resize: 'none', outline: 'none',
                                boxSizing: 'border-box',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                lineHeight: 1.5,
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                opacity: useCustomInput ? 1 : 0.6
                            }}
                            onFocus={e => { if (useCustomInput) { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.15)'; } }}
                            onBlur={e => { if (useCustomInput) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)'; } }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsolePanel;
