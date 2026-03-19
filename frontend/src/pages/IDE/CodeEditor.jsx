import React, { useMemo } from 'react';
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
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', overflow: 'hidden' }}>
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
            `}</style>
        </div>
    );
};

export default CodeEditor;
