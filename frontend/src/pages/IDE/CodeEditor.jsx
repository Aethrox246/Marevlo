import React, { useMemo, useState, useCallback, memo, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubLight } from '@uiw/codemirror-theme-github';
import { useTheme } from '../../context/ThemeContext';
import { Maximize2, Minimize2, Type, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * CodeEditor - Premium CodeMirror-based editor with:
 * - Syntax highlighting for multiple languages
 * - Performance optimized with memoization
 * - Accessibility improvements (ARIA labels, keyboard navigation)
 * - Adjustable font size
 * - Fullscreen mode with smooth transitions
 * - Line count and cursor position display
 */
const CodeEditor = memo(({ code, onChange, language, onRun, onSubmit }) => {
    const { isDark } = useTheme();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fontSize, setFontSize] = useState(14);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
    const [lineCount, setLineCount] = useState(1);
    const editorRef = useRef(null);

    // Map the string language to the actual CodeMirror extension
    const langExtension = useMemo(() => {
        switch (language?.toLowerCase()) {
            case 'javascript':
            case 'js':
                return javascript({ jsx: true });
            case 'python':
            case 'py':
                return python();
            case 'java':
                return java();
            case 'cpp':
            case 'c++':
                return cpp();
            default:
                return javascript();
        }
    }, [language]);

    // Memoized onChange handler
    const handleChange = useCallback((val, viewUpdate) => {
        onChange(val);
        // Update line count
        setLineCount(val.split('\n').length);
    }, [onChange]);

    // Track cursor position
    const handleUpdate = useCallback((viewUpdate) => {
        if (viewUpdate.selectionSet) {
            const pos = viewUpdate.state.selection.main.head;
            const line = viewUpdate.state.doc.lineAt(pos);
            setCursorPosition({
                line: line.number,
                col: pos - line.from + 1
            });
        }
    }, []);

    // Font size controls
    const increaseFontSize = useCallback(() => {
        setFontSize(prev => Math.min(prev + 2, 24));
    }, []);

    const decreaseFontSize = useCallback(() => {
        setFontSize(prev => Math.max(prev - 2, 10));
    }, []);

    // Toggle fullscreen with Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
            // F11 for fullscreen toggle
            if (e.key === 'F11') {
                e.preventDefault();
                setIsFullscreen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Update line count on initial load
    useEffect(() => {
        if (code) {
            setLineCount(code.split('\n').length);
        }
    }, [code]);

    // Language display names
    const langNames = {
        javascript: 'JavaScript',
        python: 'Python',
        java: 'Java',
        cpp: 'C++',
    };

    return (
        <div 
            className={isFullscreen ? 'editor-container-fullscreen' : 'editor-container'} 
            style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                background: 'var(--color-surface)', 
                overflow: 'hidden', 
                position: 'relative' 
            }}
            role="region"
            aria-label="Code editor"
        >
            {/* Editor Toolbar */}
            <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 6px',
                borderRadius: 8,
                background: 'color-mix(in srgb, var(--color-surface) 90%, transparent)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--color-border)',
            }}>
                {/* Font Size Controls */}
                <button 
                    onClick={decreaseFontSize}
                    className="editor-toolbar-btn"
                    title="Decrease font size (Min: 10px)"
                    aria-label="Decrease font size"
                    disabled={fontSize <= 10}
                >
                    <ZoomOut size={14} />
                </button>
                
                <span style={{ 
                    fontSize: 10, 
                    fontWeight: 600, 
                    color: 'var(--color-muted-text)',
                    minWidth: 28,
                    textAlign: 'center',
                }}>
                    {fontSize}px
                </span>
                
                <button 
                    onClick={increaseFontSize}
                    className="editor-toolbar-btn"
                    title="Increase font size (Max: 24px)"
                    aria-label="Increase font size"
                    disabled={fontSize >= 24}
                >
                    <ZoomIn size={14} />
                </button>

                <div style={{ width: 1, height: 16, background: 'var(--color-border)', margin: '0 4px' }} />

                {/* Fullscreen Toggle */}
                <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="editor-toolbar-btn"
                    title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F11)'}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    aria-pressed={isFullscreen}
                >
                    {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
            </div>
            
            {/* Main Editor */}
            <div style={{ flex: 1, minHeight: 0 }} ref={editorRef}>
                <CodeMirror
                    value={code || ''}
                    height="100%"
                    theme={isDark ? dracula : githubLight}
                    extensions={[langExtension]}
                    onChange={handleChange}
                    onUpdate={handleUpdate}
                    className="premium-editor h-full"
                    basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: true,
                        highlightSpecialChars: true,
                        history: true,
                        foldGutter: true,
                        drawSelection: true,
                        dropCursor: true,
                        allowMultipleSelections: true,
                        indentOnInput: true,
                        syntaxHighlighting: true,
                        bracketMatching: true,
                        closeBrackets: true,
                        autocompletion: true,
                        rectangularSelection: true,
                        crosshairCursor: false,
                        highlightActiveLine: true,
                        highlightSelectionMatches: true,
                        closeBracketsKeymap: true,
                        defaultKeymap: true,
                        searchKeymap: true,
                        historyKeymap: true,
                        foldKeymap: true,
                        completionKeymap: true,
                        lintKeymap: true,
                        tabSize: 4
                    }}
                    style={{
                        fontSize: `${fontSize}px`,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        height: '100%'
                    }}
                />
            </div>

            {/* Status Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 12px',
                background: 'color-mix(in srgb, var(--color-surface) 95%, var(--color-border))',
                borderTop: '1px solid var(--color-border)',
                fontSize: 11,
                color: 'var(--color-muted-text)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Language Badge */}
                    <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'color-mix(in srgb, #818cf8 12%, transparent)',
                        color: '#818cf8',
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                    }}>
                        {langNames[language?.toLowerCase()] || language || 'Plain Text'}
                    </span>
                    
                    {/* Line Count */}
                    <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Cursor Position */}
                    <span>
                        Ln {cursorPosition.line}, Col {cursorPosition.col}
                    </span>
                    
                    {/* Encoding */}
                    <span style={{ opacity: 0.7 }}>UTF-8</span>
                </div>
            </div>
            
            {/* CSS Styles */}
            <style>{`
                @keyframes editor-fade-in {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                .editor-container-fullscreen {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    z-index: 9999 !important;
                    border-radius: 0 !important;
                    animation: editor-fade-in 0.2s ease;
                }
                .editor-toolbar-btn {
                    padding: 4px 6px;
                    border-radius: 4px;
                    background: transparent;
                    border: none;
                    color: var(--color-muted-text);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                }
                .editor-toolbar-btn:hover:not(:disabled) {
                    background: var(--color-surface-hover);
                    color: var(--color-primary-text);
                }
                .editor-toolbar-btn:active:not(:disabled) {
                    transform: scale(0.92);
                }
                .editor-toolbar-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .premium-editor.cm-theme-light, .premium-editor.cm-theme-dark {
                    height: 100%;
                }
                .premium-editor .cm-scroller {
                    font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace !important;
                    line-height: 1.65;
                    scroll-behavior: smooth;
                }
                .premium-editor .cm-content {
                    padding: 8px 0;
                }
                .premium-editor .cm-gutters {
                    background-color: transparent !important;
                    color: var(--color-muted-text) !important;
                    border-right: 1px solid var(--color-border) !important;
                    padding-right: 8px;
                }
                .premium-editor .cm-lineNumbers .cm-gutterElement {
                    padding: 0 8px 0 12px;
                    min-width: 32px;
                }
                .premium-editor .cm-activeLineGutter {
                    background-color: color-mix(in srgb, #818cf8 8%, transparent) !important;
                    color: #818cf8 !important;
                }
                .premium-editor .cm-activeLine {
                    background-color: color-mix(in srgb, var(--color-primary-text) 3%, transparent) !important;
                }
                .premium-editor .cm-selectionBackground {
                    background-color: color-mix(in srgb, #818cf8 25%, transparent) !important;
                }
                .premium-editor .cm-cursor {
                    border-left-color: #818cf8 !important;
                    border-left-width: 2px !important;
                }
                .premium-editor .cm-matchingBracket {
                    background-color: color-mix(in srgb, #10b981 20%, transparent) !important;
                    outline: 1px solid #10b981;
                }
                .premium-editor .cm-foldGutter .cm-gutterElement {
                    transition: transform 0.2s ease;
                }
                .premium-editor .cm-foldGutter .cm-gutterElement:hover {
                    transform: scale(1.2);
                }
                /* Scrollbar styling */
                .premium-editor .cm-scroller::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .premium-editor .cm-scroller::-webkit-scrollbar-track {
                    background: transparent;
                }
                .premium-editor .cm-scroller::-webkit-scrollbar-thumb {
                    background: color-mix(in srgb, var(--color-muted-text) 30%, transparent);
                    border-radius: 4px;
                }
                .premium-editor .cm-scroller::-webkit-scrollbar-thumb:hover {
                    background: color-mix(in srgb, var(--color-muted-text) 50%, transparent);
                }
            `}</style>
        </div>
    );
});

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor;
