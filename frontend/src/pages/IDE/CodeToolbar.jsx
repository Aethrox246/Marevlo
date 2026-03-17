import React, { useState } from 'react';
import { Settings, ChevronDown, RotateCcw, Copy, Check } from 'lucide-react';

/**
 * CodeToolbar - Theme-aware toolbar with:
 * - Language selector
 * - Copy code button (checkmark 2s feedback)
 * - Reset code button (with confirmation)
 * - Keyboard shortcut hints
 */
const CodeToolbar = ({ selectedLanguage, onLanguageChange, languages = [], onCopy, onReset }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    const currentLanguage = languages.find(l => l.id === selectedLanguage) || languages[0] || { name: 'Select' };

    const handleCopy = () => {
        onCopy?.();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        if (confirmReset) {
            onReset?.();
            setConfirmReset(false);
        } else {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
        }
    };

    const iconBtn = (title, onClick, children) => (
        <button
            title={title}
            onClick={onClick}
            style={{
                padding: '5px 8px', borderRadius: 6, background: 'transparent',
                border: 'none', color: 'var(--color-muted-text)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted-text)'}
        >
            {children}
        </button>
    );

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 16px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0
        }}>
            {/* Left: Logo + Language */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 22, height: 22, background: '#10b981', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>A</span>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary-text)', fontSize: 13 }}>Marevlo</span>
                </div>

                <div style={{ width: 1, height: 14, background: 'var(--color-border)' }} />

                {/* Language Selector */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '5px 10px', borderRadius: 6,
                            background: 'var(--color-surface-hover)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-primary-text)',
                            fontSize: 12, cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        {currentLanguage.name}
                        <ChevronDown size={12} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </button>

                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, marginTop: 4,
                                width: 160, background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                zIndex: 20, padding: '4px 0'
                            }}>
                                {languages.map((lang) => (
                                    <button
                                        key={lang.id}
                                        onClick={() => { onLanguageChange(lang.id); setIsDropdownOpen(false); }}
                                        style={{
                                            width: '100%', textAlign: 'left',
                                            padding: '7px 14px', fontSize: 13,
                                            background: lang.id === selectedLanguage ? 'var(--color-surface-hover)' : 'transparent',
                                            color: 'var(--color-primary-text)',
                                            fontWeight: lang.id === selectedLanguage ? 600 : 400,
                                            border: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Copy + Reset + Settings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* Copy Code */}
                {iconBtn(
                    copied ? 'Copied!' : 'Copy code',
                    handleCopy,
                    <>
                        {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                        <span style={{ color: copied ? '#10b981' : 'inherit' }}>{copied ? 'Copied' : 'Copy'}</span>
                    </>
                )}

                {/* Reset Code */}
                {iconBtn(
                    confirmReset ? 'Click again to confirm reset' : 'Reset to starter code',
                    handleReset,
                    <>
                        <RotateCcw size={14} style={{ color: confirmReset ? '#ef4444' : 'inherit' }} />
                        <span style={{ color: confirmReset ? '#ef4444' : 'inherit' }}>
                            {confirmReset ? 'Confirm?' : 'Reset'}
                        </span>
                    </>
                )}

                <div style={{ width: 1, height: 14, background: 'var(--color-border)', margin: '0 4px' }} />

                {/* Settings (placeholder) */}
                {iconBtn('Settings', () => { }, <Settings size={15} />)}
            </div>
        </div>
    );
};

export default CodeToolbar;
