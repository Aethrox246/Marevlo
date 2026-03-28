import React, { memo, useEffect, useCallback } from 'react';
import { X, Keyboard, Play, Upload, Copy, RotateCcw, Maximize2, Search, Command } from 'lucide-react';

/**
 * KeyboardShortcuts - Modal displaying all available keyboard shortcuts
 * Features:
 * - Grouped shortcuts by category
 * - OS-aware modifier keys (Cmd for Mac, Ctrl for Windows)
 * - Smooth animations
 * - Click outside to close
 */

const ShortcutKey = memo(({ children }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 24,
        height: 24,
        padding: '0 8px',
        borderRadius: 6,
        background: 'var(--color-surface-hover)',
        border: '1px solid var(--color-border)',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'var(--color-primary-text)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    }}>
        {children}
    </span>
));

const ShortcutRow = memo(({ icon: Icon, label, keys, description }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border)',
    }}>
        <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'color-mix(in srgb, #818cf8 10%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        }}>
            <Icon size={16} style={{ color: '#818cf8' }} />
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary-text)' }}>
                {label}
            </div>
            {description && (
                <div style={{ fontSize: 11, color: 'var(--color-muted-text)', marginTop: 2 }}>
                    {description}
                </div>
            )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {keys.map((key, i) => (
                <React.Fragment key={i}>
                    <ShortcutKey>{key}</ShortcutKey>
                    {i < keys.length - 1 && (
                        <span style={{ color: 'var(--color-muted-text)', fontSize: 10 }}>+</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    </div>
));

const ShortcutSection = memo(({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
        <h3 style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-muted-text)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        }}>
            <span style={{ width: 3, height: 14, borderRadius: 1, background: '#818cf8' }} />
            {title}
        </h3>
        <div>
            {children}
        </div>
    </div>
));

const KeyboardShortcuts = memo(({ isOpen, onClose }) => {
    // Detect OS
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? '⌘' : 'Ctrl';
    const altKey = isMac ? '⌥' : 'Alt';

    // Close on Escape
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose?.();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <>
            <style>{`
                @keyframes shortcuts-backdrop-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes shortcuts-modal-in {
                    from { 
                        opacity: 0; 
                        transform: scale(0.95) translateY(10px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1) translateY(0); 
                    }
                }
            `}</style>

            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100,
                    animation: 'shortcuts-backdrop-in 0.2s ease',
                }}
            />

            {/* Modal */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 480,
                    maxWidth: 'calc(100vw - 48px)',
                    maxHeight: 'calc(100vh - 100px)',
                    background: 'var(--color-surface)',
                    borderRadius: 16,
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
                    zIndex: 101,
                    overflow: 'hidden',
                    animation: 'shortcuts-modal-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="shortcuts-title"
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    background: 'color-mix(in srgb, var(--color-primary-text) 2%, var(--color-surface))',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Keyboard size={18} style={{ color: 'white' }} />
                        </div>
                        <div>
                            <h2 id="shortcuts-title" style={{ 
                                fontSize: 16, 
                                fontWeight: 700, 
                                color: 'var(--color-primary-text)',
                                margin: 0,
                            }}>
                                Keyboard Shortcuts
                            </h2>
                            <p style={{ fontSize: 12, color: 'var(--color-muted-text)', margin: '2px 0 0' }}>
                                Speed up your workflow
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-muted-text)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--color-surface-hover)';
                            e.currentTarget.style.color = 'var(--color-primary-text)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--color-muted-text)';
                        }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ 
                    padding: '20px 24px', 
                    maxHeight: 'calc(100vh - 250px)', 
                    overflowY: 'auto',
                }} className="premium-scrollbar">
                    <ShortcutSection title="Code Execution">
                        <ShortcutRow
                            icon={Play}
                            label="Run Code"
                            keys={[modKey, 'Enter']}
                            description="Execute code with current test case input"
                        />
                        <ShortcutRow
                            icon={Upload}
                            label="Submit Solution"
                            keys={[modKey, 'Shift', 'Enter']}
                            description="Run all test cases and submit"
                        />
                    </ShortcutSection>

                    <ShortcutSection title="Editor">
                        <ShortcutRow
                            icon={Copy}
                            label="Copy Code"
                            keys={[modKey, 'Shift', 'C']}
                            description="Copy entire code to clipboard"
                        />
                        <ShortcutRow
                            icon={RotateCcw}
                            label="Reset Code"
                            keys={[modKey, 'Shift', 'R']}
                            description="Reset to starter code template"
                        />
                        <ShortcutRow
                            icon={Maximize2}
                            label="Toggle Fullscreen"
                            keys={['F11']}
                            description="Expand editor to fullscreen"
                        />
                        <ShortcutRow
                            icon={Search}
                            label="Find & Replace"
                            keys={[modKey, 'F']}
                            description="Search within code"
                        />
                    </ShortcutSection>

                    <ShortcutSection title="Navigation">
                        <ShortcutRow
                            icon={Keyboard}
                            label="Show Shortcuts"
                            keys={[modKey, '/']}
                            description="Open this shortcuts panel"
                        />
                    </ShortcutSection>

                    {/* OS Hint */}
                    <div style={{
                        marginTop: 16,
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: 'color-mix(in srgb, var(--color-primary-text) 3%, var(--color-surface))',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}>
                        <Command size={16} style={{ color: 'var(--color-muted-text)' }} />
                        <span style={{ fontSize: 12, color: 'var(--color-muted-text)' }}>
                            {isMac 
                                ? 'Using Mac keyboard shortcuts. ⌘ = Command key'
                                : 'Using Windows/Linux keyboard shortcuts. Ctrl = Control key'
                            }
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid var(--color-border)',
                    background: 'color-mix(in srgb, var(--color-primary-text) 2%, var(--color-surface))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span style={{ fontSize: 11, color: 'var(--color-muted-text)' }}>
                        Press <ShortcutKey>Esc</ShortcutKey> to close
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            background: '#818cf8',
                            color: 'white',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#6366f1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#818cf8';
                        }}
                    >
                        Got it
                    </button>
                </div>
            </div>
        </>
    );
});

KeyboardShortcuts.displayName = 'KeyboardShortcuts';

export default KeyboardShortcuts;
