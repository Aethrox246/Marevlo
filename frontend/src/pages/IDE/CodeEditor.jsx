import React, { useRef } from 'react';

// Auto-close pairs
const PAIRS = { '{': '}', '(': ')', '[': ']', '"': '"', "'": "'", '`': '`' };

/**
 * CodeEditor - Theme-aware editor with:
 * - Auto-close brackets/quotes
 * - Tab → 4 spaces
 * - Explicit height fill for drag-resize parents
 */
const CodeEditor = ({ code, onChange }) => {
    const textareaRef = useRef(null);

    const handleKeyDown = (e) => {
        const ta = textareaRef.current;
        const { selectionStart: start, selectionEnd: end, value } = ta;

        // ── Tab → insert spaces ──────────────────────────────────────
        if (e.key === 'Tab') {
            e.preventDefault();
            const spaces = '    ';
            const next = value.slice(0, start) + spaces + value.slice(end);
            onChange(next);
            requestAnimationFrame(() => {
                ta.selectionStart = ta.selectionEnd = start + spaces.length;
            });
            return;
        }

        // ── Auto-close brackets / quotes ─────────────────────────────
        if (PAIRS[e.key]) {
            e.preventDefault();
            const close = PAIRS[e.key];
            // If same char (quote) and next char is the closing quote, just move cursor
            if (e.key === close && value[start] === close) {
                ta.selectionStart = ta.selectionEnd = start + 1;
                return;
            }
            const next = value.slice(0, start) + e.key + close + value.slice(end);
            onChange(next);
            requestAnimationFrame(() => {
                ta.selectionStart = ta.selectionEnd = start + 1;
            });
            return;
        }

        // ── Backspace: remove matching pair if cursor is between them ─
        if (e.key === 'Backspace' && start === end) {
            const prev = value[start - 1];
            const next = value[start];
            if (prev && PAIRS[prev] === next) {
                e.preventDefault();
                const newVal = value.slice(0, start - 1) + value.slice(start + 1);
                onChange(newVal);
                requestAnimationFrame(() => {
                    ta.selectionStart = ta.selectionEnd = start - 1;
                });
            }
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: 'var(--color-surface)', overflow: 'hidden' }}>
            {/* Line numbers gutter */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '48px',
                background: 'var(--color-surface)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column', paddingTop: '16px',
                textAlign: 'right', paddingRight: '8px',
                userSelect: 'none', pointerEvents: 'none', overflow: 'hidden', zIndex: 1
            }}>
                {(code || '').split('\n').map((_, i) => (
                    <div key={i} style={{
                        fontSize: '12px',
                        color: 'var(--color-muted-text)',
                        lineHeight: '24px',
                        fontFamily: "'Consolas', 'Monaco', monospace"
                    }}>
                        {i + 1}
                    </div>
                ))}
            </div>

            {/* Editor textarea */}
            <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck="false"
                placeholder="// Write your code here..."
                aria-label="Code editor"
                style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    background: 'var(--color-surface)',
                    color: 'var(--color-primary-text)',
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                    fontSize: '14px', lineHeight: '24px',
                    padding: '16px 16px 16px 64px',
                    border: 'none', outline: 'none', resize: 'none',
                    caretColor: 'var(--color-primary-text)',
                    tabSize: 4,
                    overflowY: 'auto', overflowX: 'auto',
                    boxSizing: 'border-box',
                }}
            />
        </div>
    );
};

export default CodeEditor;
