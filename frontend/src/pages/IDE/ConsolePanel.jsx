import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Terminal, ChevronDown, ChevronUp, Copy, Check, Trash2, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * ConsolePanel - Enhanced theme-aware collapsible console with:
 * - Smooth expand/collapse animations
 * - Output syntax highlighting (errors, success, timestamps)
 * - Copy output functionality
 * - Clear console button
 * - Running indicator with animation
 * - Better visual feedback for different states
 */
const ConsolePanel = memo(({
    output, status, isExpanded, onToggle,
    stdin, onStdinChange,
    useCustomInput, onToggleCustomInput,
    autoWrapReturn, onToggleAutoWrap
}) => {
    const [copied, setCopied] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);
    const outputRef = useRef(null);
    const startTimeRef = useRef(null);

    // Track execution time
    useEffect(() => {
        if (status === 'running') {
            startTimeRef.current = Date.now();
            setExecutionTime(null);
        } else if (startTimeRef.current && (status === 'success' || status === 'error')) {
            setExecutionTime(Date.now() - startTimeRef.current);
        }
    }, [status]);

    // Auto-scroll to bottom when new output arrives
    useEffect(() => {
        if (outputRef.current && output) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const getStatusConfig = useCallback(() => {
        switch (status) {
            case 'error': 
                return { 
                    color: '#ef4444', 
                    bgColor: 'color-mix(in srgb, #ef4444 8%, transparent)',
                    icon: AlertCircle,
                    label: 'Error'
                };
            case 'success': 
                return { 
                    color: '#10b981', 
                    bgColor: 'color-mix(in srgb, #10b981 8%, transparent)',
                    icon: CheckCircle2,
                    label: 'Success'
                };
            case 'running': 
                return { 
                    color: '#f59e0b', 
                    bgColor: 'color-mix(in srgb, #f59e0b 8%, transparent)',
                    icon: Loader2,
                    label: 'Running'
                };
            default: 
                return { 
                    color: 'var(--color-muted-text)', 
                    bgColor: 'transparent',
                    icon: Terminal,
                    label: 'Idle'
                };
        }
    }, [status]);

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    const handleCopyOutput = useCallback(() => {
        if (output) {
            navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [output]);

    // Format output with syntax highlighting for common patterns
    const formatOutput = useCallback((text) => {
        if (!text) return null;
        
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            let lineStyle = {};
            let prefix = null;
            
            // Error patterns
            if (/^(Error|Exception|Traceback|TypeError|ValueError|SyntaxError|RuntimeError|NameError)/i.test(line)) {
                lineStyle = { color: '#ef4444', fontWeight: 500 };
                prefix = <AlertCircle size={12} style={{ color: '#ef4444', marginRight: 6, flexShrink: 0 }} />;
            }
            // Warning patterns
            else if (/^(Warning|Deprecat)/i.test(line)) {
                lineStyle = { color: '#f59e0b' };
            }
            // Success patterns
            else if (/^(Accepted|Passed|Success|OK)/i.test(line) || line.includes('test case') && line.includes('passed')) {
                lineStyle = { color: '#10b981', fontWeight: 500 };
                prefix = <CheckCircle2 size={12} style={{ color: '#10b981', marginRight: 6, flexShrink: 0 }} />;
            }
            // File paths
            else if (/^\s+File\s+".*",\s+line\s+\d+/i.test(line)) {
                lineStyle = { color: 'var(--color-muted-text)', fontStyle: 'italic' };
            }
            
            return (
                <div 
                    key={idx} 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        ...lineStyle,
                    }}
                >
                    {prefix}
                    <span>{line || '\u00A0'}</span>
                </div>
            );
        });
    }, []);

    return (
        <div style={{
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            flexShrink: 0,
            height: isExpanded ? 280 : 44,
            transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            display: 'flex', 
            flexDirection: 'column',
        }}>
            {/* Animation styles */}
            <style>{`
                @keyframes console-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes console-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .console-checkbox {
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border: 1.5px solid var(--color-border);
                    border-radius: 3px;
                    background: var(--color-surface);
                    cursor: pointer;
                    position: relative;
                    transition: all 0.15s ease;
                }
                .console-checkbox:checked {
                    background: #818cf8;
                    border-color: #818cf8;
                }
                .console-checkbox:checked::after {
                    content: '';
                    position: absolute;
                    left: 4px;
                    top: 1px;
                    width: 4px;
                    height: 8px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }
                .console-checkbox:hover:not(:checked) {
                    border-color: #818cf8;
                }
                .console-btn {
                    padding: 4px 8px;
                    border-radius: 4px;
                    background: transparent;
                    border: none;
                    color: var(--color-muted-text);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    transition: all 0.15s ease;
                }
                .console-btn:hover {
                    background: var(--color-surface-hover);
                    color: var(--color-primary-text);
                }
                .console-btn:active {
                    transform: scale(0.95);
                }
            `}</style>

            {/* Header */}
            <button
                onClick={onToggle}
                style={{
                    width: '100%', 
                    height: 44, 
                    flexShrink: 0,
                    padding: '0 16px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: statusConfig.bgColor,
                    backdropFilter: 'blur(12px)', 
                    WebkitBackdropFilter: 'blur(12px)', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: 'var(--color-primary-text)',
                    borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                    transition: 'background 0.2s ease',
                }}
                aria-label={isExpanded ? "Collapse console" : "Expand console"}
                aria-expanded={isExpanded}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: status !== 'idle' ? statusConfig.bgColor : 'transparent',
                    }}>
                        <StatusIcon 
                            size={14} 
                            style={{ 
                                color: statusConfig.color,
                                animation: status === 'running' ? 'console-spin 1s linear infinite' : 'none',
                            }} 
                        />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Console</span>
                    
                    {/* Status Badge */}
                    {status !== 'idle' && (
                        <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            color: statusConfig.color,
                            background: statusConfig.bgColor,
                            animation: status === 'running' ? 'console-pulse 1.5s ease infinite' : 'none',
                        }}>
                            {statusConfig.label}
                        </span>
                    )}
                    
                    {/* Execution Time */}
                    {executionTime && status !== 'running' && (
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            color: 'var(--color-muted-text)',
                        }}>
                            <Clock size={11} />
                            {executionTime}ms
                        </span>
                    )}

                    {/* Output Preview */}
                    {output && !isExpanded && (
                        <span style={{ 
                            fontSize: 12, 
                            color: statusConfig.color, 
                            maxWidth: 250, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            opacity: 0.8,
                        }}>
                            {output.split('\n')[0].slice(0, 40)}...
                        </span>
                    )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isExpanded && output && (
                        <button
                            className="console-btn"
                            onClick={(e) => { e.stopPropagation(); handleCopyOutput(); }}
                            title="Copy output"
                        >
                            {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                        </button>
                    )}
                    <div style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}>
                        <ChevronUp size={16} style={{ color: 'var(--color-muted-text)' }} />
                    </div>
                </div>
            </button>

            {/* Output body */}
            <div 
                ref={outputRef}
                className="premium-scrollbar" 
                style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '12px 16px', 
                    background: 'var(--color-surface)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    opacity: isExpanded ? 1 : 0,
                    transition: 'opacity 0.2s ease 0.1s',
                }}
            >
                {output ? (
                    <div style={{ flex: 1, minHeight: 40 }}>
                        <pre style={{ 
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace", 
                            fontSize: 12, 
                            whiteSpace: 'pre-wrap', 
                            margin: 0, 
                            lineHeight: 1.6,
                        }}>
                            {formatOutput(output)}
                        </pre>
                    </div>
                ) : (
                    <div style={{ 
                        height: 80, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexDirection: 'column', 
                        gap: 8, 
                        color: 'var(--color-muted-text)', 
                        flex: 1 
                    }}>
                        <Terminal size={28} style={{ opacity: 0.2 }} />
                        <p style={{ fontSize: 13, margin: 0, fontWeight: 500, opacity: 0.7 }}>
                            Run your code to see output here
                        </p>
                        <p style={{ fontSize: 11, margin: 0, opacity: 0.5 }}>
                            Press Ctrl+Enter to run
                        </p>
                    </div>
                )}

                {/* STDIN Section */}
                <div style={{ 
                    borderTop: '1px solid var(--color-border)', 
                    paddingTop: 12, 
                    marginTop: 12 
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        marginBottom: 10 
                    }}>
                        <span style={{ 
                            fontSize: 10, 
                            fontWeight: 700, 
                            color: 'var(--color-muted-text)', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.06em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}>
                            <span style={{ 
                                width: 3, 
                                height: 12, 
                                borderRadius: 1, 
                                background: '#818cf8' 
                            }} />
                            STDIN Input
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <label style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 6, 
                                fontSize: 11, 
                                color: useCustomInput ? 'var(--color-primary-text)' : 'var(--color-muted-text)', 
                                cursor: 'pointer',
                                fontWeight: useCustomInput ? 500 : 400,
                            }}>
                                <input 
                                    type="checkbox" 
                                    className="console-checkbox"
                                    checked={useCustomInput} 
                                    onChange={e => onToggleCustomInput?.(e.target.checked)} 
                                />
                                Custom input
                            </label>
                            <label style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 6, 
                                fontSize: 11, 
                                color: autoWrapReturn ? 'var(--color-primary-text)' : 'var(--color-muted-text)', 
                                cursor: 'pointer',
                                fontWeight: autoWrapReturn ? 500 : 400,
                            }}>
                                <input 
                                    type="checkbox" 
                                    className="console-checkbox"
                                    checked={autoWrapReturn} 
                                    onChange={e => onToggleAutoWrap?.(e.target.checked)} 
                                />
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
                        aria-label="Standard input for code execution"
                        style={{
                            width: '100%', 
                            height: 80, 
                            borderRadius: 8,
                            border: '1px solid var(--color-border)',
                            background: useCustomInput 
                                ? 'color-mix(in srgb, var(--color-primary-text) 3%, var(--color-surface))'
                                : 'color-mix(in srgb, var(--color-muted-text) 5%, var(--color-surface))',
                            color: 'var(--color-primary-text)',
                            fontSize: 12, 
                            fontFamily: "'JetBrains Mono', monospace",
                            padding: 12, 
                            resize: 'none', 
                            outline: 'none',
                            boxSizing: 'border-box',
                            lineHeight: 1.5,
                            transition: 'all 0.2s ease',
                            opacity: useCustomInput ? 1 : 0.5,
                        }}
                        onFocus={e => { 
                            if (useCustomInput) { 
                                e.currentTarget.style.borderColor = '#818cf8'; 
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.12)'; 
                            } 
                        }}
                        onBlur={e => { 
                            e.currentTarget.style.borderColor = 'var(--color-border)'; 
                            e.currentTarget.style.boxShadow = 'none'; 
                        }}
                    />
                </div>
            </div>
        </div>
    );
});

ConsolePanel.displayName = 'ConsolePanel';

export default ConsolePanel;
