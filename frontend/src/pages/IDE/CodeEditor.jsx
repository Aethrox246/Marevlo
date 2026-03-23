import React, { useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubLight } from '@uiw/codemirror-theme-github';
import { useTheme } from '../../context/ThemeContext';

/**
 * CodeEditor - Premium CodeMirror-based editor with syntax highlighting,
 * auto-closing pairs, line numbers, and dark mode theming out of the box.
 */
const CodeEditor = ({ code, onChange, language }) => {
    const { isDark } = useTheme();
    const [isFullscreen, setIsFullscreen] = useState(false);

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

    return (
        <div className={isFullscreen ? 'editor-container-fullscreen' : 'editor-container'} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', overflow: 'hidden', position: 'relative' }}>
            {/* Expand Button */}
            <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="expand-button"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 10,
                    backgroundColor: 'var(--color-hover-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-primary-text)',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}
            >
                {isFullscreen ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3v5H3M16 3h5v5M3 16v5h5M21 16v5h-5"/>
                    </svg>
                )}
            </button>
            
            <div style={{ flex: 1, minHeight: 0 }}>
                <CodeMirror
                    value={code || ''}
                    height="100%"
                    theme={isDark ? dracula : githubLight}
                    extensions={[langExtension]}
                    onChange={(val) => onChange(val)}
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
                        crosshairCursor: true,
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
                        fontSize: '14px',
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        height: '100%'
                    }}
                />
            </div>
            
            {/* Some CSS overrides to ensure the editor spans full height seamlessly */}
            <style>{`
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
                }
                .premium-editor.cm-theme-light, .premium-editor.cm-theme-dark {
                    height: 100%;
                }
                .premium-editor .cm-scroller {
                    font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace !important;
                    line-height: 1.6;
                }
                .premium-editor .cm-gutters {
                    background-color: transparent !important;
                    color: var(--color-muted-text) !important;
                    border-right: 1px solid var(--color-border) !important;
                }
                .premium-editor .cm-activeLineGutter {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                    color: var(--color-primary-text) !important;
                }
                .premium-editor .cm-activeLine {
                    background-color: transparent !important;
                }
                .expand-button:hover {
                    background-color: var(--color-hover-bg-active) !important;
                    border-color: var(--color-primary) !important;
                }
                .expand-button:active {
                    transform: scale(0.95);
                }
            `}</style>
        </div>
    );
};

export default CodeEditor;
