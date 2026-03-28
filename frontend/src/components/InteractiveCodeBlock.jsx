import React, { useState, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { javascript } from '@codemirror/lang-javascript';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubLight } from '@uiw/codemirror-theme-github';
import { useTheme } from '../context/ThemeContext';
import { Play, Copy, Check, Terminal, Maximize2, Minimize2, RotateCcw, Clock, Cpu, Sparkles } from 'lucide-react';

const getRunnerEndpoint = () => {
    if (import.meta.env.VITE_RUNNER_URL) {
        return `${import.meta.env.VITE_RUNNER_URL}/run`;
    }
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    return `${protocol}//${host}:4002/run`;
};

const LANG_META = {
    python: {
        icon: <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M12 2C6.5 2 6 4.5 6 6v2h6v1H5c-2 0-3.5 1.5-3.5 4s1.5 4 3.5 4h2v-2c0-2 1.5-3.5 3.5-3.5h5c1.5 0 2.5-1 2.5-2.5V6c0-2-1.5-4-6-4zm-2 2.5a1 1 0 110 2 1 1 0 010-2z" fill="#3776ab"/><path d="M12 22c5.5 0 6-2.5 6-4v-2h-6v-1h7c2 0 3.5-1.5 3.5-4s-1.5-4-3.5-4h-2v2c0 2-1.5 3.5-3.5 3.5h-5c-1.5 0-2.5 1-2.5 2.5V18c0 2 1.5 4 6 4zm2-2.5a1 1 0 110-2 1 1 0 010 2z" fill="#ffce3e"/></svg>,
        label: 'Python',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        extension: () => python(),
        runnerId: 'python',
        filename: 'main.py',
    },
    sql: {
        icon: <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M12 3C7 3 3 4.5 3 6.5v11C3 19.5 7 21 12 21s9-1.5 9-3.5v-11C21 4.5 17 3 12 3z" stroke="#06b6d4" strokeWidth="2"/><path d="M3 6.5c0 2 4 3.5 9 3.5s9-1.5 9-3.5M3 12c0 2 4 3.5 9 3.5s9-1.5 9-3.5" stroke="#06b6d4" strokeWidth="2"/></svg>,
        label: 'SQL',
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        extension: () => sql(),
        runnerId: null,
        filename: 'query.sql',
    },
    code: {
        icon: <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M8 18l-6-6 6-6M16 6l6 6-6 6" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        label: 'Code',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        extension: () => javascript(),
        runnerId: 'javascript',
        filename: 'script.js',
    },
    javascript: {
        icon: <svg viewBox="0 0 24 24" className="w-4 h-4"><rect width="24" height="24" rx="4" fill="#f7df1e"/><path d="M7 18.5l1.5-1c.3.5.8 1 1.5 1 .8 0 1.2-.4 1.2-1v-5.5h2v5.6c0 1.6-1 2.4-2.5 2.4-1.3 0-2.2-.7-2.7-1.5zm6.5-.3l1.5-.9c.4.6 1 1.2 2 1.2.8 0 1.3-.4 1.3-1 0-.7-.5-1-1.5-1.4l-.5-.2c-1.5-.6-2.4-1.4-2.4-3 0-1.5 1.2-2.6 3-2.6 1.3 0 2.2.4 2.9 1.6l-1.5 1c-.3-.6-.7-.8-1.3-.8-.6 0-1 .4-1 .8 0 .6.4.8 1.2 1.2l.5.2c1.7.7 2.7 1.5 2.7 3.2 0 1.8-1.4 2.8-3.3 2.8-1.8 0-3-.9-3.6-2z" fill="#000"/></svg>,
        label: 'JavaScript',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        extension: () => javascript({ jsx: true }),
        runnerId: 'javascript',
        filename: 'index.js',
    },
};

