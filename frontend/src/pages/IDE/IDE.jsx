import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Upload, Code, FileText, Terminal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Import all separated components
import ProblemPanel from './ProblemPanel';
import CodeToolbar from './CodeToolbar';
import CodeEditor from './CodeEditor';
import TestcasePanel from './TestcasePanel';
import StatusNotification from './StatusNotification';
import ConsolePanel from './ConsolePanel';
import EmptyState from './EmptyState';

const starterCodes = {
    cpp: "#include <iostream>\nusing namespace std;\n\nint main(){\n    cout << \"Hello\";\n}",
    java: "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello\");\n  }\n}",
    python: "print('Hello')",
    javascript: "console.log('Hello');"
};

const API = import.meta.env.VITE_API_URL;

const getRunnerEndpoint = () => {
    if (import.meta.env.VITE_RUNNER_URL) {
        return `${import.meta.env.VITE_RUNNER_URL}/run`;
    }
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    return `${protocol}//${host}:4002/run`;
};

const parseExampleText = (text = '') => {
    if (!text || typeof text !== 'string') {
        return {
            input: '',
            expected_output: '',
            explanation: ''
        };
    }

    // Normalize newlines
    const normalized = text.replace(/\\n/g, '\n').replace(/\\\n/g, '\n');

    // More flexible regex patterns
    const inputMatch = normalized.match(/Input:\s*(.+?)(?=\nOutput:|Output:|$)/is);
    const outputMatch = normalized.match(/Output:\s*(.+?)(?=\nExplanation:|Explanation:|$)/is);
    const explanationMatch = normalized.match(/Explanation:\s*(.+?)$/is);

    return {
        input: (inputMatch?.[1] || '').trim(),
        expected_output: (outputMatch?.[1] || '').trim(),
        explanation: (explanationMatch?.[1] || '').trim()
    };
};

const getStarterCode = (problem, language) => {
    if (problem?.starter_code) {
        if (typeof problem.starter_code === 'string' && problem.starter_code.trim()) {
            return problem.starter_code;
        }
        if (typeof problem.starter_code === 'object') {
            const langCode = problem.starter_code[language];
            if (langCode && String(langCode).trim()) return langCode;
        }
    }

    const title = problem?.title || 'Graph Problem';
    const fallback = {
        java: `// ${title}\n// Read from STDIN, write to STDOUT\n\nimport java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder input = new StringBuilder();\n        String line;\n        while ((line = br.readLine()) != null) {\n            input.append(line).append(\"\\n\");\n        }\n        // TODO: parse input and solve\n        System.out.println(\"\");\n    }\n}\n`,
        python: `# ${title}\n# Read from STDIN, write to STDOUT\nimport sys\n\ndef solve(data: str) -> str:\n    # TODO: parse input and solve\n    return \"\"\n\nif __name__ == \"__main__\":\n    data = sys.stdin.read()\n    print(solve(data))\n`,
        javascript: `// ${title}\n// Read from STDIN, write to STDOUT\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8');\n\nfunction solve(data) {\n  // TODO: parse input and solve\n  return \"\";\n}\n\nprocess.stdout.write(String(solve(input)));\n`,
        cpp: `// ${title}\n// Read from STDIN, write to STDOUT\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // TODO: parse input and solve\n    return 0;\n}\n`
    };

    return fallback[language] || fallback.python;
};

