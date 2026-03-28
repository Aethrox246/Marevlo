import React, { useState, useCallback, useEffect, memo } from 'react';
import { Settings, ChevronDown, RotateCcw, Copy, Check, Keyboard, Command } from 'lucide-react';

/**
 * KeyboardShortcutBadge - Displays keyboard shortcuts in a clean badge
 */
const KeyboardShortcutBadge = memo(({ keys, className = '' }) => (
    <span className={`inline-flex items-center gap-0.5 ${className}`} style={{ fontSize: 10 }}>
        {keys.map((key, i) => (
            <span key={i} style={{
                padding: '1px 4px',
                borderRadius: 3,
                background: 'color-mix(in srgb, var(--color-primary-text) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-primary-text) 12%, transparent)',
                fontSize: 9,
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: 'var(--color-muted-text)',
                lineHeight: 1.2,
            }}>
                {key}
            </span>
        ))}
    </span>
));

/**
 * CodeToolbar - Enhanced theme-aware toolbar with:
 * - Language selector with icons
 * - Copy code button with keyboard shortcut hints
 * - Reset code button with confirmation
 * - Keyboard shortcut tooltips
 * - Smooth animations and transitions
 */
const CodeToolbar = ({ selectedLanguage, onLanguageChange, languages = [], onCopy, onReset, onShowShortcuts }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const [isMac, setIsMac] = useState(false);

    // Detect OS for keyboard shortcut display
    useEffect(() => {
        setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    }, []);

    const currentLanguage = languages.find(l => l.id === selectedLanguage) || languages[0] || { name: 'Select' };

    // Language icons mapping
    const langIcons = {
        python: '🐍',
        javascript: '⚡',
        java: '☕',
        cpp: '⚙️',
        'c++': '⚙️',
    };

    const handleCopy = useCallback(() => {
        onCopy?.();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [onCopy]);

    const handleReset = useCallback(() => {
        if (confirmReset) {
            onReset?.();
            setConfirmReset(false);
        } else {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
        }
    }, [confirmReset, onReset]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            // Ctrl/Cmd + Shift + C = Copy
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                handleCopy();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleCopy]);

    const modKey = isMac ? '⌘' : 'Ctrl';

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
            minHeight: 48,
        }}>
            {/* Animation styles */}
            <style>{`
                @keyframes toolbar-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes toolbar-check {
                    0% { transform: scale(0) rotate(-45deg); opacity: 0; }
                    50% { transform: scale(1.2) rotate(0deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes toolbar-shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-2px); }
                    75% { transform: translateX(2px); }
                }
                .toolbar-btn {
                    padding: 6px 10px;
                    border-radius: 6px;
                    background: transparent;
                    border: 1px solid transparent;
                    color: var(--color-muted-text);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                    position: relative;
                }
                .toolbar-btn:hover {
                    color: var(--color-primary-text);
                    background: var(--color-surface-hover);
                    border-color: var(--color-border);
                }
                .toolbar-btn:active {
                    transform: scale(0.97);
                }
                .toolbar-btn-success {
                    color: #10b981 !important;
                    background: color-mix(in srgb, #10b981 8%, transparent) !important;
                    border-color: color-mix(in srgb, #10b981 20%, transparent) !important;
                }
                .toolbar-btn-danger {
                    color: #ef4444 !important;
                    background: color-mix(in srgb, #ef4444 8%, transparent) !important;
                    border-color: color-mix(in srgb, #ef4444 20%, transparent) !important;
                    animation: toolbar-shake 0.3s ease;
                }
                .lang-dropdown-item {
                    width: 100%;
                    text-align: left;
                    padding: 8px 14px;
                    font-size: 13px;
                    background: transparent;
                    color: var(--color-primary-text);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.15s ease;
                }
                .lang-dropdown-item:hover {
                    background: var(--color-surface-hover);
                }
                .lang-dropdown-item-active {
                    background: color-mix(in srgb, #818cf8 10%, transparent);
                    font-weight: 600;
                }
            `}</style>

            {/* Left: Logo + Language */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                        width: 24, 
                        height: 24, 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        borderRadius: 6, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                    }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>M</span>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary-text)', fontSize: 14 }}>Marevlo</span>
                </div>

                <div style={{ width: 1, height: 18, background: 'var(--color-border)' }} />

                {/* Language Selector */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 12px', borderRadius: 8,
                            background: 'var(--color-surface-hover)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-primary-text)',
                            fontSize: 12, cursor: 'pointer', fontWeight: 500,
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#818cf8';
                            e.currentTarget.style.boxShadow = '0 0 0 2px color-mix(in srgb, #818cf8 15%, transparent)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <span style={{ fontSize: 14 }}>{langIcons[selectedLanguage?.toLowerCase()] || '📝'}</span>
                        {currentLanguage.name}
                        <ChevronDown size={12} style={{ 
                            transform: isDropdownOpen ? 'rotate(180deg)' : 'none', 
                            transition: 'transform 0.2s ease',
                            opacity: 0.6,
                        }} />
                    </button>

                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, marginTop: 6,
                                width: 180, background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 10, 
                                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                                zIndex: 20, 
                                padding: '4px',
                                animation: 'fadeIn 0.15s ease',
                            }}>
                                {languages.map((lang) => (
                                    <button
                                        key={lang.id}
                                        onClick={() => { onLanguageChange(lang.id); setIsDropdownOpen(false); }}
                                        className={`lang-dropdown-item ${lang.id === selectedLanguage ? 'lang-dropdown-item-active' : ''}`}
                                        style={{
                                            borderRadius: 6,
                                        }}
                                    >
                                        <span style={{ fontSize: 14 }}>{langIcons[lang.id?.toLowerCase()] || '📝'}</span>
                                        {lang.name}
                                        {lang.id === selectedLanguage && (
                                            <Check size={14} style={{ marginLeft: 'auto', color: '#818cf8' }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Actions + Shortcuts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Keyboard Shortcuts Hint */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'color-mix(in srgb, var(--color-primary-text) 3%, transparent)',
                    marginRight: 8,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--color-muted-text)' }}>Run</span>
                        <KeyboardShortcutBadge keys={[modKey, '↵']} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--color-muted-text)' }}>Submit</span>
                        <KeyboardShortcutBadge keys={[modKey, '⇧', '↵']} />
                    </div>
                </div>

                {/* Copy Code */}
                <button
                    title={`Copy code (${modKey}+Shift+C)`}
                    onClick={handleCopy}
                    className={`toolbar-btn ${copied ? 'toolbar-btn-success' : ''}`}
                >
                    {copied ? (
                        <Check size={14} style={{ animation: 'toolbar-check 0.3s ease' }} />
                    ) : (
                        <Copy size={14} />
                    )}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                {/* Reset Code */}
                <button
                    title={confirmReset ? 'Click again to confirm reset' : 'Reset to starter code'}
                    onClick={handleReset}
                    className={`toolbar-btn ${confirmReset ? 'toolbar-btn-danger' : ''}`}
                >
                    <RotateCcw size={14} style={{ 
                        transition: 'transform 0.3s ease',
                        transform: confirmReset ? 'rotate(-180deg)' : 'none',
                    }} />
                    <span>{confirmReset ? 'Confirm?' : 'Reset'}</span>
                </button>

                <div style={{ width: 1, height: 18, background: 'var(--color-border)', margin: '0 4px' }} />

                {/* Keyboard Shortcuts Button */}
                <button
                    title="View all keyboard shortcuts"
                    onClick={onShowShortcuts}
                    className="toolbar-btn"
                    style={{ padding: '6px 8px' }}
                >
                    <Keyboard size={15} />
                </button>

                {/* Settings */}
                <button
                    title="Settings"
                    onClick={() => {}}
                    className="toolbar-btn"
                    style={{ padding: '6px 8px' }}
                >
                    <Settings size={15} />
                </button>
            </div>
        </div>
    );
};

export default memo(CodeToolbar);