export default function InteractiveCodeBlock({ initialCode, language = 'python' }) {
    const { isDark } = useTheme();
    const [code, setCode] = useState(initialCode || '');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [status, setStatus] = useState('idle');
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);
    const [lineCount, setLineCount] = useState(0);
    const containerRef = useRef(null);

    const meta = LANG_META[language] || LANG_META.code;
    const canRun = !!meta.runnerId;

    // Calculate line count
    useEffect(() => {
        setLineCount(code.split('\n').length);
    }, [code]);

    // Handle escape key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isExpanded) {
                setIsExpanded(false);
            }
            // Ctrl/Cmd + Enter to run
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && containerRef.current?.contains(document.activeElement)) {
                e.preventDefault();
                runCode();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isExpanded, code]);

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetCode = () => {
        setCode(initialCode || '');
        setOutput('');
        setStatus('idle');
        setExecutionTime(null);
    };

    const runCode = async () => {
        if (!canRun || isRunning) return;
        setIsRunning(true);
        setStatus('running');
        setOutput('Initializing runtime environment...');
        const startTime = performance.now();
        
        try {
            const response = await fetch(getRunnerEndpoint(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: meta.runnerId,
                    code: code,
                    stdin: ""
                })
            });
            const result = await response.json();
            const endTime = performance.now();
            setExecutionTime(Math.round(endTime - startTime));

            if (!response.ok) {
                setOutput(`Error: ${result?.error || result?.stderr || 'Request failed'}`);
                setStatus('error');
                return;
            }

            const stderr = result?.stderr || "";
            const stdout = result?.stdout || "";

            if (stderr) {
                setOutput(stderr);
                setStatus('error');
            } else if (!stdout) {
                setOutput('Program executed successfully with no output.');
                setStatus('success');
            } else {
                setOutput(stdout);
                setStatus('success');
            }
        } catch (error) {
            setOutput(`Connection Error: ${error.message || 'Unable to reach code runner'}`);
            setStatus('error');
            setExecutionTime(null);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`mini-ide-container my-8 transition-all duration-500 group ${isExpanded ? 'fixed inset-4 z-[9999] rounded-3xl' : 'rounded-2xl'}`}
            style={{
                borderColor: `${meta.color}33`,
                backgroundColor: isDark ? '#0d1117' : '#ffffff',
                boxShadow: isDark 
                    ? `0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 40px -10px ${meta.color}20, inset 0 1px 0 rgba(255,255,255,0.05)`
                    : `0 25px 60px -15px rgba(0, 0, 0, 0.15), 0 0 40px -10px ${meta.color}10`,
            }}
        >
            {/* Premium Header / Title Bar */}
            <div className="mini-ide-header flex items-center justify-between px-5 py-3.5 border-b"
                style={{
                    background: isDark 
                        ? 'linear-gradient(180deg, rgba(30, 30, 46, 0.98) 0%, rgba(22, 22, 35, 0.98) 100%)'
                        : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                }}
            >
                <div className="flex items-center gap-4">
                    {/* Animated Traffic Lights */}
                    <div className="mini-ide-traffic-lights flex gap-2">
                        <div className="mini-ide-traffic-light red w-3.5 h-3.5 rounded-full cursor-pointer hover:scale-110 transition-transform" 
                             style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%)', boxShadow: '0 0 8px rgba(255, 107, 107, 0.4)' }} 
                             onClick={() => setIsExpanded(false)}
                             title="Minimize" />
                        <div className="mini-ide-traffic-light yellow w-3.5 h-3.5 rounded-full cursor-pointer hover:scale-110 transition-transform" 
                             style={{ background: 'linear-gradient(135deg, #feca57 0%, #ff9f43 100%)', boxShadow: '0 0 8px rgba(254, 202, 87, 0.4)' }}
                             onClick={resetCode}
                             title="Reset" />
                        <div className="mini-ide-traffic-light green w-3.5 h-3.5 rounded-full cursor-pointer hover:scale-110 transition-transform" 
                             style={{ background: 'linear-gradient(135deg, #5fd068 0%, #26de81 100%)', boxShadow: '0 0 8px rgba(95, 208, 104, 0.4)' }}
                             onClick={() => setIsExpanded(!isExpanded)}
                             title={isExpanded ? "Exit Fullscreen" : "Fullscreen"} />
                    </div>
                    
                    <div className="h-5 w-[1px] mx-2" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />

                    {/* Filename with Icon */}
                    <div className="mini-ide-filename flex items-center gap-2 text-xs font-medium" 
                         style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                        <span className="opacity-80">{meta.icon}</span>
                        <span className="font-mono">{meta.filename}</span>
                    </div>

                    {/* Language Badge */}
                    <div 
                        className="mini-ide-lang-badge flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase"
                        style={{
                            background: `${meta.color}15`,
                            color: meta.color,
                            border: `1px solid ${meta.color}30`,
                        }}
                    >
                        <Sparkles size={10} />
                        <span>{meta.label}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Line Count */}
                    <span className="text-[10px] font-mono px-2 py-1 rounded-md" 
                          style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                        {lineCount} lines
                    </span>

                    {/* Reset Button */}
                    <button
                        onClick={resetCode}
                        className="mini-ide-action-btn p-2 rounded-lg transition-all hover:scale-105 active:scale-95"
                        style={{ 
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                        }}
                        title="Reset Code"
                    >
                        <RotateCcw size={14} />
                    </button>

                    {/* Copy Button */}
                    <button
                        onClick={copyCode}
                        className="mini-ide-action-btn p-2 rounded-lg transition-all hover:scale-105 active:scale-95"
                        style={{ 
                            background: copied ? 'rgba(16, 185, 129, 0.15)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            color: copied ? '#10b981' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                        }}
                        title="Copy Code"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>

                    {/* Expand Button */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mini-ide-action-btn p-2 rounded-lg transition-all hover:scale-105 active:scale-95"
                        style={{ 
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                        }}
                        title={isExpanded ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>

                    {/* Run Button */}
                    {canRun && (
                        <button
                            onClick={runCode}
                            disabled={isRunning}
                            className="mini-ide-run-btn flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: meta.gradient,
                                color: '#fff',
                                boxShadow: `0 4px 15px ${meta.color}44`,
                            }}
                        >
                            <Play 
                                size={12} 
                                fill={isRunning ? 'none' : 'currentColor'} 
                                className={isRunning ? 'animate-spin' : ''} 
                            />
                            {isRunning ? 'Running...' : 'Run'}
                            <span className="hidden sm:inline opacity-60 text-[9px] ml-1">Ctrl+Enter</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Editor Area with Line Numbers */}
            <div className="mini-ide-editor relative" style={{ background: isDark ? '#0d1117' : '#ffffff' }}>
                <div className="ide-editor-wrapper" style={{ 
                    minHeight: isExpanded ? '400px' : '180px', 
                    maxHeight: isExpanded ? 'calc(100vh - 350px)' : '500px', 
                    overflow: 'auto' 
                }}>
                    <CodeMirror
                        value={code}
                        theme={isDark ? dracula : githubLight}
                        extensions={[meta.extension()]}
                        onChange={(val) => setCode(val)}
                        basicSetup={{
                            lineNumbers: true,
                            foldGutter: true,
                            highlightActiveLine: true,
                            highlightActiveLineGutter: true,
                            syntaxHighlighting: true,
                            bracketMatching: true,
                            closeBrackets: true,
                            autocompletion: true,
                            tabSize: 4,
                        }}
                        style={{
                            fontSize: isExpanded ? '15px' : '14px',
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace",
                            height: '100%',
                        }}
                    />
                </div>
            </div>

            {/* Premium Terminal / Output Area */}
            {canRun && (
                <div
                    className="mini-ide-console border-t"
                    style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        background: isDark 
                            ? 'linear-gradient(180deg, rgba(8, 8, 12, 0.98) 0%, rgba(5, 5, 8, 0.99) 100%)'
                            : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                    }}
                >
                    {/* Console Header */}
                    <div className="mini-ide-console-header flex items-center justify-between px-5 py-3 border-b"
                         style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center gap-3">
                            <Terminal size={14} style={{ color: meta.color }} />
                            <span className="mini-ide-console-title text-[10px] font-bold tracking-widest uppercase"
                                  style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                                Output Console
                            </span>
                            
                            {/* Status Badge */}
                            {status !== 'idle' && (
                                <span className={`mini-ide-console-status px-2.5 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1.5`}
                                      style={{
                                          background: status === 'running' ? 'rgba(59, 130, 246, 0.15)'
                                              : status === 'success' ? 'rgba(34, 197, 94, 0.15)'
                                              : 'rgba(239, 68, 68, 0.15)',
                                          color: status === 'running' ? '#60a5fa'
                                              : status === 'success' ? '#4ade80'
                                              : '#f87171',
                                      }}>
                                    {status === 'running' && <Cpu size={10} className="animate-pulse" />}
                                    {status === 'running' ? 'Executing' : status === 'success' ? 'Success' : 'Error'}
                                </span>
                            )}
                        </div>
                        
                        {/* Execution Time */}
                        {executionTime !== null && (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono"
                                 style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                                <Clock size={10} />
                                <span>{executionTime}ms</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Console Output */}
                    <div
                        className="px-5 py-4 flex gap-3 font-mono text-sm overflow-auto custom-scrollbar"
                        style={{
                            minHeight: '70px',
                            maxHeight: isExpanded ? '300px' : '200px',
                        }}
                    >
                        <span style={{ color: meta.color, opacity: 0.8, userSelect: 'none' }} className="pt-0.5 font-bold">$</span>
                        <pre
                            className="mini-ide-console-output flex-1 whitespace-pre-wrap text-[13px] leading-relaxed font-medium"
                            style={{
                                color: status === 'error' ? '#f87171'
                                    : status === 'success' ? '#4ade80'
                                    : isDark ? '#d4d4d4' : '#4b5563',
                                margin: 0,
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                boxShadow: 'none',
                            }}
                        >
                            {output || <span className="italic opacity-30">Click "Run" or press Ctrl+Enter to execute code...</span>}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