const wrapCodeForRun = (language, code, autoWrapReturn) => {
    if (!autoWrapReturn) return code;
    if (language === 'python') {
        return `${code}\n\n# --- Auto runner: parse stdin assignments and call a likely function ---\nimport sys\nimport inspect\nimport ast\n\ndef _parse_assignments(text):\n    text = (text or '').strip()\n    if not text:\n        return {}, []\n    parts = []\n    buf = []\n    depth = 0\n    in_str = False\n    esc = False\n    for ch in text:\n        if in_str:\n            buf.append(ch)\n            if esc:\n                esc = False\n            elif ch == '\\\\':\n                esc = True\n            elif ch in ('\"', \"'\"):\n                in_str = False\n            continue\n        if ch in ('\"', \"'\"):\n            in_str = True\n            buf.append(ch)\n            continue\n        if ch in '([{':\n            depth += 1\n        elif ch in ')]}':\n            depth = max(0, depth - 1)\n        if ch == ',' and depth == 0:\n            part = ''.join(buf).strip()\n            if part:\n                parts.append(part)\n            buf = []\n        else:\n            buf.append(ch)\n    last = ''.join(buf).strip()\n    if last:\n        parts.append(last)\n    result = {}\n    ordered = []\n    for part in parts:\n        if '=' not in part:\n            continue\n        name, value = part.split('=', 1)\n        name = name.strip()\n        value = value.strip()\n        try:\n            parsed = ast.literal_eval(value)\n            result[name] = parsed\n            ordered.append(parsed)\n        except Exception:\n            result[name] = value\n            ordered.append(value)\n    return result, ordered\n\ndef _pick_function(funcs, vars_dict):\n    if 'solve' in globals() and callable(globals().get('solve')):\n        return globals()['solve'], 'solve'\n    if 'main' in globals() and callable(globals().get('main')):\n        return globals()['main'], 'main'\n    if not funcs:\n        return None, None\n    if len(funcs) == 1:\n        return funcs[0], funcs[0].__name__\n    best = None\n    best_score = -1\n    for f in funcs:\n        try:\n            params = inspect.signature(f).parameters\n            score = sum(1 for k in params.keys() if k in vars_dict)\n            if score > best_score:\n                best = f\n                best_score = score\n        except Exception:\n            continue\n    return best, best.__name__ if best else (None, None)\n\ntry:\n    _stdin = sys.stdin.read()\n    _vars, _ordered = _parse_assignments(_stdin)\n    _funcs = [v for v in globals().values() if inspect.isfunction(v) and v.__module__ == '__main__']\n    _fn, _name = _pick_function(_funcs, _vars)\n    _res = None\n    if _fn:\n        try:\n            _sig = inspect.signature(_fn)\n            if _sig.parameters:\n                _args = []\n                _i = 0\n                for k in _sig.parameters.keys():\n                    if k in _vars:\n                        _args.append(_vars.get(k))\n                    elif _i < len(_ordered):\n                        _args.append(_ordered[_i])\n                        _i += 1\n                    else:\n                        _args.append(None)\n                _res = _fn(*_args)\n            else:\n                _res = _fn()\n        except Exception:\n            _res = None\n    elif 'solve' in globals():\n        _res = solve(_stdin)\n    print(_res)\nexcept Exception:\n    pass\n`;
    }
    if (language === 'javascript') {
        return `${code}\n\n// --- Auto print return value if solve(data) exists ---\ntry {\n  if (typeof solve === 'function') {\n    const fs = require('fs');\n    const _data = fs.readFileSync(0, 'utf8');\n    const _res = solve(_data);\n    if (_res !== undefined) process.stdout.write(String(_res));\n  }\n} catch (e) {}\n`;
    }
    return code;
};

/**
 * useDrag — lightweight drag-to-resize hook (no external deps)
 * direction: 'horizontal' (left/right %) or 'vertical' (top/bottom %)
 * min/max: percent limits
 */
function useDrag(initial = 40, min = 20, max = 75, direction = 'horizontal') {
    const [size, setSize] = useState(initial);
    const dragging = useRef(false);
    const containerRef = useRef(null);

    const onMouseDown = useCallback((e) => {
        e.preventDefault();
        dragging.current = true;
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
    }, [direction]);

    useEffect(() => {
        const onMove = (e) => {
            if (!dragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = direction === 'horizontal'
                ? ((e.clientX - rect.left) / rect.width) * 100
                : ((e.clientY - rect.top) / rect.height) * 100;
            setSize(Math.min(Math.max(pct, min), max));
        };
        const onUp = () => {
            dragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [min, max, direction]);

    return { containerRef, size, onMouseDown };
}

/**
 * IDE - Main Integrated Development Environment component (LeetCode Style)
 * Orchestrates all sub-components and manages state
 */
/**
 * Convert a structured JSON test case input object to a stdin string.
 * Example: { nums: [2,7,11,15], target: 9 } → "[2, 7, 11, 15]\n9"
 */
const testCaseInputToStdin = (input) => {
    if (typeof input === 'string') return input;
    if (input === null || input === undefined) return '';
    // Always JSON-serialize each field value — one per line.
    // This gives a consistent, predictable stdin format the user can parse.
    return Object.values(input).map(v => JSON.stringify(v)).join('\n');
};

/**
 * Normalize output for comparison:
 * - trim whitespace
 * - normalize JSON formatting (remove extra spaces)
 * - handle None vs null
 */
const normalizeOutput = (output) => {
    if (output === null || output === undefined) return '';
    let s = String(output).trim();
    // Normalize Python None → null, True → true, False → false
    s = s.replace(/\bNone\b/g, 'null');
    s = s.replace(/\bTrue\b/g, 'true');
    s = s.replace(/\bFalse\b/g, 'false');
    // Try to parse as JSON and re-stringify for canonical form
    try {
        const parsed = JSON.parse(s);
        s = JSON.stringify(parsed);
    } catch (e) {
        // Not valid JSON, keep as-is but remove trailing newlines
    }
    return s;
};

export default function IDE({ problem, judgeTestCases = [], onBack, onNext, onSolved }) {
    const { user } = useAuth();
    // State management
    const [selectedLanguage, setSelectedLanguage] = useState('java'); // Default to Java
    const [code, setCode] = useState(starterCodes[selectedLanguage]);
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle', 'running', 'success', 'error'
    const [attempts, setAttempts] = useState(0);
    const [activeTestcase, setActiveTestcase] = useState(0);
    const [testcases, setTestcases] = useState([]);
    const [isConsoleOpen, setIsConsoleOpen] = useState(false);
    const [stdin, setStdin] = useState('');
    const [useCustomInput, setUseCustomInput] = useState(false);
    const [autoWrapReturn, setAutoWrapReturn] = useState(true);
    const [activeTestTab, setActiveTestTab] = useState('testcase');
    const [testResults, setTestResults] = useState([]);
    const languages = [
        { id: 'cpp', name: 'C++' },
        { id: 'java', name: 'Java' },
        { id: 'python', name: 'Python' },
        { id: 'javascript', name: 'JavaScript' }
    ];

    const [activeMobileTab, setActiveMobileTab] = useState('problem'); // 'problem', 'editor', 'testcases'

    // ── Drag-to-resize: horizontal (problem vs editor)
    const hDrag = useDrag(40, 20, 72, 'horizontal');
    // ── Drag-to-resize: vertical (editor vs testcase+console)
    const vDrag = useDrag(65, 25, 80, 'vertical');

    // ── Global keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                runCode(true);   // Ctrl+Shift+Enter → Submit
            } else if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                runCode(false);  // Ctrl+Enter → Run
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, selectedLanguage, useCustomInput, stdin, autoWrapReturn, testcases]);

    // ── Copy code to clipboard
    const handleCopy = () => {
        navigator.clipboard.writeText(code).catch(() => {
            console.warn("Clipboard not supported");
        });
    };

    // ── Reset to starter code
    const handleReset = () => {
        setCode(starterCodes[selectedLanguage]);
    };

    const handleLanguageChange = (lang) => {
        setSelectedLanguage(lang);
        setCode(starterCodes[lang]);
    };

    // Initialize code when problem changes or language changes
    useEffect(() => {
        setCode(getStarterCode(problem, selectedLanguage));
        setOutput("");
        setStatus('idle');
        setAttempts(0);
        setStdin('');
        setUseCustomInput(false);
        setAutoWrapReturn(true);
        setActiveTestTab('testcase');
        setTestResults([]);

        // Build testcase rows from the problem schema used in assets.
        // Prefer direct input/output fields, with fallback to legacy example_text parsing.
        if (problem && problem.examples && problem.examples.length > 0) {
            setTestcases(problem.examples.map((ex) => {
                if (ex && (ex.input !== undefined || ex.output !== undefined || ex.explanation !== undefined)) {
                    return {
                        input: String(ex.input ?? '').trim(),
                        expected_output: String(ex.output ?? '').trim(),
                        explanation: String(ex.explanation ?? '').trim(),
                    };
                }
                return parseExampleText(ex?.example_text);
            }));
        } else {
            setTestcases([]);
        }
    }, [problem]);

    const runSingle = async (stdinValue) => {
        const codeToRun = wrapCodeForRun(selectedLanguage, code, autoWrapReturn);
        const response = await fetch(getRunnerEndpoint(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: selectedLanguage || 'python',
                code: codeToRun,
                stdin: stdinValue || ""
            })
        });
        const result = await response.json();
        return { response, result };
    };

    const handleTestTabChange = (tab) => {
        setActiveTestTab(tab);
        if (tab === 'result' && !isRunning) {
            runCode(true);
        }
    };

    /**
     * Execute code using local runner service
     */
    const runCode = async (isSubmission = false) => {
        // Validate we have code to run
        if (!code || code.trim() === '') {
            setOutput("Error: No code to run. Write some code first!");
            setStatus('error');
            return;
        }

        setIsRunning(true);
        setStatus('running');
        setOutput("Running code...");
        setIsConsoleOpen(true);
        setTestResults([]);

        try {
            if (isSubmission) {
                // ─── SUBMIT MODE: Judge against structured test cases ───
                // Use judgeTestCases from problem files first, fallback to example-parsed testcases
                const casesToJudge = judgeTestCases.length > 0 ? judgeTestCases : testcases;

                if (casesToJudge.length === 0) {
                    setOutput("Error: No test cases available for this problem.");
                    setStatus('error');
                    setIsRunning(false);
                    return;
                }

                let allPassed = true;
                const results = [];

                for (let i = 0; i < casesToJudge.length; i++) {
                    const tc = casesToJudge[i];

                    // Determine stdin: if using structured judge test cases, convert input object to stdin string
                    let stdinValue;
                    if (useCustomInput) {
                        stdinValue = stdin;
                    } else if (judgeTestCases.length > 0 && tc.input) {
                        // Structured test case from problem file
                        stdinValue = testCaseInputToStdin(tc.input);
                    } else {
                        // Fallback to example-parsed input
                        stdinValue = tc.input || '';
                    }

                    const { response, result } = await runSingle(stdinValue);

                    if (!response.ok) {
                        const msg = result?.error || result?.stderr || `Request failed (${response.status})`;
                        results.push({
                            passed: false,
                            message: `Runtime Error:\n${msg}`,
                            category: 'error'
                        });
                        allPassed = false;
                        continue;
                    }

                    const stdout = (result?.stdout || '').trim();
                    const stderr = (result?.stderr || '').trim();

                    if (stderr) {
                        results.push({
                            passed: false,
                            message: `Execution Error:\n${stderr}`,
                            category: 'stderr'
                        });
                        allPassed = false;
                        continue;
                    }

                    // Determine expected output
                    let expectedRaw;
                    if (judgeTestCases.length > 0) {
                        // Structured test case — expected_output is a JSON value
                        expectedRaw = typeof tc.expected_output === 'string'
                            ? tc.expected_output
                            : JSON.stringify(tc.expected_output);
                    } else {
                        expectedRaw = tc.expected_output || '';
                    }

                    const normalizedExpected = normalizeOutput(expectedRaw);
                    const normalizedActual = normalizeOutput(stdout);

                    if (!normalizedExpected) {
                        // No expected output defined — treat as failure, never auto-accept
                        results.push({
                            passed: false,
                            message: 'No expected output defined for this test case.',
                            category: 'no-expected'
                        });
                        allPassed = false;
                    } else if (normalizedActual !== normalizedExpected) {
                        results.push({
                            passed: false,
                            message: `Expected:\n${expectedRaw}\n\nGot:\n${stdout.substring(0, 200) || '(no output)'}`,
                            category: 'mismatch'
                        });
                        allPassed = false;
                    } else {
                        results.push({
                            passed: true,
                            message: `Output:\n${stdout.substring(0, 200)}`,
                            category: 'success'
                        });
                    }
                }

                setTestResults(results);
                setActiveTestTab('result');
                setOutput(
                    allPassed
                        ? `✓ All ${results.length} test case${results.length !== 1 ? 's' : ''} passed!`
                        : `✗ ${results.filter(r => !r.passed).length} of ${results.length} test case${results.length !== 1 ? 's' : ''} failed`
                );

                // Log submission to backend for DB persistence
                if (user?.id && problem?.id) {
                    try {
                        const passedCount = results.filter(r => r.passed).length;
                        await fetch(`${API}/execute/log`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                user_id: user.id,
                                problem_id: problem.id,
                                language: selectedLanguage || 'python',
                                status: allPassed ? 'passed' : 'failed',
                                passed: passedCount
                            })
                        });
                    } catch (err) {
                        // Ignore logging errors to avoid blocking UX
                    }
                }

                handleSubmissionResult(allPassed);
                return;
            }

            // ─── RUN MODE: Just execute code and show output, NO verdict ───
            const activeTc = testcases[activeTestcase];
            const stdinValue = useCustomInput ? stdin : (activeTc?.input || '');
            const { response, result } = await runSingle(stdinValue);

            if (!response.ok) {
                const msg = result?.error || result?.stderr || `Request failed (${response.status})`;
                setOutput(`Error: ${msg}`);
                setStatus('error');
                return;
            }

            const stdout = result?.stdout || "";
            const stderr = result?.stderr || "";

            if (stderr) {
                setOutput(stderr);
                setStatus('error');
            } else if (!stdout) {
                setOutput("No output generated.");
                setStatus('idle');
            } else {
                setOutput(stdout);
                // Run mode: set to 'idle' — no verdict popup
                setStatus('idle');
            }
        } catch (error) {
            const errorMsg = error?.message || 'Unknown error occurred';
            setOutput(`Error: ${errorMsg}`);
            setStatus('error');
        } finally {
            setIsRunning(false);
        }
    };

    /**
     * Handle submission result
     */
    const handleSubmissionResult = (isSuccess) => {
        if (isSuccess) {
            setStatus('success');
            if (onSolved) onSolved();
        } else {
            setStatus('error');
            setAttempts(prev => prev + 1);
        }
    };

    // Show empty state if no problem selected
    if (!problem) {
        return <EmptyState />;
    }

    return (
        <div className="flex flex-col h-full overflow-hidden relative" style={{ background: 'var(--color-app-bg)' }}>
            {/* Header - Global CodeToolbar */}
            <CodeToolbar
                selectedLanguage={selectedLanguage}
                languages={languages}
                onLanguageChange={handleLanguageChange}
                onCopy={handleCopy}
                onReset={handleReset}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* ── DESKTOP LAYOUT with two drag handles ── */}
                <div
                    ref={hDrag.containerRef}
                    className="hidden lg:flex flex-1 h-full"
                    style={{ position: 'relative' }}
                >
                    {/* Left Panel — Problem Description */}
                    <div style={{ width: `${hDrag.size}%`, minWidth: '240px', height: '100%', flexShrink: 0, overflow: 'hidden', borderRight: '1px solid var(--color-border)' }}>
                        <ProblemPanel problem={problem} onBack={onBack} />
                    </div>

                    {/* ↔ Horizontal drag handle (Ghost Hitbox) */}
                    <div
                        onMouseDown={hDrag.onMouseDown}
                        style={{ 
                            width: 13,          /* 1px visible line + 6px invisible drag zone on both sides */
                            margin: '0 -6px',   /* Offsets the width layout hit perfectly back down to 1px footprint */
                            flexShrink: 0, 
                            borderLeft: '6px solid transparent', 
                            borderRight: '6px solid transparent',
                            background: 'var(--color-border)', 
                            backgroundClip: 'padding-box',
                            cursor: 'col-resize', position: 'relative', zIndex: 10, 
                            transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#818cf8'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
                        title="Drag to resize left/right"
                    />

                    {/* Right Panel — Editor + Testcase */}
                    <div
                        ref={vDrag.containerRef}
                        style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    >
                        {/* Code Editor (top) */}
                        <div style={{ height: `${vDrag.size}%`, minHeight: '80px', overflow: 'hidden', position: 'relative' }}>
                            <CodeEditor code={code} onChange={setCode} language={selectedLanguage} />
                        </div>

                        {/* ↕ Vertical drag handle (Ghost Hitbox) */}
                        <div
                            onMouseDown={vDrag.onMouseDown}
                            style={{ 
                                height: 13,         /* 1px visible line + 6px invisible drag zone on both top and bottom */
                                margin: '-6px 0',   /* Offsets the height layout hit perfectly back down to 1px footprint */
                                flexShrink: 0, 
                                borderTop: '6px solid transparent', 
                                borderBottom: '6px solid transparent',
                                background: 'var(--color-border)', 
                                backgroundClip: 'padding-box',
                                cursor: 'row-resize', position: 'relative', zIndex: 10, 
                                transition: 'background-color 0.2s ease' 
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#818cf8'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
                            title="Drag to resize top/bottom"
                        />

                        {/* Testcase + Console (bottom) */}
                        <div style={{ flex: 1, minHeight: '80px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div className="flex-1 overflow-hidden">
                                <TestcasePanel
                                    testcases={testcases}
                                    activeTestcase={activeTestcase}
                                    onTestcaseChange={setActiveTestcase}
                                    activeTab={activeTestTab}
                                    onTabChange={handleTestTabChange}
                                    testResults={testResults}
                                    onRun={() => runCode(false)}
                                    onSubmit={() => runCode(true)}
                                    isRunning={isRunning}
                                />
                            </div>
                            <ConsolePanel
                                output={output}
                                status={status}
                                isExpanded={isConsoleOpen}
                                onToggle={() => setIsConsoleOpen(prev => !prev)}
                                stdin={stdin}
                                onStdinChange={setStdin}
                                useCustomInput={useCustomInput}
                                onToggleCustomInput={setUseCustomInput}
                                autoWrapReturn={autoWrapReturn}
                                onToggleAutoWrap={setAutoWrapReturn}
                            />
                        </div>
                    </div>
                </div>

                {/* ── MOBILE LAYOUT — tab-based, unchanged ── */}
                <div className={`lg:hidden flex-1 flex flex-col h-full`}>
                    {activeMobileTab === 'problem' && (
                        <div className="flex-1 overflow-hidden w-full">
                            <ProblemPanel problem={problem} onBack={onBack} />
                        </div>
                    )}
                    {activeMobileTab === 'editor' && (
                        <div className="flex-1 overflow-hidden w-full">
                            <CodeEditor code={code} onChange={setCode} language={selectedLanguage} />
                        </div>
                    )}
                    {activeMobileTab === 'testcases' && (
                        <div className="flex-1 overflow-hidden w-full">
                            <TestcasePanel
                                testcases={testcases}
                                activeTestcase={activeTestcase}
                                onTestcaseChange={setActiveTestcase}
                                activeTab={activeTestTab}
                                onTabChange={handleTestTabChange}
                                testResults={testResults}
                                onRun={() => runCode(false)}
                                onSubmit={() => runCode(true)}
                                isRunning={isRunning}
                            />
                        </div>
                    )}
                </div>

            </div>{/* end main content area */}

            {/* Mobile Floating Action Buttons (Fixed Bottom Right) */}
            <div className={`lg:hidden fixed bottom-20 right-4 flex flex-col gap-3 z-50 transition-transform duration-300 ${activeMobileTab === 'problem' ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <button
                    onClick={() => runCode(false)}
                    disabled={isRunning}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-800 text-white shadow-lg border border-neutral-700 active:scale-95 transition-all"
                >
                    <Play size={20} fill={isRunning ? "none" : "currentColor"} />
                </button>
                <button
                    onClick={() => runCode(true)}
                    disabled={isRunning}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg active:scale-95 transition-all"
                >
                    <Upload size={20} />
                </button>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden h-16 bg-neutral-900 border-t border-neutral-800 flex items-center justify-around shrink-0 z-40">
                <button
                    onClick={() => setActiveMobileTab('problem')}
                    className={`flex flex-col items-center gap-1 p-2 ${activeMobileTab === 'problem' ? 'text-white' : 'text-neutral-500'}`}
                >
                    <FileText size={20} />
                    <span className="text-[10px] font-medium">Problem</span>
                </button>
                <button
                    onClick={() => setActiveMobileTab('editor')}
                    className={`flex flex-col items-center gap-1 p-2 ${activeMobileTab === 'editor' ? 'text-white' : 'text-neutral-500'}`}
                >
                    <Code size={20} />
                    <span className="text-[10px] font-medium">Code</span>
                </button>
                <button
                    onClick={() => setActiveMobileTab('testcases')}
                    className={`flex flex-col items-center gap-1 p-2 ${activeMobileTab === 'testcases' ? 'text-white' : 'text-neutral-500'}`}
                >
                    <Terminal size={20} />
                    <span className="text-[10px] font-medium">Testcases</span>
                </button>
            </div>

            {/* Status Notifications */}
            <StatusNotification
                status={status}
                attempts={attempts}
                onNext={onNext}
                onDismiss={() => setStatus('idle')}
            />
        </div>
    );
}
